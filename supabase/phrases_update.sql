-- Phrasen komplett ersetzen
DELETE FROM phrases;

INSERT INTO phrases (category, turkish, german, pronunciation, sort_order) VALUES

-- WILLKOMMEN
('Willkommen', 'Hoş geldiniz!', 'Willkommen!', 'Hosch gel-di-niz', 1),
('Willkommen', 'İyi günler!', 'Guten Tag!', 'I-yi gün-ler', 2),
('Willkommen', 'İyi akşamlar!', 'Guten Abend!', 'I-yi ak-scham-lar', 3),
('Willkommen', 'Buyurun, buyurun!', 'Bitte, bitte! (einladen)', 'Bu-ju-run', 4),
('Willkommen', 'Lütfen oturun!', 'Bitte setzen Sie sich!', 'Lüt-fen o-tu-run', 5),
('Willkommen', 'Hoş geldiniz, bekleniyordunuz!', 'Willkommen, Sie wurden erwartet!', 'Hosch gel-di-niz bek-le-ni-jor-du-nuz', 6),

-- VORSTELLUNG
('Vorstellung', 'Benim adım Natalie.', 'Mein Name ist Natalie.', 'Be-nim a-dym Na-ta-lie', 1),
('Vorstellung', 'Ben bu akşam ev sahibinizim.', 'Ich bin heute Abend Ihre Gastgeberin.', 'Ben bu ak-scham ev sa-hi-bi-ni-sim', 2),
('Vorstellung', 'Türkçem henüz çok iyi değil, ama öğreniyorum!', 'Mein Türkisch ist noch nicht so gut, aber ich lerne!', 'Türk-tschemm he-nüs tschok i-yi de-il, a-ma ö-ren-i-jo-rum', 3),
('Vorstellung', 'Biraz sabır gösterin lütfen.', 'Bitte habt etwas Geduld mit mir.', 'Bi-ras sa-byr gös-te-rin lüt-fen', 4),
('Vorstellung', 'Anlamadım, tekrar edebilir misiniz?', 'Ich habe nicht verstanden, können Sie wiederholen?', 'An-la-ma-dym, tek-rar e-de-bi-lir mi-si-niz', 5),
('Vorstellung', 'Çok teşekkür ederim!', 'Vielen Dank!', 'Tschok te-schek-kür e-de-rim', 6),

-- GETRÄNKE
('Getränke', 'Bir şey içmek ister misiniz?', 'Möchten Sie etwas trinken?', 'Bir schej itsch-mek is-ter mi-si-niz', 1),
('Getränke', 'Başka bir içecek ister misiniz?', 'Noch etwas zu trinken?', 'Basch-ka bir itsche-dschek is-ter mi-si-niz', 2),
('Getränke', 'Su ister misiniz?', 'Möchten Sie Wasser?', 'Su is-ter mi-si-niz', 3),
('Getränke', 'Soğuk mu, sıcak mı?', 'Kalt oder warm?', 'So-uk mu, sy-dschak my', 4),
('Getränke', 'Soda mı, mineral mi?', 'Soda oder Mineralwasser?', 'So-da my, mi-ne-ral my', 5),
('Getränke', 'Kahve ister misiniz?', 'Möchten Sie Kaffee?', 'Kah-ve is-ter mi-si-niz', 6),
('Getränke', 'Ayran ister misiniz?', 'Möchten Sie Ayran?', 'Aj-ran is-ter mi-si-niz', 7),

-- PIZZA
('Pizza', 'Pizzanız hazır!', 'Ihre Pizza ist fertig!', 'Piz-za-nyz ha-zyr', 1),
('Pizza', 'Afiyet olsun!', 'Guten Appetit!', 'A-fi-jet ol-sun', 2),
('Pizza', 'Bu bizim özel pizzamız.', 'Das ist unsere Spezial-Pizza.', 'Bu bi-sim ö-sel piz-za-myz', 3),
('Pizza', 'Bugünün önerisi bu pizza.', 'Die Empfehlung des Tages ist diese Pizza.', 'Bu-gü-nün ö-ne-ri-si bu piz-za', 4),
('Pizza', 'Acılı mı, acısız mı?', 'Scharf oder nicht scharf?', 'A-dschy-ly my, a-dschy-sys my', 5),
('Pizza', 'Vejetaryen seçeneğimiz var.', 'Wir haben vegetarische Optionen.', 'Ve-je-tar-jen se-tsche-ne-i-mis var', 6),
('Pizza', 'Fırından taze geliyor.', 'Frisch aus dem Ofen.', 'Fy-ryn-dan ta-se ge-li-jor', 7),

