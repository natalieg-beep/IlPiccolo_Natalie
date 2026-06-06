# Il Piccolo N — App Status & Entwicklungshistorie

**Stand: 2026-06-06 | Letzter Commit: patch15-kueche**

## Stack
- Next.js 16.2.6, App Router, TypeScript, Turbopack, `src/` dir
- Supabase SSR (`@supabase/ssr`), RLS aktiviert
- Single-User: natalie.guenes.tr@gmail.com
- Git: `git@github.com:natalieg-beep/IlPiccolo_Natalie.git`
- Vercel Deploy: `il-piccolo-natalie.vercel.app`
- Root Directory in Vercel: leer (git init in `webapp/` Unterordner)
- **WICHTIG**: `proxy.ts` statt `middleware.ts` (Next.js 16 Breaking Change)

---

## Datenbankstruktur (Supabase)

### `tables`
- `id`, `label`, `location` (CHECK: outside/inside/takeaway/privat)
- Virtuelle Tische: TakeAway (location=takeaway), Privat (location=privat)

### `orders`
- `id`, `table_id`, `status` (open/closed/transferred), `opened_at`, `closed_at`
- `note`, `guest_origin`, `age_group`, `party_size`, `group_type`, `children_info`
- `discount_percent`, `discount_amount` (fix ₺, patch13)
- `payment_method`: card | cash | friends_card | schwarz_bar | schwarz
- `guest_country`, `guest_source`, `guest_notes` (patch12)

### `order_items`
- `id`, `order_id`, `name`, `qty`, `unit_price`, `on_the_house`

### `daily_entries`
- `id`, `date`, `entry_type`, `amount`, `kdv` (patch14), `note`, `created_at`
- entry_types: `menulux_brutto`, `beko1_brutto`, `beko2_brutto`, `bar_offiziell`
- `trinkgeld`, `entnahme_privat`, `entnahme_geschaeft`
- Legacy: `menulux_total`, `beko_total` (beide noch lesbar)

### `phrases`
- `id`, `category`, `german`, `turkish`, `pronunciation`, `sort_order`, `formality` (both/formal/informal)

---

## App-Struktur (Routen)

### Service-Bereich
- `/service` — Tischübersicht (TablesClient.tsx)
  - Tische: Außen / Innen / Sonstiges (TakeAway + Privat)
  - Status-Farben: grün=offen, blau=transferred
- `/service/tisch/[id]` — Bestellung (OrderClient.tsx)
  - Kategorien: Pizza/Extras/Tatlılar/İçecekler/Kahveler/✏️Sonstiges
  - Sonstiges = manuelle Einträge (Name+Preis frei)
  - Zahlungsarten: Karte/Bar/👫Freunde(Karte)/🤝Freunde(Bar)/🎁Freunde(gratis)
  - Freunde gratis + Privat-Tisch → Gesamtbetrag automatisch 0 ₺
  - Rabatt: 10/20/50% oder frei % oder frei ₺
  - Speichern → bleibt auf Tischseite (Toast "✓ Gespeichert")
  - 🔀 Tisch verschieben → Modal mit allen Tischen
  - ✕ Abschließen → schließt Bestellung, zurück zur Übersicht
  - Gäste-Infos: Gruppentyp, Kinder, Herkunft, Alter, Personen, Land, Quelle, Notizen
- `/service/phrasen` — Türkische Phrasen
  - Kategorie-Tabs (flexWrap), Favoriten, Sie/Du Toggle, Suche

