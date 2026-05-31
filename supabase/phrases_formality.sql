-- Spalte hinzufügen
ALTER TABLE phrases ADD COLUMN IF NOT EXISTS formality text default 'both';

-- Alle löschen und neu einfügen
DELETE FROM phrases;

INSERT INTO phrases (category, turkish, german, pronunciation, sort_order, formality) VALUES

-- ═══════════════════════════════════════════
-- WILLKOMMEN
-- ═══════════════════════════════════════════
('Willkommen', 'Hoş geldiniz!',              'Willkommen! (Sie)',         'Hosch gel-di-niz',          1, 'formal'),
('Willkommen', 'Hoş geldin!',                'Willkommen! (Du)',          'Hosch gel-din',             1, 'informal'),
('Willkommen', 'İyi günler!',                'Guten Tag!',                'I-yi gün-ler',              2, 'both'),
('Willkommen', 'İyi akşamlar!',              'Guten Abend!',              'I-yi ak-scham-lar',         3, 'both'),
('Willkommen', 'Buyurun, buyurun!',          'Bitte, bitte! (einladen)',  'Bu-ju-run',                 4, 'both'),
('Willkommen', 'Lütfen oturun!',             'Bitte setzen Sie sich!',    'Lüt-fen o-tu-run',          5, 'formal'),
('Willkommen', 'Lütfen otur!',               'Bitte setz dich!',         'Lüt-fen o-tur',             5, 'informal'),
('Willkommen', 'Bekleniyordunuz!',           'Sie wurden erwartet!',      'Bek-le-ni-jor-du-nuz',      6, 'formal'),
('Willkommen', 'Seni bekliyorduk!',          'Wir haben auf dich gewartet!', 'Se-ni bek-li-jor-duk',  6, 'informal'),

-- ═══════════════════════════════════════════
-- VORSTELLUNG
-- ═══════════════════════════════════════════
('Vorstellung', 'Benim adım Natalie.',        'Mein Name ist Natalie.',    'Be-nim a-dym Na-ta-lie',   1, 'both'),
('Vorstellung', 'Ben bu akşam ev sahibinizim.', 'Ich bin heute Abend Ihre Gastgeberin.', 'Ben bu ak-scham ev sa-hi-bi-ni-sim', 2, 'formal'),
('Vorstellung', 'Ben bu akşam ev sahibinim.', 'Ich bin heute Abend deine Gastgeberin.', 'Ben bu ak-scham ev sa-hi-bi-nim', 2, 'informal'),
('Vorstellung', 'Türkçem henüz çok iyi değil, ama öğreniyorum!', 'Mein Türkisch ist noch nicht so gut, aber ich lerne!', 'Türk-tschemm he-nüs tschok i-yi de-il a-ma ö-ren-i-jo-rum', 3, 'both'),
('Vorstellung', 'Biraz sabır gösterin lütfen.', 'Bitte habt etwas Geduld mit mir.', 'Bi-ras sa-byr gös-te-rin lüt-fen', 4, 'formal'),
('Vorstellung', 'Biraz sabır göster lütfen.', 'Bitte hab etwas Geduld mit mir.', 'Bi-ras sa-byr gös-ter lüt-fen', 4, 'informal'),
('Vorstellung', 'Anlamadım, tekrar edebilir misiniz?', 'Ich habe nicht verstanden, können Sie wiederholen?', 'An-la-ma-dym tek-rar e-de-bi-lir mi-si-niz', 5, 'formal'),
('Vorstellung', 'Anlamadım, tekrar eder misin?', 'Ich habe nicht verstanden, kannst du wiederholen?', 'An-la-ma-dym tek-rar e-der mi-sin', 5, 'informal'),

