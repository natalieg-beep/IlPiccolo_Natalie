'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let b64 = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    b64 += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(b64)
}

const CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: 'molkerei',   label: 'Molkerei',          icon: '🧀' },
  { key: 'wurst',      label: 'Wurst & Aufschnitt', icon: '🥩' },
  { key: 'mehl',       label: 'Mehl & Teig',        icon: '🌾' },
  { key: 'gemuese',    label: 'Gemüse & Obst',       icon: '🥦' },
  { key: 'getraenke',  label: 'Getränke',            icon: '☕' },
  { key: 'backen',     label: 'Backen & Fette',      icon: '🧈' },
  { key: 'verpackung', label: 'Verpackung & Papier', icon: '📦' },
  { key: 'reinigung',  label: 'Reinigung',           icon: '🧹' },
  { key: 'sonstiges',  label: 'Sonstiges',           icon: '📋' },
]
const UNITS = ['kg','g','Stk','L','ml','Pkg']

type Product = {
  id: string; name: string; category: string; unit: string; notes: string | null; active: boolean
}
type Price = {
  id: string; product_id: string; price_tl: number; quantity: number; unit: string
  price_per_unit: number; date: string; source: string; receipt_ref: string | null; notes: string | null
}
type ScannedItem = {
  name: string; price_tl: number; quantity: number; unit: string; category_hint: string; notes: string
  matched_product_id?: string; is_new_product?: boolean; new_product_name?: string; new_product_category?: string
}

