import { createClient } from '@/lib/supabase/server'
import AusgabenPage from './AusgabenPageClient'

export default async function Page() {
  const supabase = await createClient()

  const [
    { data: products },
    { data: allPrices },
    { data: categories },
    { data: expenses },
    { data: suppliers },
  ] = await Promise.all([
    supabase.from('purchase_products').select('*').eq('active', true).order('category').order('name'),
    supabase.from('purchase_prices').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('expense_categories').select('*').eq('active', true).order('sort'),
    supabase.from('expenses').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('suppliers').select('id, name, category').eq('active', true).order('name'),
  ])

  return (
    <AusgabenPage
      products={products ?? []}
      allPrices={allPrices ?? []}
      categories={categories ?? []}
      expenses={expenses ?? []}
      suppliers={suppliers ?? []}
    />
  )
}
