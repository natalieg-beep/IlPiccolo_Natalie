'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Typen ─────────────────────────────────────────────────────────────────────

type Mode = 'einkauf' | 'invest' | 'privat' | 'fixkosten'

interface ReceiptItem {
  id: string
  receipt_id: string | null
  name: string
  amount_gross: number
  amount_net: number
  vat_rate: number
  quantity: number
  unit: string | null
  date: string | null
}

interface Receipt {
  id: string
  supplier_id: string | null
  fatura_no: string | null
  date: string | null
  total_tl: number | null
}

interface ExpenseCategory { id: string; name: string; type: string; icon: string }
interface Supplier { id: string; name: string; category: string }

// State pro Rechnung (Standard für alle Items)
interface ReceiptState {
  mode: Mode
  category_id: string
  skip: boolean
}

// State pro Item (Überschreibung — nur wenn abweichend vom Rechnungs-Standard)
interface ItemOverride {
  mode: Mode
  category_id: string
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

const MODE_LABELS: { mode: Mode; label: string; color: string; bg: string }[] = [
  { mode: 'einkauf',   label: '🛒 Einkauf',   color: '#2D6A2D', bg: '#E8F5E9' },
  { mode: 'invest',    label: '🔨 Invest',    color: '#1565C0', bg: '#E3F2FD' },
  { mode: 'fixkosten', label: '📋 Fixkosten', color: '#6A1B9A', bg: '#F3E5F5' },
  { mode: 'privat',    label: '🏠 Privat',    color: '#B8882A', bg: '#FFF8E1' },
]

function ModeToggle({ value, onChange, small }: { value: Mode; onChange: (m: Mode) => void; small?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {MODE_LABELS.map(({ mode, label, color, bg }) => (
        <button key={mode} onClick={() => onChange(mode)} style={{
          background: value === mode ? color : bg,
          color: value === mode ? '#FFF' : color,
          border: `1.5px solid ${color}`, borderRadius: '7px',
          padding: small ? '3px 8px' : '5px 12px',
          fontSize: small ? '11px' : '12px', fontWeight: 700, cursor: 'pointer',
        }}>
          {label}
        </button>
      ))}
    </div>
  )
}

function CategorySelect({ mode, value, onChange, categories }: {
  mode: Mode; value: string; onChange: (v: string) => void; categories: ExpenseCategory[]
}) {
  if (mode !== 'invest' && mode !== 'fixkosten') return null
  const filtered = categories.filter(c =>
    mode === 'invest' ? (c.type === 'investition' || c.type === 'einmalig') : c.type === 'laufend'
  )
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '13px',
      border: value ? '1.5px solid #2D6A2D' : '1.5px solid #C0392B',
      background: '#F7F4F0', marginTop: '6px',
    }}>
      <option value="">— Kategorie wählen (Pflicht) —</option>
      {filtered.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
    </select>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function BulkReviewClient() {
  const db = createClient()

  const [items, setItems]             = useState<ReceiptItem[]>([])
  const [receipts, setReceipts]       = useState<Record<string, Receipt>>({})
  const [suppliers, setSuppliers]     = useState<Record<string, Supplier>>({})
  const [categories, setCategories]   = useState<ExpenseCategory[]>([])
  const [receiptStates, setReceiptStates] = useState<Record<string, ReceiptState>>({})
  const [itemOverrides, setItemOverrides] = useState<Record<string, ItemOverride>>({})
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [committing, setCommitting]   = useState(false)
  const [commitResult, setCommitResult] = useState<{ ok: number; skipped: number; errors: string[] } | null>(null)

  // ── Laden ──────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: pendingItems }, { data: allReceipts }, { data: allSuppliers }, { data: allCats }] = await Promise.all([
      db.from('receipt_items').select('*').eq('status', 'pending').order('created_at'),
      db.from('receipts').select('id, supplier_id, fatura_no, date, total_tl'),
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

    // Receipt-State initialisieren (Standard: Einkauf)
    const grouped = new Map<string, ReceiptItem[]>()
    for (const item of pendingItems ?? []) {
      const key = item.receipt_id ?? '__none__'
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(item)
    }
    const states: Record<string, ReceiptState> = {}
    for (const key of grouped.keys()) states[key] = { mode: 'einkauf', category_id: '', skip: false }
    setReceiptStates(states)
    setItemOverrides({})
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Effektiver Modus für ein Item ──────────────────────────────────────────
  // Item-Override hat Vorrang; sonst gilt Rechnungs-Standard

  function effectiveMode(itemId: string, receiptKey: string): Mode {
    return itemOverrides[itemId]?.mode ?? receiptStates[receiptKey]?.mode ?? 'einkauf'
  }
  function effectiveCategory(itemId: string, receiptKey: string): string {
    return itemOverrides[itemId]?.category_id ?? receiptStates[receiptKey]?.category_id ?? ''
  }
  function effectiveSkip(itemId: string, receiptKey: string): boolean {
    return itemOverrides[itemId]?.skip ?? receiptStates[receiptKey]?.skip ?? false
  }
  function hasOverride(itemId: string): boolean {
    return !!itemOverrides[itemId]
  }

  // ── State-Setter ──────────────────────────────────────────────────────────

  function setReceiptMode(key: string, mode: Mode) {
    setReceiptStates(prev => ({ ...prev, [key]: { ...prev[key], mode, category_id: '' } }))
    // Item-Overrides für diese Rechnung löschen (Standard übernehmen)
    setItemOverrides(prev => {
      const next = { ...prev }
      for (const id of Object.keys(next)) { if (next[id] !== undefined) delete next[id] }
      return next
    })
  }
  function setReceiptCategory(key: string, cat: string) {
    setReceiptStates(prev => ({ ...prev, [key]: { ...prev[key], category_id: cat } }))
  }
  function setReceiptSkip(key: string, skip: boolean) {
    setReceiptStates(prev => ({ ...prev, [key]: { ...prev[key], skip } }))
  }

  function setItemMode(itemId: string, mode: Mode) {
    setItemOverrides(prev => ({ ...prev, [itemId]: { ...prev[itemId], mode, category_id: prev[itemId]?.category_id ?? '', skip: false } }))
  }
  function setItemCategory(itemId: string, cat: string) {
    setItemOverrides(prev => ({ ...prev, [itemId]: { ...prev[itemId], category_id: cat, skip: false } }))
  }
  function setItemSkip(itemId: string, skip: boolean) {
    setItemOverrides(prev => ({ ...prev, [itemId]: { ...prev[itemId], skip, mode: prev[itemId]?.mode ?? 'einkauf', category_id: '' } }))
  }
  function clearItemOverride(itemId: string) {
    setItemOverrides(prev => { const next = { ...prev }; delete next[itemId]; return next })
  }

  // Alles auf Einkauf
  function setAllEinkauf() {
    setReceiptStates(prev => {
      const next = { ...prev }
      for (const k of Object.keys(next)) next[k] = { mode: 'einkauf', category_id: '', skip: false }
      return next
    })
    setItemOverrides({})
  }

  // ── Validierung ───────────────────────────────────────────────────────────

  function isItemReady(itemId: string, receiptKey: string): boolean {
    const skip = effectiveSkip(itemId, receiptKey)
    if (skip) return true
    const mode = effectiveMode(itemId, receiptKey)
    if (mode === 'invest' || mode === 'fixkosten') return !!effectiveCategory(itemId, receiptKey)
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
  const allReady = receiptKeys.length > 0 && items.every(i => isItemReady(i.id, i.receipt_id ?? '__none__'))
  const readyItems = items.filter(i => isItemReady(i.id, i.receipt_id ?? '__none__')).length

  // ── Commit ────────────────────────────────────────────────────────────────

  async function commitAll() {
    setCommitting(true)
    let ok = 0, skipped = 0
    const errors: string[] = []

    for (const item of items) {
      const key = item.receipt_id ?? '__none__'
      const skip = effectiveSkip(item.id, key)
      const mode = effectiveMode(item.id, key)
      const category_id = effectiveCategory(item.id, key)
      const receipt = item.receipt_id ? receipts[item.receipt_id] : null
      const dateToUse = item.date ?? receipt?.date ?? null

      if (skip) {
        await db.from('receipt_items').update({ status: 'skipped' }).eq('id', item.id)
        skipped++
        continue
      }

      try {
        if (mode === 'einkauf' || mode === 'privat') {
          const { data: pp, error: ppErr } = await db.from('purchase_prices').insert({
            product_id: null, price_tl: item.amount_net, quantity: item.quantity,
            unit: item.unit ?? 'Stk', date: dateToUse, source: 'scan',
            receipt_ref: item.receipt_id, is_private: mode === 'privat',
            vat_rate: item.vat_rate, notes: item.name,
          }).select('id').single()
          if (ppErr) throw new Error(ppErr.message)
          await db.from('receipt_items').update({ status: 'saved', target_table: 'purchase_prices', target_id: pp!.id, mode }).eq('id', item.id)
        } else {
          const { data: exp, error: expErr } = await db.from('expenses').insert({
            category_id: category_id || null, supplier_id: receipt?.supplier_id ?? null,
            date: dateToUse, description: item.name, amount_gross: item.amount_gross,
            amount_net: item.amount_net, vat_rate: item.vat_rate,
            payment_type: 'offiziell', has_receipt: !!item.receipt_id, source: 'scan',
          }).select('id').single()
          if (expErr) throw new Error(expErr.message)
          await db.from('receipt_items').update({ status: 'saved', target_table: 'expenses', target_id: exp!.id, mode, category_id: category_id || null }).eq('id', item.id)
        }
        ok++
      } catch (err) {
        errors.push(`${item.name}: ${err instanceof Error ? err.message : String(err)}`)
        await db.from('receipt_items').update({ status: 'error', error_message: err instanceof Error ? err.message : String(err) }).eq('id', item.id)
      }
    }

    setCommitResult({ ok, skipped, errors })
    setCommitting(false)
    await loadData()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>⏳ Lade…</div>

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
        <div style={{ background: commitResult.errors.length ? '#FFF8F0' : '#F0FFF0', border: `1px solid ${commitResult.errors.length ? '#B8882A' : '#2D6A2D'}`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800 }}>Gespeichert</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#2D6A2D' }}>✅ {commitResult.ok} Positionen · ⏭️ {commitResult.skipped} übersprungen</p>
          {commitResult.errors.slice(0, 5).map((e, i) => <p key={i} style={{ margin: '4px 0 0', fontSize: '11px', color: '#C0392B' }}>{e}</p>)}
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* Header */}
          <div style={{ background: '#FFF', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{receiptKeys.length} Rechnungen · {items.length} Positionen</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: readyItems === items.length ? '#2D6A2D' : '#999' }}>
                  {readyItems} / {items.length} bereit
                </p>
              </div>
              <button onClick={commitAll} disabled={!allReady || committing} style={{
                background: allReady ? '#1A1207' : '#CCC', color: '#FFF', border: 'none',
                borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 800,
                cursor: allReady ? 'pointer' : 'not-allowed',
              }}>
                {committing ? '⏳' : '💾 Speichern'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={setAllEinkauf} style={{ background: '#E8F5E9', color: '#2D6A2D', border: '1.5px solid #2D6A2D', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                🛒 Alle → Einkauf
              </button>
              <span style={{ fontSize: '11px', color: '#999' }}>Dann einzelne Rechnungen oder Positionen anpassen</span>
            </div>
          </div>

          {/* Rechnungskarten */}
          {receiptKeys.map(key => {
            const receiptItems = byReceipt.get(key)!
            const receipt = key !== '__none__' ? receipts[key] : null
            const supplier = receipt?.supplier_id ? suppliers[receipt.supplier_id] : null
            const rs = receiptStates[key] ?? { mode: 'einkauf', category_id: '', skip: false }
            const isOpen = expandedReceipt === key
            const allItemsReady = receiptItems.every(i => isItemReady(i.id, key))
            const totalGross = receiptItems.reduce((s, i) => s + i.amount_gross, 0)
            const overrideCount = receiptItems.filter(i => hasOverride(i.id)).length

            return (
              <div key={key} style={{
                background: '#FFF', borderRadius: '14px', marginBottom: '10px', overflow: 'hidden',
                border: rs.skip ? '1.5px solid #DDD' : allItemsReady ? '1.5px solid #D4EDDA' : '1.5px solid #FFE0B2',
              }}>
                {/* Header */}
                <div style={{ padding: '14px 16px 10px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                  onClick={() => setExpandedReceipt(isOpen ? null : key)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: rs.skip ? '#AAA' : '#1A1207' }}>
                      {supplier?.name ?? receipt?.fatura_no ?? '(kein Händler)'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      {fmtDate(receipt?.date ?? null)} · {receiptItems.length} Pos. · {fmtTL(receipt?.total_tl ?? totalGross)}
                      {overrideCount > 0 && <span style={{ color: '#B8882A', marginLeft: '6px' }}>· {overrideCount} manuell</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {allItemsReady && !rs.skip && <span style={{ color: '#2D6A2D', fontSize: '13px' }}>✓</span>}
                    <span style={{ color: '#999', fontSize: '11px' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Rechnungs-Standard */}
                {!rs.skip && (
                  <div style={{ padding: '0 16px 8px' }}>
                    <div style={{ fontSize: '11px', color: '#999', marginBottom: '5px' }}>Standard für alle Positionen:</div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <ModeToggle value={rs.mode} onChange={m => setReceiptMode(key, m)} />
                      <button onClick={e => { e.stopPropagation(); setReceiptSkip(key, true) }} style={{ background: '#F5F5F5', color: '#999', border: '1.5px solid #DDD', borderRadius: '7px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer' }}>⏭️ alle</button>
                    </div>
                    <CategorySelect mode={rs.mode} value={rs.category_id} onChange={v => setReceiptCategory(key, v)} categories={categories} />
                  </div>
                )}

                {rs.skip && (
                  <div style={{ padding: '0 16px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#999' }}>⏭️ alle übersprungen</span>
                    <button onClick={() => setReceiptSkip(key, false)} style={{ background: 'none', border: 'none', color: '#B8882A', fontSize: '12px', cursor: 'pointer', padding: 0 }}>rückgängig</button>
                  </div>
                )}

                {/* Positionen (aufklappbar) */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #F0EDE8' }}>
                    {receiptItems.map((item, idx) => {
                      const ov = itemOverrides[item.id]
                      const iMode = effectiveMode(item.id, key)
                      const iCat = effectiveCategory(item.id, key)
                      const iSkip = effectiveSkip(item.id, key)
                      const iReady = isItemReady(item.id, key)

                      return (
                        <div key={item.id} style={{
                          padding: '10px 16px', borderBottom: idx < receiptItems.length - 1 ? '1px solid #F7F4F0' : 'none',
                          background: ov ? '#FFFEF5' : 'transparent', opacity: iSkip ? 0.5 : 1,
                        }}>
                          {/* Name + Betrag */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, marginRight: '8px' }}>
                              {item.name}
                              {ov && !iSkip && <span style={{ fontSize: '10px', color: '#B8882A', marginLeft: '6px' }}>✏️ manuell</span>}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#B8882A', flexShrink: 0 }}>{fmtTL(item.amount_gross)}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#999', marginBottom: '7px' }}>
                            {item.quantity} {item.unit ?? 'Stk'} · Netto {fmtTL(item.amount_net)} · KDV %{item.vat_rate}
                          </div>

                          {/* Item-Modus (wenn nicht geskippt) */}
                          {!iSkip && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <ModeToggle value={iMode} onChange={m => setItemMode(item.id, m)} small />
                              <button onClick={() => setItemSkip(item.id, true)} style={{ background: '#F5F5F5', color: '#999', border: '1px solid #DDD', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', cursor: 'pointer' }}>⏭️</button>
                              {ov && (
                                <button onClick={() => clearItemOverride(item.id)} style={{ background: 'none', border: 'none', color: '#999', fontSize: '10px', cursor: 'pointer', padding: '0 4px' }}>↩ Reset</button>
                              )}
                            </div>
                          )}

                          {/* Kategorie für dieses Item */}
                          {!iSkip && (iMode === 'invest' || iMode === 'fixkosten') && (
                            <CategorySelect
                              mode={iMode} value={iCat}
                              onChange={v => setItemCategory(item.id, v)}
                              categories={categories}
                            />
                          )}

                          {/* Skip */}
                          {iSkip && (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', color: '#999' }}>⏭️ übersprungen</span>
                              <button onClick={() => iSkip && ov ? clearItemOverride(item.id) : setItemSkip(item.id, false)} style={{ background: 'none', border: 'none', color: '#B8882A', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                                rückgängig
                              </button>
                            </div>
                          )}

                          {/* Warnung wenn Kategorie fehlt */}
                          {!iReady && !iSkip && (
                            <div style={{ fontSize: '11px', color: '#C0392B', marginTop: '4px' }}>⚠️ Kategorie fehlt</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Speichern unten */}
          {receiptKeys.length > 3 && (
            <button onClick={commitAll} disabled={!allReady || committing} style={{
              width: '100%', background: allReady ? '#1A1207' : '#CCC', color: '#FFF',
              border: 'none', borderRadius: '12px', padding: '16px', fontSize: '15px',
              fontWeight: 800, cursor: allReady ? 'pointer' : 'not-allowed', marginTop: '8px',
            }}>
              {committing ? '⏳ Speichere…' : `💾 Alles speichern (${items.length} Positionen)`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
