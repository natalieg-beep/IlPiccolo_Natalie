import { createClient } from '@/lib/supabase/server'
import RezepteClient from './RezepteClient'

export default async function Page() {
  const supabase = await createClient()

  const [
    { data: menuItems },
    { data: ingredients },
    { data: assignments },
    { data: products },
    { data: prices },
  ] = await Promise.all([
    supabase.from('menu_items').select('*').eq('active', true).order('category').order('sort'),
    supabase.from('recipe_ingredients').select('*').order('sort'),
    supabase.from('recipe_product_assignments')
      .select('*, purchase_products(id,name,unit), purchase_prices(id,price_tl,quantity,price_per_unit,date,unit)')
      .eq('active', true),
    supabase.from('purchase_products').select('id,name,category,unit').eq('active', true).order('name'),
    supabase.from('purchase_prices').select('id,product_id,price_tl,quantity,unit,price_per_unit,date').order('date', { ascending: false }),
  ])

  return (
    <RezepteClient
      menuItems={menuItems ?? []}
      ingredients={ingredients ?? []}
      assignments={assignments ?? []}
      products={products ?? []}
      prices={prices ?? []}
    />
  )
}
