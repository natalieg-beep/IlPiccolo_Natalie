-- patch30: Receipt-First Pipeline — scan_batches + receipt_items
-- Beschlossen: 2026-06-17 (Session 3)

-- ============================================================
-- scan_batches: Gruppiert einen Upload-Vorgang (z.B. 100 PDFs)
-- ============================================================
CREATE TABLE IF NOT EXISTS scan_batches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  total_files   integer NOT NULL DEFAULT 0,
  processed_files integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'scanning'
                CHECK (status IN ('scanning', 'review', 'committed', 'error')),
  note          text
);

ALTER TABLE scan_batches DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- receipt_items: Alle Positionen jeder Rechnung als Staging
-- ============================================================
CREATE TABLE IF NOT EXISTS receipt_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id     uuid REFERENCES receipts(id) ON DELETE SET NULL,
  batch_id       uuid REFERENCES scan_batches(id) ON DELETE SET NULL,

  -- Wie auf der Rechnung gedruckt
  name           text NOT NULL,
  amount_gross   numeric(12, 2) NOT NULL,
  vat_rate       numeric(5, 2) NOT NULL DEFAULT 0,   -- z.B. 0, 10, 20

  -- GENERATED: Netto und KDV-Betrag
  amount_net     numeric(12, 4) GENERATED ALWAYS AS
                   (amount_gross / (1 + vat_rate / 100)) STORED,
  vat_amount     numeric(12, 4) GENERATED ALWAYS AS
                   (amount_gross - amount_gross / (1 + vat_rate / 100)) STORED,

  quantity       numeric(10, 3) NOT NULL DEFAULT 1,
  unit           text,
  date           date,  -- Rechnungsdatum (bei Bulk: pro Item unterschiedlich)

  -- Kategorisierung durch User
  mode           text NOT NULL DEFAULT 'einkauf'
                 CHECK (mode IN ('einkauf', 'invest', 'privat', 'fixkosten')),
  category_id    uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
  product_id     uuid REFERENCES purchase_products(id) ON DELETE SET NULL,

  -- Verarbeitungsstatus
  status         text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'saved', 'skipped', 'error')),
  target_table   text CHECK (target_table IN ('purchase_prices', 'expenses', NULL)),
  target_id      uuid,  -- UUID des gespeicherten Eintrags (purchase_prices.id / expenses.id)
  error_message  text,

  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE receipt_items DISABLE ROW LEVEL SECURITY;

-- Index für schnelle Abfragen pro Batch und Status
CREATE INDEX IF NOT EXISTS idx_receipt_items_batch_id ON receipt_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_status ON receipt_items(status);
CREATE INDEX IF NOT EXISTS idx_receipt_items_mode ON receipt_items(mode);
CREATE INDEX IF NOT EXISTS idx_scan_batches_status ON scan_batches(status);
