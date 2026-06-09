-- Patch 21b: date in expenses nullable machen (Belege ohne Datum erlauben)
ALTER TABLE expenses ALTER COLUMN date DROP NOT NULL;
