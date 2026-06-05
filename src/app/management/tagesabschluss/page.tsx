import { createClient } from '@/lib/supabase/server'
import TagesabschlussClient from './TagesabschlussClient'

export default async function TagesabschlussPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: dateParam } = await searchParams
  const date = dateParam ?? new Date().toISOString().slice(0, 10)

  const supabase = await createClient()

  const dayStart = `${date}T00:00:00.000Z`
  const dayEnd   = `${date}T23:59:59.999Z`

  // Gespeicherte Tagesabschluss-Einträge
  const { data: entries } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('date', date)
    .in('entry_type', [
      'menulux_brutto', 'beko1_brutto', 'beko2_brutto',
      'bar_offiziell', 'trinkgeld', 'entnahme_privat', 'entnahme_geschaeft',
      // legacy
      'menulux_total', 'beko_total',
    ])

  // Bar Freunde (schwarz_bar) aus Bestellungen
  const { data: schwarzOrders } = await supabase
    .from('orders')
    .select('order_items(unit_price, qty, on_the_house)')
    .eq('payment_method', 'schwarz_bar')
    .gte('opened_at', dayStart)
    .lte('opened_at', dayEnd)

  const schwarzBarFromOrders = (schwarzOrders ?? []).reduce((sum, o) => {
    const items = (o.order_items ?? []) as { unit_price: number; qty: number; on_the_house: boolean }[]
    return sum + items.filter(i => !i.on_the_house).reduce((s, i) => s + i.unit_price * i.qty, 0)
  }, 0)

  // App-Umsatz offiziell (Karte + Bar + Freunde Karte)
  const { data: officialOrders } = await supabase
    .from('orders')
    .select('order_items(unit_price, qty, on_the_house), discount_percent, discount_amount, payment_method, tables(location)')
    .in('payment_method', ['card', 'cash', 'friends_card'])
    .gte('opened_at', dayStart)
    .lte('opened_at', dayEnd)

  const appRevenue = (officialOrders ?? []).reduce((sum, o) => {
    if ((o.tables as { location?: string } | null)?.location === 'privat') return sum
    const items = (o.order_items ?? []) as { unit_price: number; qty: number; on_the_house: boolean }[]
    const base = items.filter(i => !i.on_the_house).reduce((s, i) => s + i.unit_price * i.qty, 0)
    const afterPct = Math.round(base * (1 - ((o.discount_percent as number | null) ?? 0) / 100))
    return sum + Math.max(0, afterPct - ((o.discount_amount as number | null) ?? 0))
  }, 0)

  return (
    <TagesabschlussClient
      date={date}
      initialEntries={entries ?? []}
      schwarzBarFromOrders={schwarzBarFromOrders}
      appRevenue={appRevenue}
    />
  )
}
