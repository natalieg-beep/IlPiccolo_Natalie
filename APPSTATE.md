# Il Piccolo N — App Status & Entwicklungshistorie

**Stand: 2026-06-07 | Letzter Commit: badb49d**

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

#### `order_items`
- `id`, `order_id`, `name`, `qty`, `unit_price`, `on_the_house`

#### `daily_entries`
- `id`, `date`, `entry_type`, `amount`, `kdv`, `note`, `created_at`

#### `phrases`
- `id`, `category`, `german`, `turkish`, `pronunciation`, `sort_order`, `formality`

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
- `task_key` (PRIMARY KEY), `label`, `hours`, `warn_before_hours` (nullable, default 1)

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

## Teig-Prozess (4 Schritte)

### Schritt 1 — Teig gemacht
- Timer: 24h im Kühlschrank
- Button in Karte: „Teiglinge geformt →"
- Erfasst: KG Teig, Anzahl Teiglinge (optional)

### Schritt 2 — Teiglinge geformt (im Kühlschrank)
- Timer: mind. 24h, max. 72h im Kühlschrank
- Anzeige: „✅ Mind. 24h erreicht — bereit" sobald 24h rum
- **Im ✏️ Bearbeitungsmodus:** Boxen zuweisen (Grid 1–10)
  - Freie Box antippen = dieser Charge zuweisen (📦 blau)
  - Nochmal antippen = entfernen (nur wenn noch im Kühlschrank)
  - 🔒 = Box gehört anderer aktiver Charge

### Schritt 3 — Rausnehmen (Akklimatisierung)
- **Im ✏️ Bearbeitungsmodus:** Pro zugewiesener Box: `🌡️ Rausnehmen`
- Box wechselt auf Status `draussen`, Timestamp wird gesetzt
- 2–4h Raumtemperatur (Teiglinge gehen nach)

### Schritt 4 — Verarbeiten oder Zurück
- **Im ✏️ Bearbeitungsmodus:** Pro draußen-Box zwei Buttons:
  - `✅ Verarbeitet` → Box fertig, wird grün
  - `🔄 Zurück in Kühlschrank` → Box zurück auf `kuehlschrank`-Status
- Wenn **alle Boxen einer Charge verarbeitet** → Charge automatisch auf `fertig`

### Gesamtlaufzeit
- **96h** ab Teig-Herstellung (Fortschrittsbalken in der Karte)
- Farbe: grün > 24h | orange > 8h | rot < 8h übrig

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
- **Vorwarnung** (einmalig): X Stunden vor Fälligkeit — konfigurierbar pro Produkt
- **Fälligkeit + stündliche Erinnerung**: bei Ablauf, dann jede volle Stunde solange überfällig
- **Frische/Belag/Dessert**: alle überfälligen Produkte in **einer gebündelten Nachricht**
- **Teig**: **einzelne Nachricht pro Charge**

### Cron-Job
- **cron-job.org** — alle 30 Minuten
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

---

## Bekannte offene Punkte
- Ausgaben-Seite: noch keine Funktion (ausgegraut)
- Fixkosten-Seite: noch keine Funktion (ausgegraut)
- Burrata-Zähler (kommt später, Karte wird noch hochgeladen)
- Einnahmen: Differenz App↔Gerätekasse nicht in Einnahmen-Seite sichtbar
- Boxen 7–10 kommen noch dazu (aktuell 6 physische Boxen, Grid zeigt schon 10)
