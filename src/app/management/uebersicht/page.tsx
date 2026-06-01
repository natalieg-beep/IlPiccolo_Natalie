import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function UebersichtPage() {
  const supabase = await createClient()

  // Heute (Türkei = UTC+3)
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const { data: orders } = await supabase
    .from('orders')
    .select('*, tables(label, location), order_items(*)')
    .gte('opened_at', todayStart.toISOString())
    .lte('opened_at', todayEnd.toISOString())
    .order('opened_at', { ascending: false })

  const allOrders = orders ?? []

  const totalRevenue = allOrders.reduce((sum, o) =>
    sum + (o.order_items ?? []).reduce((s: number, i: { unit_price: number; qty: number }) =>
      s + i.unit_price * i.qty, 0), 0)

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    open:        { label: 'Offen',       color: '#2E7D32', bg: '#F0FAF0' },
    transferred: { label: 'Übertragen',  color: '#1565C0', bg: '#EEF4FF' },
    closed:      { label: 'Abgeschlossen', color: '#8A7A60', bg: '#F5F2EC' },
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F4F0' }}>
      {/* Header */}
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div>
          <h1 style={{ fontSize: '17px', fontWeight: '700', color: '#B8882A' }}>📊 Tagesübersicht</h1>
          <p style={{ fontSize: '11px', color: '#8A7A60' }}>
            {now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/management">
          <button style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '7px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
        </Link>
      </div>

      <div style={{ padding: '16px', maxWidth: '700px', margin: '0 auto' }}>

        {/* Zusammenfassung */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Bestellungen', value: allOrders.length, unit: '' },
            { label: 'Tische bedient', value: new Set(allOrders.map(o => o.table_id)).size, unit: '' },
            { label: 'Umsatz gesamt', value: totalRevenue.toLocaleString('de-DE'), unit: ' ₺' },
          ].map(s => (
            <div key={s.label} style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px', padding: '14px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#B8882A' }}>{s.value}{s.unit}</div>
              <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bestellungen */}
        {allOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A7A60' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍕</div>
            <p>Noch keine Bestellungen heute</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {allOrders.map(order => {
              const items = order.order_items ?? []
              const subtotal = items.reduce((s: number, i: { unit_price: number; qty: number }) => s + i.unit_price * i.qty, 0)
              const st = statusLabel[order.status] ?? statusLabel.closed
              const time = new Date(order.opened_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

              return (
                <div key={order.id} style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  {/* Tisch-Header */}
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0EDE8', background: '#FAFAF8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: '#B8882A' }}>
                        Tisch {order.tables?.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#8A7A60' }}>
                        {order.tables?.location === 'outside' ? 'Außen' : 'Innen'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#8A7A60' }}>· {time} Uhr</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: st.bg, color: st.color, fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px' }}>
                        {st.label}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#B8882A' }}>{subtotal} ₺</span>
                    </div>
                  </div>

                  {/* Artikel */}
                  <div style={{ padding: '8px 14px' }}>
                    {items.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#8A7A60', padding: '4px 0' }}>Keine Artikel</p>
                    ) : (
                      items.map((item: { id: string; name: string; qty: number; unit_price: number }) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '13px', borderBottom: '1px solid #F5F2EC' }}>
                          <span style={{ color: '#1A1207' }}>{item.name} <span style={{ color: '#8A7A60' }}>×{item.qty}</span></span>
                          <span style={{ color: '#B8882A', fontWeight: '600' }}>{item.unit_price * item.qty} ₺</span>
                        </div>
                      ))
                    )}
                    {order.note && (
                      <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '6px', fontStyle: 'italic' }}>📝 {order.note}</p>
                    )}
                    {(order.guest_origin || order.party_size || order.age_group) && (
                      <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '4px' }}>
                        👥 {[order.party_size && `${order.party_size} Pers.`, order.age_group, order.guest_origin && ({ tourist_foreign: 'Ausland', tourist_domestic: 'Inland', local: 'Einheimisch' } as Record<string, string>)[order.guest_origin]].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
