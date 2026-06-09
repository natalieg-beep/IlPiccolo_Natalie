-- Patch 20 FIX: expenses Tabelle neu erstellen (falls unvollständig vorhanden)

DROP TABLE IF EXISTS expenses CASCADE;

CREATE TABLE expenses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
  receipt_id      uuid REFERENCES receipts(id) ON DELETE SET NULL,
  supplier_id     uuid REFERENCES suppliers(id) ON DELETE SET NULL,

  date            date NOT NULL,
  description     text,

  -- Beträge
  amount_net      numeric(10,2),
  vat_rate        numeric(5,2),
  vat_amount      numeric(10,2),
  stopaj_amount   numeric(10,2),
  amount_gross    numeric(10,2) NOT NULL,

  -- Zahlungsart
  payment_type    text NOT NULL DEFAULT 'offiziell'
                  CHECK (payment_type IN ('offiziell','bar','schwarz')),
  payment_method  text CHECK (payment_method IN ('überweisung','karte','nakit','sonstiges')),

  -- Beleg-Status
  has_receipt     boolean NOT NULL DEFAULT false,
  source          text NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('manual','foto','pdf','import')),

  -- Amortisation
  amort_months    integer,
  amort_start     date,

  -- Periodenzuordnung
  period_from     date,
  period_to       date,

  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

CREATE INDEX expenses_date         ON expenses(date DESC);
CREATE INDEX expenses_category     ON expenses(category_id);
CREATE INDEX expenses_supplier     ON expenses(supplier_id);
CREATE INDEX expenses_payment_type ON expenses(payment_type);

-- Miete offiziell: 800.000 ₺ + Stopaj 200.000 ₺, 2 Jahre, amortisiert über 24 Monate
INSERT INTO expenses (
  category_id, date, description,
  amount_net, stopaj_amount, amount_gross,
  payment_type, payment_method, has_receipt, source,
  amort_months, amort_start, period_from, period_to, notes
) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Miete & Kaution' LIMIT 1),
  '2026-04-01', 'Miete offiziell (2 Jahre)',
  800000.00, 200000.00, 1000000.00,
  'offiziell', 'überweisung', true, 'import',
  24, '2026-04-01', '2026-04-01', '2028-03-31',
  'Stopaj 200.000 ₺ am Jahresende fällig. Monatlicher Anteil: 50.000 ₺'
);

-- Miete inoffiziell: 400.000 ₺ bar, kein Beleg, 2 Jahre
INSERT INTO expenses (
  category_id, date, description,
  amount_gross,
  payment_type, payment_method, has_receipt, source,
  amort_months, amort_start, period_from, period_to, notes
) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Miete & Kaution' LIMIT 1),
  '2026-04-01', 'Miete inoffiziell (2 Jahre)',
  400000.00,
  'schwarz', 'nakit', false, 'import',
  24, '2026-04-01', '2026-04-01', '2028-03-31',
  'Bar bezahlt, kein Beleg. Monatlicher Anteil: ~16.667 ₺'
);
