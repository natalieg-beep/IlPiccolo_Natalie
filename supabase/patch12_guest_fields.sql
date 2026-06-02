-- Patch 12: Erweiterte Gäste-Felder
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_country  text;  -- Herkunftsland (Freitext)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_source   text;  -- Wie aufmerksam geworden
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_notes    text;  -- Weitere freie Notizen
