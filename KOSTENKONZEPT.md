# Il Piccolo N — Kostenerfassung & Preiskalkulation
**Stand: 2026-06-12**

---

## Ziel

Alle Kosten des Restaurants vollständig erfassen → daraus Preise richtig kalkulieren.

---

## Entschiedene Design-Parameter

| Thema | Entscheidung |
|---|---|
| **KDV (MwSt)** | Immer miterfassen: 1% / 10% / 20% |
| **Stopaj** | Eigenes Feld, Fälligkeit Jahresende |
| **Schwarzzahlungen** | Explizit erfasst (wie bei Einnahmen), kein Verstecken |
| **Zahlungsart** | `offiziell` / `bar` / `schwarz` |
| **Miete** | 1,2 Mio ₺ einmalig für 2 Jahre → amortisiert über 24 Monate = **50.000 ₺/Monat** |
| **3. Mietjahr** | Kommt später → Laufzeit-Felder vorbereiten |
| **Amortisation** | Beide Sichten: monatlicher Anteil (Kalkulation) + Gesamtbilanz |
| **Händler-Kategorien** | Flexibel — eigene Tabelle, in App pflegbar |
| **Fehlende Belege** | Manuell erfassbar ohne Scan-Pflicht, aber Hinweis "kein Beleg" |
| **Brutto/Netto** | `price_tl` in `purchase_prices` = immer NETTO. App rechnet aus Brutto um — nie Claude. |
| **Privat vs. Geschäftlich** | Pro Scan-Item wählbar: geschäftlich / privat / investition |

---

## Was wir erfassen wollen

### 1. Laufende Produktkosten
Einkaufspreise für Zutaten: Mehl, Käse, Wurst, Gemüse, Getränke, Verpackung etc.
→ Preisverlauf über Zeit, Preisvergleich zwischen Händlern
→ **Datenquelle**: Kassenzettel + Rechnungen per Foto-Scan

### 2. Betriebskosten / Fixkosten
Monatlich wiederkehrend:
- Miete (amortisiert: 50.000 ₺/Monat aus 1,2 Mio für 2 Jahre)
- Strom, Gas, Wasser (noch leer — nacherfassen)
- TürkTelekom: 1.102,25 ₺/Monat (⚠️ Mai doppelt bezahlt!)
- Steuerberater / Muhasebe
- Kassensystem, Software

### 3. Investitionen & Einmalkosten (seit April 2026)
→ **Datenquelle**: Investitionskosten.xlsx (146 Zeilen, in DB importiert)
- Miete + Ablösesumme (Kaution)
- Architekt, Notar, Patent
- Umbau / Renovierung (Hakbilenler, diverse Handwerker)
- Geräte (Ofen, Kühlschrank, Kasse, Kaffeemaschine etc.)
- Erstausstattung, Deko, Schilder
- Flüge, Transport (Serkan etc.)
- Schwarzzahlungen — explizit erfasst, `payment_type = 'schwarz'`

### 4. Rezepturen (geplant)
→ Preiskalkulation_v5.xlsx: Wareneinsatz pro Pizza bereits in Excel berechnet
→ Wird als Rezept-Modul in DB übernommen sobald Einkaufspreise stabil gepflegt

---

## Datenbankstruktur (aktueller Stand)

### `purchase_products` — Produktkatalog
```sql
id, name, category, unit, notes, active, created_at
```
Kategorien: molkerei | wurst | mehl | gemuese | getraenke | backen | verpackung | reinigung | sonstiges

### `purchase_prices` — Preisverlauf
```sql
id, product_id (FK), price_tl (NETTO!), quantity, unit,
price_per_unit (GENERATED = price_tl/quantity),
date, source (manual|scan), receipt_ref, notes,
is_private boolean, supplier_id (FK),
vat_rate numeric(5,2),   -- patch28: 1 | 10 | 20 | null
created_at
```

### `suppliers` — Händler & Lieferanten
```sql
id, name, category (supermarkt|lieferant|handwerker|behoerde|sonstiges),
notes, active boolean, created_at
```

### `receipts` — Belege mit Duplikat-Erkennung
```sql
id, supplier_id (FK), ettn (UNIQUE), fatura_no, image_hash (UNIQUE),
date, total_tl, scanned_at, source (manual|foto|pdf), notes
```

### `expense_categories` — Kostenkategorien (in App pflegbar)
```sql
id, name, type (laufend|einmalig|investition), icon, sort
```

### `expenses` — Einzelne Ausgaben
```sql
id, category_id (FK), receipt_id (FK), supplier_id (FK),
date, amount_net, vat_rate, vat_amount, stopaj_amount, amount_gross,
payment_type (offiziell|bar|schwarz), payment_method,
description, has_receipt boolean, source (manual|foto|pdf|scan|import),
period_from, period_to, amort_months, amort_start, notes, created_at
```

---

## Brutto/Netto-Logik

| Belegtyp | Gedruckter Preis | Vorgehen |
|---|---|---|
| Kassenbon BIM/Migros/Şok | BRUTTO (KDV enthalten) | `is_gross=true` → App: `netto = brutto / (1 + vat/100)` |
| e-Arşiv / HORECA / Rechnung | NETTO (KDV separat) | `is_gross=false` → Preis direkt übernehmen |

