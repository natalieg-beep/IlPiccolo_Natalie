import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function UebersichtPage() {
  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999)

  const { data: orders } = await supabase
    .from('orders')
    .select('*, tables(label, location), order_items(*)')
    .gte('opened_at', todayStart.toISOString())
    .lte('opened_at', todayEnd.toISOString())
    .order('opened_at', { ascending: false })

  const allOrders = orders ?? []

  // Umsatz = nur bezahlte (nicht schwarz), abzüglich Aufs-Haus, mit Rabatt
  function orderRevenue(o: typeof allOrders[0]) {
    if (o.payment_method === 'schwarz') return 0
    const items: { unit_price: number; qty: number; on_the_house: boolean }[] = o.order_items ?? []
    const base = items.reduce((s, i) => i.on_the_house ? s : s + i.unit_price * i.qty, 0)
    return Math.round(base * (1 - (o.discount_percent ?? 0) / 100))
  }

  const totalRevenue = allOrders.reduce((s, o) => s + orderRevenue(o), 0)
  const schwarzTotal = allOrders.filter(o => o.payment_method === 'schwarz')
    .reduce((s, o) => {
      const items: { unit_price: number; qty: number; on_the_house: boolean }[] = o.order_items ?? []
      return s + items.reduce((ss, i) => i.on_the_house ? ss : ss + i.unit_price * i.qty, 0)
    }, 0)

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    open:        { label: 'Offen',         color: '#2E7D32', bg: '#F0FAF0' },
    transferred: { label: 'Übertragen',    color: '#1565C0', bg: '#EEF4FF' },
    closed:      { label: 'Abgeschlossen', color: '#8A7A60', bg: '#F5F2EC' },
  }

  const payLabel: Record<string, string> = {
    card:    '💳 Karte',
    cash:    '💵 Bar',
    schwarz: '🤝 Freunde/Fam.',
  }

  const groupLabel: Record<string, string> = {
    couple:   '👫 Pärchen',
    family:   '👨‍👩‍👧 Familie',
    single:   '🧍 Single',
    friends:  '🎉 Freunde',
    business: '💼 Business',
  }

  const originLabel: Record<string, string> = {
    tourist_foreign:  'Ausland',
    tourist_domestic: 'Inland',
    local:            'Einheimisch',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px' }}>
          {[
            { label: 'Bestellungen',   value: allOrders.length,                              unit: '' },
            { label: 'Tische bedient', value: new Set(allOrders.map(o => o.table_id)).size,  unit: '' },
            { label: 'Umsatz offiziell', value: totalRevenue.toLocaleString('de-DE'),        unit: ' ₺' },
            { label: 'Freunde/Fam. (schwarz)', value: schwarzTotal.toLocaleString('de-DE'),  unit: ' ₺' },
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
              const items: { id: string; name: string; qty: number; unit_price: number; on_the_house: boolean }[] = order.order_items ?? []
              const gross    = items.reduce((s, i) => s + i.unit_price * i.qty, 0)
              const houseAmt = items.filter(i => i.on_the_house).reduce((s, i) => s + i.unit_price * i.qty, 0)
              const charged  = orderRevenue(order)
              const st       = statusLabel[order.status] ?? statusLabel.closed
              const time     = new Date(order.opened_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
              const isSchwarz = order.payment_method === 'schwarz'

              return (
                <div key={order.id} style={{
                  background: '#FFFFFF', border: `1px solid ${isSchwarz ? '#A5D6A7' : '#E5E0D8'}`,
                  borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  {/* Tisch-Header */}
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0EDE8', background: isSchwarz ? '#F0FAF0' : '#FAFAF8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#B8882A' }}>
                        Tisch {order.tables?.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#8A7A60' }}>
                        {order.tables?.location === 'outside' ? 'Außen' : 'Innen'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#8A7A60' }}>· {time} Uhr</span>
                      {order.payment_method && (
                        <span style={{ fontSize: '11px', color: isSchwarz ? '#2E7D32' : '#5A5040', fontWeight: '600' }}>
                          {payLabel[order.payment_method] ?? order.payment_method}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ background: st.bg, color: st.color, fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', display: 'block', marginBottom: '3px' }}>
                          {st.label}
                        </span>
                        {(order.discount_percent || houseAmt > 0) && (
                          <div style={{ fontSize: '10px', color: '#8A7A60', textDecoration: 'line-through', textAlign: 'right' }}>{gross} ₺</div>
                        )}
                        <span style={{ fontSize: '15px', fontWeight: '700', color: isSchwarz ? '#2E7D32' : '#B8882A' }}>
                          {isSchwarz ? `${gross} ₺ 🤝` : `${charged} ₺`}
                        </span>
                      </div>
                      <Link href={`/management/order/${order.id}`}>
                        <button style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '8px 11px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
                          ✏️
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Artikel */}
                  <div style={{ padding: '8px 14px' }}>
                    {items.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#8A7A60', padding: '4px 0' }}>Keine Artikel</p>
                    ) : (
                      items.map(item => (
                        <div key={item.id} style={{
                          display: 'flex', justifyContent: 'space-between', padding: '3px 0',
                          fontSize: '13px', borderBottom: '1px solid #F5F2EC',
                          background: item.on_the_house ? '#F0FAF0' : undefined,
                        }}>
                          <span style={{ color: '#1A1207' }}>
                            {item.on_the_house && '🎁 '}
                            {item.name} <span style={{ color: '#8A7A60' }}>×{item.qty}</span>
                          </span>
                          <span style={{
                            color: item.on_the_house ? '#2E7D32' : '#B8882A', fontWeight: '600',
                            textDecoration: item.on_the_house ? 'line-through' : 'none',
                            fontSize: item.on_the_house ? '11px' : '13px',
                          }}>
                            {item.unit_price * item.qty} ₺{item.on_the_house ? ' gratis' : ''}
                          </span>
                        </div>
                      ))
                    )}

                    {/* Rabatt-Info */}
                    {(order.discount_percent ?? 0) > 0 && (
                      <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '5px' }}>
                        🏷️ Rabatt {order.discount_percent} % angewandt
                      </p>
                    )}

                    {/* Gäste-Infos */}
                    {(order.guest_origin || order.age_group || order.party_size || order.group_type) && (
                      <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '4px' }}>
                        👥 {[
                          order.group_type && groupLabel[order.group_type],
                          order.party_size && `${order.party_size} Pers.`,
                          order.age_group,
                          order.guest_origin && originLabel[order.guest_origin],
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    {order.note && (
                      <p style={{ fontSize: '11px', color: '#8A7A60', marginTop: '4px', fontStyle: 'italic' }}>📝 {order.note}</p>
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
