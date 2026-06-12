import { createAdminClient } from '@/lib/supabase/admin'
import LieferantenClient from './LieferantenClient'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = createAdminClient()
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .order('category')
    .order('name')

  return <LieferantenClient suppliers={suppliers ?? []} />
}
