-- Patch 22: Private Produkte + Rezept-Modul

-- ── purchase_products: 'privat' Kategorie ─────────────────────────────────────
ALTER TABLE purchase_products
  DROP CONSTRAINT IF EXISTS purchase_products_category_check;
ALTER TABLE purchase_products
  ADD CONSTRAINT purchase_products_category_check
  CHECK (category IN ('molkerei','wurst','mehl','gemuese','getraenke','backen','verpackung','reinigung','privat','sonstiges'));

-- ── Menüpunkte ────────────────────────────────────────────────────────────────
CREATE TABLE menu_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL CHECK (category IN ('pizza','dessert','getraenk','kaffee','extra')),
  vk_price    numeric(10,2),
  active      boolean NOT NULL DEFAULT true,
  sort        integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
CREATE INDEX menu_items_category ON menu_items(category);

-- ── Rezept-Zutaten ────────────────────────────────────────────────────────────
-- Eine Zutat ist eine abstrakte Menge ("150g Löffelbiskuits") — unabhängig vom Lieferanten
CREATE TABLE recipe_ingredients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id  uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name          text NOT NULL,      -- "Löffelbiskuits", "Mozzarella" etc.
  quantity      numeric(10,4) NOT NULL,
  unit          text NOT NULL,      -- kg | g | Stk | L | ml
  notes         text,
  sort          integer NOT NULL DEFAULT 0
);
ALTER TABLE recipe_ingredients DISABLE ROW LEVEL SECURITY;
CREATE INDEX recipe_ingredients_menu_item ON recipe_ingredients(menu_item_id);

-- ── Produkt-Zuordnungen ───────────────────────────────────────────────────────
-- Welches purchase_product erfüllt diese Zutat aktuell?
-- price_mode: 'latest' = neuester Preis (default), 'pinned' = fixierter Preis
CREATE TABLE recipe_product_assignments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_ingredient_id  uuid NOT NULL REFERENCES recipe_ingredients(id) ON DELETE CASCADE,
  product_id            uuid NOT NULL REFERENCES purchase_products(id) ON DELETE CASCADE,
  price_mode            text NOT NULL DEFAULT 'latest'
                        CHECK (price_mode IN ('latest','pinned')),
  pinned_price_id       uuid REFERENCES purchase_prices(id) ON DELETE SET NULL,
  -- pinned_price_id: nur relevant wenn price_mode='pinned'
  -- → "alte Lieferung noch in Verwendung, neuer Preis existiert schon"
  active                boolean NOT NULL DEFAULT true,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipe_ingredient_id, product_id)
);
ALTER TABLE recipe_product_assignments DISABLE ROW LEVEL SECURITY;
CREATE INDEX rpa_ingredient ON recipe_product_assignments(recipe_ingredient_id);
CREATE INDEX rpa_product    ON recipe_product_assignments(product_id);
