import { createClient } from '@/lib/supabase/server'
import PhrasenClient from './PhrasenClient'

export default async function PhrasenPage() {
  const supabase = await createClient()
  const { data: phrases } = await supabase
    .from('phrases')
    .select('id, category, turkish, german, pronunciation, formality')
    .order('category')
    .order('sort_order')

  return <PhrasenClient phrases={phrases ?? []} />
}
