-- Patch 20: Ausgaben-Kategorien + Ausgaben (Investitionen, Fixkosten, Betrieb)

-- ── Kostenkategorien (in App pflegbar) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_categories (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name    text NOT NULL,
  type    text NOT NULL CHECK (type IN ('laufend','einmalig','investition')),
  icon    text NOT NULL DEFAULT '📋',
  sort    integer NOT NULL DEFAULT 0,
  active  boolean NOT NULL DEFAULT true
);

ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;

-- Initiale Kategorien
INSERT INTO expense_categories (name, type, icon, sort) VALUES
  -- Investitionen
  ('Miete & Kaution',      'investition', '🏠', 10),
  ('Ablösesumme',          'investition', '🔑', 11),
  ('Umbau & Renovierung',  'investition', '🔨', 12),
  ('Geräte & Maschinen',   'investition', '⚙️',  13),
  ('Erstausstattung',      'investition', '🪑', 14),
  ('Rechts & Notar',       'investition', '📜', 15),
  ('Patent & Marke',       'investition', '™️',  16),
  ('Werbung & Marketing',  'investition', '📢', 17),
  ('Transport & Reise',    'investition', '✈️',  18),
  -- Laufend
  ('Miete (monatlich)',    'laufend',     '🏠', 20),
  ('Strom',                'laufend',     '⚡', 21),
  ('Gas',                  'laufend',     '🔥', 22),
  ('Wasser',               'laufend',     '💧', 23),
  ('Telefon & Internet',   'laufend',     '📡', 24),
  ('Steuerberater',        'laufend',     '📊', 25),
  ('Kassensystem',         'laufend',     '🖥️',  26),
  ('Versicherung',         'laufend',     '🛡️',  27),
  -- Einmalig / Sonstiges
  ('Sonstiges Einmalig',   'einmalig',    '📋', 90),
  ('Sonstiges Laufend',    'laufend',     '📋', 91)
ON CONFLICT DO NOTHING;

-- ── Ausgaben ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
  receipt_id      uuid REFERENCES receipts(id) ON DELETE SET NULL,
  supplier_id     uuid REFERENCES suppliers(id) ON DELETE SET NULL,

  date            date NOT NULL,
  description     text,

  -- Beträge
  amount_net      numeric(10,2),          -- Netto
  vat_rate        numeric(5,2),           -- KDV-Satz: 1 | 10 | 20
  vat_amount      numeric(10,2),          -- KDV-Betrag
  stopaj_amount   numeric(10,2),          -- Stopaj (Quellensteuer, Jahresende fällig)
  amount_gross    numeric(10,2) NOT NULL, -- Brutto-Gesamtbetrag

  -- Zahlungsart
  payment_type    text NOT NULL DEFAULT 'offiziell'
                  CHECK (payment_type IN ('offiziell','bar','schwarz')),
  payment_method  text CHECK (payment_method IN ('überweisung','karte','nakit','sonstiges')),

  -- Beleg-Status
  has_receipt     boolean NOT NULL DEFAULT false,
  source          text NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('manual','foto','pdf','import')),

  -- Amortisation (für Investitionen und Mietvorauszahlungen)
  amort_months    integer,                -- über wie viele Monate verteilen? NULL = kein Amort.
  amort_start     date,                   -- ab wann amortisieren?

  -- Periodenzuordnung (für Miete, Strom etc.)
  period_from     date,
  period_to       date,

  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- Indizes
CREATE INDEX IF NOT EXISTS expenses_date        ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS expenses_category    ON expenses(category_id);
CREATE INDEX IF NOT EXISTS expenses_supplier    ON expenses(supplier_id);
CREATE INDEX IF NOT EXISTS expenses_payment_type ON expenses(payment_type);

-- ── Miete vorerfassen (bekannter Wert) ────────────────────────────────────────
-- Offizielle Miete: 800.000 ₺ für 2 Jahre → 50.000 ₺/Monat amortisiert
INSERT INTO expenses (
  date, description, amount_net, vat_rate, vat_amount, stopaj_amount, amount_gross,
  payment_type, payment_method, has_receipt, source,
  amort_months, amort_start, period_from, period_to, notes
) VALUES (
  '2026-04-01',
  'Miete offiziell (2 Jahre)',
  800000.00, NULL, NULL, 200000.00, 1000000.00,
  'offiziell', 'überweisung', true, 'import',
  24, '2026-04-01', '2026-04-01', '2028-03-31',
  'Stopaj 200.000 ₺ am Jahresende fällig. Monatlicher Anteil: 50.000 ₺'
);

-- Inoffizielle Miete: 400.000 ₺ bar, keine Rechnung
INSERT INTO expenses (
  date, description, amount_gross,
  payment_type, payment_method, has_receipt, source,
  amort_months, amort_start, period_from, period_to, notes
) VALUES (
  '2026-04-01',
  'Miete inoffiziell (2 Jahre)',
  400000.00,
  'schwarz', 'nakit', false, 'import',
  24, '2026-04-01', '2026-04-01', '2028-03-31',
  'Bar bezahlt, kein Beleg. Monatlicher Anteil: ~16.667 ₺'
);
