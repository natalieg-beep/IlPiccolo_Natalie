-- Patch 7: Pizza-Ess-Hinweise

INSERT INTO phrases (category, german, turkish, pronunciation, formality) VALUES
  ('Pizza', 'Unsere Pizza schneidet man mit einer Schere.', 'Pizzamızı makasla keseriz.', 'Piz-za-mı-zı ma-kas-la ke-se-riz.', 'both'),
  ('Pizza', 'Nur bis zur Mitte schneiden, dann das nächste Stück bis zur Mitte schneiden.', 'Sadece ortaya kadar kesin, sonra bir sonraki dilimi ortaya kadar kesin.', 'Sa-de-ce or-ta-ya ka-dar ke-sin, son-ra bir son-ra-ki di-li-mi or-ta-ya ka-dar ke-sin.', 'formal'),
  ('Pizza', 'Nur bis zur Mitte schneiden, dann das nächste Stück bis zur Mitte schneiden.', 'Sadece ortaya kadar kes, sonra bir sonraki dilimi ortaya kadar kes.', 'Sa-de-ce or-ta-ya ka-dar kes, son-ra bir son-ra-ki di-li-mi or-ta-ya ka-dar kes.', 'informal'),
  ('Pizza', 'Wir haben auch Besteck.', 'Çatal bıçağımız da var.', 'Ça-tal bı-ça-ğı-mız da var.', 'both'),
  ('Pizza', 'Wir haben auch Messer und Gabel.', 'Bıçak ve çatalımız da var.', 'Bı-çak ve ça-ta-lı-mız da var.', 'both'),
  ('Pizza', 'Das Besteck ist dazu da, um die Burrata zu verteilen.', 'Çatal bıçak, burratayı yaymak içindir.', 'Ça-tal bı-çak, bur-ra-ta-yı yay-mak i-çin-dir.', 'both'),
  ('Pizza', 'Pizzastück in der Mitte knicken und dann essen.', 'Pizza dilimini ortadan katlayıp yiyin.', 'Piz-za di-li-mi-ni or-ta-dan kat-la-yıp yi-yin.', 'formal'),
  ('Pizza', 'Pizzastück in der Mitte knicken und dann essen.', 'Pizza dilimini ortadan katlayıp ye.', 'Piz-za di-li-mi-ni or-ta-dan kat-la-yıp ye.', 'informal');
