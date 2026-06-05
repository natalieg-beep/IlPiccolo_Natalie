'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

type OrderItem = { id: string; name: string; qty: number; unit_price: number; on_the_house: boolean }
type Order = {
  id: string; status: string; note: string | null; opened_at: string
  guest_origin: string | null; age_group: string | null; party_size: number | null
  group_type: string | null; children_info: string | null
  guest_country: string | null; guest_source: string | null; guest_notes: string | null
  discount_percent: number | null; discount_amount: number | null; payment_method: string | null
  tables: { label: string; location: string } | null
  order_items: OrderItem[]
}

const payLabel: Record<string, string> = {
  card: '💳 Karte', cash: '💵 Bar',
  friends_card: '👫 Freunde (Karte)',
  schwarz_bar: '🤝 Freunde (Bar)', schwarz: '🎁 Freunde (gratis)',
}
const childrenLabel: Record<string, string> = { kleinkind: '👶', kinder: '👧', jugendliche: '🧒' }
const groupLabel: Record<string, string> = {
  couple: '👫 Pärchen', family: '👨‍👩‍👧 Familie', single: '🧍 Single',
  friends: '🎉 Freunde', business: '💼 Business',
}
const originLabel: Record<string, string> = {
  tourist_foreign: 'Ausland', tourist_domestic: 'Inland', local: 'Einheimisch',
}
const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Offen',         color: '#2E7D32', bg: '#F0FAF0' },
  transferred: { label: 'Übertragen',    color: '#1565C0', bg: '#EEF4FF' },
  closed:      { label: 'Abgeschlossen', color: '#8A7A60', bg: '#F5F2EC' },
}

function orderRevenue(o: Order) {
  // Privat und Freunde gratis zählen nicht zum offiziellen Umsatz
  if (o.payment_method === 'schwarz' || o.tables?.location === 'privat') return 0
  const base = (o.order_items ?? []).reduce((s, i) => i.on_the_house ? s : s + i.unit_price * i.qty, 0)
  const afterPercent = Math.round(base * (1 - (o.discount_percent ?? 0) / 100))
  return Math.max(0, afterPercent - ((o as Order & { discount_amount?: number }).discount_amount ?? 0))
}
function orderGross(o: Order) {
  return (o.order_items ?? []).reduce((s, i) => i.on_the_house ? s : s + i.unit_price * i.qty, 0)
}