**Wichtig:** Claude rechnet NIE um — er kopiert den gedruckten Preis.
Die `toNetto()`-Funktion in AusgabenClient.tsx macht die Umrechnung zuverlässig.

**KDV-Sätze in der Türkei:**
- 1%: Grundnahrungsmittel (Mehl, Zucker, Eier, Butter etc.)
- 10%: Verarbeitete Lebensmittel, Getränke
- 20%: Non-Food, Reinigung, Verpackung, Dienstleistungen

---

## Amortisationslogik

### Miete (Sonderfall)
- Gezahlt: 1.200.000 ₺ einmalig für 2 Jahre (April 2026 – März 2028)
- `amort_months = 24`, `amort_start = 2026-04-01`
- Monatlicher Anteil: **50.000 ₺/Monat**

### Investitionen (Umbau etc.)
- `amort_months` und `amort_start` pro Eintrag
- Monatlicher Anteil = `amount_gross / amort_months`

### Einmalkosten
- `amort_months = 1` (fließt nur in dem Monat ein)

---

## Preiskalkulation (Ziel)

```
Wareneinsatz/Pizza     = Σ (Zutat × Einkaufspreis) [aus purchase_prices]
Fixkosten/Pizza        = Monatliche Fixkosten ÷ Pizzen/Monat [aus orders]
Invest-Anteil/Pizza    = Σ (amort. Invest/Monat) ÷ Pizzen/Monat
─────────────────────────────────────────────────────────────
Gesamtkosten/Pizza     = Wareneinsatz + Fixkosten + Invest-Anteil
Zielpreis              = Gesamtkosten × (1 + Zielgewinn%)
```

**Voraussetzungen:**

| # | Was | Status |
|---|---|---|
| 1 | Einkaufspreise pro Zutat | 🔄 in Aufbau (Scan läuft) |
| 2 | Rezepturen / Mengen pro Pizza | ✅ in Excel, 🔜 in DB |
| 3 | Fixkosten vollständig | ⚠️ Gas/Strom/Wasser fehlen noch |
| 4 | Investitionen vollständig | ✅ importiert |
| 5 | Pizzen/Monat Ø | ✅ aus Einnahmen-Daten berechenbar |
| 6 | Stopaj-Schätzung Jahresende | 🔜 erfassen |

---

## Patches (ausgeführt)

| Patch | Inhalt | Status |
|---|---|---|
| patch18 | `purchase_products` + `purchase_prices` Tabellen | ✅ |
| patch19 | `suppliers` + `receipts` Tabellen | ✅ |
| patch20 | `expense_categories` + `expenses` Tabellen | ✅ |
| patch21–26 | Diverses (RLS, Felder, UI-Fixes) | ✅ |
| patch27 | RLS: `anon_all` auf allen internen Tabellen (expenses, purchase_products, purchase_prices, suppliers, receipts, expense_categories) | ✅ |
| patch28 | `vat_rate` Spalte zu `purchase_prices` | ✅ |

---

## Bekannte Händler

| Händler | Kategorie | Belegtyp | KDV |
|---|---|---|---|
| BIM | Supermarkt | Kassenbon (Brutto) | 1% Grundnahrung, 20% Non-Food |
| Migros / Şok | Supermarkt | Kassenbon (Brutto) | je nach Produkt |
| Muhtar | Supermarkt lokal | Kassenbon | je nach Produkt |
| Bostan | Supermarkt lokal | Kassenbon + wöchentliche Rechnung (10% Rabatt) | — |
| Atılım Şengida | Lebensmittel-Lieferant | e-Arşiv (Netto) | — |
| Royal Bounty Gıda | Lebensmittel-Lieferant | e-Arşiv (Netto) | — |
| Damla / Coca-Cola | Getränke-Lieferant | e-Arşiv (Netto) | 10% + YERINDE TUKETIM Jahresrabatt |
| WIO Gayrimenkul | Lavazza-Lieferant | Rechnung | — |
| Hakbilenler | Handwerker (Umbau) | Rechnung | — |
| Koru Patent | Beratung | Rechnung | — |
| TürkTelekom | Telekommunikation | Rechnung | — |
| Tüpgaz | Gas | Lieferschein | — |

**Bostan-Besonderheit:** Bekommt man manchmal Kassenzettel + wöchentliche Sammelrechnung.
Die Preise können abweichen weil 10% Händlerrabatt. Duplikat-Check verhindert Doppelerfassung.

---

## Offene To-Dos

| Aufgabe | Priorität |
|---|---|
| Gas/Strom/Wasser Fixkosten nacherfassen | hoch |
| TürkTelekom Mai-Doppelzahlung klären (Rückbuchung?) | hoch |
| Steuerberater-Export CSV (monatl. KDV-Aufstellung) | mittel |
| Personalkosten-Tracking einbauen | mittel |
| Rezept-Modul: Zutaten aus Excel importieren | mittel |
| Kalkulations-Seite: Kosten/Pizza automatisch | niedrig |
| Stopaj-Jahresübersicht 2026 | niedrig |
