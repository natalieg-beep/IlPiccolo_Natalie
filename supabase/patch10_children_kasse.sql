-- Patch 10: Kinder-Info + Kasse-Einträge

-- Kinder-Info pro Bestellung
ALTER TABLE orders ADD COLUMN IF NOT EXISTS children_info text;
-- Werte (kommagetrennt): 'kleinkind', 'kinder', 'jugendliche'

-- Tages-Kasse: manuelle Einträge für Trinkgeld, Schwarzgeld, Notizen
CREATE TABLE IF NOT EXISTS daily_entries (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  date         date        NOT NULL DEFAULT CURRENT_DATE,
  entry_type   text        NOT NULL,  -- 'tip' | 'schwarz_bar' | 'note'
  amount       integer     DEFAULT 0,
  note         text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner only" ON daily_entries
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Tisch-Notiz (persistent, unabhängig von Bestellungen)
ALTER TABLE tables ADD COLUMN IF NOT EXISTS note text;
