# Il Piccolo N — App Status & Entwicklungshistorie

**Stand: 2026-06-08 | Letzter Commit: siehe git log**

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
| **patch19_suppliers_receipts** | suppliers + receipts Tabellen (ETTN-Duplikat-Check) | 🔜 nächster Chat |

---

## Nächste Schritte (nächster Chat)
1. **patch19**: `suppliers` + `receipts` Tabellen bauen
2. **scan-receipt** Edge Function: ETTN + Fatura No extrahieren, Duplikat-Check
3. **AusgabenClient**: Duplikat-Warnung UI + Händler-Auswahl beim Scan
4. **purchase_prices**: alle bisherigen Preise löschen → Belege neu hochladen mit echtem Datum + Händler
5. **Fixkosten-Seite**: noch keine Funktion (ausgegraut)
6. **Burrata-Zähler**: kommt später (Karte wird noch hochgeladen)
7. **Einnahmen**: Differenz App↔Gerätekasse nicht in Einnahmen-Seite sichtbar
8. **Boxen 7–10**: kommen noch dazu (aktuell 6 physische Boxen, Grid zeigt schon 10)

---

## Bekannte offene Punkte
- Fixkosten-Seite: noch keine Funktion (ausgegraut)
- Burrata-Zähler (kommt später, Karte wird noch hochgeladen)
- Einnahmen: Differenz App↔Gerätekasse nicht in Einnahmen-Seite sichtbar
- Boxen 7–10 kommen noch dazu (aktuell 6 physische Boxen, Grid zeigt schon 10)
