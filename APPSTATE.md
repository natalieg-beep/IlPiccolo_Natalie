# Il Piccolo N — App Status & Entwicklungshistorie

**Stand: 2026-06-15 | Letzter Commit: siehe git log**

## Letzte Änderungen (2026-06-15)

### Scan-System: Großes Update

#### Multi-Foto & Eingabewege
- **4 Eingabewege** nebeneinander: 📸 Kamera · 🖼️ Galerie (mehrere) · 📄 PDF · 📋 Text
- **Multi-Foto**: mehrere Fotos gleichzeitig wählen → Claude behandelt als einen langen Bon (dedupliziert)
- **Bulk-PDF**: mehrere PDFs vom gleichen Händler → automatisch Bulk-Modus → kombinierte Produktliste, jedes Item mit eigenem Datum
- **Bildkomprimierung**: Fotos werden client-seitig auf 1400px / JPEG 80% komprimiert (verhindert failed-to-fetch bei großen Handy-Fotos)
- **PDF-Fix**: PDFs werden als `type:'document'` an Claude API gesendet (nicht `type:'image'`) — war Ursache für "failed to match"

#### Händler-Erkennung (Edge Function)
- **Bidirektionaler Match**: DB "Bostan" ↔ Claude "Bostan Sebze Meyve Pazarı" → beide Richtungen geprüft, längster Match gewinnt
- **Aliases**: `suppliers.aliases text` Spalte — kommagetrennte Alternativnamen. Wenn Claude-Name kein Match → User wählt manuell → gelbes Banner "Als Alias speichern?" → nächstes Mal automatisch erkannt
- **BH28/Il Piccolo nie als Händler**: Prompt klärt explizit: SAYIN-Sektion = Käufer = wir → ignorieren
- **Trendyol**: alle Rechnungen mit trendyol.com URL / TY/TYA Fatura-Nr / Satış Kanalı=Trendyol → supplier_name = "Trendyol"
- **Verkäufer = oben links**: auf e-Arşiv Rechnungen ist der Lieferant immer der Rechnungsaussteller (oben links), nicht der "SAYIN"-Empfänger

#### Depozit (Flaschenkaution)
- DPZ.CC, DPZ.FAN, DPZ.SPR, DPZ.ZERO werden als eigene Produkte erkannt (category: verpackung)
  - `Depozit Coca-Cola`, `Depozit Coca-Cola Zero`, `Depozit Fanta`, `Depozit Sprite`
- Alle anderen DPZ/Güvence/Pfand weiterhin ignoriert

#### Scan-Historie (receipts Tabelle)
- Edge Function gibt jetzt auch Belegkopf-Daten zurück: ETTN, Fatura-Nr, Gesamtbetrag, KDV, receipt_type
- Beim Speichern → automatisch Eintrag in `receipts` Tabelle
- **Neuer Tab "📋 Belege"** in Ausgaben: Liste aller gescannten Belege mit Händler, Fatura-Nr, Betrag, KDV, ETTN (gekürzt), Dateiname, Scan-Zeitstempel, Anzahl Positionen
- Dateinamen werden beim Upload gespeichert (auch mehrere bei Bulk)

#### SQL Patches
- **patch28**: `receipts` Tabelle erweitert: `filename text`, `receipt_type text`, `vat_amount numeric`, `item_count integer`
- **suppliers.aliases**: `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS aliases text;`
- **Trendyol**: `INSERT INTO suppliers (name, category) VALUES ('Trendyol', 'sonstiges'); UPDATE suppliers SET active = true WHERE name = 'Trendyol';`

#### max_tokens
- scan-receipt Edge Function: 2048 → 4096 (für lange Bons / Bulk)

## Letzte Änderungen (2026-06-13)

### Menü-Updates
- **Üç Gen** hinzugefügt: Dessert, 190₺, Desc: "Fındıklı üçgen pasta"
- **Tonno EKSTRA** hinzugefügt: Extra, 200₺, Desc: "Ton balığı (50g)" → in EXTRA_GROUPS 🥩 Et-Gruppe
- **Ayran** Preis: 50₺ → 60₺
- Datei: `src/lib/menu.ts`

