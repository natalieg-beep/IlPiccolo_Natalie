'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MENU, CATEGORIES, EXTRA_GROUPS } from '@/lib/menu'

type Table = { id: string; label: string; location: string }
type OrderItem = { id: string; name: string; qty: number; unit_price: number; on_the_house: boolean }
type Order = {
  id: string; status: string; note: string | null
  guest_origin: string | null; age_group: string | null; party_size: number | null
  discount_percent: number | null; discount_amount: number | null
  payment_method: string | null; group_type: string | null
  children_info: string | null
  guest_country: string | null; guest_source: string | null; guest_notes: string | null
  order_items: OrderItem[]
}

const S = {
  header:  { background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky' as const, top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  card:    { background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px', padding: '12px 14px' },
  label:   { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#8A7A60', marginBottom: '8px' },
  goldBtn: { background: '#B8882A', color: '#FFFFFF', border: 'none', padding: '12px 20px', borderRadius: '10px', fontSize: '15px', fontWeight: '700' as const, cursor: 'pointer' },
  qtyBtn:  { background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', width: '32px', height: '32px', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', display: 'flex' as const, alignItems: 'center', justifyContent: 'center' },
  chip: (active: boolean) => ({
    background: active ? '#FFF8EC' : '#F5F2EC',
    border: `1px solid ${active ? '#B8882A' : '#E5E0D8'}`,
    borderRadius: '8px', padding: '6px 11px', fontSize: '12px', cursor: 'pointer',
    color: active ? '#B8882A' : '#5A5040', fontWeight: active ? '600' as const : '400' as const,
  }),
}

const LOCATION_LABEL: Record<string, string> = {
  outside: 'Außen', inside: 'Innen', takeaway: '🥡 TakeAway', privat: '🏠 Privat',
}

export default function OrderClient({ table, existingOrder, backHref }: {
  table: Table; existingOrder: Order | null; backHref?: string
}) {
  const router   = useRouter()
  const supabase = createClient()

  // ── Bestellung ──────────────────────────────────────────────────
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [items, setItems] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    // Merge rows with same name (can happen when partially gratis → saved as 2 rows)
    existingOrder?.order_items.forEach(i => { m[i.name] = (m[i.name] ?? 0) + i.qty })
    return m
  })
  // onTheHouse: how many units of each item are gratis (not a boolean flag anymore)
  const [onTheHouse, setOnTheHouse] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    existingOrder?.order_items.filter(i => i.on_the_house).forEach(i => {
      m[i.name] = (m[i.name] ?? 0) + i.qty
    })
    return m
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  // ── Sonstiges ────────────────────────────────────────────────────
  const [customPrices, setCustomPrices] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    existingOrder?.order_items.forEach(i => {
      if (!MENU.find(mi => mi.name === i.name)) m[i.name] = i.unit_price
    })
    return m
  })
  const [newItemName,  setNewItemName]  = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')

  function getPrice(name: string) {
    return customPrices[name] ?? MENU.find(m => m.name === name)?.price ?? 0
  }

  function addCustomItem() {
    const n = newItemName.trim()
    const p = parseInt(newItemPrice)
    if (!n || !p) return
    setCustomPrices(prev => ({ ...prev, [n]: p }))
    setItems(prev => ({ ...prev, [n]: (prev[n] ?? 0) + 1 }))
    setNewItemName('')
    setNewItemPrice('')
  }

  // ── Rabatt & Zahlung ─────────────────────────────────────────────
  const [discount,         setDiscount]         = useState(existingOrder?.discount_percent ?? 0)
  const [customDiscount,   setCustomDiscount]   = useState('')
  const [discountAmount,   setDiscountAmount]   = useState(existingOrder?.discount_amount ?? 0)
  const [customDiscountAmt,setCustomDiscountAmt]= useState('')
  const [paymentMethod,    setPaymentMethod]    = useState(existingOrder?.payment_method ?? '')

  function applyDiscount(d: number) {
    setDiscount(d); setCustomDiscount('')
    setDiscountAmount(0); setCustomDiscountAmt('')
  }
  function applyDiscountAmount(val: string) {
    setCustomDiscountAmt(val)
    setDiscountAmount(parseInt(val) || 0)
    setDiscount(0); setCustomDiscount('')
  }

  // ── Notiz ────────────────────────────────────────────────────────
  const [note, setNote] = useState(existingOrder?.note ?? '')

  // ── Gäste ────────────────────────────────────────────────────────
  const [showGuest,    setShowGuest]    = useState(false)
  const [guestOrigin,  setGuestOrigin]  = useState(existingOrder?.guest_origin ?? '')
  const [ageGroup,     setAgeGroup]     = useState(existingOrder?.age_group ?? '')
  const [partySize,    setPartySize]    = useState(existingOrder?.party_size?.toString() ?? '')
  const [groupType,    setGroupType]    = useState(existingOrder?.group_type ?? '')
  const [childrenInfo, setChildrenInfo] = useState<string[]>(
    existingOrder?.children_info?.split(',').filter(Boolean) ?? []
  )
  const [guestCountry, setGuestCountry] = useState(existingOrder?.guest_country ?? '')
  const [guestSource,  setGuestSource]  = useState(existingOrder?.guest_source  ?? '')
  const [guestNotes,   setGuestNotes]   = useState(existingOrder?.guest_notes   ?? '')

  // ── Tisch verschieben ────────────────────────────────────────────
  const [showMoveTo,  setShowMoveTo]  = useState(false)
  const [allTables,   setAllTables]   = useState<Table[]>([])
  const [movingTable, setMovingTable] = useState(false)

  async function fetchAndShowMove() {
    const { data } = await supabase.from('tables').select('id, label, location').order('label')
    setAllTables((data ?? []).filter(t => t.id !== table.id))
    setShowMoveTo(true)
  }

  async function moveToTable(newTableId: string) {
    if (!existingOrder?.id) return
    setMovingTable(true)
    await supabase.from('orders').update({ table_id: newTableId }).eq('id', existingOrder.id)
    router.push('/service/tisch/' + newTableId)
    router.refresh()
  }

  // ── Berechnungen ─────────────────────────────────────────────────
  const totalCount     = Object.values(items).reduce((a, b) => a + b, 0)
  const grossPrice     = Object.entries(items).reduce((s, [n, q]) => s + getPrice(n) * q, 0)
  const houseTotal     = Object.entries(items).reduce((s, [n, q]) => {
    const hq = Math.min(onTheHouse[n] ?? 0, q)
    return s + getPrice(n) * hq
  }, 0)
  const chargeableBase = grossPrice - houseTotal

  const isPrivat = table.location === 'privat'
  const isGratis = paymentMethod === 'schwarz' || isPrivat

  const discountedPrice = discountAmount > 0
    ? Math.max(0, chargeableBase - discountAmount)
    : Math.round(chargeableBase * (1 - discount / 100))
  const displayTotal = isGratis ? 0 : discountedPrice

  // ── Hilfsfunktionen ──────────────────────────────────────────────
  function changeHouseQty(name: string, delta: number) {
    setOnTheHouse(prev => {
      const maxQty = items[name] ?? 0
      const next = Math.max(0, Math.min(maxQty, (prev[name] ?? 0) + delta))
      if (next === 0) { const m = { ...prev }; delete m[name]; return m }
      return { ...prev, [name]: next }
    })
  }

  function changeQty(name: string, delta: number) {
    setItems(prev => {
      const val = Math.max(0, (prev[name] ?? 0) + delta)
      if (val === 0) {
        const n = { ...prev }; delete n[name]
        setOnTheHouse(s => { const ns = { ...s }; delete ns[name]; return ns })
        return n
      }
      // Cap house qty if total qty decreases below it
      setOnTheHouse(s => {
        const hq = s[name] ?? 0
        if (hq > val) return { ...s, [name]: val }
        return s
      })
      return { ...prev, [name]: val }
    })
  }

  // ── Speichern ────────────────────────────────────────────────────
  async function saveOrder() {
    setSaving(true)
    const entries = Object.entries(items)
    if (entries.length === 0) { setSaving(false); return }

    let orderId = existingOrder?.id
    const meta = {
      note: note || null,
      guest_origin: guestOrigin || null, age_group: ageGroup || null,
      party_size: partySize ? parseInt(partySize) : null,
      discount_percent: discountAmount > 0 ? null : (discount || null),
      discount_amount:  discountAmount > 0 ? discountAmount : null,
      payment_method: paymentMethod || null,
      group_type: groupType || null,
      children_info: childrenInfo.length ? childrenInfo.join(',') : null,
      guest_country: guestCountry || null,
      guest_source:  guestSource  || null,
      guest_notes:   guestNotes   || null,
    }

    if (!orderId) {
      const { data, error } = await supabase.from('orders')
        .insert({ table_id: table.id, status: 'open', ...meta }).select('id').single()
      if (error || !data) { alert('Fehler beim Speichern'); setSaving(false); return }
      orderId = data.id
    } else {
      await supabase.from('orders').update(meta).eq('id', orderId)
    }

    await supabase.from('order_items').delete().eq('order_id', orderId)
    const saveRows: { order_id: string; name: string; qty: number; unit_price: number; on_the_house: boolean }[] = []
    entries.forEach(([name, qty]) => {
      const houseQty   = Math.min(onTheHouse[name] ?? 0, qty)
      const chargedQty = qty - houseQty
      if (houseQty   > 0) saveRows.push({ order_id: orderId!, name, qty: houseQty,   unit_price: getPrice(name), on_the_house: true  })
      if (chargedQty > 0) saveRows.push({ order_id: orderId!, name, qty: chargedQty, unit_price: getPrice(name), on_the_house: false })
    })
    await supabase.from('order_items').insert(saveRows)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  async function saveGuestMeta() {
    if (!existingOrder?.id) return
    await supabase.from('orders').update({
      guest_origin: guestOrigin || null, age_group: ageGroup || null,
      party_size: partySize ? parseInt(partySize) : null,
      note: note || null, group_type: groupType || null,
      children_info: childrenInfo.length ? childrenInfo.join(',') : null,
      guest_country: guestCountry || null,
      guest_source:  guestSource  || null,
      guest_notes:   guestNotes   || null,
    }).eq('id', existingOrder.id)
    setShowGuest(false)
  }

  async function closeOrder() {
    if (!existingOrder?.id) return
    if (!paymentMethod) {
      alert('Bitte zuerst eine Zahlungsart auswählen.')
      return
    }
    if (!confirm('Bestellung abschließen?')) return
    setSaving(true)
    await supabase.from('orders').update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      payment_method: paymentMethod,
    }).eq('id', existingOrder.id)
    router.push(backHref ?? '/service')
    router.refresh()
  }

  // ── Produkt-Zeile ────────────────────────────────────────────────
  function ProductRow({ item, qty, onChange }: { item: { name: string; desc: string; price: number }; qty: number; onChange: (name: string, delta: number) => void }) {
    return (
      <div style={{
        background: qty > 0 ? '#FFF8EC' : '#FFFFFF',
        border: `1.5px solid ${qty > 0 ? '#B8882A' : '#E5E0D8'}`,
        borderRadius: '12px', padding: '11px 13px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1207' }}>{item.name}</div>
          {item.desc && <div style={{ fontSize: '11px', color: '#A09080', marginTop: '2px', lineHeight: 1.4 }}>{item.desc}</div>}
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#B8882A', marginTop: '3px' }}>{item.price} ₺</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
          <button onClick={() => onChange(item.name, -1)} style={S.qtyBtn}>−</button>
          <span style={{ fontSize: '16px', fontWeight: '700', minWidth: '22px', textAlign: 'center', color: '#1A1207' }}>{qty}</span>
          <button onClick={() => onChange(item.name, 1)} style={S.qtyBtn}>+</button>
        </div>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: 'calc(120px + 56px + env(safe-area-inset-bottom))', background: '#F7F4F0', minHeight: '100dvh' }}>

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#B8882A' }}>
            {isPrivat ? '🏠 Privat' : `Tisch ${table.label}`}
          </div>
          <div style={{ fontSize: '11px', color: '#8A7A60' }}>
            {LOCATION_LABEL[table.location] ?? table.location}
            {existingOrder ? ' · Bestellung offen' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/service/phrasen">
            <button style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '7px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
              🇹🇷 Phrasen
            </button>
          </Link>
          <button onClick={() => router.push(backHref ?? '/service')} style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '8px 14px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
            ← Tische
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* Privat-Hinweis */}
        {isPrivat && (
          <div style={{ background: '#FFF8EC', border: '1px solid #E8C878', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#8A7A60' }}>
            🏠 Privates Essen — wird <strong>nicht</strong> im Umsatz gezählt. Nur zur internen Erfassung.
          </div>
        )}

        {/* Kategorien */}
        <p style={S.label}>Kategorie</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setSelectedCat(selectedCat === cat.key ? null : cat.key)} style={{
              background: selectedCat === cat.key ? '#FFF8EC' : '#FFFFFF',
              border: `2px solid ${selectedCat === cat.key ? '#B8882A' : '#E5E0D8'}`,
              borderRadius: '12px', padding: '10px 4px', textAlign: 'center', cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: '22px' }}>{cat.icon}</div>
              <div style={{ fontSize: '10px', color: '#B8882A', marginTop: '3px', fontWeight: '600' }}>{cat.label}</div>
            </button>
          ))}
        </div>

        {/* Produkte */}
        {selectedCat && (
          <div style={{ marginBottom: '16px' }}>
            <p style={S.label}>{CATEGORIES.find(c => c.key === selectedCat)?.label}</p>
            {selectedCat === 'extra' ? (
              EXTRA_GROUPS.map(group => (
                <div key={group.label} style={{ marginBottom: '10px' }}>
                  <p style={{ fontSize: '11px', color: '#8A7A60', fontWeight: '600', marginBottom: '5px', paddingLeft: '2px' }}>{group.label}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {MENU.filter(m => group.names.includes(m.name)).map(item => (
                      <ProductRow key={item.name} item={item} qty={items[item.name] ?? 0} onChange={changeQty} />
                    ))}
                  </div>
                </div>
              ))
            ) : selectedCat === 'sonstiges' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#8A7A60', fontWeight: '600' }}>✏️ Produkt manuell eintragen</div>
                  <input
                    type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                    placeholder="z.B. Experimental Pizza, Tagesspecial…"
                    style={{ width: '100%', background: '#F5F2EC', border: `1px solid ${newItemName ? '#B8882A' : '#E5E0D8'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: '#1A1207', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}
                      placeholder="Preis (₺)" min="1"
                      style={{ flex: 1, background: '#F5F2EC', border: `1px solid ${newItemPrice ? '#B8882A' : '#E5E0D8'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: '#1A1207', outline: 'none' }}
                    />
                    <button onClick={addCustomItem} disabled={!newItemName.trim() || !newItemPrice} style={{
                      background: newItemName.trim() && newItemPrice ? '#B8882A' : '#E5E0D8',
                      color: '#FFFFFF', border: 'none', borderRadius: '8px',
                      padding: '9px 16px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    }}>+ Hinzufügen</button>
                  </div>
                </div>
                {Object.keys(items).filter(name => !!customPrices[name]).map(name => (
                  <ProductRow key={name} item={{ name, desc: '', price: customPrices[name] }} qty={items[name] ?? 0} onChange={changeQty} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {MENU.filter(m => m.category === selectedCat).map(item => (
                  <ProductRow key={item.name} item={item} qty={items[item.name] ?? 0} onChange={changeQty} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Aktuelle Bestellung ── */}
        {totalCount > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={S.label}>Bestellung</p>

            {/* Artikel-Liste */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px', overflow: 'hidden' }}>
              {Object.entries(items).map(([name, qty], i, arr) => {
                const houseQty   = Math.min(onTheHouse[name] ?? 0, qty)
                const chargedQty = qty - houseQty
                const isAllHouse = houseQty >= qty
                const isPartial  = houseQty > 0 && !isAllHouse
                const chargedPrice = getPrice(name) * chargedQty
                const housePrice   = getPrice(name) * houseQty
                return (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', padding: '9px 12px',
                    borderBottom: i < arr.length - 1 ? '1px solid #F0EDE8' : 'none',
                    background: isAllHouse ? '#F0FAF0' : isPartial ? '#F7FCF7' : undefined,
                  }}>
                    <span style={{ flex: 1, fontSize: '14px', color: '#1A1207' }}>
                      {name} <span style={{ color: '#8A7A60' }}>×{qty}</span>
                    </span>
                    {!isGratis && (
                      qty === 1 ? (
                        // Einfacher Toggle für Einzelartikel
                        <button onClick={() => changeHouseQty(name, houseQty > 0 ? -1 : 1)} title="Aufs Haus" style={{
                          background: houseQty > 0 ? '#2E7D32' : '#F5F2EC',
                          border: `1px solid ${houseQty > 0 ? '#2E7D32' : '#E5E0D8'}`,
                          borderRadius: '6px', padding: '3px 8px', fontSize: '13px',
                          cursor: 'pointer', marginRight: '8px', lineHeight: 1,
                        }}>🎁</button>
                      ) : (
                        // Stepper für mehrere Einheiten
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginRight: '8px' }}>
                          <button onClick={() => changeHouseQty(name, -1)} disabled={houseQty === 0} style={{
                            background: '#F5F2EC', border: '1px solid #E5E0D8', borderRadius: '5px',
                            width: '22px', height: '22px', fontSize: '14px', cursor: houseQty === 0 ? 'default' : 'pointer',
                            color: houseQty === 0 ? '#C0B8B0' : '#5A5040', lineHeight: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>−</button>
                          <span style={{
                            fontSize: '11px', minWidth: '30px', textAlign: 'center',
                            color: houseQty > 0 ? '#2E7D32' : '#8A7A60', fontWeight: '600',
                          }}>🎁{houseQty > 0 ? houseQty : ''}</span>
                          <button onClick={() => changeHouseQty(name, 1)} disabled={houseQty >= qty} style={{
                            background: '#F5F2EC', border: '1px solid #E5E0D8', borderRadius: '5px',
                            width: '22px', height: '22px', fontSize: '14px', cursor: houseQty >= qty ? 'default' : 'pointer',
                            color: houseQty >= qty ? '#C0B8B0' : '#5A5040', lineHeight: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>+</button>
                        </div>
                      )
                    )}
                    {/* Preis-Anzeige */}
                    {isGratis ? (
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#2E7D32', textDecoration: 'line-through' }}>
                        {getPrice(name) * qty} ₺ gratis
                      </span>
                    ) : isAllHouse ? (
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#2E7D32', textDecoration: 'line-through' }}>
                        {housePrice} ₺ gratis
                      </span>
                    ) : isPartial ? (
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#B8882A' }}>
                        {chargedPrice} ₺
                        <span style={{ color: '#2E7D32', marginLeft: '4px', textDecoration: 'line-through', fontSize: '11px' }}>+{housePrice} ₺</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#B8882A' }}>
                        {getPrice(name) * qty} ₺
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Privat-Warenwert */}
            {isPrivat && grossPrice > 0 && (
              <div style={{ textAlign: 'right', padding: '6px 4px', fontSize: '12px', color: '#8A7A60' }}>
                Warenwert (intern): {grossPrice} ₺
              </div>
            )}

            {/* Rabatt — nur wenn nicht gratis */}
            {!isGratis && (
              <div style={{ ...S.card, marginTop: '8px' }}>
                <div style={{ fontSize: '12px', color: '#8A7A60', fontWeight: '600', marginBottom: '8px' }}>🏷️ İndirim / Rabatt</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
                  {[0, 10, 20, 50].map(d => (
                    <button key={d} onClick={() => applyDiscount(d)} style={{
                      ...S.chip(discount === d && !customDiscount && discountAmount === 0),
                      padding: '7px 13px', fontSize: '13px',
                    }}>
                      {d === 0 ? 'Kein' : `${d} %`}
                    </button>
                  ))}
                  {/* Frei % */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number" min="1" max="99" placeholder="%" value={customDiscount}
                      onChange={e => { setCustomDiscount(e.target.value); setDiscount(parseInt(e.target.value) || 0); setDiscountAmount(0); setCustomDiscountAmt('') }}
                      style={{
                        background: '#F5F2EC', border: `1px solid ${customDiscount ? '#B8882A' : '#E5E0D8'}`,
                        borderRadius: '8px', padding: '7px 10px', width: '60px', fontSize: '13px',
                        color: '#1A1207', outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#8A7A60' }}>%</span>
                  </div>
                  {/* Frei ₺ */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number" min="1" placeholder="₺ fix" value={customDiscountAmt}
                      onChange={e => applyDiscountAmount(e.target.value)}
                      style={{
                        background: '#F5F2EC', border: `1px solid ${customDiscountAmt ? '#B8882A' : '#E5E0D8'}`,
                        borderRadius: '8px', padding: '7px 10px', width: '70px', fontSize: '13px',
                        color: '#1A1207', outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#8A7A60' }}>₺</span>
                  </div>
                </div>
                {(discount > 0 || discountAmount > 0) && (
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#8A7A60', textDecoration: 'line-through' }}>{chargeableBase} ₺</span>
                    <span style={{ color: '#1A1207' }}> → </span>
                    <span style={{ fontWeight: '700', color: '#B8882A' }}>{displayTotal} ₺</span>
                    <span style={{ color: '#2E7D32', marginLeft: '6px' }}>
                      {discountAmount > 0 ? `−${discountAmount} ₺` : `−${discount} %`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Zahlungsart */}
            <div style={{ ...S.card, marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: '#8A7A60', fontWeight: '600', marginBottom: '8px' }}>💳 Zahlungsart</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {([
                  { val: 'card',         label: '💳 Karte' },
                  { val: 'cash',         label: '💵 Bar' },
                  { val: 'friends_card', label: '👫 Freunde (Karte)' },
                  { val: 'schwarz_bar',  label: '🤝 Freunde (Bar)' },
                  { val: 'schwarz',      label: '🎁 Freunde (gratis)' },
                ] as const).map(({ val, label }) => (
                  <button key={val} onClick={() => setPaymentMethod(paymentMethod === val ? '' : val)} style={{
                    ...S.chip(paymentMethod === val),
                    padding: '8px 14px', fontSize: '13px',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
              {paymentMethod === 'schwarz' && (
                <p style={{ fontSize: '11px', color: '#2E7D32', marginTop: '6px' }}>🎁 Gesamtbetrag = 0 ₺ (gratis)</p>
              )}
            </div>

            {/* Gäste-Notiz */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', color: '#8A7A60', marginBottom: '4px' }}>📝 Notiz zu diesen Gästen</div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Allergie, Besonderheit, Wunsch…" rows={2} style={{
                width: '100%', background: note ? '#FFF8EC' : '#FFFFFF',
                border: `1px solid ${note ? '#E8C878' : '#E5E0D8'}`,
                borderRadius: '8px', padding: '9px 11px', color: '#1A1207',
                fontSize: '13px', resize: 'none', outline: 'none',
              }} />
            </div>
          </div>
        )}

        {/* Gäste-Metadaten */}
        <div style={{ marginBottom: '16px' }}>
          <button onClick={() => setShowGuest(!showGuest)} style={{
            background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '10px',
            padding: '10px 14px', width: '100%', textAlign: 'left', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '13px', color: '#8A7A60',
          }}>
            <span>👥 Gäste-Infos {(guestOrigin || ageGroup || partySize || groupType || guestCountry || guestSource || guestNotes) ? '✓' : '(optional)'}</span>
            <span>{showGuest ? '▼' : '▶'}</span>
          </button>
          {showGuest && (
            <div style={{ ...S.card, marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '6px' }}>Art der Gruppe</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                  {([
                    ['couple',   '👫 Pärchen'],
                    ['family',   '👨‍👩‍👧 Familie'],
                    ['single',   '🧍 Single'],
                    ['friends',  '🎉 Freunde'],
                    ['business', '💼 Business'],
                  ] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setGroupType(groupType === val ? '' : val)} style={S.chip(groupType === val)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '6px' }}>Mit Kindern</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                  {([
                    ['kleinkind',   '👶 Kleinkind'],
                    ['kinder',      '👧 Kinder'],
                    ['jugendliche', '🧒 Jugendliche'],
                  ] as const).map(([val, label]) => {
                    const active = childrenInfo.includes(val)
                    return (
                      <button key={val} onClick={() => setChildrenInfo(prev =>
                        active ? prev.filter(v => v !== val) : [...prev, val]
                      )} style={S.chip(active)}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '6px' }}>Herkunft</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                  {([
                    ['tourist_foreign',  '🌍 Auslands-Tourist'],
                    ['tourist_domestic', '🇹🇷 Inlands-Tourist'],
                    ['local',            '🏠 Einheimisch'],
                  ] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setGuestOrigin(guestOrigin === val ? '' : val)} style={S.chip(guestOrigin === val)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '6px' }}>Altersgruppe</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                  {(['unter 30', '30–50', 'über 50'] as const).map(ag => (
                    <button key={ag} onClick={() => setAgeGroup(ageGroup === ag ? '' : ag)} style={S.chip(ageGroup === ag)}>
                      {ag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '6px' }}>Personen</label>
                <input type="number" value={partySize} onChange={e => setPartySize(e.target.value)} placeholder="z.B. 3" min="1" max="20" style={{
                  background: '#F5F2EC', border: '1px solid #E5E0D8', borderRadius: '8px',
                  padding: '8px 12px', width: '100px', fontSize: '14px', color: '#1A1207', outline: 'none',
                }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '6px' }}>🌍 Herkunftsland</label>
                <input type="text" value={guestCountry} onChange={e => setGuestCountry(e.target.value)}
                  placeholder="z.B. Deutschland, Österreich…"
                  style={{ width: '100%', background: '#F5F2EC', border: `1px solid ${guestCountry ? '#B8882A' : '#E5E0D8'}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#1A1207', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '6px' }}>📣 Wie aufmerksam geworden?</label>
                <input type="text" value={guestSource} onChange={e => setGuestSource(e.target.value)}
                  placeholder="z.B. Google, Instagram, Empfehlung…"
                  style={{ width: '100%', background: '#F5F2EC', border: `1px solid ${guestSource ? '#B8882A' : '#E5E0D8'}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#1A1207', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '6px' }}>📝 Weitere Notizen</label>
                <textarea value={guestNotes} onChange={e => setGuestNotes(e.target.value)}
                  placeholder="Alles weitere zu diesen Gästen…" rows={2}
                  style={{ width: '100%', background: '#F5F2EC', border: `1px solid ${guestNotes ? '#B8882A' : '#E5E0D8'}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#1A1207', outline: 'none', resize: 'none' }} />
              </div>

              {existingOrder && (
                <button onClick={saveGuestMeta} style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
                  ✓ Gäste-Infos speichern
                </button>
              )}
            </div>
          )}
        </div>

        {/* Aktionen bestehende Bestellung */}
        {existingOrder && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button onClick={fetchAndShowMove} disabled={movingTable} style={{
              background: '#F5F2EC', border: '1px solid #E5E0D8', color: '#5A5040',
              padding: '13px 14px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer',
            }}>
              🔀 Tisch
            </button>
            <button onClick={closeOrder} disabled={saving} style={{
              flex: 1, background: '#FFF0F0', border: '1px solid #FFCDD2', color: '#C62828',
              padding: '13px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontWeight: '700',
            }}>✕ Abschließen</button>
          </div>
        )}
      </div>

      {/* Tisch-Verschieben Modal */}
      {showMoveTo && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
          display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setShowMoveTo(false)}>
          <div style={{
            background: '#FFFDF9', borderRadius: '16px 16px 0 0', padding: '20px 16px',
            width: '100%', maxWidth: '480px', margin: '0 auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#B8882A', marginBottom: '14px' }}>
              🔀 Auf welchen Tisch verschieben?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxHeight: '60dvh', overflowY: 'auto' }}>
              {allTables.map(t => (
                <button key={t.id} onClick={() => moveToTable(t.id)} style={{
                  background: '#FFF8EC', border: '2px solid #E8C878', borderRadius: '12px',
                  padding: '14px 6px', textAlign: 'center', cursor: 'pointer',
                }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#B8882A' }}>
                    {t.location === 'takeaway' ? '🥡' : t.location === 'privat' ? '🏠' : t.label}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8A7A60', marginTop: '3px' }}>
                    {t.location === 'outside' ? 'Außen' : t.location === 'inside' ? 'Innen' : t.location === 'takeaway' ? 'TakeAway' : 'Privat'}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowMoveTo(false)} style={{
              marginTop: '14px', width: '100%', background: '#F5F2EC', border: '1px solid #E5E0D8',
              color: '#8A7A60', padding: '12px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer',
            }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      {totalCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 'calc(56px + env(safe-area-inset-bottom))', left: 0, right: 0,
          background: '#FFFDF9', borderTop: `2px solid ${saved ? '#4CAF50' : '#B8882A'}`,
          padding: '12px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', zIndex: 1001,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
          transition: 'border-color 0.3s',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#8A7A60' }}>
              {isPrivat ? '🏠 Privat' : `Tisch ${table.label}`}
              {paymentMethod === 'card'         && '  ·  💳 Karte'}
              {paymentMethod === 'cash'         && '  ·  💵 Bar'}
              {paymentMethod === 'friends_card' && '  ·  👫 Freunde (Karte)'}
              {paymentMethod === 'schwarz_bar'  && '  ·  🤝 Freunde (Bar)'}
              {paymentMethod === 'schwarz'      && '  ·  🎁 Freunde (gratis)'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#B8882A' }}>{totalCount}</span>
              <span style={{ fontSize: '12px', color: '#8A7A60' }}>Art. ·</span>
              {isGratis ? (
                <>
                  <span style={{ fontSize: '12px', color: '#8A7A60', textDecoration: 'line-through' }}>{grossPrice} ₺</span>
                  <span style={{ fontSize: '17px', fontWeight: '800', color: '#2E7D32' }}>0 ₺</span>
                </>
              ) : (
                <>
                  {(discount > 0 || discountAmount > 0) && (
                    <span style={{ fontSize: '12px', color: '#8A7A60', textDecoration: 'line-through' }}>{chargeableBase} ₺</span>
                  )}
                  <span style={{ fontSize: '17px', fontWeight: '800', color: '#1A1207' }}>{displayTotal} ₺</span>
                  {houseTotal > 0 && (
                    <span style={{ fontSize: '11px', color: '#2E7D32' }}>+{houseTotal} ₺ 🎁</span>
                  )}
                </>
              )}
            </div>
          </div>
          <button onClick={saveOrder} disabled={saving} style={{
            ...S.goldBtn,
            background: saved ? '#4CAF50' : '#B8882A',
            opacity: saving ? 0.6 : 1,
            transition: 'background 0.3s',
          }}>
            {saving ? 'Speichert…' : saved ? '✓ Gespeichert' : 'Speichern'}
          </button>
        </div>
      )}
    </div>
  )
}