-- ═══════════════════════════════════════════
-- GETRÄNKE
-- ═══════════════════════════════════════════
('Getränke', 'Bir şey içmek ister misiniz?',  'Möchten Sie etwas trinken?', 'Bir schej itsch-mek is-ter mi-si-niz', 1, 'formal'),
('Getränke', 'Bir şey içmek ister misin?',    'Möchtest du etwas trinken?', 'Bir schej itsch-mek is-ter mi-sin',    1, 'informal'),
('Getränke', 'Başka bir içecek ister misiniz?', 'Noch etwas zu trinken?',   'Basch-ka bir itsche-dschek is-ter mi-si-niz', 2, 'formal'),
('Getränke', 'Başka bir içecek ister misin?', 'Noch etwas zu trinken?',      'Basch-ka bir itsche-dschek is-ter mi-sin',    2, 'informal'),
('Getränke', 'Su ister misiniz?',             'Möchten Sie Wasser?',         'Su is-ter mi-si-niz',   3, 'formal'),
('Getränke', 'Su ister misin?',               'Möchtest du Wasser?',         'Su is-ter mi-sin',      3, 'informal'),
('Getränke', 'Soğuk mu, sıcak mı?',           'Kalt oder warm?',             'So-uk mu sy-dschak my', 4, 'both'),
('Getränke', 'Soda mı, mineral mi?',          'Soda oder Mineralwasser?',    'So-da my mi-ne-ral my', 5, 'both'),
('Getränke', 'Kahve ister misiniz?',          'Möchten Sie Kaffee?',         'Kah-ve is-ter mi-si-niz', 6, 'formal'),
('Getränke', 'Kahve ister misin?',            'Möchtest du Kaffee?',         'Kah-ve is-ter mi-sin',    6, 'informal'),
('Getränke', 'Ayran ister misiniz?',          'Möchten Sie Ayran?',          'Aj-ran is-ter mi-si-niz', 7, 'formal'),
('Getränke', 'Ayran ister misin?',            'Möchtest du Ayran?',          'Aj-ran is-ter mi-sin',    7, 'informal'),

-- ═══════════════════════════════════════════
-- PIZZA
-- ═══════════════════════════════════════════
('Pizza', 'Pizzanız hazır!',                'Ihre Pizza ist fertig!',         'Piz-za-nyz ha-zyr',  1, 'formal'),
('Pizza', 'Pizzan hazır!',                  'Deine Pizza ist fertig!',        'Piz-zan ha-zyr',     1, 'informal'),
('Pizza', 'Afiyet olsun!',                  'Guten Appetit!',                 'A-fi-jet ol-sun',    2, 'both'),
('Pizza', 'Bu bizim özel pizzamız.',        'Das ist unsere Spezial-Pizza.',  'Bu bi-sim ö-sel piz-za-myz', 3, 'both'),
('Pizza', 'Bugünün önerisi bu pizza.',      'Empfehlung des Tages.',          'Bu-gü-nün ö-ne-ri-si bu piz-za', 4, 'both'),
('Pizza', 'Acılı mı, acısız mı?',           'Scharf oder nicht scharf?',      'A-dschy-ly my a-dschy-sys my', 5, 'both'),
('Pizza', 'Vejetaryen seçeneğimiz var.',    'Wir haben vegetarische Optionen.', 'Ve-je-tar-jen se-tsche-ne-i-mis var', 6, 'both'),
('Pizza', 'Fırından taze geliyor.',         'Frisch aus dem Ofen.',           'Fy-ryn-dan ta-se ge-li-jor', 7, 'both'),
('Pizza', 'Glutensiz seçeneğimiz yok.',     'Wir haben keine glutenfreie Option.', 'Glu-ten-sis se-tsche-ne-i-mis jok', 8, 'both'),

-- ═══════════════════════════════════════════
-- NACHFRAGEN
-- ═══════════════════════════════════════════
('Nachfragen', 'Her şey yolunda mı?',        'Ist alles in Ordnung?',          'Her schej jo-lun-da my', 1, 'both'),
('Nachfragen', 'Nasıl buldunuz?',            'Wie hat es Ihnen geschmeckt?',   'Na-syl bul-du-nuz',      2, 'formal'),
('Nachfragen', 'Nasıl buldun?',              'Wie hat es dir geschmeckt?',     'Na-syl bul-dun',         2, 'informal'),
('Nachfragen', 'Beğendiniz mi?',             'Hat es Ihnen gefallen?',         'Be-en-di-niz mi',        3, 'formal'),
('Nachfragen', 'Beğendin mi?',               'Hat es dir gefallen?',           'Be-en-din mi',           3, 'informal'),
('Nachfragen', 'Tabağı alabilir miyim?',     'Darf ich den Teller mitnehmen?', 'Ta-ba-y a-la-bi-lir mi-jim', 4, 'both'),
('Nachfragen', 'Biraz bekler misiniz?',      'Einen Moment bitte?',            'Bi-ras bek-ler mi-si-niz', 5, 'formal'),
('Nachfragen', 'Biraz bekler misin?',        'Einen Moment bitte?',            'Bi-ras bek-ler mi-sin',    5, 'informal'),
('Nachfragen', 'Başka bir şey ister misiniz?', 'Möchten Sie noch etwas?',      'Basch-ka bir schej is-ter mi-si-niz', 6, 'formal'),
('Nachfragen', 'Başka bir şey ister misin?', 'Möchtest du noch etwas?',        'Basch-ka bir schej is-ter mi-sin',    6, 'informal'),
('Nachfragen', 'Hemen bakıyorum.',           'Ich schau sofort nach.',         'He-men ba-ky-jo-rum',    7, 'both'),