### Händler-Management (AusgabenClient)
- **Neuen Händler anlegen** direkt beim Scan: ➕-Button neben Händler-Dropdown
  - Inline-Formular: Name + Kategorie (🏪 Supermarkt / 🚚 Lieferant / Sonstiges)
  - Speichert in Supabase `suppliers`, wählt neuen Händler sofort aus
  - State: `localSuppliers`, `showNewSupplier`, `newSupplierName`, `newSupplierCat`, `savingSupplier`
  - Funktion: `saveNewSupplier()`
- **Scan erkennt unbekannten Händler**: `applyScanResult` prüft jetzt auch `supplier_name`
  - Wenn Händler erkannt aber nicht in DB → ➕-Formular öffnet sich automatisch mit Name vorausgefüllt
- **Händler-Liste bereinigt** (manuell in Supabase auszuführen):
  ```sql
  DELETE FROM suppliers;
  INSERT INTO suppliers (name, category) VALUES
    ('Muhtar',         'lieferant'),
    ('Bostan',         'lieferant'),
    ('BIM',            'supermarkt'),
    ('Altım Şen Gıda', 'lieferant'),
    ('Metro',          'supermarkt');
  ```
  ⚠️ Falls noch nicht ausgeführt → im Supabase SQL Editor einfügen!

## Letzte Änderungen (2026-06-12)

### BIM Preis-Bug (kritisch)
- Problem: Claude hat Brutto→Netto selbst ausgerechnet → Zahlendreher (469₺ → 64,36₺)
- Fix: Claude kopiert Zahlen nur noch exakt wie gedruckt + gibt `is_gross: true/false` zurück
- App rechnet: `toNetto()` in AusgabenClient.tsx → `brutto / (1 + vat_rate/100)`
- Edge Function `scan-receipt` neu deployed

### Produkt-Name editieren
- Fix: Error-Handling + autoFocus in `saveEditProduct()`

### Menulux-Eingabe verliert Fokus
- Ursache: `BruttoKdvBlock` war innerhalb der Render-Funktion definiert
- Fix: auf Modul-Ebene ausgelagert in `TagesabschlussClient.tsx`

### DB-Stand (12.06.2026)
- `purchase_products` und `purchase_prices` sind leer (absichtlich gelöscht, Neustart)

## Letzte Änderungen (11.06.2026) — v2

### Einkaufspreise komplett neu (patch24+25)
- **patch24**: `is_private boolean DEFAULT false` in `purchase_prices`
- **patch25**: Alle `purchase_prices` + `purchase_products` geleert (Neustart mit sauberen Daten)
- **AusgabenClient** komplett neu gebaut:
  - Neuer Tab **🛒 Produkte / 📊 Auswertung**
  - **Auswertung**: Wochen- und Monatsansicht mit Navigation, Gesamt/Geschäftlich/Privat-Split, Balkendiagramm nach Kategorie, tägliche Einkaufsliste
  - **Produkte bearbeiten**: ✏️-Button auf jedem Produkt → Name, Kategorie, Einheit ändern oder löschen
  - **Preise bearbeiten**: ✏️-Button auf jedem Preis-Eintrag → Menge, Einheit, Gesamtpreis, Privat-Flag, Datum korrigieren
  - **Scan-Bestätigung**: Menge/Einheit editierbar, Echtzeit-Einzelpreis, 🏢/🏠-Toggle pro Zeile
  - Scan-Prompt: Gebinde → Einzeleinheiten (Cola 24×0,5L → quantity:24 unit:Stk), Depozit ignoriert
- **Investitionskosten**: "📂 Nicht kategorisiert"-Gruppe für expenses ohne category_id

## Letzte Änderungen (11.06.2026)

