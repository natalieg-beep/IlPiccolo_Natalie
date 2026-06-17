'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Typen ─────────────────────────────────────────────────────────────────────

type Mode = 'einkauf' | 'invest' | 'privat' | 'fixkosten'

interface ReceiptItem {
  id: string
  receipt_id: string | null
  batch_id: string | null
  name: string
  amount_gross: number
  amount_net: number
  vat_rate: number
  vat_amount: number
  quantity: number
  unit: string | null
  date: string | null
  mode: Mode
  category_id: string | null
  product_id: string | null
  status: string
  error_message: string | null
}

interface Receipt {
  id: string
  supplier_id: string | null
  ettn: string | null
  fatura_no: string | null
  date: string | null
  total_tl: number | null
  filename: string | null
}

interface ExpenseCategory {
  id: string
  name: string
  type: string
  icon: string
}

interface Product {
  id: string
  name: string
  category: string
  unit: string
}

interface Supplier {
  id: string
  name: string
}

// ── Lokaler State pro Item ────────────────────────────────────────────────────

interface ItemState {
  mode: Mode
  category_id: string
  product_id: string
  skip: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTL(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const MODE_LABELS: { mode: Mode; label: string; color: string }[] = [
  { mode: 'einkauf',   label: '🛒 Einkauf',   color: '#2D6A2D' },
  { mode: 'invest',    label: '🔨 Invest',    color: '#1565C0' },
  { mode: 'fixkosten', label: '📋 Fixkosten', color: '#6A1B9A' },
  { mode: 'privat',    label: '🏠 Privat',    color: '#B8882A' },
]

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function BulkReviewClient() {
  const db = createClient()

  const [items, setItems]         = useState<ReceiptItem[]>([])
  const [receipts, setReceipts]   = useState<Record<string, Receipt>>({})
  const [suppliers, setSuppliers] = useState<Record<string, Supplier>>({})
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [products, setProducts]   = useState<Product[]>([])
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({})
  const [loading, setLoading]     = useState(true)
  const [committing, setCommitting] = useState(false)
  const [commitResults, setCommitResults] = useState<{ ok: number; skipped: number; errors: string[] } | null>(null)
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null)

  // ── Daten laden ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)

    const [
      { data: pendingItems },
      { data: allReceipts },
      { data: allSuppliers },
      { data: allCategories },
      { data: allProducts },
    ] = await Promise.all([
      db.from('receipt_items').select('*').eq('status', 'pending').order('created_at'),
      db.from('receipts').select('id, supplier_id, ettn, fatura_no, date, total_tl, filename'),
      db.from('suppliers').select('id, name').eq('active', true),
      db.from('expense_categories').select('id, name, type, icon').eq('active', true).order('sort'),
      db.from('purchase_products').select('id, name, category, unit').eq('active', true).order('name'),
    ])

    const receiptMap: Record<string, Receipt> = {}
    for (const r of allReceipts ?? []) receiptMap[r.id] = r

    const supplierMap: Record<string, Supplier> = {}
    for (const s of allSuppliers ?? []) supplierMap[s.id] = s

    setItems(pendingItems ?? [])
    setReceipts(receiptMap)
    setSuppliers(supplierMap)
    setCategories(allCategories ?? [])
    setProducts(allProducts ?? [])

    // Initialen ItemState aufbauen
    const states: Record<string, ItemState> = {}
    for (const item of pendingItems ?? []) {
      states[item.id] = {
        mode: item.mode as Mode,
        category_id: item.category_id ?? '',
        product_id: item.product_id ?? '',
        skip: false,
      }
    }
    setItemStates(states)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Item-State ändern ────────────────────────────────────────────────────────

  function setItemField(id: string, field: keyof ItemState, value: string | Mode | boolean) {
    setItemStates(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  // Bulk-Aktion: alle Items eines Receipts auf denselben Modus setzen
  function bulkSetMode(receiptId: string, mode: Mode) {
    const ids = items.filter(i => i.receipt_id === receiptId).map(i => i.id)
    setItemStates(prev => {
      const next = { ...prev }
      for (const id of ids) next[id] = { ...next[id], mode }
      return next
    })
  }

  // Bulk-Aktion: alle Items eines Receipts überspringen
  function bulkSkip(receiptId: string) {
    const ids = items.filter(i => i.receipt_id === receiptId).map(i => i.id)
    setItemStates(prev => {
      const next = { ...prev }
      for (const id of ids) next[id] = { ...next[id], skip: true }
      return next
    })
  }

  // ── Validierung ──────────────────────────────────────────────────────────────

  function isItemReady(id: string): boolean {
    const s = itemStates[id]
    if (!s) return false
    if (s.skip) return true
    if (s.mode === 'invest' || s.mode === 'fixkosten') return !!s.category_id
    return true // einkauf + privat brauchen keine Kategorie (Produkt optional)
  }

  const allReady = items.length > 0 && items.every(i => isItemReady(i.id))
  const readyCount = items.filter(i => isItemReady(i.id)).length

  // ── Commit ───────────────────────────────────────────────────────────────────

  async function commitAll() {
    setCommitting(true)
    let ok = 0, skipped = 0
    const errors: string[] = []

    for (const item of items) {
      const s = itemStates[item.id]
      if (!s) continue

      // Überspringen
      if (s.skip) {
        await db.from('receipt_items').update({ status: 'skipped' }).eq('id', item.id)
        skipped++
        continue
      }

      const receipt = item.receipt_id ? receipts[item.receipt_id] : null
      const supplierIdFromReceipt = receipt?.supplier_id ?? null
      const dateToUse = item.date ?? receipt?.date ?? null

      try {
        if (s.mode === 'einkauf' || s.mode === 'privat') {
          // → purchase_prices
          const { data: pp, error: ppErr } = await db
            .from('purchase_prices')
            .insert({
              product_id:  s.product_id || null,
              price_tl:    item.amount_net,   // purchase_prices speichert NETTO
              quantity:    item.quantity,
              unit:        item.unit ?? 'Stk',
              date:        dateToUse,
              source:      'scan',
              receipt_ref: item.receipt_id,
              is_private:  s.mode === 'privat',
              vat_rate:    item.vat_rate,
              notes:       item.name,
            })
            .select('id')
            .single()

          if (ppErr) throw new Error(ppErr.message)

          await db.from('receipt_items').update({
            status: 'saved',
            target_table: 'purchase_prices',
            target_id: pp!.id,
            mode: s.mode,
            product_id: s.product_id || null,
          }).eq('id', item.id)

        } else {
          // invest | fixkosten → expenses
          const { data: exp, error: expErr } = await db
            .from('expenses')
            .insert({
              category_id:    s.category_id || null,
              supplier_id:    supplierIdFromReceipt,
              date:           dateToUse,
              description:    item.name,
              amount_gross:   item.amount_gross,
              amount_net:     item.amount_net,
              vat_rate:       item.vat_rate,
              vat_amount:     item.vat_amount,
              payment_type:   'offiziell',
              has_receipt:    !!item.receipt_id,
              source:         'scan',
            })
            .select('id')
            .single()

          if (expErr) throw new Error(expErr.message)

          await db.from('receipt_items').update({
            status: 'saved',
            target_table: 'expenses',
            target_id: exp!.id,
            mode: s.mode,
            category_id: s.category_id || null,
          }).eq('id', item.id)
        }

        ok++
      } catch (err) {
        const msg = `${item.name}: ${err instanceof Error ? err.message : String(err)}`
        errors.push(msg)
        await db.from('receipt_items').update({
          status: 'error',
          error_message: err instanceof Error ? err.message : String(err),
        }).eq('id', item.id)
      }
    }

    setCommitResults({ ok, skipped, errors })
    setCommitting(false)
    // Items neu laden (nur noch Fehler-Items bleiben pending/error)
    await loadData()
  }

  // ── Gruppierung nach Receipt ──────────────────────────────────────────────────

  const byReceipt = new Map<string | null, ReceiptItem[]>()
  for (const item of items) {
    const key = item.receipt_id ?? '__no_receipt__'
    if (!byReceipt.has(key)) byReceipt.set(key, [])
    byReceipt.get(key)!.push(item)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
        Lade Positionen…
      </div>
    )
  }

  if (items.length === 0 && !commitResults) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1A1207' }}>Keine offenen Positionen</p>
        <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#999' }}>
          Zuerst Rechnungen im Tab "📥 Batch" einscannen.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>

      {/* Commit-Ergebnis Banner */}
      {commitResults && (
        <div style={{
          background: commitResults.errors.length > 0 ? '#FFF8F0' : '#F0FFF0',
          border: `1px solid ${commitResults.errors.length > 0 ? '#B8882A' : '#2D6A2D'}`,
          borderRadius: '12px', padding: '16px', marginBottom: '16px',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, color: '#1A1207' }}>
            Commit abgeschlossen
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#2D6A2D' }}>✅ {commitResults.ok} gespeichert · ⏭️ {commitResults.skipped} übersprungen</p>
          {commitResults.errors.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#C0392B' }}>❌ {commitResults.errors.length} Fehler:</p>
              {commitResults.errors.map((e, i) => (
                <p key={i} style={{ margin: '2px 0', fontSize: '11px', color: '#C0392B' }}>{e}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header + Commit-Button */}
      {items.length > 0 && (
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1A1207' }}>
              📋 {items.length} Positionen kategorisieren
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#999' }}>
              {readyCount} / {items.length} bereit
            </p>
          </div>
          <button
            onClick={commitAll}
            disabled={!allReady || committing}
            style={{
              background: allReady ? '#1A1207' : '#CCC',
              color: '#FFF', border: 'none', borderRadius: '10px',
              padding: '10px 18px', fontSize: '13px', fontWeight: 800,
              cursor: allReady ? 'pointer' : 'not-allowed',
            }}
          >
            {committing ? '⏳ Speichere…' : '💾 Alles speichern'}
          </button>
        </div>
      )}

      {/* Rechnungen */}
      {Array.from(byReceipt.entries()).map(([receiptKey, receiptItems]) => {
        const rKey = receiptKey as string
        const receipt = rKey !== '__no_receipt__' ? receipts[rKey] ?? null : null
        const supplier = receipt?.supplier_id ? suppliers[receipt.supplier_id] : null
        const isOpen = expandedReceipt === rKey
        const allItemsReady = receiptItems.every(i => isItemReady(i.id))
        const dominantMode = itemStates[receiptItems[0]?.id]?.mode ?? 'einkauf'

        return (
          <div key={rKey} style={{ background: '#FFF', borderRadius: '14px', marginBottom: '12px', overflow: 'hidden', border: allItemsReady ? '1.5px solid #D4EDDA' : '1.5px solid #F0EDE8' }}>

            {/* Receipt-Header */}
            <div
              onClick={() => setExpandedReceipt(isOpen ? null : rKey)}
              style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1207', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {supplier?.name ?? receipt?.fatura_no ?? '(kein Händler)'}
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                  {fmtDate(receipt?.date ?? null)} · {receiptItems.length} Pos. · {fmtTL(receipt?.total_tl ?? receiptItems.reduce((s, i) => s + i.amount_gross, 0))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                {allItemsReady && <span style={{ fontSize: '11px', color: '#2D6A2D', fontWeight: 700 }}>✓</span>}
                <span style={{ fontSize: '12px', color: '#999' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Bulk-Aktionen (immer sichtbar) */}
            <div style={{ padding: '0 16px 10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {MODE_LABELS.map(({ mode, label, color }) => (
                <button
                  key={mode}
                  onClick={(e) => { e.stopPropagation(); bulkSetMode(rKey, mode) }}
                  style={{
                    background: dominantMode === mode ? color : '#F0EDE8',
                    color: dominantMode === mode ? '#FFF' : '#555',
                    border: 'none', borderRadius: '8px', padding: '5px 10px',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); bulkSkip(rKey) }}
                style={{ background: '#F0EDE8', color: '#999', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer' }}
              >
                ⏭️ Alle überspringen
              </button>
            </div>

            {/* Item-Liste (aufklappbar) */}
            {isOpen && (
              <div style={{ borderTop: '1px solid #F0EDE8' }}>
                {receiptItems.map((item, idx) => {
                  const s = itemStates[item.id]
                  if (!s) return null
                  const needsCategory = s.mode === 'invest' || s.mode === 'fixkosten'
                  const filteredCats = categories.filter(c =>
                    s.mode === 'invest' ? c.type === 'investition' || c.type === 'einmalig'
                    : s.mode === 'fixkosten' ? c.type === 'laufend'
                    : true
                  )

                  return (
                    <div key={item.id} style={{
                      padding: '12px 16px',
                      borderBottom: idx < receiptItems.length - 1 ? '1px solid #F7F4F0' : 'none',
                      opacity: s.skip ? 0.45 : 1,
                    }}>
                      {/* Name + Betrag */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1207', flex: 1, marginRight: '8px' }}>
                          {item.name}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#B8882A', flexShrink: 0 }}>
                          {fmtTL(item.amount_gross)}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
                        {item.quantity} {item.unit ?? 'Stk'} · Netto {fmtTL(item.amount_net)} · KDV %{item.vat_rate} · {fmtDate(item.date)}
                      </div>

                      {/* Modus-Toggle */}
                      {!s.skip && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: needsCategory ? '8px' : '0' }}>
                          {MODE_LABELS.map(({ mode, label, color }) => (
                            <button
                              key={mode}
                              onClick={() => setItemField(item.id, 'mode', mode)}
                              style={{
                                background: s.mode === mode ? color : '#F0EDE8',
                                color: s.mode === mode ? '#FFF' : '#555',
                                border: 'none', borderRadius: '6px', padding: '4px 8px',
                                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              {label}
                            </button>
                          ))}
                          <button
                            onClick={() => setItemField(item.id, 'skip', true)}
                            style={{ background: '#F0EDE8', color: '#999', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            ⏭️
                          </button>
                        </div>
                      )}

                      {/* Kategorie (invest/fixkosten) */}
                      {!s.skip && needsCategory && (
                        <select
                          value={s.category_id}
                          onChange={e => setItemField(item.id, 'category_id', e.target.value)}
                          style={{
                            width: '100%', padding: '8px 10px', borderRadius: '8px',
                            border: s.category_id ? '1.5px solid #2D6A2D' : '1.5px solid #C0392B',
                            fontSize: '13px', background: '#F7F4F0', marginTop: '6px',
                          }}
                        >
                          <option value="">— Kategorie wählen (Pflicht) —</option>
                          {filteredCats.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                          ))}
                        </select>
                      )}

                      {/* Produkt-Zuweisung (einkauf) */}
                      {!s.skip && s.mode === 'einkauf' && (
                        <select
                          value={s.product_id}
                          onChange={e => setItemField(item.id, 'product_id', e.target.value)}
                          style={{
                            width: '100%', padding: '8px 10px', borderRadius: '8px',
                            border: '1.5px solid #D4B483',
                            fontSize: '13px', background: '#F7F4F0', marginTop: '6px',
                          }}
                        >
                          <option value="">(kein Produkt — wird ohne Zuordnung gespeichert)</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} [{p.unit}]</option>
                          ))}
                        </select>
                      )}

                      {/* Skip-Badge */}
                      {s.skip && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#999' }}>⏭️ wird übersprungen</span>
                          <button
                            onClick={() => setItemField(item.id, 'skip', false)}
                            style={{ background: 'none', border: 'none', color: '#B8882A', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                          >
                            rückgängig
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Commit nochmal unten */}
      {items.length > 5 && (
        <button
          onClick={commitAll}
          disabled={!allReady || committing}
          style={{
            width: '100%', background: allReady ? '#1A1207' : '#CCC',
            color: '#FFF', border: 'none', borderRadius: '12px',
            padding: '16px', fontSize: '15px', fontWeight: 800,
            cursor: allReady ? 'pointer' : 'not-allowed', marginTop: '8px',
          }}
        >
          {committing ? '⏳ Speichere…' : `💾 Alles speichern (${items.length} Positionen)`}
        </button>
      )}
    </div>
  )
}
