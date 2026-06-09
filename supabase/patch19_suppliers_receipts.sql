-- Patch 19: Händler + Belege mit Duplikat-Erkennung

-- ── Händler ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL DEFAULT 'sonstiges',
  -- Kategorien: lieferant | supermarkt | handwerker | behoerde | telekommunikation | sonstiges
  notes       text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;

-- Initiale Händler (aus bekannten Daten)
INSERT INTO suppliers (name, category) VALUES
  ('Atılım Şengida',    'lieferant'),
  ('Royal Bounty Gıda', 'lieferant'),
  ('WIO Gayrimenkul',   'lieferant'),
  ('BIM',               'supermarkt'),
  ('Muhtar',            'supermarkt'),
  ('Hakbilenler',       'handwerker'),
  ('Koru Patent',       'behoerde'),
  ('TürkTelekom',       'telekommunikation'),
  ('Tüpgaz',            'lieferant'),
  ('Sonstiges',         'sonstiges')
ON CONFLICT DO NOTHING;

-- ── Belege ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  ettn        text UNIQUE,        -- türk. E-Rechnung UUID (e-fatura / e-arşiv)
  fatura_no   text,               -- Rechnungsnummer (Soft-Check)
  image_hash  text UNIQUE,        -- SHA-256 Foto-Hash (Fallback ohne ETTN)
  date        date,
  total_tl    numeric(10,2),
  source      text NOT NULL DEFAULT 'manual'
              CHECK (source IN ('manual','foto','pdf')),
  scanned_at  timestamptz NOT NULL DEFAULT now(),
  notes       text
);

ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;

-- Index für schnelle Duplikat-Checks
CREATE INDEX IF NOT EXISTS receipts_ettn       ON receipts(ettn)       WHERE ettn IS NOT NULL;
CREATE INDEX IF NOT EXISTS receipts_image_hash ON receipts(image_hash) WHERE image_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS receipts_fatura_no  ON receipts(fatura_no)  WHERE fatura_no IS NOT NULL;

-- ── purchase_prices: supplier_id + receipt_id nachrüsten ──────────────────────
ALTER TABLE purchase_prices
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS receipt_id  uuid REFERENCES receipts(id)  ON DELETE SET NULL;