### Bug-Fix: Bestellübersicht schwarz_bar-Anzeige
- ✅ **`UebersichtClient.tsx`** — Betragsanzeige war falsch für `schwarz_bar`-Orders
  - `isSchwarz` war bisher true für BEIDE: `schwarz` (gratis) UND `schwarz_bar` (Freunde zahlen bar)
  - Beide zeigten `gross` (alle Items inkl. `on_the_house`) statt korrektem Betrag → z.B. 840 statt 580 ₺
  - **Fix**: drei getrennte Variablen:
    - `isGratis` = `payment_method === 'schwarz'` → zeigt `gross` mit 🎁 (was verschenkt wurde)
    - `isSchwarzBar` = `payment_method === 'schwarz_bar'` → zeigt `charged` mit 🤝 (was Freunde zahlen)
    - `isSchwarz` = `isGratis || isSchwarzBar` (für grüne Farbgebung)

### Berechnungslogiken (Bestellübersicht)
- **`orderGross(o)`**: Σ(unit_price × qty) ohne on_the_house-Items — für Tagesübersicht
- **`orderRevenue(o)`**: 0 wenn schwarz/privat; sonst base × (1−discount%) − discount_amount (ohne on_the_house)
- **`gross` (Karte lokal)**: Σ ALLER Items inkl. on_the_house → Originalpreis durchgestrichen
- **`charged` (Karte lokal)**: = orderRevenue → was tatsächlich bezahlt wird
- **`schwarzTotal`**: Σ orderGross für alle schwarz+schwarz_bar Orders → was Freunde konsumiert haben

### Ayran
- Preis war bereits korrekt auf 50 ₺ in `src/lib/menu.ts` — keine Änderung nötig

## Letzte Änderungen (08.06.2026)
- ✅ **Global Bottom-Navigation**: fixe Tab-Bar auf allen Seiten (Küche / Service / Management)
  - `src/components/BottomNav.tsx` — Client Component, nutzt `usePathname`
  - Aktiver Tab farbig hervorgehoben (grün/gold/dunkel), unsichtbar auf `/login`
  - `layout.tsx` Root: `paddingBottom` für safe-area-inset
- ✅ **Ausgaben / Einkaufspreise** (`/management/ausgaben`) — komplett neu
  - Produktmatrix nach Kategorien, aufklappbarer Preisverlauf
  - Scan via Foto oder Text (PDF copy-paste) → Claude Vision → Bestätigungsscreen → Speichern
  - Manueller Preis- und Produkteintrag
  - Edge Function `scan-receipt` (Supabase) → Claude API (Sonnet 4.6, ~$0.02/Scan)
  - Base64-Fix: chunked Konvertierung (verhindert Stack Overflow bei großen Fotos)
- ✅ **Einnahmen-Bug gefixt**: Orders ohne `payment_method` wurden mit 0 ₺ gewertet
  - `closeOrder()` prüft jetzt ob Zahlungsart gewählt, speichert sie beim Abschließen
  - 26 historische Orders (payment_method=null) auf `cash` gesetzt
- ✅ Telegram-Benachrichtigungen: Cron-Job auf cron-job.org pausiert (Testphase)

## Letzte Änderungen (08.06.2026) — früher
- ✅ Service/OrderClient: "Aufs Haus" für einzelne Einheiten bei qty > 1 (Stepper − 🎁n +)
  - `onTheHouse` war `Set<string>`, jetzt `Record<string, number>` (Anzahl gratis pro Item)
  - Beim Speichern: bei teilweise gratis → 2 DB-Zeilen (eine on_the_house=true, eine false)
  - Beim Laden: gleiche Namen werden korrekt zusammengeführt
- ✅ Teig-Tracker: komplett neu gebaut
  - Alle Prozessschritte ①②③ immer sichtbar (nicht je nach Stage versteckt)
  - Jeder Timestamp hat ✏️ Edit-Button (auch draußen-Zeitstempel pro Box)
  - Box-Zuweisung in Schritt ②: Box erbt automatisch `teiglinge_at` als "im Kühlschrank seit"
  - Schritt ③ erscheint automatisch sobald erste Box rausgeholt wird
  - Jede draußen-Box hat eigenen individuellen 2–4h Timer ab `draussen_at`
  - Legacy-Stages (draussen/kuehlschrank) werden als teiglinge_geformt behandelt
