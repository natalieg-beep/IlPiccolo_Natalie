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

// Komprimiert ein Bild auf max. 1400px Breite/Höhe, JPEG 80% — verhindert zu große Uploads
function compressImage(file: File): Promise<{ base64: string; type: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1400
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      resolve({ base64: dataUrl.split(',')[1], type: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}

export const CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: 'molkerei',   label: 'Molkerei',          icon: '🧀' },
  { key: 'wurst',      label: 'Wurst & Geflügel',  icon: '🥩' },
  { key: 'mehl',       label: 'Mehl & Teig',        icon: '🌾' },
  { key: 'gemuese',    label: 'Gemüse & Obst',      icon: '🥦' },
  { key: 'getraenke',  label: 'Getränke',           icon: '☕' },
  { key: 'backen',     label: 'Backen & Fette',     icon: '🧈' },
  { key: 'verpackung', label: 'Verpackung & Papier',icon: '📦' },
  { key: 'reinigung',  label: 'Reinigung',          icon: '🧹' },
  { key: 'sonstiges',  label: 'Sonstiges',          icon: '📋' },
]
const UNITS = ['kg', 'g', 'Stk', 'L', 'ml', 'Pkg']

export type Product = {
  id: string; name: string; category: string; unit: string; notes: string | null; active: boolean
}
export type Price = {
  id: string; product_id: string; price_tl: number; quantity: number; unit: string
  price_per_unit: number; date: string; source: string; receipt_ref: string | null
  notes: string | null; is_private: boolean; vat_rate: number | null
}
type ScannedItem = {
  name: string; price_tl: number; is_gross?: boolean; quantity: number; unit: string
  vat_rate: number | null; category_hint: string; notes: string
  matched_product_id?: string; is_new_product?: boolean
  new_product_name?: string; new_product_category?: string
  mode?: 'geschaeftlich' | 'privat' | 'investition'
}
// Rechnet Brutto→Netto wenn is_gross=true (BIM etc.). Claude rechnet NIE — nur Zahlen kopieren.
function toNetto(item: ScannedItem): number {
  if (item.is_gross && item.vat_rate) return item.price_tl / (1 + item.vat_rate / 100)
  return item.price_tl
}

