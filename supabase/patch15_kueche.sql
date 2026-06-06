-- patch15: Küchen-Modul
-- Ausführen in Supabase SQL Editor

-- Küchen-Benutzer
CREATE TABLE IF NOT EXISTS kitchen_users (
  id   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  whatsapp text
);

INSERT INTO kitchen_users (name, whatsapp) VALUES
  ('Vedat', '905542527254'),
  ('Rakim', '905347459719')
ON CONFLICT DO NOTHING;

-- Teig-Chargen (Teig → Teiglinge → Kühlschrank → Draußen → Fertig)
CREATE TABLE IF NOT EXISTS kitchen_dough_batches (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid REFERENCES kitchen_users(id),
  stage               text NOT NULL DEFAULT 'teig_gemacht',
  -- stages: teig_gemacht | teiglinge_geformt | kuehlschrank | draussen | fertig
  teig_at             timestamptz,
  teiglinge_at        timestamptz,
  kuehlschrank_at     timestamptz,
  draussen_at         timestamptz,
  fertig_at           timestamptz,
  draussen_stunden    integer DEFAULT 2,
  notes               text,
  created_at          timestamptz DEFAULT now()
);

-- Alle anderen Aufgaben-Logs (Frische, Täglich, Sonstiges, Belag)
CREATE TABLE IF NOT EXISTS kitchen_task_logs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_key   text NOT NULL,
  user_id    uuid REFERENCES kitchen_users(id),
  logged_at  timestamptz DEFAULT now(),
  notes      text
);

-- Mindesthaltbarkeit
CREATE TABLE IF NOT EXISTS kitchen_products (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  category   text DEFAULT 'sonstiges', -- kaese | wurst | sonstiges
  expires_at date NOT NULL,
  notes      text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES kitchen_users(id)
);

-- RLS deaktivieren (interne Küchen-App, kein Auth nötig)
ALTER TABLE kitchen_users     DISABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_dough_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_task_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_products  DISABLE ROW LEVEL SECURITY;
