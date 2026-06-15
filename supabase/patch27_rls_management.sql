-- Patch 27: RLS für interne Management-Tabellen öffnen
-- Das ist ein privates Restaurant-Management-Tool ohne User-Auth.
-- Alle Tabellen werden für anon read+write freigegeben.

-- expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all" ON expenses;
CREATE POLICY "anon_all" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- expense_categories
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all" ON expense_categories;
CREATE POLICY "anon_all" ON expense_categories FOR ALL USING (true) WITH CHECK (true);

-- purchase_products
ALTER TABLE purchase_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all" ON purchase_products;
CREATE POLICY "anon_all" ON purchase_products FOR ALL USING (true) WITH CHECK (true);

-- purchase_prices
ALTER TABLE purchase_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all" ON purchase_prices;
CREATE POLICY "anon_all" ON purchase_prices FOR ALL USING (true) WITH CHECK (true);

-- suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all" ON suppliers;
CREATE POLICY "anon_all" ON suppliers FOR ALL USING (true) WITH CHECK (true);

-- receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all" ON receipts;
CREATE POLICY "anon_all" ON receipts FOR ALL USING (true) WITH CHECK (true);
