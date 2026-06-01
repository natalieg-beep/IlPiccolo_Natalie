-- Patch 9: Korrektur "kesiyoruz" statt "keseriz"
UPDATE phrases
SET turkish      = 'Pizzamızı makasla kesiyoruz.',
    pronunciation = 'Piz-za-mı-zı ma-kas-la ke-si-yo-ruz.'
WHERE turkish LIKE '%makasla keseriz%';
