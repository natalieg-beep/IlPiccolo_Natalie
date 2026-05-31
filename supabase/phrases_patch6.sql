INSERT INTO phrases (category, turkish, german, pronunciation, sort_order, formality) VALUES

-- Tische besetzt
('Willkommen', 'Maalesef şu an tüm masalar dolu, bir saat sonra gelin.', 'Leider sind alle Tische besetzt, kommen Sie in einer Stunde wieder.', 'Ma-a-le-sef schu an tüm ma-sa-lar do-lu bir sa-at son-ra ge-lin', 11, 'formal'),
('Willkommen', 'Maalesef şu an tüm masalar dolu, bir saat sonra gel.', 'Leider sind alle Tische besetzt, komm in einer Stunde wieder.', 'Ma-a-le-sef schu an tüm ma-sa-lar do-lu bir sa-at son-ra gel', 11, 'informal'),

-- Reservierung anbieten
('Willkommen', 'Bir masa rezerve etmemi ister misiniz?', 'Soll ich einen Tisch für Sie reservieren?', 'Bir ma-sa re-ser-ve et-me-mi is-ter mi-si-niz', 12, 'formal'),
('Willkommen', 'Bir masa rezerve etmemi ister misin?', 'Soll ich einen Tisch für dich reservieren?', 'Bir ma-sa re-ser-ve et-me-mi is-ter mi-sin', 12, 'informal'),

-- Dessert anbieten
('Nachfragen', 'Bir tatlı daha alır mısınız? Belki bir Tiramisu?', 'Darf es noch ein Dessert sein? Vielleicht ein Tiramisu?', 'Bir tat-ly da-ha a-lyr my-sy-nyz bel-ki bir Ti-ra-mi-su', 12, 'formal'),
('Nachfragen', 'Bir tatlı daha alır mısın? Belki bir Tiramisu?', 'Darf es noch ein Dessert sein? Vielleicht ein Tiramisu?', 'Bir tat-ly da-ha a-lyr my-syn bel-ki bir Ti-ra-mi-su', 12, 'informal'),

-- Kaffee anbieten
('Getränke', 'Kahve mi istersiniz, Türk kahvesi mi?', 'Möchten Sie einen Kaffee oder türkischen Kaffee?', 'Kah-ve mi is-ter-si-niz Türk kah-ve-si mi', 8, 'formal'),
('Getränke', 'Kahve mi istersin, Türk kahvesi mi?', 'Möchtest du einen Kaffee oder türkischen Kaffee?', 'Kah-ve mi is-ter-sin Türk kah-ve-si mi', 8, 'informal'),

-- Aufs Haus
('Zahlung', 'Türk kahvesi bizden!', 'Der türkische Kaffee geht aufs Haus!', 'Türk kah-ve-si bis-den', 8, 'both'),

-- Rabatt
('Zahlung', 'Bugün size %10 indirim var.', 'Heute gibt es 10% Rabatt für Sie.', 'Bu-gün si-se yüs-de on in-di-rim var', 9, 'formal'),
('Zahlung', 'Bugün sana %10 indirim var.', 'Heute gibt es 10% Rabatt für dich.', 'Bu-gün sa-na yüs-de on in-di-rim var', 9, 'informal');
