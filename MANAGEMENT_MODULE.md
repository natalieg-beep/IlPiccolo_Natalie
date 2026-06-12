# Management-Modul — Dokumentation

**Stand: 2026-06-12**

---

## Hub `/management`

**Zweck:** Startseite. Zeigt live den heutigen offiziellen Umsatz und die Anzahl der Bestellungen. Links zu allen Unterbereichen.

**Datenquelle:** Liest heute abgeschlossene `orders` direkt beim Laden der Seite.

---

## 📊 Einnahmen `/management/einnahmen`

**Zweck:** Umsatz-Analyse über Zeit — Tag / Woche / Monat / Jahr, mit Navigation vor/zurück.

**Eingabe:** Keine manuelle Eingabe. Liest automatisch `orders` + `daily_entries` aus der DB.

**Ausgabe:**
- Offizieller Umsatz nach Zahlungsart: Karte 💳, Bar 💵, Freunde Karte 👫
- Inoffiziell (grün): Freunde Bar (schwarz_bar), Freunde gratis (schwarz/Warenwert)
- Grau/durchgestrichen: Privat-Essen (Warenwert, kein Umsatz), Aufs-Haus-Posten
- Gerätekasse-Block: Vergleich Menulux + Beko wenn im Tagesabschluss eingetragen
- Differenz App ↔ Gerätekasse

**Wichtige Logik:** Menulux und Beko werden NICHT addiert — Beko ist eine Teilmenge von Menulux
(Karte läuft über Menulux, Beko ist nur der Kartenanteil davon).

---

## 🗂️ Bestellungen `/management/uebersicht`

**Zweck:** Alle abgeschlossenen/offenen Bestellungen anzeigen, bearbeiten, löschen.

**Eingabe:** Datums-Filter (URL-Parameter `?date=`). Von Einnahmen aus direkt verlinkt.

**Ausgabe:**
- Liste aller Orders gefiltert nach Datum
- Pro Order: Tisch, Zahlungsart, Betrag (charged), Rabatt, Items
- `schwarz_bar` zeigt `charged` (was Freunde zahlen) mit 🤝
- `schwarz` (gratis) zeigt `gross` (Warenwert) mit 🎁

**Aktionen:** Order löschen, zu anderem Tisch verschieben, in Order-Detail springen.

---

## 📋 Order-Detail `/management/order/[id]`

**Zweck:** Eine einzelne Bestellung nachträglich bearbeiten.

**Eingabe:** Order-ID in der URL.

**Aktionen:** Items hinzufügen/entfernen, Zahlungsart ändern, Rabatt setzen, Notizen.

**Gespeichert in:** `orders` / `order_items`

---

## 📋 Tagesabschluss `/management/tagesabschluss`

**Zweck:** Physische Geräte-Zahlen eintragen und mit der App abgleichen.

**Manuelle Eingaben (täglich):**

| Feld | Was eingetragen wird |
|---|---|
| Menulux Brutto | Gesamtumsatz laut Menulux-Kasse (Brutto inkl. KDV) |
| Beko 1 / Beko 2 | Kartenumsatz laut Beko-Terminal(s) — Teilmenge von Menulux! |
| Trinkgeld | Gesammeltes Trinkgeld des Tages |
| Privat-Entnahme | Geld aus der Kasse für private Zwecke |
| Geschäftl. Entnahme | z.B. für Einkäufe bar bezahlt |

KDV wird automatisch berechnet (Brutto ÷ 11 = KDV bei 10%), kann überschrieben werden.

**Gespeichert in:** `daily_entries` (upsert — mehrfach speicherbar pro Tag)

---

## 💰 Ausgaben `/management/ausgaben`

### Tab 1: 🛒 Einkaufspreise

**Zweck:** Produktkatalog mit Preishistorie. Basis für Rezept-Preiskalkulation.

#### Scan-Logik (Edge Function `scan-receipt`)

Die Edge Function ruft Claude Vision mit dem Bon-Foto auf. **Claude rechnet NIE** — er kopiert Zahlen genau wie gedruckt. Die App macht die Arithmetik.

