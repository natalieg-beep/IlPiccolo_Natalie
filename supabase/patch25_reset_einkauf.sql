-- patch25: Einkaufspreise + Produkte komplett leeren (Neustart)
-- Alle Preiseinträge und Produkte werden gelöscht.
-- Die Tabellenstruktur bleibt erhalten.

TRUNCATE purchase_prices RESTART IDENTITY CASCADE;
TRUNCATE purchase_products RESTART IDENTITY CASCADE;