- ✅ Einstellungen: "Keine Meldung" Option hinzugefügt (warn_before_hours = -1 als Sentinel)
  - "Alle deaktivieren" Button setzt alle Einträge auf "Keine Meldung"
  - Aktuell alle auf "Keine Meldung" gesetzt (Testphase)

## Letzte Änderungen (07.06.2026)
- ✅ Cron-Job: cron-job.org → alle 30 Min, Telegram-Test (?test=true) funktioniert
- ✅ Telegram: stündliche Erinnerung wenn überfällig (nicht nur einmalig)
- ✅ Telegram: Frische/Belag/Dessert gebündelt in einer Nachricht, Teig einzeln pro Charge
- ✅ Telegram-Fenster: 60 Min → 30 Min (mit needsNotification-Logik: jede volle Stunde)
- ✅ Teig-Prozess: 4 Schritte klar definiert (siehe unten)
- ✅ Box-Tracking: neue Tabelle kitchen_dough_boxes (1–10), pro Charge zuweisbar
- ✅ Box-Prozess: Zuweisen → Rausnehmen → Verarbeitet / Zurück in Kühlschrank
- ✅ Auto-fertig: Charge wird automatisch auf "fertig" gesetzt wenn alle Boxen verarbeitet
- ✅ Gas: 2 Gasflaschen (gas_1, gas_2) unabhängig voneinander
- ✅ Teig-Übersicht: Karte in Küchen-Übersicht klickbar → Link zu /kueche/teig
- ✅ Timezone-Fix: datetime-local Inputs zeigen korrekte Lokalzeit (Istanbul UTC+3)
- ✅ Batch-Namen: "Teig vom DD.MM.YYYY — Im Kühlschrank (Teiglinge)"

---

## Stack
- Next.js 16.2.6, App Router, TypeScript, Turbopack, `src/` dir
- Supabase SSR (`@supabase/ssr`), RLS aktiviert (Küchen-Tabellen: RLS deaktiviert)
- Auth: natalie.guenes.tr@gmail.com + vedat@ilpiccolo-kas.com (Supabase Auth)
- Git: `git@github.com:natalieg-beep/IlPiccolo_Natalie.git`
- Vercel Deploy: `il-piccolo-natalie.vercel.app`
- Root Directory in Vercel: leer (git init in `webapp/` Unterordner)
- **WICHTIG**: `proxy.ts` statt `middleware.ts` (Next.js 16 Breaking Change)
- Claude API: Anthropic (Sonnet 4.6 für scan-receipt), Secret: `ANTHROPIC_API_KEY` in Supabase

---

## App-Bereiche

### Service-Bereich (`/service`)
Für Natalie + Vedat (Supabase Auth Login)

### Management-Bereich (`/management`)
Für Natalie + Vedat (Supabase Auth Login)

### Küchen-Bereich (`/kueche`)
Für Natalie, Vedat, Rakim — **kein Supabase Auth**, nur Name antippen (localStorage)

---

## App-Struktur (Routen)

### Service-Bereich
- `/service` — Tischübersicht
- `/service/tisch/[id]` — Bestellung
- `/service/phrasen` — Türkische Phrasen

### Management-Bereich
- `/management` — Hub
- `/management/einnahmen` — Einnahmen-Analyse
- `/management/uebersicht` — Bestellungen bearbeiten
- `/management/tagesabschluss` — Tagesabschluss
- `/management/order/[id]` — Einzelbestellung bearbeiten
- `/management/ausgaben` — Einkaufspreise (Produktmatrix + Scan) ✅ neu

