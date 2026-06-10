import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ManagementPage() {
  const supabase = await createClient()
  const today      = new Date().toISOString().slice(0, 10)
  const todayStart = `${today}T00:00:00.000Z`
  const todayEnd   = `${today}T23:59:59.999Z`

  // Heutige Bestellungen (abgeschlossen)
  const { data: orders } = await supabase
    .from('orders')
    .select('payment_method, discount_percent, discount_amount, tables(location), order_items(unit_price, qty, on_the_house)')
    .in('status', ['closed', 'transferred'])
    .gte('opened_at', todayStart)
    .lte('opened_at', todayEnd)

  // Offene Bestellungen
  const { count: openCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')

  type OrderItem = { unit_price: number; qty: number; on_the_house: boolean }
  type Order = { payment_method: string | null; discount_percent: number | null; discount_amount: number | null; tables: { location: string } | null; order_items: OrderItem[] }

  const allOrders = (orders ?? []) as unknown as Order[]
  const nonPrivat = allOrders.filter(o => o.tables?.location !== 'privat')

  const officialRevenue = nonPrivat.reduce((sum, o) => {
    if (!['card', 'cash', 'friends_card'].includes(o.payment_method ?? '')) return sum
    const base = (o.order_items ?? []).filter(i => !i.on_the_house).reduce((s, i) => s + i.unit_price * i.qty, 0)
    const afterPct = Math.round(base * (1 - (o.discount_percent ?? 0) / 100))
    return sum + Math.max(0, afterPct - (o.discount_amount ?? 0))
  }, 0)

  const orderCount = nonPrivat.length

  const cards = [
    {
      label: 'Einnahmen',
      icon: '📊',
      desc: 'Nach Zahlungsart · Woche · Monat',
      href: '/management/einnahmen',
      stat: `${officialRevenue.toLocaleString('de-DE')} ₺`,
      statLabel: 'heute offiziell',
      highlight: true,
      disabled: false,
    },
    {
      label: 'Bestellungen',
      icon: '🗂️',
      desc: 'Bearbeiten · Löschen · Verschieben',
      href: '/management/uebersicht',
      stat: orderCount.toString(),
      statLabel: `heute · ${openCount ?? 0} offen`,
      highlight: false,
      disabled: false,
    },
    {
      label: 'Tagesabschluss',
      icon: '📋',
      desc: 'Beko · Menulux · KDV · Trinkgeld · Entnahmen',
      href: '/management/tagesabschluss',
      stat: null,
      statLabel: null,
      highlight: false,
      disabled: false,
    },
    {
      label: 'Ausgaben',
      icon: '🧾',
      desc: 'Einkaufspreise · Investitionen · Belege scannen',
      href: '/management/ausgaben',
      stat: null,
      statLabel: null,
      highlight: false,
      disabled: false,
    },
    {
      label: 'Rezepte & Kalkulation',
      icon: '📋',
      desc: 'Zutaten zuordnen · Preiskalkulation',
      href: '/management/rezepte',
      stat: null,
      statLabel: null,
      highlight: false,
      disabled: false,
    },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F4F0', maxWidth: '600px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#B8882A' }}>Management</h1>
          <p style={{ fontSize: '11px', color: '#8A7A60' }}>
            Il Piccolo N · {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/service">
          <button style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '8px 14px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>← Service</button>
        </Link>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {cards.map(item => {
          const inner = (
            <div style={{
              background: item.disabled ? '#F5F2EC' : item.highlight ? '#FFF8EC' : '#FFFFFF',
              border: `1.5px solid ${item.disabled ? '#E5E0D8' : item.highlight ? '#B8882A' : '#E5E0D8'}`,
              borderRadius: '14px', padding: '16px 18px',
              cursor: item.disabled ? 'default' : 'pointer',
              boxShadow: item.disabled ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              opacity: item.disabled ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '26px' }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: item.disabled ? '#8A7A60' : item.highlight ? '#B8882A' : '#1A1207' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#8A7A60', marginTop: '2px' }}>{item.desc}</div>
                </div>
              </div>
              {item.stat !== null && !item.disabled && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#B8882A' }}>{item.stat}</div>
                  <div style={{ fontSize: '10px', color: '#8A7A60' }}>{item.statLabel}</div>
                </div>
              )}
              {item.stat === null && !item.disabled && (
                <span style={{ fontSize: '18px', color: '#C8C0B4' }}>→</span>
              )}
            </div>
          )
          return item.disabled
            ? <div key={item.label}>{inner}</div>
            : <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>{inner}</Link>
        })}
      </div>
    </div>
  )
}
