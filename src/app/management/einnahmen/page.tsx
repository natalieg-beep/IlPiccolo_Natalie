import { createClient } from '@/lib/supabase/server'
import EinnahmenClient from './EinnahmenClient'

function getPeriodRange(period: string, offset: number) {
  const now = new Date()

  if (period === 'week') {
    const monday = new Date(now)
    const day = monday.getDay()
    const diff = day === 0 ? -6 : 1 - day
    monday.setDate(monday.getDate() + diff + offset * 7)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return { start: monday, end: sunday }
  }

  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start: d, end: e }
  }

  if (period === 'year') {
    const y = now.getFullYear() + offset
    return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59, 999) }
  }

  // default: day
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  d.setHours(0, 0, 0, 0)
  const e = new Date(d)
  e.setHours(23, 59, 59, 999)
  return { start: d, end: e }
}

export default async function EinnahmenPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; o?: string }>
}) {
  const { p, o } = await searchParams
  const period = (p ?? 'day') as 'day' | 'week' | 'month' | 'year'
  const offset = parseInt(o ?? '0')

  const { start, end } = getPeriodRange(period, offset)
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, payment_method, discount_percent, discount_amount,
      party_size,
      tables(label, location),
      order_items(unit_price, qty, on_the_house)
    `)
    .gte('opened_at', start.toISOString())
    .lte('opened_at', end.toISOString())
    .in('status', ['closed', 'transferred'])

  // Menulux + Beko aus daily_entries für den Zeitraum
  const startDate = start.toISOString().slice(0, 10)
  const endDate   = end.toISOString().slice(0, 10)

  const { data: entries } = await supabase
    .from('daily_entries')
    .select('entry_type, amount, kdv, date')
    .gte('date', startDate)
    .lte('date', endDate)
    .in('entry_type', ['menulux_brutto', 'menulux_total', 'beko1_brutto', 'beko_total', 'beko2_brutto'])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <EinnahmenClient
      orders={(orders ?? []) as any}
      entries={entries ?? []}
      period={period}
      offset={offset}
      startDate={startDate}
      endDate={endDate}
    />
  )
}