### Küchen-Bereich
- `/kueche` — User-Auswahl (Natalie / Vedat / Rakim, kein Passwort)
- `/kueche/home` — Hauptübersicht (Teig, Frische, Belag, Desserts, Täglich, Sonstiges)
- `/kueche/teig` — Teig-Tracker (Detail + History + Box-Management)
- `/kueche/mdh` — Mindesthaltbarkeit (Käse, Wurst etc.)
- `/kueche/einstellungen` — Frischezeiten + Vorwarnung pro Produkt konfigurieren

---

## Datenbankstruktur (Supabase)

### Service/Management-Tabellen

#### `tables`
- `id`, `label`, `location` (CHECK: outside/inside/takeaway/privat)

#### `orders`
- `id`, `table_id`, `status` (open/closed/transferred), `opened_at`, `closed_at`
- `note`, `guest_origin`, `age_group`, `party_size`, `group_type`, `children_info`
- `discount_percent`, `discount_amount` (fix ₺)
- `payment_method`: card | cash | friends_card | schwarz_bar | schwarz
- `guest_country`, `guest_source`, `guest_notes`
- **Hinweis**: `payment_method` wird jetzt beim Abschließen erzwungen (seit 08.06.2026)

#### `order_items`
- `id`, `order_id`, `name`, `qty`, `unit_price`, `on_the_house`

#### `daily_entries`
- `id`, `date`, `entry_type`, `amount`, `kdv`, `note`, `created_at`

#### `phrases`
- `id`, `category`, `german`, `turkish`, `pronunciation`, `sort_order`, `formality`

### Ausgaben-Tabellen (RLS deaktiviert) *(neu 08.06.2026)*

#### `purchase_products` — Produktkatalog
- `id`, `name`, `category` (CHECK: molkerei|wurst|mehl|gemuese|getraenke|backen|verpackung|reinigung|sonstiges)
- `unit` (CHECK: kg|g|Stk|L|ml|Pkg), `notes`, `active`, `created_at`
- **Stand**: ~57 Produkte initial befüllt (Preise mit approx. Datum, Händler fehlt noch)

#### `purchase_prices` — Preisverlauf
- `id`, `product_id` (FK → purchase_products CASCADE DELETE)
- `price_tl`, `quantity`, `unit`, `date`
- `price_per_unit` (GENERATED: price_tl / quantity)
- `source` (manual | scan), `receipt_ref`, `notes`, `created_at`
- **Hinweis**: Preise werden neu geladen sobald `suppliers`+`receipts` Tabellen existieren

### ⚠️ GEPLANT (noch nicht gebaut)

#### `suppliers` — Händler
- Geplante Felder: `id`, `name`, `category`, `notes`
- Beispiele: Gemüsehändler, Coca-Cola, Metro, Online-Shop

#### `receipts` — Rechnungen (mit Duplikat-Erkennung)
- Geplante Felder: `id`, `supplier_id`, `ettn` (unique), `fatura_no`, `date`, `total_tl`, `scanned_at`, `notes`
- ETTN = türkische E-Rechnung UUID (eindeutig, für Duplikat-Check)
- Für Belege ohne ETTN: Hash des Bildinhalts

### Küchen-Tabellen (RLS deaktiviert)

#### `kitchen_users`
- `id`, `name`, `whatsapp`
- Einträge: Natalie, Vedat (+90 554 252 72 54), Rakim (+90 534 745 97 19)

#### `kitchen_dough_batches` — Teig-Chargen
- `id`, `user_id`, `stage` (teig_gemacht | teiglinge_geformt | kuehlschrank\* | draussen | fertig)
- `teig_at`, `teiglinge_at`, `kuehlschrank_at`\*, `draussen_at`, `fertig_at`
- `kg_teig` (numeric), `anzahl_teiglinge` (integer)
- `draussen_stunden` (legacy, nicht mehr aktiv genutzt), `notes`, `created_at`
- \* `kuehlschrank` = legacy Stage, wird als `teiglinge_geformt` behandelt

