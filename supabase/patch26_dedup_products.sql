-- Patch 26: Duplikate in purchase_products bereinigen
-- Behalte jeweils das älteste Produkt pro Name (case-insensitive),
-- verlege alle purchase_prices auf den "Gewinner" und lösche die Duplikate.

BEGIN;

-- 1. Finde alle Duplikat-Gruppen
WITH ranked AS (
  SELECT
    id,
    lower(trim(name)) AS name_key,
    ROW_NUMBER() OVER (PARTITION BY lower(trim(name)) ORDER BY created_at ASC) AS rn
  FROM purchase_products
),
winners AS (
  SELECT id AS winner_id, name_key FROM ranked WHERE rn = 1
),
losers AS (
  SELECT r.id AS loser_id, w.winner_id
  FROM ranked r
  JOIN winners w ON r.name_key = w.name_key
  WHERE r.rn > 1
)
-- 2. Preise auf Winner umlenken
UPDATE purchase_prices pp
SET product_id = l.winner_id
FROM losers l
WHERE pp.product_id = l.loser_id;

-- 3. Doppelte Produkte löschen
DELETE FROM purchase_products
WHERE id IN (
  SELECT r.id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY lower(trim(name)) ORDER BY created_at ASC) AS rn
    FROM purchase_products
  ) r
  WHERE r.rn > 1
);

COMMIT;

-- Prüfung: Sollte 0 ergeben wenn alles sauber
SELECT lower(trim(name)) as name_key, COUNT(*) as anzahl
FROM purchase_products
GROUP BY name_key
HAVING COUNT(*) > 1;
