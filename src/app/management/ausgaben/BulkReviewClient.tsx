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
  quantity: number
  unit: string | null
  date: string | null
  mode: Mode
  category_id: string | null
  product_id: string | null
  status: string
}

interface Receipt {
  id: string
  supplier_id: string | null
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

interface Supplier {
  id: string
  name: string
  category: string
}

// Lokaler State pro Receipt (nicht pro Item — das war das Problem)
interface ReceiptState {
  mode: Mode
  category_id: string  // nur für invest/fixkosten
  skip: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTL(n: number | null) {
  if (n == null) return '—'
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// Supplier-Kategorie → default Modus
function defaultModeForSupplier(category: string | undefined): Mode {
  if (category === 'lieferant' || category === 'supermarkt') return 'einkauf'
  return 'einkauf' // default alles Einkauf, User flippt Invest manuell
}

const MODE_LABELS: { mode: Mode; label: string; color: string; bg: string }[] = [
  { mode: 'einkauf',   label: '🛒 Einkauf',   color: '#2D6A2D', bg: '#E8F5E9' },
  { mode: 'invest',    label: '🔨 Invest',    color: '#1565C0', bg: '#E3F2FD' },
  { mode: 'fixkosten', label: '📋 Fixkosten', color: '#6A1B9A', bg: '#F3E5F5' },
  { mode: 'privat',    label: '🏠 Privat',    color: '#B8882A', bg: '#FFF8E1' },
]

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function BulkReviewClient() {
  const db = createClient()

  const [items, setItems]           = useState<ReceiptItem[]>([])
  const [receipts, setReceipts]     = useState<Record<string, Receipt>>({})
  const [suppliers, setSuppliers]   = useState<Record<string, Supplier>>({})
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [receiptStates, setReceiptStates] = useState<Record<string, ReceiptState>>({})
  const [loading, setLoading]       = useState(true)
  const [committing, setCommitting] = useState(false)
  const [commitResult, setCommitResult] = useState<{ ok: number; skipped: number; errors: string[] } | null>(null)
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null)

  // ── Laden ─────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    const [
      { data: pendingItems },
      { data: allReceipts },
      { data: allSuppliers },
      { data: allCats },
    ] = await Promise.all([
      db.from('receipt_items').select('*').eq('status', 'pending').order('created_at'),
      db.from('receipts').select('id, supplier_id, fatura_no, date, total_tl, filename'),
      db.from('suppliers').select('id, name, category').eq('active', true),
      db.from('expense_categories').select('id, name, type, icon').eq('active', true).order('sort'),
    ])

    const receiptMap: Record<string, Receipt> = {}
    for (const r of allReceipts ?? []) receiptMap[r.id] = r
    const supplierMap: Record<string, Supplier> = {}
    for (const s of allSuppliers ?? []) supplierMap[s.id] = s

    setItems(pendingItems ?? [])
    setReceipts(receiptMap)
    setSuppliers(supplierMap)
    setCategories(allCats ?? [])

    // State pro Receipt aufbauen (nicht pro Item!)
    const grouped = new Map<string, ReceiptItem[]>()
    for (const item of pendingItems ?? []) {
      const key = item.receipt_id ?? '__none__'
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(item)
    }

    const states: Record<string, ReceiptState> = {}
    for (const [key] of grouped.entries()) {
      const receipt = key !== '__none__' ? receiptMap[key] : null
      const supplier = receipt?.supplier_id ? supplierMap[receipt.supplier_id] : null
      states[key] = {
        mode: defaultModeForSupplier(supplier?.category),
        category_id: '',
        skip: false,
      }
    }
    setReceiptStates(states)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── State ändern ──────────────────────────────────────────────────────────

  function setReceiptMode(key: string, mode: Mode) {
    setReceiptStates(prev => ({ ...prev, [key]: { ...prev[key], mode, category_id: '' } }))
  }
  function setReceiptCategory(key: string, cat: string) {
    setReceiptStates(prev => ({ ...prev, [key]: { ...prev[key], category_id: cat } }))
  }
  function setReceiptSkip(key: string, skip: boolean) {
    setReceiptStates(prev => ({ ...prev, [key]: { ...prev[key], skip } }))
  }