#### `kitchen_dough_boxes` — Box-Tracking pro Charge *(neu 07.06.2026)*
- `id`, `batch_id` (FK → kitchen_dough_batches, CASCADE DELETE)
- `box_number` (1–10, physische Box-Nummer)
- `status`: kuehlschrank | draussen | fertig
- `teiglinge_count` (optional, Anzahl Teiglinge in dieser Box)
- `draussen_at`, `fertig_at`, `created_at`
- RLS deaktiviert

#### `kitchen_task_logs` — alle Button-Drücke
- `id`, `task_key`, `user_id`, `logged_at`, `notes`

#### `kitchen_products` — MDH
- `id`, `name`, `category` (kaese/wurst/sonstiges), `expires_at`, `notes`, `created_at`, `created_by`

#### `kitchen_freshness_settings` — Frischezeiten & Benachrichtigungen
- `task_key` (PRIMARY KEY), `label`, `hours`, `warn_before_hours` (nullable integer)
- `warn_before_hours` Werte: `-1` = Keine Meldung · `null` = nur bei Fälligkeit · `N` = N Stunden vorher + bei Fälligkeit
- **Aktuell alle auf `-1` gesetzt (Testphase, Stand 08.06.2026)**

---

## Küchen-Aufgaben (task_keys)

### Frische (hours aus kitchen_freshness_settings)
| key | Label | Standard |
|---|---|---|
| zwiebeln | Zwiebeln geschnitten | 24h |
| paprika | Paprika geschnitten | 48h |
| pilze | Pilze geschnitten | 24h |
| mozza | Mozza geöffnet | 24h |
| thunfisch | Thunfisch | 24h |

### Belag-Vorbereitung (hours aus kitchen_freshness_settings)
| key | Label | Standard |
|---|---|---|
| sucuk | Sucuk | 48h |
| salami | Ital. Salami | 48h |
| salami_scharf | Scharfe Ital. Salami | 48h |
| jambon | Jambon | 48h |
| pastirma | Pastırma | 48h |

### Desserts (hours aus kitchen_freshness_settings)
| key | Label | Standard |
|---|---|---|
| tiramisu | Tiramisu | 96h |
| piccolo_crunch | Piccolo Crunch | 96h |

### Täglich (reset pro Tag)
klo, kueche_putzen, kehren_innen, kehren_aussen, innen_wischen, terrasse_wasser, terrasse_wischen

### Sonstiges (nur Log)
gas_1, gas_2, klimawasser

---

## Teig-Prozess (Schritte ①②③)

Alle Schritte immer gleichzeitig sichtbar — kein versteckter Stage-Wechsel.
Jeder Timestamp hat ein ✏️ zum nachträglichen Korrigieren.

### ① Teig gemacht
- Timer: 24h im Kühlschrank (Ampel: blau → gelb → grün → rot nach 36h)
- Button: „✓ Teiglinge geformt → jetzt eintragen" erscheint wenn noch kein teiglinge_at

### ② Teiglinge geformt (im Kühlschrank)
- Timer: mind. 24h, max. 72h (Ampel: blau → gelb → grün → rot nach 72h)
- Box-Grid 1–10: Antippen = Box dieser Charge zuweisen
  - Box bekommt automatisch `teiglinge_at` als Kühlschrank-Startzeit
  - ❄️ = zugewiesen + im Kühlschrank · 🌡️ = draußen · ✅ = fertig · 🔒 = andere Charge
  - ❄️ nochmal antippen = entfernen (nur wenn noch im Kühlschrank)
- Pro ❄️-Box: Teiglinge-Anzahl editierbar (default 6) + „Rausnehmen 🌡️" Button

### ③ Draußen (Raumtemperatur)
- Erscheint automatisch sobald erste Box rausgeholt
- **Jede Box individuell getimed** ab ihrem eigenen `draussen_at`
- Ampel: blau (< 2h) → grün (2–4h bereit) → rot (> 4h)
- Timestamp ✏️ editierbar
- Pro Box: `✅ Verarbeitet` oder `🔄 Zurück in Kühlschrank`
- Wenn alle Boxen verarbeitet → Charge automatisch auf `fertig` → geht in Historie

