import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OrderClient from '@/app/service/tisch/[id]/OrderClient'

export default async function ManagementOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Lade Order direkt per ID — unabhängig vom Status
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .maybeSingle()

  if (!order) notFound()

  const { data: table } = await supabase
    .from('tables')
    .select('*')
    .eq('id', order.table_id)
    .single()

  if (!table) notFound()

  return <OrderClient table={table} existingOrder={order} backHref="/management/uebersicht" />
}