-- ═══════════════════════════════════════════
-- ZAHLUNG
-- ═══════════════════════════════════════════
('Zahlung', 'Hesabı getirebilir miyim?',   'Darf ich die Rechnung bringen?', 'He-sa-by ge-ti-re-bi-lir mi-jim', 1, 'both'),
('Zahlung', 'Kasa içeride.',               'Die Kasse ist drinnen.',          'Ka-sa i-tsche-ri-de',    2, 'both'),
('Zahlung', 'Nakit mi, kart mı?',          'Bar oder Karte?',                 'Na-kit mi kart my',      3, 'both'),
('Zahlung', 'Toplam ... Türk lirası.',     'Insgesamt ... Türkische Lira.',   'Top-lam ... Türk li-ra-sy', 4, 'both'),
('Zahlung', 'Üstü kalsın.',                'Der Rest ist für Sie/dich.',      'Üs-tü kal-syn',          5, 'both'),
('Zahlung', 'Fatura ister misiniz?',       'Möchten Sie eine Quittung?',      'Fa-tu-ra is-ter mi-si-niz', 6, 'formal'),
('Zahlung', 'Fatura ister misin?',         'Möchtest du eine Quittung?',      'Fa-tu-ra is-ter mi-sin',    6, 'informal'),
('Zahlung', 'Çok teşekkür ederiz!',        'Vielen Dank!',                    'Tschok te-schek-kür e-de-ris', 7, 'both'),

-- ═══════════════════════════════════════════
-- VERABSCHIEDUNG
-- ═══════════════════════════════════════════
('Verabschiedung', 'İyi günler!',           'Auf Wiedersehen!',               'I-yi gün-ler',           1, 'both'),
('Verabschiedung', 'İyi geceler!',          'Gute Nacht!',                    'I-yi ge-dsche-ler',      2, 'both'),
('Verabschiedung', 'Güle güle!',            'Tschüss!',                       'Gü-le gü-le',            3, 'both'),
('Verabschiedung', 'Tekrar bekleriz!',      'Wir freuen uns, Sie wiederzusehen!', 'Tek-rar bek-le-ris', 4, 'both'),
('Verabschiedung', 'İyi tatiller!',         'Schönen Urlaub!',                'I-yi ta-til-ler',        5, 'both'),
('Verabschiedung', 'Kaş''ı sevdiniz mi?',  'Mögen Sie Kaş?',                 'Kasch-y sev-di-niz mi',  6, 'formal'),
('Verabschiedung', 'Kaş''ı sevdin mi?',    'Magst du Kaş?',                  'Kasch-y sev-din mi',     6, 'informal'),

-- ═══════════════════════════════════════════
-- PROBLEM
-- ═══════════════════════════════════════════
('Problem', 'Özür dilerim!',                'Entschuldigung!',                'Ö-sür di-le-rim',        1, 'both'),
('Problem', 'Çok üzgünüm.',                 'Das tut mir sehr leid.',         'Tschok üs-gü-nüm',       2, 'both'),
('Problem', 'Hemen hallederim.',            'Ich kümmere mich sofort darum.', 'He-men hal-le-de-rim',   3, 'both'),
('Problem', 'Bir dakika lütfen.',           'Einen Moment bitte.',            'Bir da-ki-ka lüt-fen',   4, 'both'),
('Problem', 'Şefimize soracağım.',          'Ich frage unseren Koch.',        'Sche-fi-mi-se so-ra-dscha-ym', 5, 'both');