### Boxen
- 10 physische Boxen (1–10), fest nummeriert
- Teiglinge pro Box: default 6, manuell änderbar
- Eine Box kann nur einer aktiven Charge gleichzeitig gehören

---

## Telegram-Benachrichtigungen

### Bot
- Name: `IlPiccoloPizza_bot`
- Token: in Supabase Secrets (`TELEGRAM_BOT_TOKEN`)
- Test-Endpunkt: POST `…/check-timers?test=true` → sendet Testnachricht an alle

### Empfänger
| Name | chat_id | Secret |
|---|---|---|
| Vedat | 5170867099 | TELEGRAM_CHAT_VEDAT |
| Rakim | 8062704156 | TELEGRAM_CHAT_RAKIM |
| Natalie | 8749997593 | TELEGRAM_CHAT_NATALIE |

### Benachrichtigungs-Logik
- **Keine Meldung** (`warn_before_hours = -1`): Kein Telegram, Ampel in App bleibt aktiv
- **Vorwarnung** (einmalig): X Stunden vor Fälligkeit — konfigurierbar pro Produkt
- **Fälligkeit + stündliche Erinnerung**: bei Ablauf, dann jede volle Stunde solange überfällig
- **Frische/Belag/Dessert**: alle überfälligen Produkte in **einer gebündelten Nachricht**
- **Teig**: **einzelne Nachricht pro Charge**

> ⚠️ Die Edge Function `check-timers` muss `warn_before_hours = -1` prüfen und das Item überspringen!

### Cron-Job
- **cron-job.org** — alle 30 Minuten — **aktuell PAUSIERT (Testphase)**
- URL: `https://cpqnduisajwyotrmqhwh.supabase.co/functions/v1/check-timers`
- Methode: POST, Body: `{}`
- Header: Authorization Bearer (Anon Key) + Content-Type application/json
- Edge Function: `supabase/functions/check-timers/index.ts`
- Deployed mit `--no-verify-jwt`

### Supabase Secrets
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_VEDAT
- TELEGRAM_CHAT_RAKIM
- TELEGRAM_CHAT_NATALIE
- ANTHROPIC_API_KEY (für scan-receipt Edge Function)

---

## Edge Functions (Supabase)
| Function | Zweck | Deployed |
|---|---|---|
| `check-timers` | Telegram-Benachrichtigungen (Frische, Teig) | ✅ `--no-verify-jwt` |
| `scan-receipt` | Kassenbeleg → Claude Vision → Produktliste | ✅ `--no-verify-jwt` |

---

## SQL Patches
| Patch | Was | Status |
|---|---|---|
| patch8 | discount_percent, payment_method, group_type, on_the_house | ✅ |
| patch9 | Phrasen-Korrektur | ✅ |
| patch10_children_kasse | children_info, daily_entries | ✅ |
| patch11_takeaway_privat | TakeAway+Privat virtuelle Tische | ✅ |
| patch12_guest_fields | guest_country, guest_source, guest_notes | ✅ |
| patch13_discount_amount | orders.discount_amount | ✅ |
| patch14_tagesabschluss | daily_entries.kdv column | ✅ |
| patch15_kueche | Küchen-Tabellen (kitchen_users etc.) | ✅ |
| patch16_freshness_settings | kitchen_freshness_settings | ✅ |
| — | kg_teig, anzahl_teiglinge Spalten | ✅ |
| — | warn_before_hours Spalte | ✅ |
| patch17_dough_boxes | kitchen_dough_boxes Tabelle | ✅ |
| patch18_ausgaben | purchase_products + purchase_prices | ✅ (RLS manuell deaktiviert) |
| patch19_suppliers_receipts | suppliers (98 Händler) + receipts (ETTN-Duplikat-Check) | ✅ |
| patch20_complete | expense_categories (19 Kat.) + expenses Tabelle | ✅ |
| patch21_import_investitionen | 128 Einträge aus Investitionskosten.xlsx importiert | ✅ |
| patch21b_fix_date | expenses.date nullable | ✅ |
| patch22_rezepte | menu_items + recipe_ingredients + recipe_product_assignments + privat-Kategorie | ✅ |
| patch23_menu_rezepte | 15 Pizzen + Getränke/Extras + alle Rezepturen aus Excel | ✅ |
| patch24_revenue_snapshots | revenue_snapshots Tabelle + erste Einträge (15.06.2026) | ✅ |