  // Alle auf einmal auf Einkauf setzen
  function setAllEinkauf() {
    setReceiptStates(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) next[key] = { ...next[key], mode: 'einkauf', skip: false }
      return next
    })
  }

  // ── Validierung ───────────────────────────────────────────────────────────

  function isReceiptReady(key: string): boolean {
    const s = receiptStates[key]
    if (!s) return false
    if (s.skip) return true
    if (s.mode === 'invest' || s.mode === 'fixkosten') return !!s.category_id
    return true
  }

  // Gruppierung
  const byReceipt = new Map<string, ReceiptItem[]>()
  for (const item of items) {
    const key = item.receipt_id ?? '__none__'
    if (!byReceipt.has(key)) byReceipt.set(key, [])
    byReceipt.get(key)!.push(item)
  }

  const receiptKeys = Array.from(byReceipt.keys())
  const readyCount = receiptKeys.filter(k => isReceiptReady(k)).length
  const allReady = receiptKeys.length > 0 && receiptKeys.every(k => isReceiptReady(k))

  // ── Commit ────────────────────────────────────────────────────────────────

  async function commitAll() {
    setCommitting(true)
    let ok = 0, skipped = 0
    const errors: string[] = []

    for (const [key, receiptItems] of byReceipt.entries()) {
      const s = receiptStates[key]
      if (!s) continue

      if (s.skip) {
        await db.from('receipt_items')
          .update({ status: 'skipped' })
          .in('id', receiptItems.map(i => i.id))
        skipped += receiptItems.length
        continue
      }

      const receipt = key !== '__none__' ? receipts[key] : null
      const supplierIdFromReceipt = receipt?.supplier_id ?? null
      const receiptDate = receipt?.date ?? null

      for (const item of receiptItems) {
        const dateToUse = item.date ?? receiptDate

        try {
          if (s.mode === 'einkauf' || s.mode === 'privat') {
            const { data: pp, error: ppErr } = await db
              .from('purchase_prices')
              .insert({
                product_id:  null,
                price_tl:    item.amount_net,
                quantity:    item.quantity,
                unit:        item.unit ?? 'Stk',
                date:        dateToUse,
                source:      'scan',
                receipt_ref: item.receipt_id,
                is_private:  s.mode === 'privat',
                vat_rate:    item.vat_rate,
                notes:       item.name,
              })
              .select('id').single()

            if (ppErr) throw new Error(ppErr.message)

            await db.from('receipt_items').update({
              status: 'saved', target_table: 'purchase_prices', target_id: pp!.id, mode: s.mode,
            }).eq('id', item.id)

          } else {
            const { data: exp, error: expErr } = await db
              .from('expenses')
              .insert({
                category_id:  s.category_id || null,
                supplier_id:  supplierIdFromReceipt,
                date:         dateToUse,
                description:  item.name,
                amount_gross: item.amount_gross,
                amount_net:   item.amount_net,
                vat_rate:     item.vat_rate,
                payment_type: 'offiziell',
                has_receipt:  !!item.receipt_id,
                source:       'scan',
              })
              .select('id').single()

            if (expErr) throw new Error(expErr.message)

            await db.from('receipt_items').update({
              status: 'saved', target_table: 'expenses', target_id: exp!.id,
              mode: s.mode, category_id: s.category_id || null,
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
    }

    setCommitResult({ ok, skipped, errors })
    setCommitting(false)
    await loadData()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>⏳ Lade…</div>
  }

  if (items.length === 0 && !commitResult) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Keine offenen Positionen</p>
        <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#999' }}>Zuerst Rechnungen im Tab "📥 Batch" einscannen.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>

      {/* Commit-Ergebnis */}
      {commitResult && (
        <div style={{ background: commitResult.errors.length > 0 ? '#FFF8F0' : '#F0FFF0', border: `1px solid ${commitResult.errors.length > 0 ? '#B8882A' : '#2D6A2D'}`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800 }}>Gespeichert</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#2D6A2D' }}>✅ {commitResult.ok} Positionen · ⏭️ {commitResult.skipped} übersprungen</p>
          {commitResult.errors.length > 0 && commitResult.errors.slice(0, 5).map((e, i) => (
            <p key={i} style={{ margin: '4px 0 0', fontSize: '11px', color: '#C0392B' }}>{e}</p>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* Header-Bar */}
          <div style={{ background: '#FFF', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1A1207' }}>
                  {receiptKeys.length} Rechnungen · {items.length} Positionen
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: readyCount === receiptKeys.length ? '#2D6A2D' : '#999' }}>
                  {readyCount} / {receiptKeys.length} bereit
                </p>
              </div>
              <button
                onClick={commitAll}
                disabled={!allReady || committing}
                style={{
                  background: allReady ? '#1A1207' : '#CCC', color: '#FFF',
                  border: 'none', borderRadius: '10px', padding: '10px 18px',
                  fontSize: '13px', fontWeight: 800, cursor: allReady ? 'pointer' : 'not-allowed',
                }}
              >
                {committing ? '⏳' : '💾 Speichern'}
              </button>
            </div>

            {/* Global-Aktionen */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={setAllEinkauf} style={{ background: '#E8F5E9', color: '#2D6A2D', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                🛒 Alle → Einkauf
              </button>
              <span style={{ fontSize: '12px', color: '#999', alignSelf: 'center' }}>dann einzelne Rechnungen auf Invest flippen</span>
            </div>
          </div>

          {/* Rechnungs-Karten */}
          {receiptKeys.map(key => {
            const receiptItems = byReceipt.get(key)!
            const receipt = key !== '__none__' ? receipts[key] : null
            const supplier = receipt?.supplier_id ? suppliers[receipt.supplier_id] : null
            const s = receiptStates[key] ?? { mode: 'einkauf', category_id: '', skip: false }
            const isOpen = expandedReceipt === key
            const ready = isReceiptReady(key)
            const modeInfo = MODE_LABELS.find(m => m.mode === s.mode)!
            const filteredCats = categories.filter(c =>
              s.mode === 'invest' ? (c.type === 'investition' || c.type === 'einmalig') :
              s.mode === 'fixkosten' ? c.type === 'laufend' : true
            )
            const totalGross = receiptItems.reduce((sum, i) => sum + i.amount_gross, 0)

            return (
              <div key={key} style={{
                background: '#FFF', borderRadius: '14px', marginBottom: '10px', overflow: 'hidden',
                border: s.skip ? '1.5px solid #DDD' : ready ? '1.5px solid #D4EDDA' : '1.5px solid #FFE0B2',
              }}>
                {/* Karten-Header — tippen zum Aufklappen */}
                <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => setExpandedReceipt(isOpen ? null : key)} >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: s.skip ? '#AAA' : '#1A1207', marginBottom: '2px' }}>
                      {supplier?.name ?? receipt?.fatura_no ?? '(kein Händler)'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999' }}>
                      {fmtDate(receipt?.date ?? null)} · {receiptItems.length} Pos. · {fmtTL(receipt?.total_tl ?? totalGross)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {ready && !s.skip && <span style={{ fontSize: '13px', color: '#2D6A2D' }}>✓</span>}
                    <span style={{ fontSize: '11px', color: '#999', cursor: 'pointer' }} onClick={() => setExpandedReceipt(isOpen ? null : key)}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Modus-Buttons (immer sichtbar) */}
                {!s.skip && (
                  <div style={{ padding: '0 16px 12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {MODE_LABELS.map(({ mode, label, color, bg }) => (
                      <button key={mode} onClick={() => setReceiptMode(key, mode)} style={{
                        background: s.mode === mode ? color : bg,
                        color: s.mode === mode ? '#FFF' : color,
                        border: `1.5px solid ${color}`, borderRadius: '8px', padding: '5px 12px',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      }}>
                        {label}
                      </button>
                    ))}
                    <button onClick={() => setReceiptSkip(key, true)} style={{ background: '#F5F5F5', color: '#999', border: '1.5px solid #DDD', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}>
                      ⏭️
                    </button>
                  </div>
                )}

                {/* Kategorie (für invest/fixkosten) */}
                {!s.skip && (s.mode === 'invest' || s.mode === 'fixkosten') && (
                  <div style={{ padding: '0 16px 12px' }}>
                    <select
                      value={s.category_id}
                      onChange={e => setReceiptCategory(key, e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px',
                        border: s.category_id ? '1.5px solid #2D6A2D' : '1.5px solid #C0392B',
                        background: '#F7F4F0',
                      }}
                    >
                      <option value="">— Kategorie wählen —</option>
                      {filteredCats.map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Skip-Badge */}
                {s.skip && (
                  <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#999' }}>⏭️ wird übersprungen</span>
                    <button onClick={() => setReceiptSkip(key, false)} style={{ background: 'none', border: 'none', color: '#B8882A', fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                      rückgängig
                    </button>
                  </div>
                )}

                {/* Aufgeklappte Positions-Liste */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #F0EDE8' }}>
                    {receiptItems.map((item, idx) => (
                      <div key={item.id} style={{
                        padding: '10px 16px', fontSize: '13px',
                        borderBottom: idx < receiptItems.length - 1 ? '1px solid #F7F4F0' : 'none',
                        display: 'flex', justifyContent: 'space-between', gap: '8px',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#1A1207' }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                            {item.quantity} {item.unit ?? 'Stk'} · Netto {fmtTL(item.amount_net)} · KDV %{item.vat_rate}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#B8882A', flexShrink: 0 }}>
                          {fmtTL(item.amount_gross)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Speichern unten (bei vielen Karten) */}
          {receiptKeys.length > 4 && (
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
              {committing ? '⏳ Speichere…' : `💾 Alles speichern (${receiptKeys.length} Rechnungen · ${items.length} Positionen)`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
