-- Patch 13: Fixer ₺-Rabatt auf Bestellungen + Notizfeld für Entnahmen
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount integer DEFAULT 0;
-- daily_entries.note existiert bereits (für Kasse), wird jetzt auch für Entnahmen genutzt
