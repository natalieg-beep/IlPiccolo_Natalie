-- Patch 18: Einkaufspreise / Ausgaben

CREATE TABLE IF NOT EXISTS purchase_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL CHECK (category IN ('molkerei','wurst','mehl','gemuese','getraenke','backen','verpackung','reinigung','sonstiges')),
  unit        text NOT NULL CHECK (unit IN ('kg','g','Stk','L','ml','Pkg')),
  notes       text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_prices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES purchase_products(id) ON DELETE CASCADE,
  price_tl    numeric(10,2) NOT NULL,
  quantity    numeric(10,3) NOT NULL DEFAULT 1,
  unit        text NOT NULL,
  price_per_unit numeric(10,4) GENERATED ALWAYS AS (price_tl / quantity) STORED,
  date        date NOT NULL DEFAULT current_date,
  source      text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','scan')),
  receipt_ref text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index für schnelles "letzter Preis pro Produkt"
CREATE INDEX IF NOT EXISTS purchase_prices_product_date ON purchase_prices(product_id, date DESC);

-- RLS deaktiviert (Management-Auth reicht)
ALTER TABLE purchase_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_prices DISABLE ROW LEVEL SECURITY;
