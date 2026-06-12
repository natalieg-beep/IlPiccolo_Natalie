'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let b64 = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize)
    b64 += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  return btoa(b64)
}

export type ExpenseCategory = { id: string; name: string; type: string; icon: string; sort: number }
export type Expense = {
  id: string; category_id: string | null; supplier_id: string | null
  date: string | null; description: string | null
  amount_net: number | null; vat_rate: number | null; vat_amount: number | null
  stopaj_amount: number | null; amount_gross: number
  payment_type: string; payment_method: string | null
  has_receipt: boolean; source: string
  amort_months: number | null; amort_start: string | null
  period_from: string | null; period_to: string | null
  notes: string | null; created_at: string
}
export type Supplier = { id: string; name: string; category: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTL(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// Monatlicher Anteil einer Ausgabe im gegebenen Monat (YYYY-MM)
function monthlyShare(exp: Expense, month: string): number {
  if (!exp.amort_months || !exp.amort_start) return 0
  const [y, m] = month.split('-').map(Number)
  const start = new Date(exp.amort_start)
  const end = new Date(start)
  end.setMonth(end.getMonth() + exp.amort_months)
  const check = new Date(y, m - 1, 1)
  if (check < start || check >= end) return 0
  return exp.amount_gross / exp.amort_months
}

// Fixkosten in einem Monat (nicht amortisiert, nur in dem Monat)
function isInMonth(exp: Expense, month: string): boolean {
  if (exp.amort_months) return false // amortisiert → anders behandelt
  if (!exp.date) return false
  return exp.date.slice(0, 7) === month
}

const PAYMENT_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  offiziell: { label: 'Offiziell', color: '#1565C0', bg: '#E3F2FD' },
  bar:        { label: 'Bar',      color: '#E65100', bg: '#FFF3E0' },
  schwarz:    { label: 'Schwarz',  color: '#4A4A4A', bg: '#F0F0F0' },
}
const METHOD_LABEL: Record<string, string> = {
  überweisung: '💳 Überweisung', karte: '💳 Karte', nakit: '💵 Bar', sonstiges: '…'
}

const EMPTY_FORM = {
  category_id: '', supplier_id: '', date: new Date().toISOString().slice(0, 10),
  description: '', amount_net: '', vat_rate: '20', vat_amount: '', amount_gross: '',
  stopaj_amount: '', payment_type: 'offiziell', payment_method: 'überweisung',
  has_receipt: false, amort_months: '', amort_start: '', period_from: '', period_to: '', notes: '',
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function KostenClient({
  categories, expenses: initialExpenses, suppliers,
}: {
  categories: ExpenseCategory[]
  expenses: Expense[]
  suppliers: Supplier[]
}) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [expenses, setExpenses]     = useState<Expense[]>(initialExpenses)
  const [view, setView]             = useState<'uebersicht' | 'neu' | 'scan'>('uebersicht')
  const [viewMode, setViewMode]     = useState<'monatlich' | 'gesamt'>('gesamt')
  const [selMonth, setSelMonth]     = useState(new Date().toISOString().slice(0, 7))
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'alle' | 'laufend' | 'einmalig' | 'investition'>('alle')

  const [form, setForm]   = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<Record<string, unknown> | null>(null)
  const [scanError, setScanError]   = useState<string | null>(null)
  const [dupWarning, setDupWarning] = useState<string | null>(null)
  type ExpenseMatch = { id: string; description: string | null; amount_gross: number; date: string | null; has_receipt: boolean }
  const [expenseMatch, setExpenseMatch] = useState<ExpenseMatch | null>(null)
  const [matchAssigned, setMatchAssigned] = useState(false)

  // ── Berechnungen ─────────────────────────────────────────────────────────────

  const catById = useCallback((id: string | null) =>
    categories.find(c => c.id === id) ?? null, [categories])

  const supplierById = useCallback((id: string | null) =>
    suppliers.find(s => s.id === id) ?? null, [suppliers])

  // Summe monatlicher Anteile
  const monthTotal = useCallback((month: string) => {
    let total = 0
    for (const e of expenses) {
      total += monthlyShare(e, month)
      if (isInMonth(e, month)) total += e.amount_gross
    }
    return total
  }, [expenses])

  // Gesamtsumme aller Ausgaben
  const grandTotal = expenses.reduce((s, e) => s + e.amount_gross, 0)

  // Monatlicher Amortisationsanteil aller aktiven Amortisationen
  const amortTotal = useCallback((month: string) =>
    expenses.reduce((s, e) => s + monthlyShare(e, month), 0), [expenses])

  // Nicht-amortisierte Ausgaben in Monat
  const directTotal = useCallback((month: string) =>
    expenses.filter(e => isInMonth(e, month)).reduce((s, e) => s + e.amount_gross, 0), [expenses])

  // Ausgaben gefiltert nach Kategorie-Typ
  const filteredExpenses = useCallback(() => {
    return expenses.filter(e => {
      if (filterType === 'alle') return true
      const cat = catById(e.category_id)
      return cat?.type === filterType
    })
  }, [expenses, filterType, catById])

  // Ausgaben pro Kategorie
  const expensesByCat = useCallback((catId: string) =>
    filteredExpenses().filter(e => e.category_id === catId), [filteredExpenses])

  // Summe pro Kategorie (monatlich oder gesamt)
  const catTotal = useCallback((catId: string) => {
    const exps = expensesByCat(catId)
    if (viewMode === 'gesamt') return exps.reduce((s, e) => s + e.amount_gross, 0)
    return exps.reduce((s, e) => s + monthlyShare(e, selMonth) + (isInMonth(e, selMonth) ? e.amount_gross : 0), 0)
  }, [expensesByCat, viewMode, selMonth])

  // ── Speichern ────────────────────────────────────────────────────────────────

  async function saveExpense() {
    if (!form.amount_gross) return alert('Betrag (Brutto) erforderlich')
    setSaving(true)
    const payload = {
      category_id:    form.category_id || null,
      supplier_id:    form.supplier_id || null,
      date:           form.date || null,
      description:    form.description || null,
      amount_net:     form.amount_net ? parseFloat(form.amount_net) : null,
      vat_rate:       form.vat_rate ? parseFloat(form.vat_rate) : null,
      vat_amount:     form.vat_amount ? parseFloat(form.vat_amount) : null,
      stopaj_amount:  form.stopaj_amount ? parseFloat(form.stopaj_amount) : null,
      amount_gross:   parseFloat(form.amount_gross),
      payment_type:   form.payment_type,
      payment_method: form.payment_method || null,
      has_receipt:    form.has_receipt,
      source:         'manual' as const,
      amort_months:   form.amort_months ? parseInt(form.amort_months) : null,
      amort_start:    form.amort_start || null,
      period_from:    form.period_from || null,
      period_to:      form.period_to || null,
      notes:          form.notes || null,
    }
    const { data, error } = await supabase.from('expenses').insert(payload).select().single()
    if (error) { alert('Fehler: ' + error.message); setSaving(false); return }
    setExpenses(prev => [data as Expense, ...prev])
    setForm(EMPTY_FORM)
    setView('uebersicht')
    setSaving(false)
  }

  // ── Scan ─────────────────────────────────────────────────────────────────────

  async function handleScanFile(file: File) {
    setScanning(true); setScanError(null); setScanResult(null); setDupWarning(null); setExpenseMatch(null); setMatchAssigned(false)
    try {
      const buf = await file.arrayBuffer()
      const b64 = bufferToBase64(buf)
      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-receipt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: b64, image_type: file.type, mode: 'expense' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Scan-Fehler')
      setScanResult(json)
      if (json.duplicate?.found) {
        setDupWarning(`⚠️ Dieser Beleg wurde möglicherweise schon erfasst (${fmtDate(json.duplicate.date)}, ${fmtTL(json.duplicate.total_tl)})`)
      }
      // Bestehenden Eintrag gefunden?
      if (json.expense_match) {
        setExpenseMatch(json.expense_match as ExpenseMatch)
      }
      // Formular vorausfüllen
      const exp = json.expense
      if (exp) {
        setForm(f => ({
          ...f,
          date:           exp.date ?? f.date,
          amount_gross:   exp.total_tl ? String(exp.total_tl) : f.amount_gross,
          vat_amount:     exp.vat_amount ? String(exp.vat_amount) : f.vat_amount,
          vat_rate:       exp.vat_rate ? String(exp.vat_rate) : f.vat_rate,
          description:    exp.supplier_name ?? f.description,
          supplier_id:    json.supplier_match?.id ?? f.supplier_id,
          has_receipt:    true,
        }))
      }
      setView('neu')
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setScanning(false)
    }
  }

  // Beleg einem bestehenden Eintrag zuordnen
  async function assignReceiptToMatch() {
    if (!expenseMatch) return
    setSaving(true)
    const { error } = await supabase.from('expenses').update({ has_receipt: true }).eq('id', expenseMatch.id)
    if (error) { alert('Fehler: ' + error.message); setSaving(false); return }
    setExpenses(prev => prev.map(e => e.id === expenseMatch.id ? { ...e, has_receipt: true } : e))
    setMatchAssigned(true)
    setSaving(false)
    setTimeout(() => { setView('uebersicht'); setScanResult(null); setExpenseMatch(null); setMatchAssigned(false) }, 1500)
  }

  // ── Netto-Berechnung ─────────────────────────────────────────────────────────
  function recalcNet() {
    const gross = parseFloat(form.amount_gross) || 0
    const rate  = parseFloat(form.vat_rate) || 0
    if (gross && rate) {
      const net = gross / (1 + rate / 100)
      const kdv = gross - net
      setForm(f => ({ ...f, amount_net: net.toFixed(2), vat_amount: kdv.toFixed(2) }))
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const S = {
    page:      { padding: '16px', maxWidth: '600px', margin: '0 auto', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' } as React.CSSProperties,
    card:      { background: '#FFF', borderRadius: '12px', padding: '14px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' } as React.CSSProperties,
    tabBtn:    (active: boolean): React.CSSProperties => ({ flex: 1, padding: '10px 6px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: active ? 700 : 500, background: active ? '#B8882A' : 'transparent', color: active ? '#FFF' : '#8A7A60', cursor: 'pointer' }),
    label:     { fontSize: '12px', color: '#8A7A60', marginBottom: '4px', display: 'block' } as React.CSSProperties,
    input:     { width: '100%', padding: '10px', border: '1px solid #E5E0D8', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' } as React.CSSProperties,
    goldBtn:   { background: '#B8882A', color: '#FFF', border: 'none', borderRadius: '10px', padding: '13px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
    select:    { width: '100%', padding: '10px', border: '1px solid #E5E0D8', borderRadius: '8px', fontSize: '14px', background: '#FFF', boxSizing: 'border-box' } as React.CSSProperties,
  }

  // ── ÜBERSICHT ─────────────────────────────────────────────────────────────────
  if (view === 'uebersicht') {
    const activeCats = categories
      .filter(c => filterType === 'alle' || c.type === filterType)
      .filter(c => expensesByCat(c.id).length > 0)
      .sort((a, b) => a.sort - b.sort)

    return (
      <div style={S.page}>
        {/* Monat-/Gesamt-Toggle + Monatsauswahl */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#F5F2EC', borderRadius: '10px', padding: '3px', flex: 1 }}>
            {(['monatlich','gesamt'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={S.tabBtn(viewMode === m)}>
                {m === 'monatlich' ? '📅 Monatlich' : '📊 Gesamt'}
              </button>
            ))}
          </div>
          {viewMode === 'monatlich' && (
            <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)}
              style={{ padding: '8px', border: '1px solid #E5E0D8', borderRadius: '8px', fontSize: '13px' }} />
          )}
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {viewMode === 'monatlich' ? <>
            <div style={{ ...S.card, background: '#FFF8EC', marginBottom: 0 }}>
              <div style={{ fontSize: '11px', color: '#8A7A60' }}>Monat gesamt</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#B8882A' }}>{fmtTL(monthTotal(selMonth))}</div>
            </div>
            <div style={{ ...S.card, marginBottom: 0 }}>
              <div style={{ fontSize: '11px', color: '#8A7A60' }}>davon Amortisation</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#5A5040' }}>{fmtTL(amortTotal(selMonth))}</div>
              <div style={{ fontSize: '10px', color: '#8A7A60' }}>direkt: {fmtTL(directTotal(selMonth))}</div>
            </div>
          </> : <>
            <div style={{ ...S.card, background: '#FFF8EC', marginBottom: 0 }}>
              <div style={{ fontSize: '11px', color: '#8A7A60' }}>Gesamt investiert</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#B8882A' }}>{fmtTL(grandTotal)}</div>
            </div>
            <div style={{ ...S.card, marginBottom: 0 }}>
              <div style={{ fontSize: '11px', color: '#8A7A60' }}>Einträge</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#5A5040' }}>{expenses.length}</div>
              <div style={{ fontSize: '10px', color: '#8A7A60' }}>{expenses.filter(e => !e.has_receipt).length} ohne Beleg</div>
            </div>
          </>}
        </div>

        {/* Typ-Filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto' }}>
          {(['alle','investition','laufend','einmalig'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '6px 14px', border: '1px solid #E5E0D8', borderRadius: '20px', fontSize: '12px',
              background: filterType === t ? '#B8882A' : '#FFF', color: filterType === t ? '#FFF' : '#5A5040',
              fontWeight: filterType === t ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {t === 'alle' ? 'Alle' : t === 'investition' ? '🔨 Investition' : t === 'laufend' ? '🔄 Laufend' : '⚡ Einmalig'}
            </button>
          ))}
        </div>

        {/* Kategorie-Akkordeon */}
        {activeCats.map(cat => {
          const exps = expensesByCat(cat.id)
          const total = catTotal(cat.id)
          if (total === 0) return null
          const isOpen = expandedCat === cat.id
          return (
            <div key={cat.id} style={S.card}>
              <div onClick={() => setExpandedCat(isOpen ? null : cat.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1207' }}>{cat.name}</div>
                    <div style={{ fontSize: '11px', color: '#8A7A60' }}>
                      {exps.length} Einträge
                      {exps.filter(e => !e.has_receipt).length > 0 && (
                        <span style={{ color: '#E65100', marginLeft: '6px' }}>
                          · {exps.filter(e => !e.has_receipt).length} ohne Beleg
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#B8882A' }}>{fmtTL(total)}</div>
                  {viewMode === 'monatlich' && exps.some(e => e.amort_months) && (
                    <div style={{ fontSize: '10px', color: '#8A7A60' }}>amortisiert</div>
                  )}
                  <div style={{ fontSize: '14px' }}>{isOpen ? '▲' : '▼'}</div>
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #F0EDE8', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {exps.map(e => {
                    const pt = PAYMENT_LABEL[e.payment_type] ?? PAYMENT_LABEL.offiziell
                    const supplier = supplierById(e.supplier_id)
                    const share = monthlyShare(e, selMonth)
                    return (
                      <div key={e.id} style={{ background: '#FAFAF8', borderRadius: '8px', padding: '10px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: '#1A1207' }}>{e.description ?? '—'}</div>
                            {supplier && <div style={{ color: '#8A7A60', fontSize: '11px' }}>{supplier.name}</div>}
                            <div style={{ color: '#8A7A60', fontSize: '11px', marginTop: '2px' }}>
                              {fmtDate(e.date)}
                              {e.amort_months && <span> · {e.amort_months} Monate amortisiert</span>}
                              {e.stopaj_amount && <span style={{ color: '#C62828' }}> · Stopaj {fmtTL(e.stopaj_amount)}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginLeft: '8px' }}>
                            <div style={{ fontWeight: 700, color: '#1A1207' }}>{fmtTL(e.amount_gross)}</div>
                            {viewMode === 'monatlich' && share > 0 && (
                              <div style={{ fontSize: '11px', color: '#B8882A' }}>{fmtTL(share)}/Monat</div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: pt.bg, color: pt.color, fontWeight: 600 }}>
                            {pt.label}
                          </span>
                          {e.payment_method && (
                            <span style={{ fontSize: '11px', color: '#8A7A60' }}>{METHOD_LABEL[e.payment_method] ?? e.payment_method}</span>
                          )}
                          {!e.has_receipt && (
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#FFF3E0', color: '#E65100' }}>kein Beleg</span>
                          )}
                          {e.notes && <span style={{ fontSize: '11px', color: '#8A7A60', fontStyle: 'italic' }}>{e.notes}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Nicht kategorisierte Ausgaben */}
        {(() => {
          const uncategorized = filteredExpenses().filter(e => !e.category_id)
          if (uncategorized.length === 0) return null
          const total = viewMode === 'gesamt'
            ? uncategorized.reduce((s, e) => s + e.amount_gross, 0)
            : uncategorized.reduce((s, e) => s + monthlyShare(e, selMonth) + (isInMonth(e, selMonth) ? e.amount_gross : 0), 0)
          if (total === 0 && viewMode === 'monatlich') return null
          const isOpen = expandedCat === '__uncategorized__'
          return (
            <div style={{ ...S.card, border: '1px dashed #E5B97A' }}>
              <div onClick={() => setExpandedCat(isOpen ? null : '__uncategorized__')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📂</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1207' }}>Nicht kategorisiert</div>
                    <div style={{ fontSize: '11px', color: '#E65100' }}>{uncategorized.length} Einträge ohne Kategorie</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#B8882A' }}>{fmtTL(total)}</div>
                  <div style={{ fontSize: '14px' }}>{isOpen ? '▲' : '▼'}</div>
                </div>
              </div>
              {isOpen && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #F0EDE8', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {uncategorized.map(e => {
                    const pt = PAYMENT_LABEL[e.payment_type] ?? PAYMENT_LABEL.offiziell
                    const supplier = supplierById(e.supplier_id)
                    return (
                      <div key={e.id} style={{ background: '#FAFAF8', borderRadius: '8px', padding: '10px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: '#1A1207' }}>{e.description ?? '—'}</div>
                            {supplier && <div style={{ color: '#8A7A60', fontSize: '11px' }}>{supplier.name}</div>}
                            <div style={{ color: '#8A7A60', fontSize: '11px', marginTop: '2px' }}>{fmtDate(e.date)}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: '#1A1207', marginLeft: '8px' }}>{fmtTL(e.amount_gross)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: pt.bg, color: pt.color, fontWeight: 600 }}>{pt.label}</span>
                          {!e.has_receipt && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#FFF3E0', color: '#E65100' }}>kein Beleg</span>}
                          {e.notes && <span style={{ fontSize: '11px', color: '#8A7A60', fontStyle: 'italic' }}>{e.notes}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {activeCats.length === 0 && filteredExpenses().filter(e => !e.category_id).length === 0 && (
          <div style={{ textAlign: 'center', color: '#8A7A60', padding: '40px 0' }}>
            Keine Ausgaben für diesen Filter gefunden.
          </div>
        )}

        {/* FAB Buttons */}
        <div style={{ position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom))', right: '16px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 200 }}>
          <button onClick={() => { fileRef.current?.click() }} style={{ ...S.goldBtn, borderRadius: '50%', width: '52px', height: '52px', padding: 0, fontSize: '22px' }}>📷</button>
          <button onClick={() => { setForm(EMPTY_FORM); setScanResult(null); setDupWarning(null); setView('neu') }}
            style={{ ...S.goldBtn, borderRadius: '50%', width: '52px', height: '52px', padding: 0, fontSize: '22px' }}>+</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleScanFile(f); e.target.value = '' }} />

        {scanning && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#FFF', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
              <div style={{ fontWeight: 700 }}>Beleg wird gelesen…</div>
              <div style={{ color: '#8A7A60', fontSize: '13px', marginTop: '6px' }}>Claude Vision analysiert den Beleg</div>
            </div>
          </div>
        )}
        {scanError && (
          <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '10px', padding: '12px', marginTop: '10px', color: '#C62828', fontSize: '13px' }}>
            ⚠️ {scanError}
          </div>
        )}
      </div>
    )
  }

  // ── NEUE AUSGABE ──────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button onClick={() => setView('uebersicht')} style={{ background: '#F5F2EC', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>← Zurück</button>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A1207' }}>Neue Ausgabe</h2>
      </div>

      {dupWarning && (
        <div style={{ background: '#FFF3E0', border: '1px solid #FFB300', borderRadius: '10px', padding: '12px', marginBottom: '14px', fontSize: '13px', color: '#E65100' }}>
          {dupWarning}
          <button onClick={() => setDupWarning(null)} style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#E65100', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {scanResult && (scanResult.expense as Record<string, unknown>) && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '10px', padding: '12px', marginBottom: '14px', fontSize: '13px', color: '#2E7D32' }}>
          ✓ Beleg erkannt: {String((scanResult.expense as Record<string,unknown>)?.receipt_type ?? '')}
          {String((scanResult.expense as Record<string,unknown>)?.ettn ?? '') && <span style={{ marginLeft: '8px', fontFamily: 'monospace', fontSize: '11px' }}>ETTN: {String((scanResult.expense as Record<string,unknown>).ettn).slice(0, 8)}…</span>}
        </div>
      )}

      {/* ── Passender bestehender Eintrag gefunden ── */}
      {expenseMatch && !matchAssigned && (
        <div style={{ background: '#FFF8E1', border: '2px solid #FFB300', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#E65100', marginBottom: '6px' }}>
            🔍 Passenden Eintrag gefunden
          </div>
          <div style={{ fontSize: '13px', color: '#1A1207', marginBottom: '4px' }}>
            <strong>{expenseMatch.description ?? '—'}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#8A7A60', marginBottom: '10px' }}>
            {fmtTL(expenseMatch.amount_gross)} · {fmtDate(expenseMatch.date)}
            {expenseMatch.has_receipt
              ? <span style={{ color: '#2E7D32', marginLeft: '8px' }}>✓ Beleg schon vorhanden</span>
              : <span style={{ color: '#E65100', marginLeft: '8px' }}>⚠ kein Beleg hinterlegt</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={assignReceiptToMatch} disabled={saving || expenseMatch.has_receipt}
              style={{ flex: 2, padding: '10px', background: expenseMatch.has_receipt ? '#E0E0E0' : '#2E7D32', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: expenseMatch.has_receipt ? 'default' : 'pointer' }}>
              {expenseMatch.has_receipt ? '✓ Beleg bereits zugeordnet' : saving ? '…' : '✓ Beleg diesem Eintrag zuordnen'}
            </button>
            <button onClick={() => setExpenseMatch(null)}
              style={{ flex: 1, padding: '10px', background: '#F5F2EC', color: '#555', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              Neu erfassen
            </button>
          </div>
        </div>
      )}

      {matchAssigned && (
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '10px', padding: '14px', marginBottom: '14px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#2E7D32' }}>
          ✓ Beleg erfolgreich zugeordnet!
        </div>
      )}

      <div style={S.card}>
        {/* Kategorie */}
        <label style={S.label}>Kategorie</label>
        <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} style={{ ...S.select, marginBottom: '12px' }}>
          <option value="">— Kategorie wählen —</option>
          {(['investition','laufend','einmalig'] as const).map(type => (
            <optgroup key={type} label={type.charAt(0).toUpperCase() + type.slice(1)}>
              {categories.filter(c => c.type === type).sort((a,b) => a.sort - b.sort).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Beschreibung */}
        <label style={S.label}>Beschreibung / Händler</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="z.B. Hakbilenler Umbau, Strom April…" style={{ ...S.input, marginBottom: '12px' }} />

        {/* Händler (optional) */}
        <label style={S.label}>Händler (optional)</label>
        <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))} style={{ ...S.select, marginBottom: '12px' }}>
          <option value="">— kein Händler —</option>
          {suppliers.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Datum */}
        <label style={S.label}>Datum</label>
        <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          style={{ ...S.input, marginBottom: '12px' }} />

        {/* Beträge */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={S.label}>Brutto (₺) *</label>
            <input type="number" value={form.amount_gross} onChange={e => setForm(f => ({ ...f, amount_gross: e.target.value }))}
              onBlur={recalcNet} placeholder="0.00" style={S.input} />
          </div>
          <div>
            <label style={S.label}>KDV-Satz (%)</label>
            <select value={form.vat_rate} onChange={e => setForm(f => ({ ...f, vat_rate: e.target.value }))} style={S.select}>
              <option value="">kein KDV</option>
              <option value="1">1%</option>
              <option value="10">10%</option>
              <option value="20">20%</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Netto (₺)</label>
            <input type="number" value={form.amount_net} onChange={e => setForm(f => ({ ...f, amount_net: e.target.value }))}
              placeholder="auto" style={S.input} />
          </div>
          <div>
            <label style={S.label}>KDV-Betrag (₺)</label>
            <input type="number" value={form.vat_amount} onChange={e => setForm(f => ({ ...f, vat_amount: e.target.value }))}
              placeholder="auto" style={S.input} />
          </div>
        </div>

        {/* Stopaj */}
        <label style={S.label}>Stopaj (₺) — Jahresende fällig</label>
        <input type="number" value={form.stopaj_amount} onChange={e => setForm(f => ({ ...f, stopaj_amount: e.target.value }))}
          placeholder="0.00" style={{ ...S.input, marginBottom: '12px' }} />

        {/* Zahlungsart */}
        <label style={S.label}>Zahlungsart</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {(['offiziell','bar','schwarz'] as const).map(pt => {
            const p = PAYMENT_LABEL[pt]
            return (
              <button key={pt} onClick={() => setForm(f => ({ ...f, payment_type: pt }))} style={{
                flex: 1, padding: '10px', border: `2px solid ${form.payment_type === pt ? p.color : '#E5E0D8'}`,
                borderRadius: '8px', background: form.payment_type === pt ? p.bg : '#FFF',
                color: form.payment_type === pt ? p.color : '#8A7A60',
                fontWeight: form.payment_type === pt ? 700 : 400, fontSize: '13px', cursor: 'pointer',
              }}>{p.label}</button>
            )
          })}
        </div>

        {/* Zahlungsmethode */}
        <label style={S.label}>Zahlungsmethode</label>
        <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} style={{ ...S.select, marginBottom: '12px' }}>
          <option value="überweisung">💳 Überweisung</option>
          <option value="karte">💳 Karte</option>
          <option value="nakit">💵 Bar (Nakit)</option>
          <option value="sonstiges">… Sonstiges</option>
        </select>

        {/* Beleg vorhanden */}
        <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
          <input type="checkbox" checked={form.has_receipt} onChange={e => setForm(f => ({ ...f, has_receipt: e.target.checked }))} />
          Beleg vorhanden
        </label>

        {/* Amortisation */}
        <div style={{ background: '#F5F2EC', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
          <label style={{ ...S.label, fontWeight: 700, color: '#5A5040' }}>Amortisation (für Investitionen)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={S.label}>Über Monate</label>
              <input type="number" value={form.amort_months} onChange={e => setForm(f => ({ ...f, amort_months: e.target.value }))}
                placeholder="z.B. 24" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Ab Datum</label>
              <input type="date" value={form.amort_start} onChange={e => setForm(f => ({ ...f, amort_start: e.target.value }))}
                style={S.input} />
            </div>
          </div>
        </div>

        {/* Periode */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div>
            <label style={S.label}>Periode von</label>
            <input type="date" value={form.period_from} onChange={e => setForm(f => ({ ...f, period_from: e.target.value }))} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Periode bis</label>
            <input type="date" value={form.period_to} onChange={e => setForm(f => ({ ...f, period_to: e.target.value }))} style={S.input} />
          </div>
        </div>

        {/* Notizen */}
        <label style={S.label}>Notizen</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={2} placeholder="Optionale Notizen…"
          style={{ ...S.input, resize: 'vertical', marginBottom: '16px' }} />

        <button onClick={saveExpense} disabled={saving} style={{ ...S.goldBtn, width: '100%', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Speichert…' : '✓ Ausgabe speichern'}
        </button>
      </div>
    </div>
  )
}
