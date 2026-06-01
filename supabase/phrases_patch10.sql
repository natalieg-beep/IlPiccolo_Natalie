-- Patch 10: Service-Phrasen (Karte, Bestellung, Dessert, Kaffee, Teller, Tiramisu, Google)

INSERT INTO phrases (category, german, turkish, pronunciation, formality) VALUES
  ('Küche', 'Hier ist unsere Karte.',
   'İşte menümüz.', 'İş-te me-nü-müz.', 'both'),

  ('Küche', 'Möchten Sie bestellen?',
   'Sipariş vermek ister misiniz?', 'Si-pa-riş ver-mek is-ter mi-si-niz?', 'formal'),
  ('Küche', 'Möchten Sie bestellen?',
   'Sipariş vermek ister misin?', 'Si-pa-riş ver-mek is-ter mi-sin?', 'informal'),

  ('Küche', 'Möchten Sie ein Dessert?',
   'Tatlı ister misiniz?', 'Tat-lı is-ter mi-si-niz?', 'formal'),
  ('Küche', 'Möchten Sie ein Dessert?',
   'Tatlı ister misin?', 'Tat-lı is-ter mi-sin?', 'informal'),

  ('Küche', 'Möchten Sie einen Kaffee dazu?',
   'Yanında kahve ister misiniz?', 'Ya-nın-da kah-ve is-ter mi-si-niz?', 'formal'),
  ('Küche', 'Möchten Sie einen Kaffee dazu?',
   'Yanında kahve ister misin?', 'Ya-nın-da kah-ve is-ter mi-sin?', 'informal'),

  ('Küche', 'Möchten Sie einen weiteren kleinen Teller?',
   'Bir tabak daha ister misiniz?', 'Bir ta-bak da-ha is-ter mi-si-niz?', 'formal'),
  ('Küche', 'Möchten Sie einen weiteren kleinen Teller?',
   'Bir tabak daha ister misin?', 'Bir ta-bak da-ha is-ter mi-sin?', 'informal'),

  ('Küche', 'Wir haben hausgemachte Tiramisu ohne Alkohol.',
   'Ev yapımı alkolsüz tiramisu var.', 'Ev ya-pı-mı al-kol-süz ti-ra-mi-su var.', 'both'),

  ('Zahlung', 'Wir freuen uns über eine positive Google Bewertung.',
   'Olumlu bir Google yorumu bizim için çok değerli.', 'O-lum-lu bir Goog-le yo-ru-mu bi-zim i-çin çok de-ğer-li.', 'both');
