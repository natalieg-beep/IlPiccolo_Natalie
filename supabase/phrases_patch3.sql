-- Sizi bekliyorduk (formal, wärmer)
INSERT INTO phrases (category, turkish, german, pronunciation, sort_order, formality) VALUES
('Willkommen', 'Sizi bekliyorduk!', 'Wir haben auf Sie gewartet!', 'Si-si bek-li-jor-duk', 10, 'formal'),

-- Google Translate
('Kommunikation', 'Google Translate''i birlikte kullanabilir miyiz?', 'Können wir gemeinsam Google Translate verwenden?', 'Guu-gle Trans-lei-ti bir-lik-te kul-la-na-bi-lir mi-jis', 1, 'both'),
('Kommunikation', 'Telefonu görebilir miyim?', 'Darf ich Ihr/dein Handy sehen?', 'Te-le-fo-nu gö-re-bi-lir mi-jim', 2, 'both'),
('Kommunikation', 'Yavaş konuşabilir misiniz?', 'Können Sie langsamer sprechen?', 'Ja-vasch ko-nu-scha-bi-lir mi-si-niz', 3, 'formal'),
('Kommunikation', 'Yavaş konuşabilir misin?', 'Kannst du langsamer sprechen?', 'Ja-vasch ko-nu-scha-bi-lir mi-sin', 3, 'informal'),
('Kommunikation', 'Anlıyorum.', 'Ich verstehe.', 'An-ly-jo-rum', 4, 'both'),
('Kommunikation', 'Anlamıyorum, özür dilerim.', 'Ich verstehe nicht, Entschuldigung.', 'An-la-my-jo-rum ö-sür di-le-rim', 5, 'both'),

-- Weitere Fragen
('Nachfragen', 'Başka sorunuz var mı?', 'Haben Sie noch weitere Fragen?', 'Basch-ka so-ru-nuz var my', 11, 'formal'),
('Nachfragen', 'Başka sorun var mı?', 'Hast du noch weitere Fragen?', 'Basch-ka so-run var my', 11, 'informal'),

-- Meine Ergänzungen
('Kommunikation', 'Şunu söylemek istiyorum...', 'Ich möchte sagen...', 'Dschu-nu söj-le-mek is-ti-jo-rum', 6, 'both'),

-- Smalltalk Ergänzungen
('Smalltalk', 'Kaç gündür buradasınız?', 'Wie lange sind Sie schon hier?', 'Katsch gün-dür bu-ra-da-sy-nyz', 6, 'formal'),
('Smalltalk', 'Kaç gündür buradasın?', 'Wie lange bist du schon hier?', 'Katsch gün-dür bu-ra-da-syn', 6, 'informal'),
('Smalltalk', 'Kaş''ı çok seviyorum.', 'Ich liebe Kaş sehr.', 'Kasch-y tschok se-vi-jo-rum', 7, 'both'),
('Smalltalk', 'Deniz bugün çok güzel.', 'Das Meer ist heute sehr schön.', 'De-nis bu-gün tschok gü-sel', 8, 'both'),

-- Orientierung Ergänzungen
('Orientierung', 'Burada beklemenizi rica ederim.', 'Bitte warten Sie hier.', 'Bu-ra-da bek-le-me-ni-si ri-dscha e-de-rim', 3, 'formal'),
('Orientierung', 'Burada beklemeni rica ederim.', 'Bitte warte hier.', 'Bu-ra-da bek-le-me-ni ri-dscha e-de-rim', 3, 'informal'),
('Orientierung', 'Hemen geliyorum!', 'Ich komme sofort!', 'He-men ge-li-jo-rum', 4, 'both'),

-- Küche Ergänzungen
('Küche', 'Siparişinizi alabilir miyim?', 'Darf ich Ihre Bestellung aufnehmen?', 'Si-pa-ri-schi-ni-si a-la-bi-lir mi-jim', 5, 'formal'),
('Küche', 'Siparişini alabilir miyim?', 'Darf ich deine Bestellung aufnehmen?', 'Si-pa-ri-schi-ni a-la-bi-lir mi-jim', 5, 'informal');
