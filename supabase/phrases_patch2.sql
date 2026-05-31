-- ── Löschen ──────────────────────────────────────────────────────────────
DELETE FROM phrases WHERE turkish IN (
  'İyi günler!',
  'İyi akşamlar!',
  'Buyurun, buyurun!',
  'İyi geceler!',
  'Güle güle!'
);

-- ── Neue Phrasen einfügen ─────────────────────────────────────────────────

INSERT INTO phrases (category, turkish, german, pronunciation, sort_order, formality) VALUES

-- Toilette (neue Kategorie: Orientierung)
('Orientierung', 'Tuvalet kapıdan düz gidin, sonra sağa.', 'Die Toilette ist durch die Tür, dann rechts.', 'Tu-va-let ka-py-dan düs gi-din son-ra sa-a', 1, 'both'),
('Orientierung', 'Tuvalet orada ileride, sağda.', 'Die Toilette ist da vorne rechts.', 'Tu-va-let o-ra-da i-le-ri-de sa-da', 2, 'both'),

-- Abräumen / Glas (zu Nachfragen)
('Nachfragen', 'Bardağı alabilir miyim?', 'Darf ich das Glas mitnehmen?', 'Bar-da-y a-la-bi-lir mi-jim', 8, 'both'),
('Nachfragen', 'Masayı toplayabilir miyim?', 'Darf ich abräumen?', 'Ma-sa-y top-la-ja-bi-lir mi-jim', 9, 'both'),
('Nachfragen', 'Özür dilerim, masayı hızlıca silmek istiyorum.', 'Entschuldigung, ich möchte kurz den Tisch abwischen.', 'Ö-sür di-le-rim ma-sa-y hyz-ly-dscha sil-mek is-ti-jo-rum', 10, 'both'),

-- Woher (formal + informal)
('Smalltalk', 'Nerelisiniz?', 'Woher kommen Sie?', 'Ne-re-li-si-niz', 1, 'formal'),
('Smalltalk', 'Nerelisin?', 'Woher kommst du?', 'Ne-re-li-sin', 1, 'informal'),

-- Meine Empfehlungen für weitere wichtige Phrasen:

-- Küche / Verfügbarkeit
('Küche', 'Maalesef ... kalmadı.', 'Leider haben wir kein ... mehr.', 'Ma-a-le-sef ... kal-ma-dy', 1, 'both'),
('Küche', 'Bu ev yapımı.', 'Das ist hausgemacht.', 'Bu ev ja-py-my', 2, 'both'),
('Küche', 'Mutfak saat ... de kapanıyor.', 'Die Küche schließt um ... Uhr.', 'Mut-fak sa-at ... de ka-pa-ny-jor', 3, 'both'),
('Küche', 'Bir dakika, getiriyorum.', 'Einen Moment, ich hole es.', 'Bir da-ki-ka ge-ti-ri-jo-rum', 4, 'both'),

-- Reservierung / Ankunft
('Willkommen', 'Rezervasyonunuz var mı?', 'Haben Sie reserviert?', 'Re-ser-vas-jo-nu-nuz var my', 7, 'formal'),
('Willkommen', 'Rezervasyonun var mı?', 'Hast du reserviert?', 'Re-ser-vas-jo-nun var my', 7, 'informal'),
('Willkommen', 'Kaç kişisiniz?', 'Wie viele Personen sind Sie?', 'Katsch ki-schi-si-niz', 8, 'both'),
('Willkommen', 'Dışarıda mı, içeride mi?', 'Draußen oder drinnen?', 'Dy-scha-ry-da my i-tsche-ri-de mi', 9, 'both'),

-- Smalltalk
('Smalltalk', 'Kaş''ı sevdiniz mi?', 'Mögen Sie Kaş?', 'Kasch-y sev-di-niz mi', 2, 'formal'),
('Smalltalk', 'Kaş''ı sevdin mi?', 'Magst du Kaş?', 'Kasch-y sev-din mi', 2, 'informal'),
('Smalltalk', 'Tatil için mi buradasınız?', 'Sind Sie im Urlaub hier?', 'Ta-til i-tschin mi bu-ra-da-sy-nyz', 3, 'formal'),
('Smalltalk', 'Tatil için mi buradasın?', 'Bist du im Urlaub hier?', 'Ta-til i-tschin mi bu-ra-da-syn', 3, 'informal'),
('Smalltalk', 'Hava çok güzel bugün!', 'Das Wetter ist schön heute!', 'Ha-va tschok gü-sel bu-gün', 4, 'both'),
('Smalltalk', 'İlk defa mı geldiniz?', 'Ist das Ihr erster Besuch?', 'Ilk da-fa my gel-di-niz', 5, 'formal'),
('Smalltalk', 'İlk defa mı geldin?', 'Ist das dein erster Besuch?', 'Ilk da-fa my gel-din', 5, 'informal');
