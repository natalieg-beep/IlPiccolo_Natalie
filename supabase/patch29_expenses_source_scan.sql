-- patch29: 'scan' als erlaubten source-Wert für expenses hinzufügen
-- Hintergrund: AusgabenClient speichert Investitions-Posten via Scan mit source='scan',
-- das war bisher nicht im CHECK constraint → Invest-Posten wurden lautlos nicht gespeichert.

ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_source_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_source_check
  CHECK (source IN ('manual', 'foto', 'pdf', 'import', 'scan'));