**Kassenbon-Format (BIM, Migros, Şok):**
- Preise auf dem Bon sind BRUTTO (KDV enthalten)
- KDV-Satz steht am Produktnamen: `%1.` `%10` `%20`
- Claude gibt `is_gross: true` zurück + Preis wie gedruckt
- App berechnet: `netto = brutto / (1 + vat_rate/100)`

**Rechnung-Format (e-Arşiv, HORECA, Lieferanten):**
- Preise sind NETTO (KDV separat ausgewiesen)
- Claude gibt `is_gross: false` zurück
- Preis direkt übernehmen

**BIM-Format-Besonderheit:**
- Zeilen wie `"3 ad X 1,00"` oder `"N ad X PP,PP"` sind Mengeninfo-Zeilen, die zur **nächsten** Produktzeile gehören — kein eigenes Produkt
- Zeile danach hat den Gesamtpreis (N × Einzelpreis)

**Rabatte (TUR PROM ISK., YERINDE TUKETIM):**
- Sind echte Jahresrabatte → vom Brutto-Preis abziehen vor dem Speichern
- Beispiel: 626,40₺ − 222,06₺ Rabatt → gespeicherter Preis: 404,34₺ brutto

**Ignorierte Zeilen:**
- TOPLAM KDV, Ödenecek, KDV Dahil Tutar (Summenzeilen, keine Produkte)
- BOS KOMPLE, DPZ, AMBALAJ (Leergut/Pfand)
- Depozit, Güvence (Flaschenpfand auf Einzelflaschen)

**Händler-Erkennung:**
- Edge Function liest `supplier_name` aus Belegkopf
- Gleicht gegen `suppliers`-Tabelle ab (ILIKE-Match)
- Gibt `supplier_match` zurück → UI wählt Händler automatisch vor

#### Produkt-Modus beim Scan (3-Wege-Toggle)

Pro gescanntem Artikel wählbar:

| Modus | Farbe | Gespeichert in |
|---|---|---|
| 🏢 Geschäftlich | grün | `purchase_prices` (is_private=false) |
| 🏠 Privat | lila | `purchase_prices` (is_private=true) |
| 🔨 Investition | gold | `expenses` |

- "Alle geschäftlich / Alle privat / Alle Investition"-Buttons setzen alle Items gleichzeitig
- Privat-Produkte erscheinen in der Produktübersicht mit lila Farbe

#### Preisspeicherung

```
purchase_prices.price_tl = NETTO-Preis (immer)
purchase_prices.vat_rate = KDV-Satz (1 | 10 | 20 | null)
purchase_prices.quantity = Anzahl Einzeleinheiten
purchase_prices.price_per_unit = GENERATED (price_tl / quantity)
```

**KDV-Anzeige:** In der Scan-Bestätigung werden Netto + KDV + Brutto angezeigt.
In der Auswertung: KDV-Anteil separat ausgewiesen (wichtig für Vorsteuer-Tracking).

#### Produktübersicht

**Filter:** 🏢 Geschäftlich / Alle / 🏠 Privat
- Privat-Filter blendet nur in der Übersicht aus — Preise bleiben gespeichert
- Letzter Preis (`latestPrice`) wird immer angezeigt, unabhängig vom Filter

**Preisanzeige:** `price_per_unit` = `price_tl ÷ quantity`
- kg → zusätzlich ₺/100g und ₺/g berechnet und angezeigt

**Produkt bearbeiten (✏️):** Name, Kategorie, Einheit ändern. Fehler werden angezeigt.

**Preis bearbeiten (✏️):** Menge, Einheit, Gesamtpreis, Datum, Privat-Flag nachträglich korrigieren.

#### Subtab 📊 Auswertung

Wochen-/Monats-Navigation, Gesamt-/Geschäftlich-/Privat-Split,
Balkendiagramm nach Kategorie, tägliche Einkaufsliste.

**Gespeichert in:** `purchase_products` + `purchase_prices`

---

### Tab 2: 📊 Investitionen & Fixkosten

**Zweck:** Alle Betriebsausgaben tracken — Miete, Umbau, Geräte, laufende Kosten.

