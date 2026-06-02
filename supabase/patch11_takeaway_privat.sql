-- Patch 11: TakeAway und Privat-Essen als virtuelle Tische

INSERT INTO tables (label, location)
SELECT 'TakeAway', 'takeaway'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE location = 'takeaway');

INSERT INTO tables (label, location)
SELECT 'Privat', 'privat'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE location = 'privat');

-- Tagesabschluss-Einträge: beko_total und menulux_total werden in daily_entries gespeichert
-- (entry_type: 'beko_total' | 'menulux_total', amount in ₺)
