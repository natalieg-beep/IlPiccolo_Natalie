-- Patch 14: Neue Tagesabschluss-Eintragstypen
-- Ersetzt beko_total / menulux_total durch getrennte Brutto+KDV-Felder
-- KDV wird in der App berechnet (Brutto ÷ 11), hier optional gespeichert

ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS kdv numeric(12,2);

-- Neue entry_types (amount = Brutto inkl. KDV):
-- 'menulux_brutto'  → Menulux Tageseinnahme
-- 'beko1_brutto'    → Beko Gerät 1
-- 'beko2_brutto'    → Beko Gerät 2
-- 'bar_offiziell'   → Offizielle Bar-Einnahmen
-- 'entnahme_privat' + 'entnahme_geschaeft' → bereits vorhanden
