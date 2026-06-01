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
  discount_percent: number | null; payment_method: string | null; group_type: string | null
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

export default function OrderClient({ table, existingOrder }: { table: Table; existingOrder: Order | null }) {
  const router  = useRouter()
  const supabase = createClient()

  // ── Bestellung ──────────────────────────────────────────────────
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [items, setItems] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    existingOrder?.order_items.forEach(i => { m[i.name] = i.qty })
    return m
  })
  const [onTheHouse, setOnTheHouse] = useState<Set<string>>(() => {
    const s = new Set<string>()
    existingOrder?.order_items.filter(i => i.on_the_house).forEach(i => s.add(i.name))
    return s
  })
  const [saving, setSaving] = useState(false)

  // ── Rabatt & Zahlung ─────────────────────────────────────────────
  const [discount,       setDiscount]       = useState(existingOrder?.discount_percent ?? 0)
  const [customDiscount, setCustomDiscount] = useState('')
  const [paymentMethod,  setPaymentMethod]  = useState(existingOrder?.payment_method ?? '')

  // ── Notiz ────────────────────────────────────────────────────────
  const [note,     setNote]     = useState(existingOrder?.note ?? '')
  const [showNote, setShowNote] = useState(false)

  // ── Gäste ────────────────────────────────────────────────────────
  const [showGuest,   setShowGuest]   = useState(false)
  const [guestOrigin, setGuestOrigin] = useState(existingOrder?.guest_origin ?? '')
  const [ageGroup,    setAgeGroup]    = useState(existingOrder?.age_group ?? '')
  const [partySize,   setPartySize]   = useState(existingOrder?.party_size?.toString() ?? '')
  const [groupType,   setGroupType]   = useState(existingOrder?.group_type ?? '')

  // ── Berechnungen ─────────────────────────────────────────────────
  const totalCount     = Object.values(items).reduce((a, b) => a + b, 0)
  const grossPrice     = Object.entries(items).reduce((sum, [name, qty]) =>
    sum + (MENU.find(m => m.name === name)?.price ?? 0) * qty, 0)
  const houseTotal     = Object.entries(items).reduce((sum, [name, qty]) =>
    onTheHouse.has(name) ? sum + (MENU.find(m => m.name === name)?.price ?? 0) * qty : sum, 0)
  const chargeableBase = grossPrice - houseTotal
  const totalPrice     = Math.round(chargeableBase * (1 - discount / 100))

  // ── Hilfsfunktionen ──────────────────────────────────────────────
  function toggleOnTheHouse(name: string) {
    setOnTheHouse(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function changeQty(name: string, delta: number) {
    setItems(prev => {
      const val = Math.max(0, (prev[name] ?? 0) + delta)
      if (val === 0) {
        const n = { ...prev }; delete n[name]
        setOnTheHouse(s => { const ns = new Set(s); ns.delete(name); return ns })
        return n
      }
      return { ...prev, [name]: val }
    })
  }

  function applyDiscount(d: number) {
    setDiscount(d)
    setCustomDiscount('')
  }

  // ── Speichern ────────────────────────────────────────────────────
  async function saveOrder() {
    setSaving(true)
    const entries = Object.entries(items)
    if (entries.length === 0) { setSaving(false); return }

    let orderId = existingOrder?.id
    const meta = {
      note: note || null, guest_origin: guestOrigin || null,
      age_group: ageGroup || null, party_size: partySize ? parseInt(partySize) : null,
      discount_percent: discount || null, payment_method: paymentMethod || null,
      group_type: groupType || null,
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
    await supabase.from('order_items').insert(
      entries.map(([name, qty]) => ({
        order_id: orderId, name, qty,
        unit_price: MENU.find(m => m.name === name)?.price ?? 0,
        on_the_house: onTheHouse.has(name),
      }))
    )
    router.push('/service')
    router.refresh()
  }

  async function saveGuestMeta() {
    if (!existingOrder?.id) return
    await supabase.from('orders').update({
      guest_origin: guestOrigin || null, age_group: ageGroup || null,
      party_size: partySize ? parseInt(partySize) : null,
      note: note || null, group_type: groupType || null,
    }).eq('id', existingOrder.id)
    setShowGuest(false)
  }

  async function markTransferred() {
    if (!existingOrder?.id) return
    setSaving(true)
    await supabase.from('orders').update({
      status: 'transferred', closed_at: new Date().toISOString(),
      discount_percent: discount || null, payment_method: paymentMethod || null,
    }).eq('id', existingOrder.id)
    router.push('/service')
    router.refresh()
  }

  async function closeOrder() {
    if (!existingOrder?.id) return
    if (!confirm('Bestellung schließen?')) return
    setSaving(true)
    await supabase.from('orders').update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', existingOrder.id)
    router.push('/service')
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
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '120px', background: '#F7F4F0', minHeight: '100dvh' }}>

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#B8882A' }}>Tisch {table.label}</div>
          <div style={{ fontSize: '11px', color: '#8A7A60' }}>
            {table.location === 'outside' ? 'Außen' : 'Innen'}
            {existingOrder ? ' · Bestellung offen' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/service/phrasen">
            <button style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '7px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
              🇹🇷 Phrasen
            </button>
          </Link>
          <button onClick={() => router.push('/service')} style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '8px 14px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
            ← Tische
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* Kategorien */}
        <p style={S.label}>Kategorie</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
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

            {/* Artikel-Liste mit 🎁-Button */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px', overflow: 'hidden' }}>
              {Object.entries(items).map(([name, qty], i, arr) => {
                const price   = (MENU.find(m => m.name === name)?.price ?? 0) * qty
                const isHouse = onTheHouse.has(name)
                return (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', padding: '9px 12px',
                    borderBottom: i < arr.length - 1 ? '1px solid #F0EDE8' : 'none',
                    background: isHouse ? '#F0FAF0' : undefined,
                  }}>
                    <span style={{ flex: 1, fontSize: '14px', color: '#1A1207' }}>
                      {name} <span style={{ color: '#8A7A60' }}>×{qty}</span>
                    </span>
                    {/* Aufs-Haus Toggle */}
                    <button onClick={() => toggleOnTheHouse(name)} title="Aufs Haus" style={{
                      background: isHouse ? '#2E7D32' : '#F5F2EC',
                      border: `1px solid ${isHouse ? '#2E7D32' : '#E5E0D8'}`,
                      borderRadius: '6px', padding: '3px 8px', fontSize: '13px',
                      cursor: 'pointer', marginRight: '8px', lineHeight: 1,
                    }}>🎁</button>
                    <span style={{
                      fontSize: isHouse ? '12px' : '14px',
                      fontWeight: '600',
                      color: isHouse ? '#2E7D32' : '#B8882A',
                      textDecoration: isHouse ? 'line-through' : 'none',
                    }}>
                      {price} ₺{isHouse ? ' gratis' : ''}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Rabatt */}
            <div style={{ ...S.card, marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: '#8A7A60', fontWeight: '600', marginBottom: '8px' }}>🏷️ İndirim / Rabatt</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
                {[0, 10, 20, 50].map(d => (
                  <button key={d} onClick={() => applyDiscount(d)} style={{
                    ...S.chip(discount === d && !customDiscount),
                    padding: '7px 13px', fontSize: '13px',
                  }}>
                    {d === 0 ? 'Kein' : `${d} %`}
                  </button>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number" min="1" max="99" placeholder="%" value={customDiscount}
                    onChange={e => { setCustomDiscount(e.target.value); setDiscount(parseInt(e.target.value) || 0) }}
                    style={{
                      background: '#F5F2EC', border: `1px solid ${customDiscount ? '#B8882A' : '#E5E0D8'}`,
                      borderRadius: '8px', padding: '7px 10px', width: '60px', fontSize: '13px',
                      color: '#1A1207', outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#8A7A60' }}>%</span>
                </div>
              </div>
              {discount > 0 && (
                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#8A7A60', textDecoration: 'line-through' }}>{chargeableBase} ₺</span>
                  <span style={{ color: '#1A1207' }}> → </span>
                  <span style={{ fontWeight: '700', color: '#B8882A' }}>{totalPrice} ₺</span>
                  <span style={{ color: '#2E7D32', marginLeft: '6px' }}>−{discount} %</span>
                </div>
              )}
            </div>

            {/* Zahlungsart */}
            <div style={{ ...S.card, marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: '#8A7A60', fontWeight: '600', marginBottom: '8px' }}>💳 Zahlungsart</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {([
                  { val: 'card',    label: '💳 Karte' },
                  { val: 'cash',    label: '💵 Bar' },
                  { val: 'schwarz', label: '🤝 Freunde / Familie' },
                ] as const).map(({ val, label }) => (
                  <button key={val} onClick={() => setPaymentMethod(paymentMethod === val ? '' : val)} style={{
                    ...S.chip(paymentMethod === val),
                    padding: '8px 14px', fontSize: '13px',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tischnotiz */}
            <button onClick={() => setShowNote(!showNote)} style={{ background: 'none', border: 'none', color: '#8A7A60', fontSize: '12px', cursor: 'pointer', marginTop: '10px', padding: '0' }}>
              {showNote ? '▼' : '▶'} Tischnotiz {note && '✓'}
            </button>
            {showNote && (
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Notiz (optional)" rows={2} style={{
                width: '100%', background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px',
                padding: '10px', color: '#1A1207', fontSize: '14px', marginTop: '8px', resize: 'none', outline: 'none',
              }} />
            )}
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
            <span>👥 Gäste-Infos {(guestOrigin || ageGroup || partySize || groupType) ? '✓' : '(optional)'}</span>
            <span>{showGuest ? '▼' : '▶'}</span>
          </button>
          {showGuest && (
            <div style={{ ...S.card, marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Gruppentyp */}
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

              {/* Herkunft */}
              <div>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '6px' }}>Herkunft</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                  {([
                    ['tourist_foreign',   '🌍 Auslands-Tourist'],
                    ['tourist_domestic',  '🇹🇷 Inlands-Tourist'],
                    ['local',             '🏠 Einheimisch'],
                  ] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setGuestOrigin(guestOrigin === val ? '' : val)} style={S.chip(guestOrigin === val)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Altersgruppe */}
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

              {/* Personenzahl */}
              <div>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '6px' }}>Personen</label>
                <input type="number" value={partySize} onChange={e => setPartySize(e.target.value)} placeholder="z.B. 3" min="1" max="20" style={{
                  background: '#F5F2EC', border: '1px solid #E5E0D8', borderRadius: '8px',
                  padding: '8px 12px', width: '100px', fontSize: '14px', color: '#1A1207', outline: 'none',
                }} />
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
            <button onClick={markTransferred} disabled={saving} style={{
              flex: 1, background: '#EEF4FF', border: '1px solid #90CAF9', color: '#1565C0',
              padding: '13px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontWeight: '700',
            }}>
              ✓ Ins Menulux übertragen
            </button>
            <button onClick={closeOrder} disabled={saving} style={{
              background: '#FFF0F0', border: '1px solid #FFCDD2', color: '#C62828',
              padding: '13px 16px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontWeight: '700',
            }}>✕</button>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {totalCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#FFFDF9', borderTop: '2px solid #B8882A',
          padding: '12px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', zIndex: 100,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#8A7A60' }}>
              Tisch {table.label}
              {paymentMethod === 'card'    && '  ·  💳 Karte'}
              {paymentMethod === 'cash'    && '  ·  💵 Bar'}
              {paymentMethod === 'schwarz' && '  ·  🤝 Freunde'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#B8882A' }}>{totalCount}</span>
              <span style={{ fontSize: '12px', color: '#8A7A60' }}>Art. ·</span>
              {discount > 0 && (
                <span style={{ fontSize: '12px', color: '#8A7A60', textDecoration: 'line-through' }}>{chargeableBase} ₺</span>
              )}
              <span style={{ fontSize: '17px', fontWeight: '800', color: '#1A1207' }}>{totalPrice} ₺</span>
              {houseTotal > 0 && (
                <span style={{ fontSize: '11px', color: '#2E7D32' }}>+{houseTotal} ₺ 🎁</span>
              )}
            </div>
          </div>
          <button onClick={saveOrder} disabled={saving} style={{ ...S.goldBtn, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Speichert…' : 'Speichern →'}
          </button>
        </div>
      )}
    </div>
  )
}