// Date helpers
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function UebersichtClient({
  initialOrders, date,
}: {
  initialOrders: Order[]
  date: string
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [orders,   setOrders]   = useState<Order[]>(initialOrders)
  const [deleting, setDeleting] = useState<string | null>(null)

  // ── Tagesabschluss ───────────────────────────────────────────────
  const [beko,             setBeko]             = useState('')
  const [menulux,          setMenulux]          = useState('')
  const [entnahmePrivat,       setEntnahmePrivat]       = useState('')
  const [entnahmeGeschaeft,    setEntnahmeGeschaeft]    = useState('')
  const [entnahmePrivatNote,   setEntnahmePrivatNote]   = useState('')
  const [entnahmeGeschaeftNote,setEntnahmeGeschaeftNote]= useState('')
  const [abschlussId, setAbschlussId] = useState<Record<string, string>>({})
  const [abschlussSaved, setAbschlussSaved] = useState(false)

  useEffect(() => {
    supabase.from('daily_entries').select('*').eq('date', date)
      .in('entry_type', ['beko_total', 'menulux_total', 'entnahme_privat', 'entnahme_geschaeft'])
      .then(({ data }) => {
        data?.forEach(e => {
          if (e.entry_type === 'beko_total')          setBeko(e.amount?.toString() ?? '')
          if (e.entry_type === 'menulux_total')        setMenulux(e.amount?.toString() ?? '')
          if (e.entry_type === 'entnahme_privat')    { setEntnahmePrivat(e.amount?.toString() ?? ''); setEntnahmePrivatNote(e.note ?? '') }
          if (e.entry_type === 'entnahme_geschaeft') { setEntnahmeGeschaeft(e.amount?.toString() ?? ''); setEntnahmeGeschaeftNote(e.note ?? '') }
          setAbschlussId(p => ({ ...p, [e.entry_type]: e.id }))
        })
      })
  }, [date])

  async function saveAbschluss() {
    async function upsertEntry(type: string, amount: number, note?: string) {
      const existingId = abschlussId[type]
      const payload: Record<string, unknown> = { amount }
      if (note !== undefined) payload.note = note || null
      if (existingId) {
        await supabase.from('daily_entries').update(payload).eq('id', existingId)
        return existingId
      } else {
        const { data } = await supabase.from('daily_entries').insert({ date, entry_type: type, ...payload }).select('id').single()
        return data?.id
      }
    }
    const results = await Promise.all([
      upsertEntry('beko_total',        parseInt(beko)              || 0),
      upsertEntry('menulux_total',     parseInt(menulux)           || 0),
      upsertEntry('entnahme_privat',   parseInt(entnahmePrivat)    || 0, entnahmePrivatNote),
      upsertEntry('entnahme_geschaeft',parseInt(entnahmeGeschaeft) || 0, entnahmeGeschaeftNote),
    ])
    const types = ['beko_total', 'menulux_total', 'entnahme_privat', 'entnahme_geschaeft']
    const newIds: Record<string, string> = {}
    results.forEach((id, i) => { if (id) newIds[types[i]] = id })
    setAbschlussId(p => ({ ...p, ...newIds }))
    setAbschlussSaved(true)
    setTimeout(() => setAbschlussSaved(false), 2000)
  }

  const today = new Date().toISOString().slice(0, 10)
  const isToday = date === today

  const totalRevenue = orders.reduce((s, o) => s + orderRevenue(o), 0)
  const schwarzTotal = orders
    .filter(o => (o.payment_method === 'schwarz' || o.payment_method === 'schwarz_bar') && o.tables?.location !== 'privat')
    .reduce((s, o) => s + orderGross(o), 0)

  async function deleteOrder(id: string) {
    if (!confirm('Bestellung wirklich löschen?')) return
    setDeleting(id)
    await supabase.from('order_items').delete().eq('order_id', id)
    await supabase.from('orders').delete().eq('id', id)
    setOrders(prev => prev.filter(o => o.id !== id))
    setDeleting(null)
  }

  function exportXlsx() {
    const rows: Record<string, string | number>[] = []
    orders.forEach(o => {
      const time = new Date(o.opened_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      ;(o.order_items ?? []).forEach(item => {
        rows.push({
          Datum: date,
          Uhrzeit: time,
          Tisch: o.tables?.label ?? '',
          Ort: o.tables?.location === 'outside' ? 'Außen' : 'Innen',
          Status: statusLabel[o.status]?.label ?? o.status,
          Artikel: item.name,
          Menge: item.qty,
          Einzelpreis: item.unit_price,
          Gesamt: item.unit_price * item.qty,
          'Aufs Haus': item.on_the_house ? 'Ja' : '',
          Rabatt: o.discount_percent ? `${o.discount_percent}%` : '',
          Zahlung: payLabel[o.payment_method ?? ''] ?? '',
          Gruppe: groupLabel[o.group_type ?? ''] ?? '',
          Personen: o.party_size ?? '',
          Herkunft: originLabel[o.guest_origin ?? ''] ?? '',
          Notiz: o.note ?? '',
        })
      })
      if ((o.order_items ?? []).length === 0) {
        rows.push({
          Datum: date, Uhrzeit: time, Tisch: o.tables?.label ?? '',
          Ort: o.tables?.location === 'outside' ? 'Außen' : 'Innen',
          Status: statusLabel[o.status]?.label ?? o.status,
          Artikel: '', Menge: 0, Einzelpreis: 0, Gesamt: 0,
          'Aufs Haus': '', Rabatt: '', Zahlung: payLabel[o.payment_method ?? ''] ?? '',
          Gruppe: '', Personen: '', Herkunft: '', Notiz: o.note ?? '',
        })
      }
    })

    const ws  = XLSX.utils.json_to_sheet(rows)
    const wb  = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, date)
    XLSX.writeFile(wb, `IlPiccoloN_${date}.xlsx`)
  }

  function printPage() { window.print() }

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F4F0' }} className="uebersicht-page">

      {/* Header */}
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '700', color: '#B8882A' }}>📊 Tagesübersicht</h1>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={exportXlsx} style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
              📥 XLSX
            </button>
            <button onClick={printPage} style={{ background: '#EEF4FF', border: '1px solid #90CAF9', color: '#1565C0', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
              🖨️ PDF
            </button>
            <Link href="/management">
              <button style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>← Back</button>
            </Link>
          </div>
        </div>

        {/* Datum-Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/management/uebersicht?date=${addDays(date, -1)}`}>
            <button style={{ background: '#F5F2EC', border: '1px solid #E5E0D8', color: '#5A5040', padding: '5px 10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>←</button>
          </Link>
          <span style={{ flex: 1, textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#1A1207' }}>
            {formatDate(date)}
          </span>
          <Link href={`/management/uebersicht?date=${addDays(date, 1)}`}>
            <button
              style={{ background: '#F5F2EC', border: '1px solid #E5E0D8', color: isToday ? '#D0C8BE' : '#5A5040', padding: '5px 10px', borderRadius: '8px', fontSize: '13px', cursor: isToday ? 'default' : 'pointer', opacity: isToday ? 0.4 : 1 }}
              disabled={isToday}
            >→</button>
          </Link>
          {!isToday && (
            <Link href={`/management/uebersicht?date=${today}`}>
              <button style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Heute</button>
            </Link>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: '700px', margin: '0 auto' }}>

        {/* Zusammenfassung */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
          {[
            { label: 'Bestellungen',          value: orders.length,                             unit: '' },
            { label: 'Tische bedient',         value: new Set(orders.map(o => o.tables?.label)).size, unit: '' },
            { label: 'Umsatz offiziell',       value: totalRevenue.toLocaleString('de-DE'),     unit: ' ₺' },
            { label: 'Freunde/Fam. (schwarz)', value: schwarzTotal.toLocaleString('de-DE'),     unit: ' ₺' },
          ].map(s => (
            <div key={s.label} style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#B8882A' }}>{s.value}{s.unit}</div>
              <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bestellungen */}
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A7A60' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍕</div>
            <p>Keine Bestellungen für diesen Tag</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.map(order => {
              const items   = order.order_items ?? []
              const gross   = items.reduce((s, i) => s + i.unit_price * i.qty, 0)
              const houseAmt = items.filter(i => i.on_the_house).reduce((s, i) => s + i.unit_price * i.qty, 0)
              const charged = orderRevenue(order)
              const st      = statusLabel[order.status] ?? statusLabel.closed
              const time    = new Date(order.opened_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
              const isPrivatOrder = order.tables?.location === 'privat'
              const isSchwarz = (order.payment_method === 'schwarz' || order.payment_method === 'schwarz_bar') && !isPrivatOrder
              const childrenChips = (order.children_info ?? '').split(',').filter(Boolean).map(v => childrenLabel[v] ?? '').join(' ')

              return (
                <div key={order.id} style={{
                  background: '#FFFFFF', border: `1px solid ${isSchwarz ? '#A5D6A7' : '#E5E0D8'}`,
                  borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  opacity: deleting === order.id ? 0.4 : 1, transition: 'opacity 0.2s',
                }}>
                  {/* Header */}
                  <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0EDE8', background: isSchwarz ? '#F0FAF0' : '#FAFAF8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#B8882A' }}>Tisch {order.tables?.label}</span>
                      <span style={{ fontSize: '11px', color: '#8A7A60' }}>
                        {order.tables?.location === 'outside' ? 'Außen' : order.tables?.location === 'inside' ? 'Innen' : order.tables?.location === 'takeaway' ? '🥡' : order.tables?.location === 'privat' ? '🏠 Privat' : ''}
                      </span>
                      <span style={{ fontSize: '11px', color: '#8A7A60' }}>· {time} Uhr</span>
                      {order.payment_method && (
                        <span style={{ fontSize: '11px', color: isSchwarz ? '#2E7D32' : '#5A5040', fontWeight: '600' }}>
                          {payLabel[order.payment_method] ?? order.payment_method}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ background: st.bg, color: st.color, fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', display: 'block', marginBottom: '2px' }}>{st.label}</span>
                        {(order.discount_percent || houseAmt > 0) && (
                          <div style={{ fontSize: '10px', color: '#8A7A60', textDecoration: 'line-through', textAlign: 'right' }}>{gross} ₺</div>
                        )}
                        <span style={{ fontSize: '14px', fontWeight: '700', color: isSchwarz ? '#2E7D32' : '#B8882A' }}>
                          {isSchwarz ? `${gross} ₺ 🤝` : `${charged} ₺`}
                        </span>
                      </div>
                      <Link href={`/management/order/${order.id}`}>
                        <button style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '7px 9px', borderRadius: '7px', fontSize: '14px', cursor: 'pointer' }}>✏️</button>
                      </Link>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        disabled={deleting === order.id}
                        style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', color: '#C62828', padding: '7px 9px', borderRadius: '7px', fontSize: '14px', cursor: 'pointer' }}
                      >🗑️</button>
                    </div>
                  </div>

                  {/* Artikel */}
                  <div style={{ padding: '8px 12px' }}>
                    {items.length === 0
                      ? <p style={{ fontSize: '12px', color: '#8A7A60', padding: '3px 0' }}>Keine Artikel</p>
                      : items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '13px', borderBottom: '1px solid #F5F2EC', background: item.on_the_house ? '#F0FAF0' : undefined }}>
                          <span style={{ color: '#1A1207' }}>{item.on_the_house && '🎁 '}{item.name} <span style={{ color: '#8A7A60' }}>×{item.qty}</span></span>
                          <span style={{ color: item.on_the_house ? '#2E7D32' : '#B8882A', fontWeight: '600', textDecoration: item.on_the_house ? 'line-through' : 'none', fontSize: item.on_the_house ? '11px' : '13px' }}>
                            {item.unit_price * item.qty} ₺{item.on_the_house ? ' gratis' : ''}
                          </span>
                        </div>
                      ))
                    }
                    {(order.discount_percent ?? 0) > 0 && (
                      <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '5px' }}>🏷️ Rabatt {order.discount_percent} %</p>
                    )}
                    {(order.discount_amount ?? 0) > 0 && (
                      <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '5px' }}>🏷️ Rabatt {order.discount_amount} ₺ (fix)</p>
                    )}
                    {isPrivatOrder && (
                      <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '5px', fontStyle: 'italic' }}>🏠 Privat — nicht im Umsatz</p>
                    )}
                    {(order.guest_origin || order.age_group || order.party_size || order.group_type || order.children_info) && (
                      <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '4px' }}>
                        👥 {[
                          order.group_type && groupLabel[order.group_type],
                          childrenChips,
                          order.party_size && `${order.party_size} Pers.`,
                          order.age_group,
                          order.guest_origin && originLabel[order.guest_origin],
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {order.guest_country && <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '4px' }}>🌍 {order.guest_country}</p>}
                    {order.guest_source  && <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '2px' }}>📣 {order.guest_source}</p>}
                    {order.guest_notes   && <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '2px', fontStyle: 'italic' }}>💬 {order.guest_notes}</p>}
                    {order.note && <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '2px', fontStyle: 'italic' }}>📝 {order.note}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Tagesabschluss Link ── */}
        <Link href={`/management/tagesabschluss?date=${date}`} style={{ textDecoration: 'none' }}>
          <div style={{ marginTop: '16px', background: '#FFF8EC', border: '2px solid #B8882A', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#B8882A' }}>📋 Tagesabschluss</div>
              <div style={{ fontSize: '12px', color: '#8A7A60', marginTop: '2px' }}>Beko · Menulux · KDV · Entnahmen</div>
            </div>
            <span style={{ fontSize: '20px', color: '#B8882A' }}>→</span>
          </div>
        </Link>

        {/* ── Tagesabschluss (Detail, verborgen – jetzt eigene Seite) ── */}
        <div style={{ marginTop: '24px', background: '#FFFFFF', border: '2px solid #B8882A', borderRadius: '14px', overflow: 'hidden', display: 'none' }}>
          <div style={{ background: '#FFF8EC', padding: '12px 16px', borderBottom: '1px solid #E8C878' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#B8882A' }}>📋 Tagesabschluss</div>
            <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '2px' }}>{formatDate(date)}</div>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* App-Umsatz */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F5F2EC', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px', color: '#5A5040' }}>📱 App (offiziell)</span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#B8882A' }}>{totalRevenue.toLocaleString('de-DE')} ₺</span>
            </div>

            {/* Beko */}
            <div>
              <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '5px', fontWeight: '600' }}>🏦 Beko Einnahmen</label>
              <input
                type="number" min="0" placeholder="Betrag in ₺"
                value={beko} onChange={e => setBeko(e.target.value)}
                style={{ width: '100%', background: '#F5F2EC', border: `1px solid ${beko ? '#B8882A' : '#E5E0D8'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '15px', color: '#1A1207', outline: 'none' }}
              />
            </div>

            {/* Menulux */}
            <div>
              <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '5px', fontWeight: '600' }}>🍽️ Menulux Einnahmen</label>
              <input type="number" min="0" placeholder="Betrag in ₺" value={menulux} onChange={e => setMenulux(e.target.value)}
                style={{ width: '100%', background: '#F5F2EC', border: `1px solid ${menulux ? '#B8882A' : '#E5E0D8'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '15px', color: '#1A1207', outline: 'none' }} />
            </div>

            {/* Trennlinie */}
            <div style={{ borderTop: '1px solid #F0EDE8', paddingTop: '4px' }}>
              <div style={{ fontSize: '11px', color: '#8A7A60', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Entnahmen</div>

              {/* Privat */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '5px', fontWeight: '600' }}>🏠 Privat-Entnahme</label>
                <input type="number" min="0" placeholder="Betrag in ₺" value={entnahmePrivat} onChange={e => setEntnahmePrivat(e.target.value)}
                  style={{ width: '100%', background: '#F5F2EC', border: `1px solid ${entnahmePrivat ? '#C62828' : '#E5E0D8'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '15px', color: '#1A1207', outline: 'none', marginBottom: '5px' }} />
                <input type="text" placeholder="Notiz (optional)" value={entnahmePrivatNote} onChange={e => setEntnahmePrivatNote(e.target.value)}
                  style={{ width: '100%', background: '#F5F2EC', border: `1px solid ${entnahmePrivatNote ? '#B8882A' : '#E5E0D8'}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#1A1207', outline: 'none' }} />
              </div>

              {/* Geschäftlich */}
              <div>
                <label style={{ fontSize: '12px', color: '#8A7A60', display: 'block', marginBottom: '5px', fontWeight: '600' }}>💼 Geschäftliche Entnahme</label>
                <input type="number" min="0" placeholder="Betrag in ₺" value={entnahmeGeschaeft} onChange={e => setEntnahmeGeschaeft(e.target.value)}
                  style={{ width: '100%', background: '#F5F2EC', border: `1px solid ${entnahmeGeschaeft ? '#C62828' : '#E5E0D8'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '15px', color: '#1A1207', outline: 'none', marginBottom: '5px' }} />
                <input type="text" placeholder="Notiz (optional)" value={entnahmeGeschaeftNote} onChange={e => setEntnahmeGeschaeftNote(e.target.value)}
                  style={{ width: '100%', background: '#F5F2EC', border: `1px solid ${entnahmeGeschaeftNote ? '#B8882A' : '#E5E0D8'}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#1A1207', outline: 'none' }} />
              </div>
            </div>

            {/* Zusammenfassung */}
            {(beko || menulux || entnahmePrivat || entnahmeGeschaeft) && (() => {
              const bekoN     = parseInt(beko)              || 0
              const menuluxN  = parseInt(menulux)           || 0
              const privN     = parseInt(entnahmePrivat)    || 0
              const geschN    = parseInt(entnahmeGeschaeft) || 0
              const einnahmen = bekoN + menuluxN
              const entnahmen = privN + geschN
              const netto     = einnahmen - entnahmen
              return (
                <div style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '12px', color: '#2E7D32', fontWeight: '600', marginBottom: '8px' }}>Zusammenfassung</div>
                  {[
                    { label: '📱 App (offiziell)', value: totalRevenue,  color: '#B8882A' },
                    { label: '🏦 Beko',            value: bekoN,         color: '#1A1207' },
                    { label: '🍽️ Menulux',         value: menuluxN,      color: '#1A1207' },
                    { label: '🏠 Privat-Entnahme', value: -privN,        color: privN ? '#C62828' : '#1A1207' },
                    { label: '💼 Geschäftl. Entnahme', value: -geschN,   color: geschN ? '#C62828' : '#1A1207' },
                  ].filter(r => r.value !== 0).map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '2px 0' }}>
                      <span style={{ color: '#5A5040' }}>{r.label}</span>
                      <span style={{ fontWeight: '600', color: r.color }}>{r.value > 0 ? '' : '−'}{Math.abs(r.value).toLocaleString('de-DE')} ₺</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #A5D6A7' }}>
                    <span style={{ color: netto >= 0 ? '#2E7D32' : '#C62828' }}>Netto</span>
                    <span style={{ color: netto >= 0 ? '#2E7D32' : '#C62828' }}>{netto.toLocaleString('de-DE')} ₺</span>
                  </div>
                  {(beko || menulux) && (
                    <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '5px' }}>
                      Differenz App ↔ Kasse: {Math.abs(totalRevenue - einnahmen).toLocaleString('de-DE')} ₺
                    </div>
                  )}
                </div>
              )
            })()}

            <button onClick={saveAbschluss} style={{
              background: '#B8882A', color: '#FFFFFF', border: 'none',
              borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            }}>
              {abschlussSaved ? '✓ Gespeichert!' : '💾 Tagesabschluss speichern'}
            </button>
          </div>
        </div>
      </div>

      {/* Print-Styles */}
      <style>{`
        @media print {
          .uebersicht-page button, .uebersicht-page a button { display: none !important; }
          .uebersicht-page { background: white !important; }
        }
      `}</style>
    </div>
  )
}
