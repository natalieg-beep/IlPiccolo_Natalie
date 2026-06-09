-- Patch 20 COMPLETE: expense_categories + expenses (sauber von Null)

DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;

-- ── Kostenkategorien ──────────────────────────────────────────────────────────
CREATE TABLE expense_categories (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name    text NOT NULL,
  type    text NOT NULL CHECK (type IN ('laufend','einmalig','investition')),
  icon    text NOT NULL DEFAULT '📋',
  sort    integer NOT NULL DEFAULT 0,
  active  boolean NOT NULL DEFAULT true
);

ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;

INSERT INTO expense_categories (name, type, icon, sort) VALUES
  ('Miete & Kaution',      'investition', '🏠', 10),
  ('Ablösesumme',          'investition', '🔑', 11),
  ('Umbau & Renovierung',  'investition', '🔨', 12),
  ('Geräte & Maschinen',   'investition', '⚙️',  13),
  ('Erstausstattung',      'investition', '🪑', 14),
  ('Rechts & Notar',       'investition', '📜', 15),
  ('Patent & Marke',       'investition', '™️',  16),
  ('Werbung & Marketing',  'investition', '📢', 17),
  ('Transport & Reise',    'investition', '✈️',  18),
  ('Miete (monatlich)',    'laufend',     '🏠', 20),
  ('Strom',                'laufend',     '⚡', 21),
  ('Gas',                  'laufend',     '🔥', 22),
  ('Wasser',               'laufend',     '💧', 23),
  ('Telefon & Internet',   'laufend',     '📡', 24),
  ('Steuerberater',        'laufend',     '📊', 25),
  ('Kassensystem',         'laufend',     '🖥️',  26),
  ('Versicherung',         'laufend',     '🛡️',  27),
  ('Sonstiges Einmalig',   'einmalig',    '📋', 90),
  ('Sonstiges Laufend',    'laufend',     '📋', 91);

-- ── Ausgaben ──────────────────────────────────────────────────────────────────
CREATE TABLE expenses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
  receipt_id      uuid REFERENCES receipts(id) ON DELETE SET NULL,
  supplier_id     uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  date            date NOT NULL,
  description     text,
  amount_net      numeric(10,2),
  vat_rate        numeric(5,2),
  vat_amount      numeric(10,2),
  stopaj_amount   numeric(10,2),
  amount_gross    numeric(10,2) NOT NULL,
  payment_type    text NOT NULL DEFAULT 'offiziell'
                  CHECK (payment_type IN ('offiziell','bar','schwarz')),
  payment_method  text CHECK (payment_method IN ('überweisung','karte','nakit','sonstiges')),
  has_receipt     boolean NOT NULL DEFAULT false,
  source          text NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('manual','foto','pdf','import')),
  amort_months    integer,
  amort_start     date,
  period_from     date,
  period_to       date,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

CREATE INDEX expenses_date          ON expenses(date DESC);
CREATE INDEX expenses_category      ON expenses(category_id);
CREATE INDEX expenses_supplier      ON expenses(supplier_id);
CREATE INDEX expenses_payment_type  ON expenses(payment_type);

-- ── Miete vorerfassen ─────────────────────────────────────────────────────────
INSERT INTO expenses (category_id, date, description, amount_net, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, amort_months, amort_start, period_from, period_to, notes)
SELECT id, '2026-04-01', 'Miete offiziell (2 Jahre)', 800000, 200000, 1000000, 'offiziell', 'überweisung', true, 'import', 24, '2026-04-01', '2026-04-01', '2028-03-31', 'Stopaj 200.000 ₺ am Jahresende fällig. Monatlicher Anteil: 50.000 ₺'
FROM expense_categories WHERE name = 'Miete & Kaution';

INSERT INTO expenses (category_id, date, description, amount_gross, payment_type, payment_method, has_receipt, source, amort_months, amort_start, period_from, period_to, notes)
SELECT id, '2026-04-01', 'Miete inoffiziell (2 Jahre)', 400000, 'schwarz', 'nakit', false, 'import', 24, '2026-04-01', '2026-04-01', '2028-03-31', 'Bar bezahlt, kein Beleg. Monatlicher Anteil: ~16.667 ₺'
FROM expense_categories WHERE name = 'Miete & Kaution';
