-- patch28: receipts Tabelle erweitern für Scan-Historie
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS filename     text;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS receipt_type text CHECK (receipt_type IN ('e-fatura','e-arsiv','kassenbon','handrechnung'));
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS vat_amount   numeric(10,2);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS item_count   integer;   -- Anzahl Produkte im Scan
