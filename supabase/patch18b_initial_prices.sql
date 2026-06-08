-- Initiale Produkte + Preise aus Rechnungen vom 01.06.2026

WITH ins AS (
  INSERT INTO purchase_products (name, category, unit, notes) VALUES
    ('Pizzalık Un (Özmen Renata)',         'mehl',       'kg',  '25kg Sack'),
    ('Pastırma (Polonez Çemensiz Dana)',   'wurst',      'Stk', '250g Packung'),
    ('Biscoff Bisküvi (Lotus)',            'backen',     'Stk', '1kg / 4x250g'),
    ('Tuz (Horoz)',                        'sonstiges',  'kg',  '3kg Packung'),
    ('Domates',                            'gemuese',    'kg',  NULL),
    ('Nektarin',                           'gemuese',    'kg',  NULL),
    ('Kapya Biber',                        'gemuese',    'kg',  'Rote Spitzpaprika'),
    ('Mantar',                             'gemuese',    'kg',  NULL),
    ('Kırmızı Soğan',                      'gemuese',    'kg',  NULL),
    ('Roka',                               'gemuese',    'Stk', 'Bund'),
    ('Şili Biber',                         'gemuese',    'kg',  NULL),
    ('Çilek',                              'gemuese',    'kg',  NULL),
    ('Fesleğen',                           'gemuese',    'Stk', 'Bund'),
    ('Siyah Üzüm',                         'gemuese',    'kg',  'Schwarze Weintrauben'),
    ('Avokado',                            'gemuese',    'Stk', NULL),
    ('Maydanoz',                           'gemuese',    'Stk', 'Bund'),
    ('Kestane Mantarı',                    'gemuese',    'kg',  NULL),
    ('Hähnchenschenkel (Erpiliç Baget)',   'sonstiges',  'kg',  NULL),
    ('Burrata (Caseus 100g)',              'molkerei',   'Stk', '100g Stück'),
    ('Gorgonzola',                         'molkerei',   'kg',  NULL),
    ('Servietten (Mavi Beyaz 33x33)',      'verpackung', 'Pkg', '12x100 Blatt'),
    ('Kakao Tozu (Altınmarka)',            'backen',     'Stk', '1kg')
  RETURNING id, name
)
SELECT * FROM ins;