**Eingabe:**
- `+` Button: Neue Ausgabe (Kategorie, Beschreibung, Händler, Betrag, KDV, Zahlungsart Offiziell/Bar/Schwarz, Amortisation über X Monate)
- 📷 Scan: Rechnung scannen → Claude liest Belegkopf (ETTN, Händler, Betrag, KDV, Datum) → Formular vorausgefüllt

**Beleg-Matching beim Scan:**
Wenn ein Eintrag in `expenses` schon existiert (z.B. aus manuellem Import):
- Edge Function sucht passenden Eintrag: gleicher Betrag (±5%) + Datum / Monat + Händler
- UI zeigt Banner "🔍 Passenden Eintrag gefunden" → "Beleg zuordnen" oder "Neu erfassen"
- "Beleg zuordnen" → setzt `has_receipt=true` auf dem bestehenden Eintrag

**Duplikat-Check:**
- e-Arşiv/e-Fatura: ETTN (UUID) wird gegen `receipts`-Tabelle geprüft
- Kassenbon: Rechnungsnummer gegen `receipts`

**Filter:** Alle / Investition 🔨 / Laufend 🔄 / Einmalig ⚡

**Ansicht:** Monatlich (amortisiert) oder Gesamt.
Bei monatlich: Investitionen werden auf ihre Laufzeit verteilt
(z.B. 50.000 ₺ Umbau ÷ 24 Monate = 2.083 ₺/Monat).

**Gespeichert in:** `expenses` + `expense_categories` + `suppliers`

---

## 🏪 Händler & Lieferanten `/management/lieferanten`

**Zweck:** Alle Händler und Lieferanten verwalten.

**Kategorien:** Supermarkt / Lieferant / Handwerker / Behörde / Sonstiges

**Features:**
- Suche (Name + Notizen)
- Kategorie-Filter
- Inline-Bearbeitung (Name, Kategorie, Notizen)
- Aktiv/Inaktiv-Toggle (inaktive erscheinen ausgegraut)
- Neuen Händler anlegen

**Gespeichert in:** `suppliers`

---

## 📋 Rezepte & Kalkulation `/management/rezepte`

**Zweck:** Pizzen und Getränke mit Zutaten verknüpfen → automatische Preiskalkulation.

**Status:** Tabellen vorhanden (`menu_items`, `recipe_ingredients`, `recipe_product_assignments`).
Preiskalkulation wird aktiv sobald `purchase_products` mit Preisen befüllt ist.

**Ziel:** Pro Pizza: Zutatenkosten ₺, Verkaufspreis, Marge %.

---

## Technische Hinweise

### Server-Side Rendering (Next.js)

- `export const dynamic = 'force-dynamic'` auf allen Management-Seiten → verhindert stale Cache
- Server-Seiten nutzen `createAdminClient()` (Service Role Key) für DB-Reads → umgeht RLS
- Client-Komponenten nutzen `createClient()` (Anon Key) für Writes → RLS greift (patch27 erlaubt anon all auf internen Tabellen)

### RLS-Patches

| Patch | Inhalt |
|---|---|
| patch27 | `anon_all` Policy auf `expenses`, `expense_categories`, `purchase_products`, `purchase_prices`, `suppliers`, `receipts` |
| patch28 | `vat_rate` Spalte zu `purchase_prices` hinzugefügt |

### Edge Function `scan-receipt`

- Deployed separat via `supabase functions deploy scan-receipt` (nicht Teil von Vercel-Deploy!)
- Nutzt `ANTHROPIC_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` als Environment-Variablen in Supabase
- Zwei Modi: `mode=products` (Standard) und `mode=expense` (Belegkopf)

---

## Offene Punkte

| Feature | Status |
|---|---|
| Rezepte → Preiskalkulation aktivieren | 🔜 nächster Schritt |
| Fixkosten (Gas, Strom, Wasser) nacherfassen | 🔜 Beträge noch offen |
| Steuerberater-Export (CSV) mit KDV-Aufschlüsselung | 🔜 geplant |
| Personalkosten erfassen | 🔜 noch kein Tracking |
| Burrata-Zähler | 🔜 später |
