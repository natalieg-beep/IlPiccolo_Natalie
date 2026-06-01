-- Patch 8: Rabatt, Zahlungsart, Gruppentyp, Aufs-Haus

ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;
  -- Werte: 'card' | 'cash' | 'schwarz'

ALTER TABLE orders ADD COLUMN IF NOT EXISTS group_type text;
  -- Werte: 'couple' | 'family' | 'single' | 'friends' | 'business'

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS on_the_house boolean DEFAULT false;
