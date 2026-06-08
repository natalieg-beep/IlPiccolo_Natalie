import { createClient } from '@/lib/supabase/server'
import AusgabenClient from './AusgabenClient'

export default async function AusgabenPage() {
  const supabase = await createClient()

  // Alle aktiven Produkte + letzten Preis per Subquery
  const { data: products } = await supabase
    .from('purchase_products')
    .select('*')
    .eq('active', true)
    .order('category')
    .order('name')

  // Letzter Preis pro Produkt
  const { data: latestPrices } = await supabase
    .from('purchase_prices')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  // Preisverlauf (letzte 10 Einträge pro Produkt) für Detailansicht
  return <AusgabenClient products={products ?? []} allPrices={latestPrices ?? []} />
}
