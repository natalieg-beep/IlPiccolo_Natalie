-- patch16: Konfigurierbare Frischezeiten
CREATE TABLE IF NOT EXISTS kitchen_freshness_settings (
  task_key text PRIMARY KEY,
  label    text NOT NULL,
  hours    integer NOT NULL
);

INSERT INTO kitchen_freshness_settings (task_key, label, hours) VALUES
  ('zwiebeln',       'Zwiebeln geschnitten',    24),
  ('paprika',        'Paprika geschnitten',      48),
  ('pilze',          'Pilze geschnitten',        24),
  ('mozza',          'Mozza geöffnet',           24),
  ('sucuk',          'Sucuk',                    48),
  ('salami',         'Ital. Salami',             48),
  ('salami_scharf',  'Scharfe Ital. Salami',     48),
  ('jambon',         'Jambon',                   48),
  ('pastirma',       'Pastırma',                 48),
  ('tiramisu',       'Tiramisu',                 96),
  ('piccolo_crunch', 'Piccolo Crunch',           96)
ON CONFLICT (task_key) DO NOTHING;

ALTER TABLE kitchen_freshness_settings DISABLE ROW LEVEL SECURITY;
