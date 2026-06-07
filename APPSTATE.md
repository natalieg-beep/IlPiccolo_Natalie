# Il Piccolo N — App Status & Entwicklungshistorie

**Stand: 2026-06-07 | Letzter Commit: 4cb8f80**

## Letzte Änderungen (07.06.2026)
- ✅ Timezone-Bug behoben: alle datetime-local Inputs zeigen Lokalzeit (Istanbul UTC+3)
- ✅ Batch-Namen: "Teig vom DD.MM.YYYY — Im Kühlschrank (Teiglinge)"
- ✅ Thunfisch bei Belag hinzugefügt (24h)
- ✅ Vorwarnung + Fälligkeit: 2 Telegram-Nachrichten pro Timer
- ✅ Cron auf cron-job.org umgestellt (alle 30 Min, zuverlässig)
- ✅ Einstellungen-Seite: Frischezeit + Vorwarnung pro Produkt konfigurierbar
- ✅ Teig-Prozess neu: 3 Schritte, KG + Anzahl Teiglinge, 96h Gesamtlaufzeit, Zurück in Kühlschrank
- ✅ Login mit E-Mail + Passwort (Vedat: vedat@ilpiccolo-kas.com hat Zugang zu Service + Management)
- ✅ Rakim Telegram: chat_id 8062704156
- ✅ Natalie Telegram: chat_id 8749997593
- ✅ Neue tägliche Tasks: Küche putzen, Kehren innen, Kehren außen
- ✅ Manuelle Zeiterfassung bei allen Tasks (✏️ Button)

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
- `id`, `user_id`, `stage` (teig_gemacht | teiglinge_geformt | kuehlschrank | draussen | fertig)
- `teig_at`, `teiglinge_at`, `kuehlschrank_at`, `draussen_at`, `fertig_at`
- `draussen_stunden` (Raumtemperatur-Zeit, default 2)
- `kg_teig` (numeric), `anzahl_teiglinge` (integer)
- `notes`, `created_at`

#### `kitchen_task_logs` — alle Button-Drücke
- `id`, `task_key`, `user_id`, `logged_at`, `notes`

#### `kitchen_products` — MDH
- `id`, `name`, `category` (kaese/wurst/sonstiges), `expires_at`, `notes`, `created_at`, `created_by`

#### `kitchen_freshness_settings` — Frischezeiten & Benachrichtigungen
- `task_key` (PRIMARY KEY), `label`, `hours`, `warn_before_hours` (nullable, default 1)

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
- `/kueche/teig` — Teig-Tracker (Detail + History)
- `/kueche/mdh` — Mindesthaltbarkeit (Käse, Wurst etc.)
- `/kueche/einstellungen` — Frischezeiten + Vorwarnung pro Produkt konfigurieren

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
gas, klimawasser

---

## Teig-Prozess
1. **Teig gemacht** → 24h Kühlschrank → Button: „Teiglinge geformt"
2. **Teiglinge geformt** → 24h Kühlschrank → Button: „Rausnehmen"
3. **Rausgeholt** → X Stunden Raumtemperatur → Button: „✅ Verarbeitet" ODER „🔄 Zurück in Kühlschrank"

- Gesamtlaufzeit: **96h** ab Teig-Herstellung (Fortschrittsbalken)
- KG Teig + Anzahl Teiglinge werden erfasst
- Manuelles Eintragen: Stage + Datum/Uhrzeit wählbar

---

## Telegram-Benachrichtigungen

### Bot
- Name: `IlPiccoloPizza_bot`
- Token: in Supabase Secrets (`TELEGRAM_BOT_TOKEN`)

### Empfänger
| Name | chat_id | Secret |
|---|---|---|
| Vedat | 5170867099 | TELEGRAM_CHAT_VEDAT |
| Rakim | 8062704156 | TELEGRAM_CHAT_RAKIM |
| Natalie | 8749997593 | TELEGRAM_CHAT_NATALIE |

### Wann wird gesendet?
- **Vorwarnung**: X Stunden vor Fälligkeit (konfigurierbar pro Produkt, default 1h)
- **Fälligkeit**: genau wenn Timer abläuft
- Gilt für: Teig-Stages + alle Frische/Belag/Dessert-Tasks

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

---

## Bekannte offene Punkte
- Ausgaben-Seite: noch keine Funktion (ausgegraut)
- Fixkosten-Seite: noch keine Funktion (ausgegraut)
- Burrata-Zähler (kommt später, Karte wird noch hochgeladen)
- Einnahmen: Differenz App↔Gerätekasse nicht in Einnahmen-Seite sichtbar