### Management-Bereich
- `/management` — Hub (server component, zeigt heute's Umsatz + Bestellungscount)
  - Aktive Kacheln: 📊Einnahmen, 🗂️Bestellungen, 📋Tagesabschluss
  - Ausgegraut (disabled): 🧾Ausgaben, 📌Fixkosten
- `/management/einnahmen` — Einnahmen-Analyse
  - Tabs: Tag/Woche(Mo-So)/Monat/Jahr + ←→ Navigation
  - Aufschlüsselung: Karte, Bar, Freunde(Karte), Freunde(Bar), Freunde(gratis), Privat, Verschenkt
  - Gerätekasse: Menulux+Beko aus daily_entries (nur wenn in Tagesabschluss eingetragen)
  - Privat erscheint als "nicht im Umsatz", durchgestrichen
- `/management/uebersicht` — Bestellungen bearbeiten
  - Datum-Navigation ←→, XLSX-Export, PDF-Druck
  - ✏️ Bearbeiten, 🗑️ Löschen pro Bestellung
  - Privat: wird gezeigt aber NICHT mitgezählt in Bestellungen/Umsatz
  - Link zu Tagesabschluss für das gewählte Datum
- `/management/tagesabschluss` — Tagesabschluss
  - Datum-Navigation
  - Felder: Menulux Brutto+KDV(auto÷11), Beko1, Beko2, Bar offiziell
  - 🙏 Trinkgeld, Bar Freunde (auto aus Bestellungen)
  - Entnahmen: Privat+Notiz, Geschäftlich+Notiz
  - Zusammenfassung: Gesamt Brutto/KDV/Net, Netto nach Entnahmen, Differenz App↔Kasse
- `/management/order/[id]` — Einzelbestellung bearbeiten (von Übersicht aus)
  - Lädt OrderClient mit backHref="/management/uebersicht"

---

## Geschäftslogik

### Zahlungsarten & Umsatz
| Zahlungsart | Offiziell? | Umsatz | Schwarz? |
|---|---|---|---|
| 💳 Karte | ✅ | voll | nein |
| 💵 Bar | ✅ | voll | nein |
| 👫 Freunde (Karte) | ✅ | nach Rabatt | nein |
| 🤝 Freunde (Bar) | ❌ | wird getrackt | ja |
| 🎁 Freunde (gratis) | ❌ | 0 ₺ | ja |
| 🏠 Privat-Tisch | intern | 0 ₺, Warenwert sichtbar | - |

### Preisberechnung
```
chargeableBase = grossPrice - houseTotal (aufs Haus Items)
discountedPrice = discountAmount > 0
  ? chargeableBase - discountAmount
  : chargeableBase * (1 - discount/100)
displayTotal = isGratis ? 0 : discountedPrice
```

### Privat
- Tisch mit location='privat' → total immer 0
- Warenwert wird intern angezeigt
- Wird in Übersicht gezeigt aber NICHT in Bestellungscount/Umsatz gezählt

### KDV
- Beko zeigt Brutto (KDV inklusive) als "NET SATIŞ"
- KDV = Brutto ÷ 11 (nicht × 10%!)
- Weil: Brutto = Net × 1.10, also KDV = Brutto × (1/11)

---

## Menü (src/lib/menu.ts)
- Kategorien: pizza, extra, dessert, drink, coffee, sonstiges
- Sonstiges = manuelle Einträge in OrderClient (customPrices state)
- Preise in ₺

---

## SQL Patches (ausführen in Supabase SQL-Editor)
| Patch | Was | Status |
|---|---|---|
| patch8 | discount_percent, payment_method, group_type, on_the_house | ✅ |
| patch9 | Phrasen-Korrektur (kesiyoruz) | ✅ |
| patch10_children_kasse | children_info, daily_entries Tabelle | ✅ |
| patch11_takeaway_privat | TakeAway+Privat virtuelle Tische | ✅ |
| patch12_guest_fields | guest_country, guest_source, guest_notes | ✅ ausführen! |
| patch13_discount_amount | orders.discount_amount | ✅ ausführen! |
| patch14_tagesabschluss | daily_entries.kdv column | ✅ ausführen! |
| phrases_patch10 | Service-Phrasen (Karte, Dessert, Tiramisu, Google) | ausführen! |
| patch15_kueche | Küchen-Modul: kitchen_users, kitchen_dough_batches, kitchen_task_logs, kitchen_products | ausführen! |

**Noch auszuführende Patches:**
```sql
-- patch12
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_country text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_source  text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_notes   text;

-- patch13
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount integer DEFAULT 0;

-- patch14
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS kdv numeric(12,2);
```

---

## Bekannte offene Punkte
- Ausgaben-Seite: noch keine Funktion (ausgegraut)
- Fixkosten-Seite: noch keine Funktion (ausgegraut)
- Einnahmen: Differenz App↔Gerätekasse noch nicht visuell hervorgehoben in Einnahmen-Seite
  (nur in Tagesabschluss sichtbar)
- Tagesabschluss-Daten in Einnahmen (Woche/Monat/Jahr) werden summiert aus daily_entries

---

## Differenzen App ↔ Beko/Menulux
- In **Tagesabschluss**: Zeile "Differenz App ↔ Gerätekasse" zeigt Abweichung pro Tag
- Ursachen für Differenz: nicht alle Bestellungen in App erfasst, Barzahlungen,
  Freunde (Bar) nicht doppelt zählen
- **TODO**: In Einnahmen-Seite könnte Differenz per Zeitraum angezeigt werden
  (App-Umsatz offiziell vs. Menulux+Beko gesamt)
