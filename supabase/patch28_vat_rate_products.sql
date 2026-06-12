-- Patch 28: KDV-Satz in purchase_prices
ALTER TABLE purchase_prices ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) DEFAULT NULL;
COMMENT ON COLUMN purchase_prices.vat_rate IS 'KDV-Satz in % (1, 10 oder 20). NULL = nicht erfasst. price_tl ist immer NETTO.';