function fmtPrice(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function startOfWeek(d: Date) {
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// ─── AUSWERTUNGS-TAB ─────────────────────────────────────────────────────────

function AuswertungView({ prices, products }: { prices: Price[]; products: Product[] }) {
  const [period, setPeriod] = useState<'woche' | 'monat'>('woche')
  const [offset, setOffset] = useState(0) // 0 = aktuelle Periode, -1 = letzte, etc.

  const now = new Date()

  // Zeitraum berechnen
  const { from, to, label } = (() => {
    if (period === 'woche') {
      const base = startOfWeek(now)
      base.setDate(base.getDate() + offset * 7)
      const end = new Date(base)
      end.setDate(base.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      const labelStr = offset === 0 ? 'Diese Woche' : offset === -1 ? 'Letzte Woche'
        : `${fmtDate(base.toISOString().slice(0,10))} – ${fmtDate(end.toISOString().slice(0,10))}`
      return { from: base, to: end, label: labelStr }
    } else {
      const y = now.getFullYear()
      const m = now.getMonth() + offset
      const date = new Date(y, m, 1)
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999)
      const labelStr = offset === 0 ? 'Dieser Monat'
        : date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
      return { from: date, to: end, label: labelStr }
    }
  })()

  const fromStr = from.toISOString().slice(0, 10)
  const toStr = to.toISOString().slice(0, 10)

  const inPeriod = prices.filter(p => p.date >= fromStr && p.date <= toStr)
  const business = inPeriod.filter(p => !p.is_private)
  const privat   = inPeriod.filter(p => p.is_private)
  const totalBusiness = business.reduce((s, p) => s + p.price_tl, 0)
  const totalPrivat   = privat.reduce((s, p) => s + p.price_tl, 0)
  const totalAll      = totalBusiness + totalPrivat
  const totalKdv      = inPeriod.reduce((s, p) => s + (p.vat_rate ? p.price_tl * p.vat_rate / 100 : 0), 0)
  const kdvBusiness   = business.reduce((s, p) => s + (p.vat_rate ? p.price_tl * p.vat_rate / 100 : 0), 0)

  // Nach Kategorie gruppieren
  const prodById = (id: string) => products.find(p => p.id === id)
  const byCat: Record<string, { business: number; privat: number }> = {}
  for (const p of inPeriod) {
    const cat = prodById(p.product_id)?.category ?? 'sonstiges'
    if (!byCat[cat]) byCat[cat] = { business: 0, privat: 0 }
    if (p.is_private) byCat[cat].privat += p.price_tl
    else              byCat[cat].business += p.price_tl
  }

  // Nach Datum gruppieren (Einkaufstage)
  const byDate: Record<string, Price[]> = {}
  for (const p of [...inPeriod].sort((a, b) => b.date.localeCompare(a.date))) {
    if (!byDate[p.date]) byDate[p.date] = []
    byDate[p.date].push(p)
  }

  const S = {
    card: { background: '#FFF', borderRadius: '12px', padding: '14px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as React.CSSProperties,
  }

  return (
    <div style={{ padding: '12px', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}>
      {/* Periode-Toggle */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#F5F2EC', borderRadius: '10px', padding: '3px', flex: 1 }}>
          {(['woche', 'monat'] as const).map(p => (
            <button key={p} onClick={() => { setPeriod(p); setOffset(0) }} style={{
              flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
              background: period === p ? '#1A1207' : 'transparent',
              color: period === p ? '#FFF' : '#8A7A60', fontWeight: period === p ? 700 : 400,
            }}>{p === 'woche' ? '📅 Woche' : '📆 Monat'}</button>
          ))}
        </div>
        <button onClick={() => setOffset(o => o - 1)} style={{ background: '#F5F2EC', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '16px' }}>‹</button>
        <button onClick={() => setOffset(o => Math.min(0, o + 1))} disabled={offset === 0}
          style={{ background: offset === 0 ? '#EEE' : '#F5F2EC', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: offset === 0 ? 'default' : 'pointer', fontSize: '16px', color: offset === 0 ? '#CCC' : '#333' }}>›</button>
      </div>

      {/* Periode-Label */}
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '15px', color: '#1A1207', marginBottom: '12px' }}>{label}</div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <div style={{ ...S.card, padding: '10px', marginBottom: 0, background: '#FFF8EC' }}>
          <div style={{ fontSize: '10px', color: '#8A7A60' }}>Gesamt Netto</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#B8882A' }}>{fmtPrice(totalAll)}</div>
          {totalKdv > 0 && <div style={{ fontSize: '10px', color: '#8A7A60' }}>KDV {fmtPrice(totalKdv)}</div>}
        </div>
        <div style={{ ...S.card, padding: '10px', marginBottom: 0 }}>
          <div style={{ fontSize: '10px', color: '#2E7D32' }}>🏢 Geschäftl.</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#2E7D32' }}>{fmtPrice(totalBusiness)}</div>
          {kdvBusiness > 0 && <div style={{ fontSize: '10px', color: '#8A7A60' }}>KDV {fmtPrice(kdvBusiness)}</div>}
        </div>
        <div style={{ ...S.card, padding: '10px', marginBottom: 0 }}>
          <div style={{ fontSize: '10px', color: '#7B1FA2' }}>🏠 Privat</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#7B1FA2' }}>{fmtPrice(totalPrivat)}</div>
          <div style={{ fontSize: '10px', color: '#8A7A60' }}>{privat.length} Posten</div>
        </div>
      </div>

      {/* Nach Kategorie */}
      {Object.keys(byCat).length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#8A7A60', marginBottom: '10px' }}>NACH KATEGORIE</div>
          {CATEGORIES.filter(c => byCat[c.key]).sort((a, b) => (byCat[b.key]?.business + byCat[b.key]?.privat) - (byCat[a.key]?.business + byCat[a.key]?.privat)).map(cat => {
            const d = byCat[cat.key]
            const total = d.business + d.privat
            const pct = totalAll > 0 ? (total / totalAll) * 100 : 0
            return (
              <div key={cat.key} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
                  <span>{cat.icon} {cat.label}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700 }}>{fmtPrice(total)}</span>
                    {d.privat > 0 && <span style={{ fontSize: '11px', color: '#7B1FA2', marginLeft: '6px' }}>🏠 {fmtPrice(d.privat)}</span>}
                  </div>
                </div>
                <div style={{ height: '5px', background: '#F0ECE8', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#B8882A', borderRadius: '3px' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Nach Einkaufstag */}
      {Object.keys(byDate).length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#8A7A60', marginBottom: '8px', paddingLeft: '4px' }}>EINKÄUFE</div>
          {Object.entries(byDate).map(([date, items]) => {
            const dayTotal = items.reduce((s, p) => s + p.price_tl, 0)
            const dayPrivat = items.filter(p => p.is_private).reduce((s, p) => s + p.price_tl, 0)
            return (
              <div key={date} style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{fmtDate(date)}</div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700 }}>{fmtPrice(dayTotal)}</span>
                    {dayPrivat > 0 && <span style={{ fontSize: '11px', color: '#7B1FA2', marginLeft: '6px' }}>🏠 {fmtPrice(dayPrivat)}</span>}
                  </div>
                </div>
                {items.map(p => {
                  const prod = prodById(p.product_id)
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0', borderTop: '1px solid #F5F2EC', color: p.is_private ? '#7B1FA2' : '#5A5040' }}>
                      <span>{p.is_private ? '🏠 ' : ''}{prod?.name ?? '?'} <span style={{ color: '#A09880' }}>{p.quantity} {p.unit}</span></span>
                      <span style={{ fontWeight: 600 }}>{fmtPrice(p.price_tl)}</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {inPeriod.length === 0 && (
        <div style={{ textAlign: 'center', color: '#A09880', padding: '40px 20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
          <div>Keine Einkäufe in diesem Zeitraum</div>
        </div>
      )}
    </div>
  )
}

// ─── HAUPTKOMPONENTE ──────────────────────────────────────────────────────────

type Supplier = { id: string; name: string; category: string }

const SUPPLIER_CATS: Record<string, string> = {
  supermarkt: '🏪 Supermarkt', lieferant: '🚚 Lieferant',
  handwerker: '🔧 Handwerker', sonstiges: '📦 Sonstiges',
  behoerde: '🏛️ Behörde', telekommunikation: '📡 Telekom',
}

export default function AusgabenClient({ products, allPrices, suppliers }: { products: Product[]; allPrices: Price[]; suppliers: Supplier[] }) {
  const supabase = createClient()

  // State
  const [mainTab, setMainTab] = useState<'produkte' | 'auswertung'>('produkte')
  const [view, setView] = useState<'matrix' | 'scan' | 'manual_product' | 'manual_price'>('matrix')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [showPrivat, setShowPrivat] = useState<'alle' | 'geschaeftlich' | 'privat'>('geschaeftlich')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scannedItems, setScannedItems] = useState<ScannedItem[] | null>(null)
  const [scanSupplierId, setScanSupplierId] = useState<string>('')
  const [scanDate, setScanDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>(suppliers)
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierCat, setNewSupplierCat] = useState<'supermarkt' | 'lieferant' | 'sonstiges'>('lieferant')
  const [savingSupplier, setSavingSupplier] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localProducts, setLocalProducts] = useState<Product[]>(products)
  const [localPrices, setLocalPrices] = useState<Price[]>(allPrices)
  const fileRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  // Edit-States
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editProductForm, setEditProductForm] = useState<{ name: string; category: string; unit: string; notes: string }>({ name: '', category: '', unit: '', notes: '' })
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [editPriceForm, setEditPriceForm] = useState<{ price_tl: string; quantity: string; unit: string; date: string; notes: string; is_private: boolean }>({ price_tl: '', quantity: '', unit: '', date: '', notes: '', is_private: false })

  // Letzter Preis — immer anzeigen unabhängig vom Filter (Preise sollen immer sichtbar sein)
  const latestPrice = useCallback((productId: string) => {
    return localPrices.find(p => p.product_id === productId) ?? null
  }, [localPrices])

  // Preisverlauf — alle Einträge, gefiltert nur für die History-Ansicht
  const priceHistory = useCallback((productId: string) => {
    return localPrices.filter(p => p.product_id === productId).slice(0, 20)
  }, [localPrices])

  // Neues Produkt / Neuer Preis
  const [newProd, setNewProd] = useState({ name: '', category: 'molkerei', unit: 'kg', notes: '' })
  const [manualPrice, setManualPrice] = useState({
    product_id: '', price_tl: '', quantity: '1', unit: 'kg',
    date: new Date().toISOString().slice(0, 10), notes: '', is_private: false,
  })

  // ── Scan ──────────────────────────────────────────────────────────────────

  function applyScanResult(json: { items?: ScannedItem[]; supplier_name?: string | null; supplier_match?: { id: string; name: string } | null; date?: string | null }) {
    setScannedItems(matchItems(json.items ?? []))
    if (json.supplier_match?.id) {
      setScanSupplierId(json.supplier_match.id)
    } else if (json.supplier_name) {
      // Händler erkannt aber nicht in DB → "+ Neu" vorausfüllen
      setNewSupplierName(json.supplier_name)
      setShowNewSupplier(true)
    }
    if (json.date) setScanDate(json.date)
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files)
    if (arr.length === 0) return
    setScanning(true); setScanError(null); setScannedItems(null)
    setScanSupplierId(''); setScanDate(new Date().toISOString().slice(0, 10))
    try {
      const images = await Promise.all(arr.map(f => compressImage(f)))
      const body = images.length === 1
        ? { image_base64: images[0].base64, image_type: images[0].type }
        : { images }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-receipt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler beim Scannen')
      applyScanResult(json)
    } catch (e: unknown) {
      setScanError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setScanning(false)
    }
  }

  async function handleTextScan(text: string) {
    setScanning(true); setScanError(null); setScannedItems(null)
    setScanSupplierId(''); setScanDate(new Date().toISOString().slice(0, 10))
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-receipt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler')
      applyScanResult(json)
    } catch (e: unknown) {
      setScanError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setScanning(false)
    }
  }

  function matchItems(items: ScannedItem[]): ScannedItem[] {
    return items.map(item => {
      const match = localProducts.find(p =>
        p.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(p.name.toLowerCase())
      )
      return { ...item, matched_product_id: match?.id, is_new_product: !match, new_product_name: item.name, new_product_category: item.category_hint, mode: 'geschaeftlich' as const }
    })
  }

  async function saveScannedItems() {
    if (!scannedItems) return
    setSaving(true)
    try {
      for (const item of scannedItems) {
        const mode = item.mode ?? 'geschaeftlich'

        // 🔨 Investition → direkt in expenses speichern
        if (mode === 'investition') {
          const netto  = toNetto(item)
          const brutto = item.vat_rate ? netto * (1 + item.vat_rate / 100) : netto
          const kdv    = item.vat_rate ? netto * item.vat_rate / 100 : null
          await supabase.from('expenses').insert({
            description:    item.name,
            amount_gross:   brutto,
            amount_net:     netto,
            vat_rate:       item.vat_rate ?? null,
            vat_amount:     kdv,
            date:           scanDate,
            supplier_id:    scanSupplierId || null,
            payment_type:   'offiziell',
            has_receipt:    true,
            source:         'scan',
            category_id:    null, // "Nicht kategorisiert" → Nutzer kann nachträglich zuweisen
          })
          continue
        }

        // 🏢 Geschäftlich / 🏠 Privat → purchase_prices
        let productId = item.matched_product_id
        if (item.is_new_product && item.new_product_name) {
          const { data: newP } = await supabase.from('purchase_products').insert({
            name: item.new_product_name,
            category: item.new_product_category || 'sonstiges',
            unit: item.unit,
          }).select().single()
          if (newP) { productId = newP.id; setLocalProducts(prev => [...prev, newP as Product]) }
        }
        if (!productId) continue
        const { data: newPrice } = await supabase.from('purchase_prices').insert({
          product_id: productId,
          price_tl:   toNetto(item),   // immer Netto speichern
          quantity:   item.quantity,
          unit:       item.unit,
          date:       scanDate,
          source:     'scan',
          is_private: mode === 'privat',
          supplier_id: scanSupplierId || null,
          vat_rate:   item.vat_rate ?? null,
        }).select().single()
        if (newPrice) setLocalPrices(prev => [newPrice as Price, ...prev])
      }
      setScannedItems(null)
      setScanSupplierId('')
      setScanDate(new Date().toISOString().slice(0, 10))
      setView('matrix')
    } finally {
      setSaving(false)
    }
  }

  // ── Produkt anlegen ────────────────────────────────────────────────────────

  async function saveNewProduct() {
    if (!newProd.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('purchase_products').insert({
      name: newProd.name.trim(), category: newProd.category, unit: newProd.unit, notes: newProd.notes || null,
    }).select().single()
    if (data) { setLocalProducts(prev => [...prev, data as Product]); setNewProd({ name: '', category: 'molkerei', unit: 'kg', notes: '' }) }
    setSaving(false)
    setView('matrix')
  }

  // ── Produkt bearbeiten ─────────────────────────────────────────────────────

  function startEditProduct(prod: Product) {
    setEditingProduct(prod.id)
    setEditProductForm({ name: prod.name, category: prod.category, unit: prod.unit, notes: prod.notes ?? '' })
  }

  async function saveEditProduct(prodId: string) {
    if (!editProductForm.name.trim()) return alert('Name darf nicht leer sein')
    setSaving(true)
    const { data, error } = await supabase.from('purchase_products').update({
      name: editProductForm.name.trim(),
      category: editProductForm.category,
      unit: editProductForm.unit,
      notes: editProductForm.notes || null,
    }).eq('id', prodId).select().single()
    setSaving(false)
    if (error) { alert('Fehler beim Speichern: ' + error.message); return }
    if (data) setLocalProducts(prev => prev.map(p => p.id === prodId ? data as Product : p))
    setEditingProduct(null)
  }

  async function deleteProduct(prodId: string) {
    if (!confirm('Produkt und alle Preiseinträge löschen?')) return
    await supabase.from('purchase_products').delete().eq('id', prodId)
    setLocalProducts(prev => prev.filter(p => p.id !== prodId))
    setLocalPrices(prev => prev.filter(p => p.product_id !== prodId))
    setExpandedProduct(null)
  }

  // ── Preis manuell ──────────────────────────────────────────────────────────

  async function saveManualPrice() {
    if (!manualPrice.product_id || !manualPrice.price_tl) return
    setSaving(true)
    const prod = localProducts.find(p => p.id === manualPrice.product_id)
    const { data } = await supabase.from('purchase_prices').insert({
      product_id: manualPrice.product_id,
      price_tl: parseFloat(manualPrice.price_tl),
      quantity: parseFloat(manualPrice.quantity) || 1,
      unit: manualPrice.unit || prod?.unit || 'Stk',
      date: manualPrice.date, source: 'manual',
      notes: manualPrice.notes || null,
      is_private: manualPrice.is_private,
    }).select().single()
    if (data) setLocalPrices(prev => [data as Price, ...prev])
    setSaving(false)
    setView('matrix')
    setManualPrice({ product_id: '', price_tl: '', quantity: '1', unit: 'kg', date: new Date().toISOString().slice(0, 10), notes: '', is_private: false })
  }

  // ── Preis bearbeiten ───────────────────────────────────────────────────────

  function startEditPrice(p: Price) {
    setEditingPrice(p.id)
    setEditPriceForm({
      price_tl: String(p.price_tl), quantity: String(p.quantity), unit: p.unit,
      date: p.date, notes: p.notes ?? '', is_private: p.is_private,
    })
  }

  async function saveEditPrice(priceId: string) {
    setSaving(true)
    const { data } = await supabase.from('purchase_prices').update({
      price_tl:   parseFloat(editPriceForm.price_tl),
      quantity:   parseFloat(editPriceForm.quantity) || 1,
      unit:       editPriceForm.unit,
      date:       editPriceForm.date,
      notes:      editPriceForm.notes || null,
      is_private: editPriceForm.is_private,
    }).eq('id', priceId).select().single()
    if (data) setLocalPrices(prev => prev.map(p => p.id === priceId ? data as Price : p))
    setEditingPrice(null)
    setSaving(false)
  }

  async function deletePrice(priceId: string) {
    await supabase.from('purchase_prices').delete().eq('id', priceId)
    setLocalPrices(prev => prev.filter(p => p.id !== priceId))
    setEditingPrice(null)
  }

  // ── Hilfsvariablen ─────────────────────────────────────────────────────────

  const filtered = localProducts.filter(p => {
    if (selectedCat && p.category !== selectedCat) return false
    if (showPrivat === 'alle') return true
    const prices = localPrices.filter(pr => pr.product_id === p.id)
    if (prices.length === 0) return showPrivat === 'geschaeftlich' // kein Preis → geschäftlich
    const hasPrivat = prices.some(pr => pr.is_private)
    const hasBiz    = prices.some(pr => !pr.is_private)
    if (showPrivat === 'privat')       return hasPrivat
    if (showPrivat === 'geschaeftlich') return hasBiz
    return true
  })
  const grouped = CATEGORIES.map(cat => ({
    ...cat, items: filtered.filter(p => p.category === cat.key),
  })).filter(g => g.items.length > 0 || !selectedCat)

  const [pasteText, setPasteText] = useState('')
  const [showPaste, setShowPaste] = useState(false)

  const S = {
    header: { padding: '12px 16px', background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', display: 'flex', alignItems: 'center', gap: '8px' } as React.CSSProperties,
    btn: (bg: string, color = '#FFF') => ({ background: bg, color, border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' } as React.CSSProperties),
    card: { background: '#FFF', borderRadius: '12px', border: '1px solid #E5E0D8', overflow: 'hidden', marginBottom: '8px' } as React.CSSProperties,
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '14px', boxSizing: 'border-box' } as React.CSSProperties,
  }

  // ── Neuer Händler anlegen ─────────────────────────────────────────────────
  async function saveNewSupplier() {
    if (!newSupplierName.trim()) return
    setSavingSupplier(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('suppliers')
      .insert({ name: newSupplierName.trim(), category: newSupplierCat })
      .select('id, name, category')
      .single()
    setSavingSupplier(false)
    if (error || !data) { alert('Fehler: ' + error?.message); return }
    setLocalSuppliers(prev => [...prev, data])
    setScanSupplierId(data.id)
    setShowNewSupplier(false)
    setNewSupplierName('')
  }

  // ── Render: Main-Tabs ──────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F4F0', maxWidth: '600px', margin: '0 auto' }}>

      {/* Main-Tab-Bar */}
      <div style={{ padding: '8px 12px', background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', display: 'flex', gap: '6px' }}>
        {([['produkte', '🛒 Produkte'], ['auswertung', '📊 Auswertung']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setMainTab(tab)} style={{
            flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: mainTab === tab ? 700 : 400,
            background: mainTab === tab ? '#1A1207' : 'transparent', color: mainTab === tab ? '#FFF' : '#8A7A60', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* Auswertungs-Tab */}
      {mainTab === 'auswertung' && (
        <AuswertungView prices={localPrices} products={localProducts} />
      )}

      {/* Produkte-Tab */}
      {mainTab === 'produkte' && (
        <>
          {/* Action-Bar */}
          {view === 'matrix' && (
            <div style={{ ...S.header, justifyContent: 'flex-end' }}>
              <button onClick={() => { setScannedItems(null); setScanError(null); setView('scan') }} style={S.btn('#1565C0')}>📷 Scan</button>
              <button onClick={() => { setManualPrice(p => ({ ...p, date: new Date().toISOString().slice(0,10) })); setView('manual_price') }} style={{ ...S.btn('#2E7D32'), marginLeft: '4px' }}>+ Preis</button>
              <button onClick={() => setView('manual_product')} style={{ ...S.btn('#555'), marginLeft: '4px', fontSize: '13px' }}>+ Produkt</button>
            </div>
          )}

          {/* ── SCAN ─────────────────────────────────────────────────────── */}
          {view === 'scan' && (
            <div style={{ padding: '16px' }}>
              <div style={{ ...S.card, padding: '16px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Beleg scannen</p>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#888' }}>Langer Bon? Mehrere Fotos auf einmal auswählen.</p>
                {/* Kamera: 1 Foto direkt aufnehmen */}
                <input ref={fileRef} type="file" accept="image/*" capture="environment"
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.length) handleFiles(e.target.files) }}
                />
                {/* Galerie: mehrere Fotos aus der Bibliothek wählen */}
                <input ref={galleryRef} type="file" accept="image/*" multiple
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.length) handleFiles(e.target.files) }}
                />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => fileRef.current?.click()} style={S.btn('#1565C0')} disabled={scanning}>
                    {scanning ? '⏳ Scanning…' : '📸 Kamera'}
                  </button>
                  <button onClick={() => galleryRef.current?.click()} style={S.btn('#0D47A1')} disabled={scanning}>
                    {scanning ? '⏳ Scanning…' : '🖼️ Galerie (mehrere)'}
                  </button>
                  <button onClick={() => setShowPaste(s => !s)} style={S.btn('#555')}>📋 Text einfügen</button>
                </div>
                {showPaste && (
                  <div style={{ marginTop: '12px' }}>
                    <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
                      placeholder="Belegtext hier einfügen…"
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
                  {/* ── Händler + Datum ── */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E0D8', background: '#F9F7F4' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>
                      {scannedItems.length} Produkte erkannt
                    </div>

                    {/* Händler */}
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#8A7A60', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                        🏪 Händler {scanSupplierId ? <span style={{ color: '#2E7D32' }}>✓ automatisch erkannt</span> : '(optional)'}
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select
                          value={scanSupplierId}
                          onChange={e => { setScanSupplierId(e.target.value); setShowNewSupplier(false) }}
                          style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: `1.5px solid ${scanSupplierId ? '#2E7D32' : '#E5E0D8'}`, fontSize: '14px', background: '#FFF', color: scanSupplierId ? '#1A1207' : '#A09880' }}>
                          <option value="">— Händler wählen (optional) —</option>
                          {(['supermarkt', 'lieferant', 'sonstiges'] as const).map(cat => {
                            const grouped = localSuppliers.filter(s => s.category === cat).sort((a, b) => a.name.localeCompare(b.name))
                            if (!grouped.length) return null
                            return (
                              <optgroup key={cat} label={SUPPLIER_CATS[cat] ?? cat}>
                                {grouped.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </optgroup>
                            )
                          })}
                        </select>
                        <button
                          onClick={() => setShowNewSupplier(v => !v)}
                          style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #E5E0D8', background: showNewSupplier ? '#E8F5E9' : '#FFF', fontSize: '18px', cursor: 'pointer', flexShrink: 0 }}
                          title="Neuen Händler anlegen">
                          ➕
                        </button>
                      </div>
                      {showNewSupplier && (
                        <div style={{ marginTop: '8px', padding: '10px 12px', background: '#F0F7F0', borderRadius: '8px', border: '1.5px solid #A5D6A7' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#2E7D32', marginBottom: '8px' }}>Neuen Händler anlegen</div>
                          <input
                            autoFocus
                            placeholder="Name (z.B. Metro, Migros…)"
                            value={newSupplierName}
                            onChange={e => setNewSupplierName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveNewSupplier()}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #C8E6C9', fontSize: '14px', marginBottom: '6px', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {(['supermarkt', 'lieferant', 'sonstiges'] as const).map(cat => (
                              <button key={cat} onClick={() => setNewSupplierCat(cat)}
                                style={{ flex: 1, padding: '6px 4px', borderRadius: '6px', border: `1.5px solid ${newSupplierCat === cat ? '#2E7D32' : '#C8E6C9'}`, background: newSupplierCat === cat ? '#2E7D32' : '#FFF', color: newSupplierCat === cat ? '#FFF' : '#555', fontSize: '11px', cursor: 'pointer' }}>
                                {SUPPLIER_CATS[cat]}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={saveNewSupplier}
                            disabled={savingSupplier || !newSupplierName.trim()}
                            style={{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: '6px', border: 'none', background: newSupplierName.trim() ? '#2E7D32' : '#CCC', color: '#FFF', fontSize: '13px', fontWeight: 700, cursor: newSupplierName.trim() ? 'pointer' : 'default' }}>
                            {savingSupplier ? 'Speichern…' : '✓ Anlegen & auswählen'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Datum */}
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#8A7A60', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                        📅 Einkaufsdatum
                      </label>
                      <input
                        type="date"
                        value={scanDate}
                        onChange={e => setScanDate(e.target.value)}
                        style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #E5E0D8', fontSize: '14px', background: '#FFF', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Split-Anzeige */}
                    <div style={{ fontSize: '12px', color: '#8A7A60', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>Mengen + Einheiten prüfen · 🏢/🏠 pro Zeile markieren</span>
                    </div>
                    {/* Schnell alle umschalten */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <button onClick={() => setScannedItems(prev => prev!.map(it => ({ ...it, mode: 'geschaeftlich' as const })))}
                        style={{ flex: 1, padding: '7px', border: '1.5px solid #2E7D32', borderRadius: '8px', background: '#E8F5E9', color: '#2E7D32', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        🏢 Alle geschäftl.
                      </button>
                      <button onClick={() => setScannedItems(prev => prev!.map(it => ({ ...it, mode: 'privat' as const })))}
                        style={{ flex: 1, padding: '7px', border: '1.5px solid #7B1FA2', borderRadius: '8px', background: '#EDE7F6', color: '#6A1B9A', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        🏠 Alle privat
                      </button>
                      <button onClick={() => setScannedItems(prev => prev!.map(it => ({ ...it, mode: 'investition' as const })))}
                        style={{ flex: 1, padding: '7px', border: '1.5px solid #B8882A', borderRadius: '8px', background: '#FFF8E1', color: '#B8882A', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        🔨 Alle Invest.
                      </button>
                    </div>
                  </div>
                  {scannedItems.map((item, i) => {
                    const perUnit = item.quantity > 0 ? item.price_tl / item.quantity : 0
                    return (
                      <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #F0ECE8', background: item.mode === 'privat' ? '#F9F0FF' : item.mode === 'investition' ? '#FFFDE7' : undefined }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                            <div style={{ fontSize: '11px', color: '#8A7A60' }}>
                              {item.category_hint}
                              {item.is_new_product && <span style={{ color: '#1565C0', marginLeft: '6px' }}>✦ neu</span>}
                              {!item.is_new_product && <span style={{ color: '#2E7D32', marginLeft: '6px' }}>✓ bekannt</span>}
                            </div>
                          </div>
                          <button onClick={() => setScannedItems(prev => prev!.filter((_, j) => j !== i))}
                            style={{ background: 'none', border: 'none', color: '#C62828', fontSize: '16px', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}>✕</button>
                        </div>
                        {/* Preis + Menge */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F5F2EC', borderRadius: '8px', padding: '4px 8px' }}>
                            <span style={{ fontSize: '11px', color: '#8A7A60' }}>{item.is_gross ? 'Brutto' : 'Netto'}</span>
                            <input type="number" inputMode="decimal" value={item.price_tl}
                              onChange={e => setScannedItems(prev => prev!.map((it, j) => j === i ? { ...it, price_tl: parseFloat(e.target.value) || 0 } : it))}
                              style={{ width: '60px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 700, textAlign: 'right' }} />
                            <span style={{ fontSize: '11px', color: '#8A7A60' }}>₺</span>
                          </div>
                          {item.is_gross && item.vat_rate && (
                            <div style={{ fontSize: '11px', color: '#2E7D32', background: '#E8F5E9', borderRadius: '6px', padding: '4px 7px' }}>
                              Netto: {fmtPrice(toNetto(item))}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F5F2EC', borderRadius: '8px', padding: '4px 8px' }}>
                            <input type="number" inputMode="decimal" value={item.quantity}
                              onChange={e => setScannedItems(prev => prev!.map((it, j) => j === i ? { ...it, quantity: parseFloat(e.target.value) || 1 } : it))}
                              style={{ width: '40px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 700, textAlign: 'right' }} />
                            <select value={item.unit}
                              onChange={e => setScannedItems(prev => prev!.map((it, j) => j === i ? { ...it, unit: e.target.value } : it))}
                              style={{ border: 'none', background: 'transparent', fontSize: '13px', color: '#5A5040' }}>
                              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                          {item.quantity > 0 && <span style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 600 }}>{fmtPrice(perUnit)}/{item.unit}</span>}
                        </div>
                        {/* 3-Wege-Toggle: Geschäftlich / Privat / Investition */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {(['geschaeftlich', 'privat', 'investition'] as const).map(m => {
                            const active = (item.mode ?? 'geschaeftlich') === m
                            const cfg = {
                              geschaeftlich: { label: '🏢 Geschäftl.', bg: '#E8F5E9', color: '#2E7D32', border: '#2E7D32' },
                              privat:        { label: '🏠 Privat',     bg: '#EDE7F6', color: '#6A1B9A', border: '#7B1FA2' },
                              investition:   { label: '🔨 Investition', bg: '#FFF8E1', color: '#B8882A', border: '#B8882A' },
                            }[m]
                            return (
                              <button key={m}
                                onClick={() => setScannedItems(prev => prev!.map((it, j) => j === i ? { ...it, mode: m } : it))}
                                style={{
                                  flex: 1, padding: '8px 4px', border: `2px solid ${active ? cfg.border : '#E5E0D8'}`,
                                  borderRadius: '8px', fontSize: '11px', fontWeight: active ? 700 : 500,
                                  background: active ? cfg.bg : '#FFF', color: active ? cfg.color : '#A09880',
                                  cursor: 'pointer',
                                }}>
                                {cfg.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  {/* ── Kontroll-Summe ── */}
                  {(() => {
                    const total = scannedItems.reduce((s, i) => s + toNetto(i), 0)
                    const totalBiz  = scannedItems.filter(i => (i.mode ?? 'geschaeftlich') === 'geschaeftlich').reduce((s, i) => s + toNetto(i), 0)
                    const totalPriv = scannedItems.filter(i => i.mode === 'privat').reduce((s, i) => s + toNetto(i), 0)
                    const totalInvest = scannedItems.filter(i => i.mode === 'investition').reduce((s, i) => s + toNetto(i), 0)
                    const totalKdv = scannedItems.reduce((s, i) => { const n = toNetto(i); return s + (i.vat_rate ? n * i.vat_rate / 100 : 0) }, 0)
                    const hasKdv = scannedItems.some(i => i.vat_rate)
                    return (
                      <div style={{ margin: '0 12px 4px', background: '#F5F2EC', borderRadius: '10px', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#5A5040', fontWeight: 600 }}>Netto gesamt</span>
                          <span style={{ fontSize: '18px', fontWeight: 800, color: '#1A1207' }}>{fmtPrice(total)}</span>
                        </div>
                        {hasKdv && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                            <span style={{ color: '#8A7A60' }}>+ KDV</span>
                            <span style={{ color: '#8A7A60', fontWeight: 600 }}>{fmtPrice(totalKdv)}</span>
                          </div>
                        )}
                        {hasKdv && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #E5E0D8' }}>
                            <span style={{ color: '#5A5040', fontWeight: 600 }}>Brutto</span>
                            <span style={{ color: '#5A5040', fontWeight: 700 }}>{fmtPrice(total + totalKdv)}</span>
                          </div>
                        )}
                        {(totalPriv > 0 || totalInvest > 0) && (
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#2E7D32' }}>🏢 {fmtPrice(totalBiz)}</span>
                            {totalPriv > 0 && <span style={{ color: '#7B1FA2' }}>🏠 {fmtPrice(totalPriv)}</span>}
                            {totalInvest > 0 && <span style={{ color: '#B8882A' }}>🔨 {fmtPrice(totalInvest)}</span>}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#A09880', marginTop: '4px' }}>
                          Bitte mit Rechnungssumme abgleichen
                        </div>
                      </div>
                    )
                  })()}
                  <div style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setScannedItems(null); setView('matrix') }} style={S.btn('#E0E0E0', '#555')}>Verwerfen</button>
                    <button onClick={saveScannedItems} disabled={saving} style={{ ...S.btn('#2E7D32'), flex: 1 }}>
                      {saving ? 'Speichern…' : '✓ Alle speichern'}
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => setView('matrix')} style={{ ...S.btn('#E0E0E0', '#555'), marginTop: '8px', width: '100%' }}>← Zurück</button>
            </div>
          )}

          {/* ── NEUES PRODUKT ─────────────────────────────────────────────── */}
          {view === 'manual_product' && (
            <div style={{ padding: '16px' }}>
              <div style={{ ...S.card, padding: '16px' }}>
                <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Neues Produkt anlegen</p>
                <input value={newProd.name} onChange={e => setNewProd(p => ({ ...p, name: e.target.value }))}
                  placeholder="Produktname" style={{ ...S.input, marginBottom: '10px' }} />
                <select value={newProd.category} onChange={e => setNewProd(p => ({ ...p, category: e.target.value }))}
                  style={{ ...S.input, marginBottom: '10px' }}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                </select>
                <select value={newProd.unit} onChange={e => setNewProd(p => ({ ...p, unit: e.target.value }))}
                  style={{ ...S.input, marginBottom: '10px' }}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <input value={newProd.notes} onChange={e => setNewProd(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Notiz (optional)" style={{ ...S.input, marginBottom: '12px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setView('matrix')} style={S.btn('#E0E0E0', '#555')}>Abbrechen</button>
                  <button onClick={saveNewProduct} disabled={saving || !newProd.name.trim()} style={{ ...S.btn('#2E7D32'), flex: 1 }}>
                    {saving ? 'Speichern…' : '✓ Produkt anlegen'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── MANUELLER PREIS ───────────────────────────────────────────── */}
          {view === 'manual_price' && (
            <div style={{ padding: '16px' }}>
              <div style={{ ...S.card, padding: '16px' }}>
                <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Preis eintragen</p>
                <select value={manualPrice.product_id} onChange={e => {
                  const prod = localProducts.find(p => p.id === e.target.value)
                  setManualPrice(p => ({ ...p, product_id: e.target.value, unit: prod?.unit || 'kg' }))
                }} style={{ ...S.input, marginBottom: '10px' }}>
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
                      placeholder="0.00" style={S.input} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#8A7A60', display: 'block', marginBottom: '4px' }}>Menge</label>
                    <input type="number" inputMode="decimal" value={manualPrice.quantity}
                      onChange={e => setManualPrice(p => ({ ...p, quantity: e.target.value }))}
                      style={S.input} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#8A7A60', display: 'block', marginBottom: '4px' }}>Einheit</label>
                    <select value={manualPrice.unit} onChange={e => setManualPrice(p => ({ ...p, unit: e.target.value }))}
                      style={S.input}>
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
                  style={{ ...S.input, marginBottom: '10px' }} />
                <input value={manualPrice.notes} onChange={e => setManualPrice(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Notiz (optional)" style={{ ...S.input, marginBottom: '10px' }} />
                <button onClick={() => setManualPrice(p => ({ ...p, is_private: !p.is_private }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `2px solid ${manualPrice.is_private ? '#7B1FA2' : '#E5E0D8'}`, background: manualPrice.is_private ? '#F9F0FF' : '#FFF', color: manualPrice.is_private ? '#7B1FA2' : '#8A7A60', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginBottom: '12px' }}>
                  {manualPrice.is_private ? '🏠 Privat (für zuhause)' : '🏢 Geschäftlich'}
                </button>
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

          {/* ── MATRIX ────────────────────────────────────────────────────── */}
          {view === 'matrix' && (
            <div style={{ padding: '12px', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}>

              {/* Geschäftlich/Privat-Filter */}
              <div style={{ display: 'flex', background: '#F5F2EC', borderRadius: '10px', padding: '3px', marginBottom: '10px', gap: '3px' }}>
                {(['geschaeftlich', 'alle', 'privat'] as const).map(m => (
                  <button key={m} onClick={() => setShowPrivat(m)} style={{
                    flex: 1, padding: '7px 4px', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                    background: showPrivat === m ? (m === 'privat' ? '#7B1FA2' : m === 'geschaeftlich' ? '#2E7D32' : '#5A5040') : 'transparent',
                    color: showPrivat === m ? '#FFF' : '#8A7A60', fontWeight: showPrivat === m ? 700 : 400,
                  }}>
                    {m === 'geschaeftlich' ? '🏢 Geschäftl.' : m === 'privat' ? '🏠 Privat' : 'Alle'}
                  </button>
                ))}
              </div>

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
                  {cat.items.length === 0 && !selectedCat && (
                    <div style={{ color: '#A09880', fontSize: '13px', padding: '8px 4px' }}>Keine Produkte</div>
                  )}
                  {cat.items.map(prod => {
                    const lp = latestPrice(prod.id)
                    const hist = priceHistory(prod.id)
                    const isExpanded = expandedProduct === prod.id
                    const isEditingProd = editingProduct === prod.id

                    const isPrivate = lp?.is_private ?? false
                    return (
                      <div key={prod.id} style={{ ...S.card, ...(isPrivate ? { background: '#F9F0FF', borderLeft: '3px solid #7B1FA2' } : {}) }}>
                        {/* Produkt-Header */}
                        {isEditingProd ? (
                          <div style={{ padding: '12px 14px', background: '#F9F7F4' }}>
                            <input autoFocus value={editProductForm.name} onChange={e => setEditProductForm(f => ({ ...f, name: e.target.value }))}
                              style={{ ...S.input, marginBottom: '8px', fontSize: '14px', fontWeight: 600 }} />
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <select value={editProductForm.category} onChange={e => setEditProductForm(f => ({ ...f, category: e.target.value }))}
                                style={{ ...S.input, flex: 2 }}>
                                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                              </select>
                              <select value={editProductForm.unit} onChange={e => setEditProductForm(f => ({ ...f, unit: e.target.value }))}
                                style={{ ...S.input, flex: 1 }}>
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => setEditingProduct(null)} style={S.btn('#E0E0E0', '#555')}>Abbrechen</button>
                              <button onClick={() => saveEditProduct(prod.id)} disabled={saving} style={{ ...S.btn('#2E7D32'), flex: 1 }}>✓ Speichern</button>
                              <button onClick={() => deleteProduct(prod.id)} style={S.btn('#C62828')}>🗑</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpandedProduct(isExpanded ? null : prod.id)}>
                              <div style={{ fontWeight: 600, fontSize: '15px' }}>{prod.name}</div>
                              {lp && (
                                <div style={{ fontSize: '12px', color: '#8A7A60', marginTop: '2px' }}>
                                  {fmtDate(lp.date)} · {lp.quantity} {lp.unit}
                                  {lp.is_private && <span style={{ color: '#7B1FA2', marginLeft: '4px' }}>🏠</span>}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => setExpandedProduct(isExpanded ? null : prod.id)}>
                              {lp ? (
                                <>
                                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#1A1207' }}>
                                    {fmtPrice(lp.price_per_unit)}<span style={{ fontSize: '12px', fontWeight: 400 }}>/{lp.unit}</span>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#8A7A60' }}>{fmtPrice(lp.price_tl)} ges.</div>
                                </>
                              ) : (
                                <div style={{ color: '#A09880', fontSize: '13px' }}>kein Preis</div>
                              )}
                            </div>
                            <button onClick={() => startEditProduct(prod)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', padding: '4px', color: '#8A7A60' }}>✏️</button>
                            <span style={{ color: '#A09880', fontSize: '14px', cursor: 'pointer' }} onClick={() => setExpandedProduct(isExpanded ? null : prod.id)}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>
                        )}

                        {/* Preisverlauf */}
                        {isExpanded && !isEditingProd && (
                          <div style={{ borderTop: '1px solid #F0ECE8', background: '#FAFAFA' }}>
                            <div style={{ padding: '8px 14px 4px', fontSize: '12px', fontWeight: 700, color: '#8A7A60' }}>PREISVERLAUF</div>
                            {hist.length === 0 && <div style={{ padding: '8px 14px', color: '#A09880', fontSize: '13px' }}>Noch keine Preise erfasst</div>}
                            {hist.map(p => {
                              const isEditingThis = editingPrice === p.id
                              return (
                                <div key={p.id} style={{ borderBottom: '1px solid #F0ECE8', background: p.is_private ? '#FDF5FF' : undefined }}>
                                  {isEditingThis ? (
                                    <div style={{ padding: '10px 14px' }}>
                                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                        <div style={{ flex: 2 }}>
                                          <label style={{ fontSize: '10px', color: '#8A7A60' }}>Gesamtpreis ₺</label>
                                          <input type="number" value={editPriceForm.price_tl}
                                            onChange={e => setEditPriceForm(f => ({ ...f, price_tl: e.target.value }))}
                                            style={{ ...S.input, fontSize: '13px', padding: '6px 8px' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <label style={{ fontSize: '10px', color: '#8A7A60' }}>Menge</label>
                                          <input type="number" value={editPriceForm.quantity}
                                            onChange={e => setEditPriceForm(f => ({ ...f, quantity: e.target.value }))}
                                            style={{ ...S.input, fontSize: '13px', padding: '6px 8px' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <label style={{ fontSize: '10px', color: '#8A7A60' }}>Einheit</label>
                                          <select value={editPriceForm.unit} onChange={e => setEditPriceForm(f => ({ ...f, unit: e.target.value }))}
                                            style={{ ...S.input, fontSize: '13px', padding: '6px 8px' }}>
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                          </select>
                                        </div>
                                      </div>
                                      {editPriceForm.price_tl && editPriceForm.quantity && (
                                        <div style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 600, marginBottom: '6px' }}>
                                          = {fmtPrice(parseFloat(editPriceForm.price_tl) / (parseFloat(editPriceForm.quantity) || 1))} / {editPriceForm.unit}
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                        <input type="date" value={editPriceForm.date}
                                          onChange={e => setEditPriceForm(f => ({ ...f, date: e.target.value }))}
                                          style={{ ...S.input, flex: 1, fontSize: '13px', padding: '6px 8px' }} />
                                        <input value={editPriceForm.notes}
                                          onChange={e => setEditPriceForm(f => ({ ...f, notes: e.target.value }))}
                                          placeholder="Notiz" style={{ ...S.input, flex: 1, fontSize: '13px', padding: '6px 8px' }} />
                                      </div>
                                      <button onClick={() => setEditPriceForm(f => ({ ...f, is_private: !f.is_private }))}
                                        style={{ width: '100%', padding: '6px', borderRadius: '8px', border: `1px solid ${editPriceForm.is_private ? '#7B1FA2' : '#E5E0D8'}`, background: editPriceForm.is_private ? '#F9F0FF' : '#FFF', color: editPriceForm.is_private ? '#7B1FA2' : '#8A7A60', fontWeight: 600, fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                                        {editPriceForm.is_private ? '🏠 Privat' : '🏢 Geschäftlich'}
                                      </button>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => setEditingPrice(null)} style={{ ...S.btn('#E0E0E0', '#555'), flex: 1, padding: '6px' }}>Abbrechen</button>
                                        <button onClick={() => saveEditPrice(p.id)} disabled={saving} style={{ ...S.btn('#2E7D32'), flex: 2, padding: '6px' }}>✓ Speichern</button>
                                        <button onClick={() => deletePrice(p.id)} style={{ ...S.btn('#C62828'), padding: '6px 10px' }}>🗑</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                      <div>
                                        <span style={{ color: '#555' }}>{fmtDate(p.date)}</span>
                                        <span style={{ color: '#A09880', marginLeft: '8px' }}>{p.quantity} {p.unit}</span>
                                        {p.source === 'scan' && <span style={{ color: '#1565C0', marginLeft: '4px', fontSize: '11px' }}>📷</span>}
                                        {p.is_private && <span style={{ color: '#7B1FA2', marginLeft: '4px', fontSize: '11px' }}>🏠</span>}
                                        {p.notes && <span style={{ color: '#A09880', marginLeft: '4px', fontSize: '11px' }}>{p.notes}</span>}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                          <div style={{ fontWeight: 600 }}>{fmtPrice(p.price_per_unit)}/{p.unit}</div>
                                          <div style={{ fontSize: '11px', color: '#8A7A60' }}>{fmtPrice(p.price_tl)}</div>
                                        </div>
                                        <button onClick={() => startEditPrice(p)} style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: '#8A7A60', padding: '4px' }}>✏️</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
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
                  <div style={{ fontSize: '13px', marginTop: '6px' }}>Scanne einen Beleg oder lege Produkte manuell an</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