function fmtPrice(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function AusgabenClient({ products, allPrices }: { products: Product[]; allPrices: Price[] }) {
  const supabase = createClient()

  // Letzter Preis pro Produkt
  const latestPrice = useCallback((productId: string) => {
    return allPrices.find(p => p.product_id === productId) ?? null
  }, [allPrices])

  const priceHistory = useCallback((productId: string) => {
    return allPrices.filter(p => p.product_id === productId).slice(0, 10)
  }, [allPrices])

  // State
  const [view, setView] = useState<'matrix' | 'scan' | 'manual_product' | 'manual_price'>('matrix')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scannedItems, setScannedItems] = useState<ScannedItem[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [localProducts, setLocalProducts] = useState<Product[]>(products)
  const [localPrices, setLocalPrices] = useState<Price[]>(allPrices)
  const fileRef = useRef<HTMLInputElement>(null)

  // Neues Produkt
  const [newProd, setNewProd] = useState({ name: '', category: 'molkerei', unit: 'kg', notes: '' })
  // Neuer Preis manuell
  const [manualPrice, setManualPrice] = useState({ product_id: '', price_tl: '', quantity: '1', unit: 'kg', date: new Date().toISOString().slice(0,10), notes: '' })

  // --- Scan ---
  async function handleFile(file: File) {
    setScanning(true); setScanError(null); setScannedItems(null)
    try {
      const buf = await file.arrayBuffer()
      const b64 = bufferToBase64(buf)
      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-receipt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: b64, image_type: file.type }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler beim Scannen')
      // Produkte matchen
      const items: ScannedItem[] = (json.items ?? []).map((item: ScannedItem) => {
        const match = localProducts.find(p =>
          p.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(p.name.toLowerCase())
        )
        return { ...item, matched_product_id: match?.id, is_new_product: !match, new_product_name: item.name, new_product_category: item.category_hint }
      })
      setScannedItems(items)
    } catch (e: unknown) {
      setScanError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setScanning(false)
    }
  }

  async function handleTextScan(text: string) {
    setScanning(true); setScanError(null); setScannedItems(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-receipt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler')
      const items: ScannedItem[] = (json.items ?? []).map((item: ScannedItem) => {
        const match = localProducts.find(p =>
          p.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(p.name.toLowerCase())
        )
        return { ...item, matched_product_id: match?.id, is_new_product: !match, new_product_name: item.name, new_product_category: item.category_hint }
      })
      setScannedItems(items)
    } catch (e: unknown) {
      setScanError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setScanning(false)
    }
  }

  async function saveScannedItems() {
    if (!scannedItems) return
    setSaving(true)
    try {
      const date = new Date().toISOString().slice(0, 10)
      for (const item of scannedItems) {
        let productId = item.matched_product_id
        if (item.is_new_product && item.new_product_name) {
          const { data: newP } = await supabase.from('purchase_products').insert({
            name: item.new_product_name,
            category: item.new_product_category || 'sonstiges',
            unit: item.unit,
          }).select().single()
          if (newP) {
            productId = newP.id
            setLocalProducts(prev => [...prev, newP])
          }
        }
        if (!productId) continue
        const { data: newPrice } = await supabase.from('purchase_prices').insert({
          product_id: productId,
          price_tl: item.price_tl,
          quantity: item.quantity,
          unit: item.unit,
          date,
          source: 'scan',
        }).select().single()
        if (newPrice) setLocalPrices(prev => [newPrice, ...prev])
      }
      setScannedItems(null)
      setView('matrix')
    } finally {
      setSaving(false)
    }
  }

  // --- Produkt anlegen ---
  async function saveNewProduct() {
    if (!newProd.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('purchase_products').insert({
      name: newProd.name.trim(), category: newProd.category, unit: newProd.unit, notes: newProd.notes || null,
    }).select().single()
    if (data) { setLocalProducts(prev => [...prev, data]); setNewProd({ name: '', category: 'molkerei', unit: 'kg', notes: '' }) }
    setSaving(false)
    setView('matrix')
  }

  // --- Preis manuell ---
  async function saveManualPrice() {
    if (!manualPrice.product_id || !manualPrice.price_tl) return
    setSaving(true)
    const prod = localProducts.find(p => p.id === manualPrice.product_id)
    const { data } = await supabase.from('purchase_prices').insert({
      product_id: manualPrice.product_id,
      price_tl: parseFloat(manualPrice.price_tl),
      quantity: parseFloat(manualPrice.quantity) || 1,
      unit: manualPrice.unit || prod?.unit || 'Stk',
      date: manualPrice.date,
      source: 'manual',
      notes: manualPrice.notes || null,
    }).select().single()
    if (data) setLocalPrices(prev => [data, ...prev])
    setSaving(false)
    setView('matrix')
    setManualPrice({ product_id: '', price_tl: '', quantity: '1', unit: 'kg', date: new Date().toISOString().slice(0,10), notes: '' })
  }

  // --- Grouped products ---
  const filtered = selectedCat ? localProducts.filter(p => p.category === selectedCat) : localProducts
  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: filtered.filter(p => p.category === cat.key),
  })).filter(g => g.items.length > 0 || !selectedCat)

  // --- Paste-Text state ---
  const [pasteText, setPasteText] = useState('')
  const [showPaste, setShowPaste] = useState(false)

  const S = {
    header: { padding: '16px', background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', display: 'flex', alignItems: 'center', gap: '12px' } as React.CSSProperties,
    btn: (bg: string, color = '#FFF') => ({ background: bg, color, border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' } as React.CSSProperties),
    card: { background: '#FFF', borderRadius: '12px', border: '1px solid #E5E0D8', overflow: 'hidden', marginBottom: '8px' } as React.CSSProperties,
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F4F0', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={S.header}>
        <Link href="/management" style={{ textDecoration: 'none', color: '#B8882A', fontSize: '20px' }}>←</Link>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, flex: 1 }}>Einkaufspreise</h1>
        <button onClick={() => setView('scan')} style={S.btn('#1565C0')}>📷 Scan</button>
        <button onClick={() => { setManualPrice(p => ({ ...p, date: new Date().toISOString().slice(0,10) })); setView('manual_price') }} style={{ ...S.btn('#2E7D32'), marginLeft: '6px' }}>+ Preis</button>
        <button onClick={() => setView('manual_product')} style={{ ...S.btn('#555', '#FFF'), marginLeft: '6px', fontSize: '13px' }}>+ Produkt</button>
      </div>

      {/* === SCAN VIEW === */}
      {view === 'scan' && (
        <div style={{ padding: '16px' }}>
          <div style={{ ...S.card, padding: '16px' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Beleg scannen</p>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => fileRef.current?.click()} style={S.btn('#1565C0')} disabled={scanning}>
                {scanning ? '⏳ Scanning…' : '📸 Foto aufnehmen / Datei wählen'}
              </button>
              <button onClick={() => setShowPaste(s => !s)} style={S.btn('#555')}>📋 Text einfügen</button>
            </div>

            {showPaste && (
              <div style={{ marginTop: '12px' }}>
                <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
                  placeholder="Belegtext hier einfügen (aus PDF kopiert)…"
                  style={{ width: '100%', minHeight: '120px', borderRadius: '8px', border: '1px solid #E5E0D8', padding: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <button onClick={() => { handleTextScan(pasteText); setShowPaste(false); setPasteText('') }}
                  disabled={!pasteText.trim() || scanning} style={{ ...S.btn('#1565C0'), marginTop: '8px' }}>
                  Analysieren
                </button>
              </div>
            )}

            {scanError && <p style={{ color: '#C62828', marginTop: '12px', fontSize: '13px' }}>{scanError}</p>}
          </div>

          {scannedItems && (
            <div style={S.card}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E0D8', fontWeight: 600 }}>
                {scannedItems.length} Produkte erkannt
              </div>
              {scannedItems.map((item, i) => (
                <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #F0ECE8', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#8A7A60', marginTop: '2px' }}>
                      {item.quantity} {item.unit} · {item.category_hint}
                      {item.is_new_product && <span style={{ color: '#1565C0', marginLeft: '6px' }}>✦ neu</span>}
                      {!item.is_new_product && <span style={{ color: '#2E7D32', marginLeft: '6px' }}>✓ bekannt</span>}
                    </div>
                    {item.notes && <div style={{ fontSize: '11px', color: '#A09880', marginTop: '2px' }}>{item.notes}</div>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap' }}>{fmtPrice(item.price_tl)}</div>
                  <button onClick={() => setScannedItems(prev => prev!.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: '#C62828', fontSize: '16px', cursor: 'pointer', padding: '0 4px' }}>✕</button>
                </div>
              ))}
              <div style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                <button onClick={() => { setScannedItems(null); setView('matrix') }} style={S.btn('#E0E0E0', '#555')}>Verwerfen</button>
                <button onClick={saveScannedItems} disabled={saving} style={{ ...S.btn('#2E7D32'), flex: 1 }}>
                  {saving ? 'Speichern…' : `✓ Alle speichern`}
                </button>
              </div>
            </div>
          )}

          <button onClick={() => setView('matrix')} style={{ ...S.btn('#E0E0E0', '#555'), marginTop: '8px', width: '100%' }}>← Zurück</button>
        </div>
      )}

      {/* === NEUES PRODUKT === */}
      {view === 'manual_product' && (
        <div style={{ padding: '16px' }}>
          <div style={{ ...S.card, padding: '16px' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Neues Produkt anlegen</p>
            <input value={newProd.name} onChange={e => setNewProd(p => ({ ...p, name: e.target.value }))}
              placeholder="Produktname" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '15px', boxSizing: 'border-box', marginBottom: '10px' }} />
            <select value={newProd.category} onChange={e => setNewProd(p => ({ ...p, category: e.target.value }))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '15px', marginBottom: '10px' }}>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
            </select>
            <select value={newProd.unit} onChange={e => setNewProd(p => ({ ...p, unit: e.target.value }))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '15px', marginBottom: '10px' }}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <input value={newProd.notes} onChange={e => setNewProd(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notiz (optional)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setView('matrix')} style={S.btn('#E0E0E0', '#555')}>Abbrechen</button>
              <button onClick={saveNewProduct} disabled={saving || !newProd.name.trim()} style={{ ...S.btn('#2E7D32'), flex: 1 }}>
                {saving ? 'Speichern…' : '✓ Produkt anlegen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MANUELLER PREIS === */}
      {view === 'manual_price' && (
        <div style={{ padding: '16px' }}>
          <div style={{ ...S.card, padding: '16px' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Preis eintragen</p>
            <select value={manualPrice.product_id} onChange={e => {
              const prod = localProducts.find(p => p.id === e.target.value)
              setManualPrice(p => ({ ...p, product_id: e.target.value, unit: prod?.unit || 'kg' }))
            }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '15px', marginBottom: '10px' }}>
              <option value="">Produkt wählen…</option>
              {CATEGORIES.map(cat => {
                const prods = localProducts.filter(p => p.category === cat.key)
                if (!prods.length) return null
                return <optgroup key={cat.key} label={`${cat.icon} ${cat.label}`}>
                  {prods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </optgroup>
              })}
            </select>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '11px', color: '#8A7A60', display: 'block', marginBottom: '4px' }}>Gesamtpreis (₺)</label>
                <input type="number" inputMode="decimal" value={manualPrice.price_tl}
                  onChange={e => setManualPrice(p => ({ ...p, price_tl: e.target.value }))}
                  placeholder="0.00" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#8A7A60', display: 'block', marginBottom: '4px' }}>Menge</label>
                <input type="number" inputMode="decimal" value={manualPrice.quantity}
                  onChange={e => setManualPrice(p => ({ ...p, quantity: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#8A7A60', display: 'block', marginBottom: '4px' }}>Einheit</label>
                <select value={manualPrice.unit} onChange={e => setManualPrice(p => ({ ...p, unit: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '15px' }}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            {manualPrice.price_tl && manualPrice.quantity && (
              <div style={{ fontSize: '13px', color: '#2E7D32', fontWeight: 600, marginBottom: '10px' }}>
                = {fmtPrice(parseFloat(manualPrice.price_tl) / (parseFloat(manualPrice.quantity) || 1))} / {manualPrice.unit}
              </div>
            )}
            <input type="date" value={manualPrice.date} onChange={e => setManualPrice(p => ({ ...p, date: e.target.value }))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '15px', marginBottom: '10px', boxSizing: 'border-box' }} />
            <input value={manualPrice.notes} onChange={e => setManualPrice(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notiz (optional)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setView('matrix')} style={S.btn('#E0E0E0', '#555')}>Abbrechen</button>
              <button onClick={saveManualPrice} disabled={saving || !manualPrice.product_id || !manualPrice.price_tl}
                style={{ ...S.btn('#2E7D32'), flex: 1 }}>
                {saving ? 'Speichern…' : '✓ Preis speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MATRIX VIEW === */}
      {view === 'matrix' && (
        <div style={{ padding: '12px' }}>
          {/* Kategoriefilter */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '12px' }}>
            <button onClick={() => setSelectedCat(null)}
              style={{ ...S.btn(selectedCat === null ? '#1A1207' : '#E5E0D8', selectedCat === null ? '#FFF' : '#555'), whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '13px' }}>
              Alle
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setSelectedCat(selectedCat === cat.key ? null : cat.key)}
                style={{ ...S.btn(selectedCat === cat.key ? '#1A1207' : '#E5E0D8', selectedCat === cat.key ? '#FFF' : '#555'), whiteSpace: 'nowrap', padding: '6px 10px', fontSize: '13px' }}>
                {cat.icon}
              </button>
            ))}
          </div>

          {grouped.map(cat => (
            <div key={cat.key} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#8A7A60', letterSpacing: '0.05em', marginBottom: '6px', paddingLeft: '4px' }}>
                {cat.icon} {cat.label.toUpperCase()}
              </div>
              {cat.items.length === 0 && (
                <div style={{ color: '#A09880', fontSize: '13px', padding: '8px 4px' }}>Keine Produkte in dieser Kategorie</div>
              )}
              {cat.items.map(prod => {
                const lp = latestPrice(prod.id)
                const hist = priceHistory(prod.id)
                const isExpanded = expandedProduct === prod.id

                return (
                  <div key={prod.id} style={S.card}>
                    <div onClick={() => setExpandedProduct(isExpanded ? null : prod.id)}
                      style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{prod.name}</div>
                        {lp && (
                          <div style={{ fontSize: '12px', color: '#8A7A60', marginTop: '2px' }}>
                            {fmtDate(lp.date)} · {lp.quantity} {lp.unit}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {lp ? (
                          <>
                            <div style={{ fontWeight: 700, fontSize: '16px', color: '#1A1207' }}>{fmtPrice(lp.price_per_unit)}<span style={{ fontSize: '12px', fontWeight: 400 }}>/{lp.unit}</span></div>
                            <div style={{ fontSize: '12px', color: '#8A7A60' }}>Gesamt: {fmtPrice(lp.price_tl)}</div>
                          </>
                        ) : (
                          <div style={{ color: '#A09880', fontSize: '13px' }}>kein Preis</div>
                        )}
                      </div>
                      <span style={{ color: '#A09880', fontSize: '14px' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #F0ECE8', background: '#FAFAFA' }}>
                        <div style={{ padding: '8px 14px 4px', fontSize: '12px', fontWeight: 700, color: '#8A7A60' }}>PREISVERLAUF</div>
                        {hist.length === 0 && <div style={{ padding: '8px 14px', color: '#A09880', fontSize: '13px' }}>Noch keine Preise erfasst</div>}
                        {hist.map(p => (
                          <div key={p.id} style={{ padding: '6px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid #F0ECE8' }}>
                            <div>
                              <span style={{ color: '#555' }}>{fmtDate(p.date)}</span>
                              <span style={{ color: '#A09880', marginLeft: '8px' }}>{p.quantity} {p.unit}</span>
                              {p.source === 'scan' && <span style={{ color: '#1565C0', marginLeft: '6px', fontSize: '11px' }}>📷</span>}
                              {p.notes && <span style={{ color: '#A09880', marginLeft: '6px', fontSize: '11px' }}>{p.notes}</span>}
                            </div>
                            <div style={{ fontWeight: 600 }}>
                              {fmtPrice(p.price_per_unit)}/{p.unit}
                              <span style={{ fontWeight: 400, color: '#8A7A60', marginLeft: '6px' }}>({fmtPrice(p.price_tl)})</span>
                            </div>
                          </div>
                        ))}
                        <div style={{ padding: '8px 14px' }}>
                          <button onClick={() => { setManualPrice(p => ({ ...p, product_id: prod.id, unit: prod.unit, date: new Date().toISOString().slice(0,10) })); setView('manual_price') }}
                            style={S.btn('#2E7D32', '#FFF')}>+ Preis eintragen</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {localProducts.length === 0 && (
            <div style={{ textAlign: 'center', color: '#A09880', padding: '40px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛒</div>
              <div style={{ fontWeight: 600 }}>Noch keine Produkte</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>Füge Produkte hinzu oder scanne einen Beleg</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
