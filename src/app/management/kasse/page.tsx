import { createClient } from '@/lib/supabase/server'
import KasseClient from './KasseClient'

export default async function KassePage() {
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)

  // Manuelle Kasse-Einträge von heute
  const { data: entries } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('date', today)
    .order('created_at', { ascending: false })

  // Schwarz-Bestellungen (schwarz_bar) von heute als Summe
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const { data: schwarzOrders } = await supabase
    .from('orders')
    .select('order_items(*)')
    .eq('payment_method', 'schwarz_bar')
    .gte('opened_at', todayStart.toISOString())
    .lte('opened_at', todayEnd.toISOString())

  const schwarzFromOrders = (schwarzOrders ?? []).reduce((sum, o) => {
    const items = (o.order_items ?? []) as { unit_price: number; qty: number; on_the_house: boolean }[]
    return sum + items.filter(i => !i.on_the_house).reduce((s, i) => s + i.unit_price * i.qty, 0)
  }, 0)

  return (
    <KasseClient
      initialEntries={entries ?? []}
      schwarzFromOrders={schwarzFromOrders}
    />
  )
}