### Ausgaben-Datenbankstand (09.06.2026)
- `suppliers`: 98 Händler
- `expense_categories`: 19 Kategorien (laufend / einmalig / investition)
- `expenses`: 130 Einträge (~3,6 Mio ₺ inkl. Miete)
  - payment_type: offiziell / bar / schwarz ✅
  - Amortisation: Miete über 24 Monate ✅
  - Stopaj-Feld vorhanden ✅
- `receipts`: Tabelle bereit, noch leer (Belege werden per Scan befüllt)
- `scan-receipt` Edge Function: Dual-Modus (products / expense) mit ETTN-Duplikat-Check ✅

### revenue_snapshots (neu 15.06.2026)

Tabelle für periodische Umsatz-Snapshots aus externen Geräten und der App.

#### Felder
- `source`: menulux | beko1 | beko2 | bar_berechnet | app | app_privat | app_onthehouse
- `period`: z.B. `2026-ytd` | `2026-06`
- `amount`: Betrag in ₺
- `snapshot_date`: Datum des Ablesens
- `note`: Freitext (z.B. KDV-Wert, Hinweise)

#### Logik
- **Offizieller Umsatz** = Menulux
- **Bar** = Menulux − Beko1 − Beko2
- **Achtung**: Beko↔Menulux-Integration defekt → alle Menulux-Zahlungen als Nakit gebucht
- **App** enthält auch Freunde/schwarz_bar + on_the_house → liegt höher als Menulux

#### Erster Snapshot (Stand 15.06.2026)
| source | amount | note |
|---|---|---|
| menulux | 97.268 ₺ | YTD offiziell |
| beko1 | 71.764 ₺ | KDV: 6.524,06 ₺ |
| beko2 | 16.747 ₺ | KDV: 1.497,64 ₺ |
| bar_berechnet | 8.757 ₺ | Menulux − Beko1 − Beko2 |
| app | 117.782 ₺ | 01.–14.06., bezahlt (ohne schwarz-gratis) |
| app_privat | 18.870 ₺ | schwarz + schwarz_bar (davon gratis: 970 ₺) |
| app_onthehouse | 16.890 ₺ | auf Haus Items, 35 von 114 Bestellungen |

### Kostenkonzept
→ Siehe `KOSTENKONZEPT.md` für vollständige Dokumentation

---

## Nächste Schritte
1. **Rezepte** (`/management/rezepte`): Produkte den Zutaten zuweisen → Preiskalkulation aktivieren
2. **Laufende Kosten nacherfassen**: Gas, Strom, Wasser (Beträge noch offen)
3. **Belege hochladen**: purchase_prices alte Einträge bereinigen, echte Belege per Scan eintragen
4. **Burrata-Zähler**: kommt später (Karte wird noch hochgeladen)
5. **Einnahmen**: Differenz App↔Gerätekasse nicht in Einnahmen-Seite sichtbar
6. **Boxen 7–10**: kommen noch dazu (aktuell 6 physische Boxen, Grid zeigt schon 10)

---

## Bekannte offene Punkte
- Fixkosten-Seite: noch keine Funktion (ausgegraut)
- Burrata-Zähler (kommt später, Karte wird noch hochgeladen)
- Einnahmen: Differenz App↔Gerätekasse nicht in Einnahmen-Seite sichtbar
- Boxen 7–10 kommen noch dazu (aktuell 6 physische Boxen, Grid zeigt schon 10)
- Laufende Kosten (Gas, Strom, Wasser) noch nicht erfasst — Beträge offen
- purchase_prices: bisherige Preise noch ohne Händler + echtes Datum → neu einlesen
