-- Patch 21: Import Investitionskosten (143 Einträge aus Excel)
-- Kategorien werden per Subquery aufgelöst

-- Neue Händler
INSERT INTO suppliers (name, category) VALUES ('Ablösesumme', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Architekt', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Notar', 'behoerde') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Ticaret Odasi', 'behoerde') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Dask', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Schreibwaren Bilgin', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Kase Stempel', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Su Atiksu', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Patent Danışmanlık', 'lieferant') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Flug Serkan', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Flug Sedat', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Flug Vedat', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Unterkunft Kas', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('ÖNCÜ Schloß ?', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Fettabscheider', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Wasserinstallateur', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Büyük Boy 25 Cm Makas', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Elektriker', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Messer/Klebeband', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('NAPS', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('GÜLTEN KARTAL', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('SARICAOĞLU ORMAN ÜRÜNLERİ', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('AYAS ASPİRATÖR VANTİLATÖR ELK', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Bewirtung', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('GÖREN LOJİSTİK GRUP', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('ALİ ÖZDEMİRLİ', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Domain Hostinger', 'lieferant') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Web KI Hostinger', 'lieferant') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Öncü', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Menulux', 'lieferant') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('GAZİOĞLU - Beko x30 tr', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('GÖKSEL AVCI', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('META ENDÜSTRİYEL MUTFAK', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('FATİH KARAASLAN', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('TORU LPG İÇECEK TİCARET', 'lieferant') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('MUSA KARA', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Schreiner', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('RECEP ÇOŞAR Tabella', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Horeca Kurumsal', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Ilhan Polat', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Mehmet Keles ve ort.', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Kuzey Outdoor Ayakkabi', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Özkan Elektrik', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Abdullah Hamarat', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Antalya Büyüksehir', 'behoerde') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Kas belediyesi', 'behoerde') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('3SD Danismanlik', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Burcu Sar', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Yolcu Kargo Lojistik', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Unikom', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('TECHNOJET ELEKTRONİK', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('NYSAMO MOBİLYA İNŞAAT', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Bauhaus', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Ikea', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Token Finansal Teknolojiler', 'lieferant') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Eymen E ticaret', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Hakbilener', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Ezupack Ambalaj', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('PUKCAR MADENİ', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('FIRINCI MARKET GASTRONOMİ', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Metro', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('POS ALIŞVERİŞ (YURTIÇI)', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Yapı ve Kredi Bankası', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Türkiye İş Bankası ''PAL''', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('SANAL POS ALIŞVERİŞ (YURTIÇI)', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('POS ALIŞVERİŞ', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('gaz TORU LPG İÇECEK TİCARET', 'lieferant') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('SANAL POS ALIŞVERİŞ', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('malzeme HAKBİLENLER DAYANIKLI', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Türkiye Halk Bankası', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('PTT-ACMDCGM1R-170426 PTTEM TEKNOLOJİ VE ELEKTRONİK', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Türkiye Garanti Bankası', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('POS ALIŞVERİŞ (YURTIÇI) (5169...2882)', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('POS', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('SANAL POS', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('SİLİNMİŞ KERESTE', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('ABDULLAH HAMARAT', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Migros', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Lüfter Außen Handwerker', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('MDF DOLAP', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('ilaçlama Ungeziefer', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('ALPİNPLAST', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Elif Oral Jet E Ticaret', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('SEMİH MERT BÜRÜHAN', 'handwerker') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('AS POLAT E-TİCARET', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('BAKKALOĞLU TEKSTİL', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('Korucu otel', 'sonstiges') ON CONFLICT DO NOTHING;
INSERT INTO suppliers (name, category) VALUES ('HRC', 'handwerker') ON CONFLICT DO NOTHING;

-- Ausgaben
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Ablösesumme' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Ablösesumme%' LIMIT 1),
  '2026-04-01', 'Ablösesumme',
  1500000.0, NULL, NULL, 1500000.0,
  'offiziell', 'überweisung', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Architekt%' LIMIT 1),
  '2026-04-09', 'Architekt',
  30000.0, 6000.0, NULL, 36015.81,
  'offiziell', 'überweisung', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Rechts & Notar' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Notar%' LIMIT 1),
  '2026-04-07', 'Notar',
  1731.46, 239.93, NULL, 1971.39,
  'bar', 'nakit', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Rechts & Notar' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Notar%' LIMIT 1),
  '2026-04-07', 'Notar',
  2448.51, 308.92, NULL, 2757.43,
  'bar', 'nakit', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Rechts & Notar' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Ticaret Odasi%' LIMIT 1),
  '2026-04-07', 'Ticaret Odasi',
  22700.0, NULL, NULL, 22700.0,
  'bar', 'nakit', true, 'import',
  'Rechnung liegt nicht vor');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Versicherung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Dask%' LIMIT 1),
  '2026-04-08', 'Dask',
  1562.0, NULL, NULL, 1562.0,
  'bar', 'nakit', true, 'import',
  'Brutto Betrag, kein KDV');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Schreibwaren Bilgin%' LIMIT 1),
  '2026-04-08', 'Schreibwaren Bilgin',
  400.0, 80.0, NULL, 480.0,
  'bar', 'nakit', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Kase Stempel%' LIMIT 1),
  '2026-04-08', 'Kase Stempel',
  800.0, 160.0, NULL, 968.0,
  'offiziell', 'überweisung', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Su Atiksu%' LIMIT 1),
  '2026-04-08', 'Su Atiksu',
  1090.0, NULL, NULL, 1090.0,
  'bar', 'nakit', true, 'import',
  'kein KDV');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Patent & Marke' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Patent Danışmanlık%' LIMIT 1),
  '2026-04-13', 'Patent Danışmanlık',
  8000.0, 1600.0, NULL, 9600.0,
  'offiziell', 'überweisung', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Schreibwaren Bilgin%' LIMIT 1),
  '2026-04-09', 'Schreibwaren Bilgin',
  89.58, 17.92, NULL, 107.5,
  'bar', 'nakit', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Transport & Reise' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Flug Serkan%' LIMIT 1),
  '2026-04-14', 'Flug Serkan',
  13262.47, NULL, NULL, 13262.47,
  'offiziell', 'überweisung', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Transport & Reise' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Flug Sedat%' LIMIT 1),
  '2026-04-14', 'Flug Sedat',
  18567.7, NULL, NULL, 18567.7,
  'offiziell', 'überweisung', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Transport & Reise' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Flug Vedat%' LIMIT 1),
  '2026-04-14', 'Flug Vedat',
  12731.91, NULL, NULL, 12731.91,
  'offiziell', 'überweisung', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Transport & Reise' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Unterkunft Kas%' LIMIT 1),
  '2026-05-01', 'Unterkunft Kas',
  13513.51, 1486.65, NULL, 15000.16,
  'bar', 'nakit', false, 'import',
  '(10% - 1351,35 - 1% 135,14)');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%ÖNCÜ Schloß ?%' LIMIT 1),
  NULL, 'ÖNCÜ Schloß ?',
  458.33, 91.67, NULL, 550.0,
  'offiziell', 'überweisung', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Geräte & Maschinen' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Fettabscheider%' LIMIT 1),
  '2026-04-15', 'Fettabscheider',
  4983.33, 996.67, NULL, 5980.0,
  'offiziell', 'überweisung', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Wasserinstallateur%' LIMIT 1),
  '2026-04-16', 'Wasserinstallateur',
  4000.0, NULL, NULL, 4000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Büyük Boy 25 Cm Makas%' LIMIT 1),
  '2026-04-16', 'Büyük Boy 25 Cm Makas',
  2708.34, 541.66, NULL, 3250.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Elektriker%' LIMIT 1),
  '2026-04-20', 'Elektriker',
  1000.0, NULL, NULL, 1000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Messer/Klebeband%' LIMIT 1),
  '2026-04-21', 'Messer/Klebeband',
  150.0, NULL, NULL, 150.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%NAPS%' LIMIT 1),
  '2026-04-18', 'NAPS',
  158000.0, 31600.0, NULL, 189600.0,
  'offiziell', 'überweisung', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%GÜLTEN KARTAL%' LIMIT 1),
  '2026-04-21', 'GÜLTEN KARTAL',
  10500.0, 2100.0, NULL, 12600.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%SARICAOĞLU ORMAN ÜRÜNLERİ%' LIMIT 1),
  '2026-04-18', 'SARICAOĞLU ORMAN ÜRÜNLERİ',
  10000.0, 2000.0, NULL, 12000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Geräte & Maschinen' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%AYAS ASPİRATÖR VANTİLATÖR ELK%' LIMIT 1),
  '2026-04-22', 'AYAS ASPİRATÖR VANTİLATÖR ELK',
  6873.6, 1374.72, NULL, 8248.32,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Bewirtung%' LIMIT 1),
  '2026-04-23', 'Bewirtung',
  2000.0, NULL, NULL, 2000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Transport & Reise' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%GÖREN LOJİSTİK GRUP%' LIMIT 1),
  '2026-04-23', 'GÖREN LOJİSTİK GRUP',
  17000.0, 3400.0, NULL, 20400.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Hakbilenler%' LIMIT 1),
  '2026-04-23', 'Hakbilenler',
  260000.0, 52000.0, NULL, 312000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%ALİ ÖZDEMİRLİ%' LIMIT 1),
  '2026-04-24', 'ALİ ÖZDEMİRLİ',
  600.0, 120.0, NULL, 720.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Kassensystem' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Domain Hostinger%' LIMIT 1),
  '2026-04-23', 'Domain Hostinger',
  206.99, 41.4, NULL, 248.39,
  'offiziell', 'karte', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Kassensystem' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Web KI Hostinger%' LIMIT 1),
  '2026-04-23', 'Web KI Hostinger',
  1233.46, 246.69, NULL, 1480.15,
  'offiziell', 'karte', true, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Öncü%' LIMIT 1),
  '2026-04-28', 'Öncü',
  416.67, 83.33, NULL, 500.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Kassensystem' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Menulux%' LIMIT 1),
  '2026-04-28', 'Menulux',
  73000.02, 9600.0, NULL, 82600.02,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Geräte & Maschinen' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%GAZİOĞLU - Beko x30 tr%' LIMIT 1),
  '2026-04-29', 'GAZİOĞLU - Beko x30 tr',
  7666.36, 766.64, NULL, 8433.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Geräte & Maschinen' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%GAZİOĞLU - Beko x30 tr%' LIMIT 1),
  '2026-04-29', 'GAZİOĞLU - Beko x30 tr',
  7666.36, 766.64, NULL, 8433.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Öncü%' LIMIT 1),
  '2026-04-24', 'Öncü',
  820.83, 164.17, NULL, 985.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Öncü%' LIMIT 1),
  '2026-04-23', 'Öncü',
  5625.0, 1125.0, NULL, 6750.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Öncü%' LIMIT 1),
  '2026-04-18', 'Öncü',
  3583.33, 716.67, NULL, 4300.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Öncü%' LIMIT 1),
  '2026-04-17', 'Öncü',
  1968.7, 388.74, NULL, 2332.44,
  'bar', 'nakit', false, 'import',
  '- 25 Iskonto');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%GÖKSEL AVCI%' LIMIT 1),
  '2026-05-12', 'GÖKSEL AVCI',
  10000.0, 2000.0, NULL, 12000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Öncü%' LIMIT 1),
  '2026-05-01', 'Öncü',
  5804.17, 1160.83, NULL, 6965.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Öncü%' LIMIT 1),
  '2026-05-02', 'Öncü',
  1929.17, 385.83, NULL, 2315.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Öncü%' LIMIT 1),
  '2026-05-07', 'Öncü',
  691.67, 138.33, NULL, 830.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Geräte & Maschinen' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%META ENDÜSTRİYEL MUTFAK%' LIMIT 1),
  '2026-05-06', 'META ENDÜSTRİYEL MUTFAK',
  52930.61, 10586.12, NULL, 63516.73,
  'bar', 'nakit', false, 'import',
  '- 1058,61 Skonto');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%FATİH KARAASLAN%' LIMIT 1),
  '2026-04-30', 'FATİH KARAASLAN',
  9000.0, 1800.0, NULL, 10800.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Gas' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%TORU LPG İÇECEK TİCARET%' LIMIT 1),
  '2026-05-14', 'TORU LPG İÇECEK TİCARET',
  3522.42, 346.58, NULL, 3869.0,
  'bar', 'nakit', false, 'import',
  '(10% 229,91TL, 20% 116,67TL)');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%MUSA KARA%' LIMIT 1),
  '2026-05-14', 'MUSA KARA',
  13000.0, 2600.0, NULL, 15600.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Wasserinstallateur%' LIMIT 1),
  NULL, 'Wasserinstallateur',
  5000.0, NULL, NULL, 5000.0,
  'bar', 'nakit', false, 'import',
  'ohne');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Schreiner%' LIMIT 1),
  NULL, 'Schreiner',
  5000.0, NULL, NULL, 5000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Werbung & Marketing' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%RECEP ÇOŞAR Tabella%' LIMIT 1),
  '2025-05-25', 'RECEP ÇOŞAR Tabella',
  44167.0, 8833.4, NULL, 53000.4,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Horeca Kurumsal%' LIMIT 1),
  '2026-05-09', 'Horeca Kurumsal',
  833.33, 166.67, NULL, 1000.0,
  'bar', 'nakit', false, 'import',
  '-6,67 TL Skonto');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Ilhan Polat%' LIMIT 1),
  '2026-05-09', 'Ilhan Polat',
  2083.33, 416.67, NULL, 2500.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Mehmet Keles ve ort.%' LIMIT 1),
  '2026-05-13', 'Mehmet Keles ve ort.',
  2129.17, 390.83, NULL, 2520.0,
  'bar', 'nakit', false, 'import',
  '10% - 35 TL - 20% 355,83');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Kuzey Outdoor Ayakkabi%' LIMIT 1),
  '2026-05-13', 'Kuzey Outdoor Ayakkabi',
  4101.8, 410.18, NULL, 4511.98,
  'bar', 'nakit', false, 'import',
  '0.1');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Öncü%' LIMIT 1),
  '2026-04-18', 'Öncü',
  3583.33, 716.67, NULL, 4300.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Özkan Elektrik%' LIMIT 1),
  '2026-04-23', 'Özkan Elektrik',
  12500.0, 2500.0, NULL, 15000.0,
  'bar', 'nakit', false, 'import',
  '- 6252,2 Skonto');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Özkan Elektrik%' LIMIT 1),
  '2026-04-23', 'Özkan Elektrik',
  1302.8, 260.56, NULL, 1563.36,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Ilhan Polat%' LIMIT 1),
  '2026-04-22', 'Ilhan Polat',
  1416.67, 283.33, NULL, 1700.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Ilhan Polat%' LIMIT 1),
  '2026-04-20', 'Ilhan Polat',
  158.33, 31.67, NULL, 190.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Abdullah Hamarat%' LIMIT 1),
  '2026-04-16', 'Abdullah Hamarat',
  1750.0, 350.0, NULL, 2100.0,
  'bar', 'nakit', false, 'import',
  '-358,3 Skonto');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Rechts & Notar' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Antalya Büyüksehir%' LIMIT 1),
  '2026-04-15', 'Antalya Büyüksehir',
  2986.66, 597.33, NULL, 3583.99,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Rechts & Notar' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Kas belediyesi%' LIMIT 1),
  '2026-04-09', 'Kas belediyesi',
  2750.0, NULL, NULL, 2750.0,
  'bar', 'nakit', false, 'import',
  'kein KDV');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Steuerberater' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%3SD Danismanlik%' LIMIT 1),
  '2026-05-13', '3SD Danismanlik',
  675.0, 135.0, NULL, 810.0,
  'bar', 'nakit', false, 'import',
  '90- Skonto');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Burcu Sar%' LIMIT 1),
  '2026-05-16', 'Burcu Sar',
  3328.33, 665.67, NULL, 3994.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Transport & Reise' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Yolcu Kargo Lojistik%' LIMIT 1),
  '2026-05-14', 'Yolcu Kargo Lojistik',
  290.84, 58.17, NULL, 349.01,
  'bar', 'nakit', false, 'import',
  '-8,33 Skonto');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Geräte & Maschinen' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Unikom%' LIMIT 1),
  '2026-05-12', 'Unikom',
  4350.0, 870.0, NULL, 5220.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Geräte & Maschinen' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%TECHNOJET ELEKTRONİK%' LIMIT 1),
  '2026-05-17', 'TECHNOJET ELEKTRONİK',
  1198.6, 239.72, NULL, 1438.32,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%NYSAMO MOBİLYA İNŞAAT%' LIMIT 1),
  '2026-05-15', 'NYSAMO MOBİLYA İNŞAAT',
  1403.76, 140.38, NULL, 1544.14,
  'bar', 'nakit', false, 'import',
  '-31,36 Skonto');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Bauhaus%' LIMIT 1),
  '2026-05-20', 'Bauhaus',
  4335.83, 867.17, NULL, 5203.0,
  'bar', 'nakit', false, 'import',
  '0.2');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Ikea%' LIMIT 1),
  '2026-05-20', 'Ikea',
  4873.84, 924.03, NULL, 5797.87,
  'bar', 'nakit', false, 'import',
  '10 und 20%');
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Kassensystem' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Token Finansal Teknolojiler%' LIMIT 1),
  '2026-05-02', 'Token Finansal Teknolojiler',
  8665.0, 1733.0, NULL, 10398.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Eymen E ticaret%' LIMIT 1),
  '2026-05-13', 'Eymen E ticaret',
  187.47, 37.49, NULL, 224.96,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Hakbilener%' LIMIT 1),
  '2026-05-19', 'Hakbilener',
  6000.0, 1200.0, NULL, 7200.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Ezupack Ambalaj%' LIMIT 1),
  '2026-05-18', 'Ezupack Ambalaj',
  1083.17, 216.63, NULL, 1299.8,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Geräte & Maschinen' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%PUKCAR MADENİ%' LIMIT 1),
  '2026-05-18', 'PUKCAR MADENİ',
  2475.0, 495.0, NULL, 2970.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Geräte & Maschinen' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%FIRINCI MARKET GASTRONOMİ%' LIMIT 1),
  '2026-05-19', 'FIRINCI MARKET GASTRONOMİ',
  2601.67, 520.33, NULL, 3122.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Metro%' LIMIT 1),
  '2026-05-20', 'Metro',
  11091.12, 2218.22, NULL, 13309.34,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Ilhan Polat%' LIMIT 1),
  '2026-05-21', 'Ilhan Polat',
  450.0, 90.0, NULL, 540.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Ilhan Polat%' LIMIT 1),
  '2026-05-22', 'Ilhan Polat',
  1100.0, 220.0, NULL, 1320.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS ALIŞVERİŞ (YURTIÇI)%' LIMIT 1),
  '2026-05-20', 'POS ALIŞVERİŞ (YURTIÇI)',
  324.43, 64.88, NULL, 389.31,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Yapı ve Kredi Bankası%' LIMIT 1),
  '2026-05-18', 'Yapı ve Kredi Bankası',
  10333.33, 2066.67, NULL, 12400.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Türkiye İş Bankası ''PAL''%' LIMIT 1),
  '2026-05-18', 'Türkiye İş Bankası ''PAL''',
  6187.5, 1237.5, NULL, 7425.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%SANAL POS ALIŞVERİŞ (YURTIÇI)%' LIMIT 1),
  '2026-05-18', 'SANAL POS ALIŞVERİŞ (YURTIÇI)',
  2208.33, 441.67, NULL, 2650.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%SANAL POS ALIŞVERİŞ (YURTIÇI)%' LIMIT 1),
  '2026-05-18', 'SANAL POS ALIŞVERİŞ (YURTIÇI)',
  2288.35, 457.67, NULL, 2746.02,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS ALIŞVERİŞ%' LIMIT 1),
  '2026-05-18', 'POS ALIŞVERİŞ',
  625.0, 125.0, NULL, 750.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Gas' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%gaz TORU LPG İÇECEK TİCARET%' LIMIT 1),
  '2026-04-14', 'gaz TORU LPG İÇECEK TİCARET',
  324.42, 64.88, NULL, 389.3,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS ALIŞVERİŞ%' LIMIT 1),
  '2026-05-13', 'POS ALIŞVERİŞ',
  4599.97, 919.99, NULL, 5519.96,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%SANAL POS ALIŞVERİŞ%' LIMIT 1),
  '2026-05-13', 'SANAL POS ALIŞVERİŞ',
  1478.83, 295.77, NULL, 1774.6,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS ALIŞVERİŞ%' LIMIT 1),
  '2026-05-13', 'POS ALIŞVERİŞ',
  621.17, 124.23, NULL, 745.4,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS ALIŞVERİŞ%' LIMIT 1),
  '2026-05-13', 'POS ALIŞVERİŞ',
  269.22, 53.84, NULL, 323.06,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%malzeme HAKBİLENLER DAYANIKLI%' LIMIT 1),
  '2026-05-11', 'malzeme HAKBİLENLER DAYANIKLI',
  3500.0, 700.0, NULL, 4200.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS ALIŞVERİŞ (YURTIÇI)%' LIMIT 1),
  '2026-04-30', 'POS ALIŞVERİŞ (YURTIÇI)',
  633.33, 126.67, NULL, 760.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS ALIŞVERİŞ (YURTIÇI)%' LIMIT 1),
  '2026-05-07', 'POS ALIŞVERİŞ (YURTIÇI)',
  125.0, 25.0, NULL, 150.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS ALIŞVERİŞ (YURTIÇI)%' LIMIT 1),
  '2026-04-27', 'POS ALIŞVERİŞ (YURTIÇI)',
  612.5, 122.5, NULL, 735.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS ALIŞVERİŞ (YURTIÇI)%' LIMIT 1),
  '2026-04-27', 'POS ALIŞVERİŞ (YURTIÇI)',
  357.5, 71.5, NULL, 429.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Türkiye Halk Bankası%' LIMIT 1),
  '2026-04-15', 'Türkiye Halk Bankası',
  4166.67, 833.33, NULL, 5000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Yapı ve Kredi Bankası%' LIMIT 1),
  '2026-04-16', 'Yapı ve Kredi Bankası',
  145.83, 29.17, NULL, 175.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Geräte & Maschinen' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%PTT-ACMDCGM1R-170426 PTTEM TEKNOLOJİ VE ELEKTRONİK%' LIMIT 1),
  '2026-04-17', 'PTT-ACMDCGM1R-170426 PTTEM TEKNOLOJİ VE ELEKTRONİK',
  8787.65, 1757.53, NULL, 10545.18,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Yapı ve Kredi Bankası%' LIMIT 1),
  '2026-04-20', 'Yapı ve Kredi Bankası',
  125.0, 25.0, NULL, 150.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Yapı ve Kredi Bankası%' LIMIT 1),
  '2026-04-20', 'Yapı ve Kredi Bankası',
  708.33, 141.67, NULL, 850.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Türkiye Garanti Bankası%' LIMIT 1),
  '2026-04-20', 'Türkiye Garanti Bankası',
  3333.33, 666.67, NULL, 4000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS ALIŞVERİŞ (YURTIÇI) (5169...2882)%' LIMIT 1),
  '2026-04-21', 'POS ALIŞVERİŞ (YURTIÇI) (5169...2882)',
  833.33, 166.67, NULL, 1000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Türkiye Garanti Bankası%' LIMIT 1),
  '2026-04-21', 'Türkiye Garanti Bankası',
  833.33, 166.67, NULL, 1000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%SANAL POS ALIŞVERİŞ (YURTIÇI)%' LIMIT 1),
  '2026-04-24', 'SANAL POS ALIŞVERİŞ (YURTIÇI)',
  3133.59, 626.72, NULL, 3760.31,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Türkiye Halk Bankası%' LIMIT 1),
  '2026-04-24', 'Türkiye Halk Bankası',
  12500.0, 2500.0, NULL, 15000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS ALIŞVERİŞ (YURTIÇI)%' LIMIT 1),
  '2026-04-24', 'POS ALIŞVERİŞ (YURTIÇI)',
  12708.33, 2541.67, NULL, 15250.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%POS%' LIMIT 1),
  '2026-04-24', 'POS',
  5000.0, 1000.0, NULL, 6000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%SANAL POS%' LIMIT 1),
  '2026-05-18', 'SANAL POS',
  6988.33, 1397.67, NULL, 8386.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%SİLİNMİŞ KERESTE%' LIMIT 1),
  '2026-04-16', 'SİLİNMİŞ KERESTE',
  4167.6, 833.52, NULL, 5001.12,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%ABDULLAH HAMARAT%' LIMIT 1),
  '2026-05-19', 'ABDULLAH HAMARAT',
  10333.34, 2066.67, NULL, 12400.01,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Migros%' LIMIT 1),
  '2026-05-29', 'Migros',
  1199.68, 299.92, NULL, 1499.6,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Lüfter Außen Handwerker%' LIMIT 1),
  '2025-05-31', 'Lüfter Außen Handwerker',
  5000.0, NULL, NULL, 5000.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%MDF DOLAP%' LIMIT 1),
  '2026-06-03', 'MDF DOLAP',
  7000.0, 700.0, NULL, 7700.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Sonstiges Einmalig' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%ilaçlama Ungeziefer%' LIMIT 1),
  '2026-06-05', 'ilaçlama Ungeziefer',
  1500.0, 300.0, NULL, 1800.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Öncü%' LIMIT 1),
  '2026-05-22', 'Öncü',
  116.67, 23.33, NULL, 140.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%ALPİNPLAST%' LIMIT 1),
  '2026-05-25', 'ALPİNPLAST',
  1988.33, 397.67, NULL, 2386.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Elif Oral Jet E Ticaret%' LIMIT 1),
  '2026-06-02', 'Elif Oral Jet E Ticaret',
  3178.0, 635.6, NULL, 3813.6,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%SARICAOĞLU ORMAN ÜRÜNLERİ%' LIMIT 1),
  '2026-05-20', 'SARICAOĞLU ORMAN ÜRÜNLERİ',
  9458.43, 1891.69, NULL, 11350.12,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%SEMİH MERT BÜRÜHAN%' LIMIT 1),
  '2026-05-21', 'SEMİH MERT BÜRÜHAN',
  625.0, 125.0, NULL, 750.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%AS POLAT E-TİCARET%' LIMIT 1),
  '2026-06-04', 'AS POLAT E-TİCARET',
  2030.0, 405.0, NULL, 2435.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Erstausstattung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%BAKKALOĞLU TEKSTİL%' LIMIT 1),
  '2026-06-01', 'BAKKALOĞLU TEKSTİL',
  1583.25, 316.65, NULL, 1899.9,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Transport & Reise' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Korucu otel%' LIMIT 1),
  '2026-05-29', 'Korucu otel',
  8783.34, 1756.67, NULL, 10540.01,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%HRC%' LIMIT 1),
  '2026-06-02', 'HRC',
  462.5, 92.5, NULL, 555.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%Ilhan Polat%' LIMIT 1),
  '2026-06-02', 'Ilhan Polat',
  155.0, 31.0, NULL, 186.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%HRC%' LIMIT 1),
  '2026-06-02', 'HRC',
  1000.0, 200.0, NULL, 1200.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%HRC%' LIMIT 1),
  '2026-06-02', 'HRC',
  7700.0, 1540.0, NULL, 9240.0,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%HRC%' LIMIT 1),
  '2026-06-02', 'HRC',
  579.16, 115.83, NULL, 694.99,
  'bar', 'nakit', false, 'import',
  NULL);
INSERT INTO expenses (category_id, supplier_id, date, description, amount_net, vat_amount, stopaj_amount, amount_gross, payment_type, payment_method, has_receipt, source, notes) VALUES (
  (SELECT id FROM expense_categories WHERE name = 'Umbau & Renovierung' LIMIT 1),
  (SELECT id FROM suppliers WHERE name ILIKE '%HRC%' LIMIT 1),
  '2026-06-02', 'HRC',
  458.33, 91.67, NULL, 550.0,
  'bar', 'nakit', false, 'import',
  NULL);
