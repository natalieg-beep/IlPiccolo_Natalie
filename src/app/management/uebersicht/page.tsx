import { createClient } from '@/lib/supabase/server'
import UebersichtClient from './UebersichtClient'

export default async function UebersichtPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: dateParam } = await searchParams
  const date = dateParam ?? new Date().toISOString().slice(0, 10)

  const supabase = await createClient()

  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999)

  const { data: orders } = await supabase
    .from('orders')
    .select('*, tables(label, location), order_items(*)')
    .gte('opened_at', dayStart.toISOString())
    .lte('opened_at', dayEnd.toISOString())
    .order('opened_at', { ascending: false })

  return <UebersichtClient initialOrders={orders ?? []} date={date} />
}
