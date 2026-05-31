import { createClient } from '@/lib/supabase/server'
import TablesClient from './TablesClient'

export default async function ServicePage() {
  const supabase = await createClient()
  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .order('label')

  const { data: orders } = await supabase
    .from('orders')
    .select('table_id, status')
    .in('status', ['open', 'transferred'])

  const tableStatus: Record<string, string> = {}
  for (const o of orders ?? []) {
    if (!tableStatus[o.table_id] || o.status === 'open') {
      tableStatus[o.table_id] = o.status
    }
  }

  return <TablesClient tables={tables ?? []} tableStatus={tableStatus} />
}