-- NACHFRAGEN
('Nachfragen', 'Başka bir şey ister misiniz?', 'Möchten Sie noch etwas?', 'Basch-ka bir schej is-ter mi-si-niz', 1),
('Nachfragen', 'Her şey yolunda mı?', 'Ist alles in Ordnung?', 'Her schej jo-lun-da my', 2),
('Nachfragen', 'Nasıl buldunuz?', 'Wie hat es Ihnen geschmeckt?', 'Na-syl bul-du-nuz', 3),
('Nachfragen', 'Beğendiniz mi?', 'Hat es Ihnen gefallen?', 'Be-en-di-niz mi', 4),
('Nachfragen', 'Tabağı alabilir miyim?', 'Darf ich den Teller mitnehmen?', 'Ta-ba-y a-la-bi-lir mi-jim', 5),
('Nachfragen', 'Biraz bekler misiniz?', 'Einen Moment bitte?', 'Bi-ras bek-ler mi-si-niz', 6),
('Nachfragen', 'Hemen bakıyorum.', 'Ich schau sofort nach.', 'He-men ba-ky-jo-rum', 7),

-- ZAHLUNG
('Zahlung', 'Hesabı getirebilir miyim?', 'Darf ich die Rechnung bringen?', 'He-sa-by ge-ti-re-bi-lir mi-jim', 1),
('Zahlung', 'Kasa içeride.', 'Die Kasse ist drinnen.', 'Ka-sa i-tsche-ri-de', 2),
('Zahlung', 'Nakit mi, kart mı?', 'Bar oder Karte?', 'Na-kit mi, kart my', 3),
('Zahlung', 'Toplam ... Türk lirası.', 'Insgesamt ... Türkische Lira.', 'Top-lam ... Türk li-ra-sy', 4),
('Zahlung', 'Üstü kalsın.', 'Der Rest ist für Sie.', 'Üs-tü kal-syn', 5),
('Zahlung', 'Fatura ister misiniz?', 'Möchten Sie eine Quittung?', 'Fa-tu-ra is-ter mi-si-niz', 6),
('Zahlung', 'Çok teşekkür ederiz!', 'Vielen Dank!', 'Tschok te-schek-kür e-de-ris', 7),

-- VERABSCHIEDUNG
('Verabschiedung', 'İyi günler!', 'Auf Wiedersehen!', 'I-yi gün-ler', 1),
('Verabschiedung', 'İyi geceler!', 'Gute Nacht!', 'I-yi ge-dsche-ler', 2),
('Verabschiedung', 'Güle güle!', 'Tschüss / Auf Wiedersehen!', 'Gü-le gü-le', 3),
('Verabschiedung', 'Tekrar bekleriz!', 'Wir freuen uns, Sie wiederzusehen!', 'Tek-rar bek-le-ris', 4),
('Verabschiedung', 'İyi tatiller!', 'Schönen Urlaub!', 'I-yi ta-til-ler', 5),
('Verabschiedung', 'Kaş''ı sevdiniz mi?', 'Mögen Sie Kaş?', 'Kasch-y sev-di-niz mi', 6),

-- PROBLEM
('Problem', 'Özür dilerim!', 'Entschuldigung!', 'Ö-sür di-le-rim', 1),
('Problem', 'Çok üzgünüm.', 'Das tut mir sehr leid.', 'Tschok üs-gü-nüm', 2),
('Problem', 'Hemen hallederim.', 'Ich kümmere mich sofort darum.', 'He-men hal-le-de-rim', 3),
('Problem', 'Bir dakika lütfen.', 'Einen Moment bitte.', 'Bir da-ki-ka lüt-fen', 4),
('Problem', 'Şefimize soracağım.', 'Ich frage unseren Koch.', 'Sche-fi-mi-se so-ra-dsha-ym', 5);
