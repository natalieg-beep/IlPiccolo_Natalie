-- patch24: is_private flag für purchase_prices
-- Privat-Items auf Kassenzetteln (z.B. Hähnchen für zuhause) separat tracken

ALTER TABLE purchase_prices
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

-- Index für schnelle Filterung
CREATE INDEX IF NOT EXISTS idx_purchase_prices_is_private
  ON purchase_prices (is_private);
