import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OrderClient from './OrderClient'

export default async function TischPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: table } = await supabase
    .from('tables')
    .select('*')
    .eq('id', id)
    .single()

  if (!table) notFound()

  const { data: openOrder } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('table_id', id)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return <OrderClient table={table} existingOrder={openOrder} />
}
