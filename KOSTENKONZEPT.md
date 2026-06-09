# Il Piccolo N — Kostenerfassung & Preiskalkulation
**Stand: 2026-06-09**

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

---

## Was wir erfassen wollen

### 1. Laufende Produktkosten (patch18, teilweise gebaut)
Einkaufspreise für Zutaten: Mehl, Käse, Wurst, Gemüse, Getränke, Verpackung etc.
→ Preisverlauf über Zeit, Preisvergleich zwischen Händlern
→ **Datenquelle**: Preiskalkulation_v5.xlsx (56 Produkte bereits gepflegt)

### 2. Betriebskosten / Fixkosten
Monatlich wiederkehrend:
- Miete (amortisiert: 50.000 ₺/Monat aus 1,2 Mio für 2 Jahre)
- Strom, Gas, Wasser (noch leer — nacherfassen)
- TürkTelekom: 1.102,25 ₺/Monat (⚠️ Mai doppelt bezahlt!)
- Steuerberater / Muhasebe
- Kassensystem, Software

### 3. Investitionen & Einmalkosten (seit April 2026)
→ **Datenquelle**: Investitionskosten.xlsx (146 Zeilen, bereits sehr vollständig)
- Miete + Ablösesumme (Kaution)
- Architekt, Notar, Patent
- Umbau / Renovierung (Hakbilenler, diverse Handwerker)
- Geräte (Ofen, Kühlschrank, Kasse, Kaffeemaschine etc.)
- Erstausstattung, Deko, Schilder
- Flüge, Transport (Serkan etc.)
- Schwarzzahlungen — explizit erfasst, `payment_type = 'schwarz'`

### 4. Rezepturen (bereits in Excel, später importieren)
→ Preiskalkulation_v5.xlsx: Wareneinsatz pro Pizza bereits berechnet
→ Wird später als Rezept-Modul in DB übernommen

---

## Datenbankstruktur (vollständig)

### Bereits vorhanden (patch18)

#### `purchase_products` — Produktkatalog
```sql
id, name, category, unit, notes, active, created_at
```
Kategorien: molkerei | wurst | mehl | gemuese | getraenke | backen | verpackung | reinigung | sonstiges

#### `purchase_prices` — Preisverlauf
```sql
id, product_id (FK), price_tl, quantity, unit, price_per_unit (GENERATED),
date, source (manual|scan), receipt_ref, notes, created_at
```
⚠️ Noch kein `supplier_id` → kommt mit patch19

---

### patch19 (nächster Schritt)

#### `suppliers` — Händler
```sql
id          uuid PRIMARY KEY
name        text NOT NULL           -- z.B. "Atılım Şengida", "BIM", "Metro"
category    text                    -- 'lieferant' | 'handwerker' | 'behoerde' | 'sonstiges'
notes       text
created_at  timestamptz DEFAULT now()
```
→ Kategorie flexibel erweiterbar (kein ENUM, nur text mit Vorschlägen in UI)

#### `receipts` — Belege mit Duplikat-Erkennung
```sql
id          uuid PRIMARY KEY
supplier_id uuid FK → suppliers (nullable)
ettn        text UNIQUE             -- türk. E-Rechnung UUID (e-fatura/e-arşiv)
fatura_no   text                    -- Rechnungsnummer
image_hash  text UNIQUE             -- SHA-256 des Bildes (Fallback ohne ETTN)
date        date
total_tl    numeric(10,2)
scanned_at  timestamptz DEFAULT now()
source      text  -- 'manual' | 'foto' | 'pdf'
notes       text
```

---

### patch20 — Ausgaben & Investitionen

#### `expense_categories` — Kostenkategorien (in App pflegbar)
```sql
id      uuid PRIMARY KEY
name    text NOT NULL       -- z.B. "Miete", "Strom", "Umbau Terrasse", "Geräte"
type    text NOT NULL       -- 'laufend' | 'einmalig' | 'investition'
icon    text                -- Emoji für UI
sort    integer DEFAULT 0
```

#### `expenses` — Einzelne Ausgaben
```sql
id              uuid PRIMARY KEY
category_id     uuid FK → expense_categories
receipt_id      uuid FK → receipts (nullable — kein Scan nötig)
supplier_id     uuid FK → suppliers (nullable)
date            date NOT NULL
amount_net      numeric(10,2)       -- Netto
vat_rate        numeric(5,2)        -- KDV-Satz: 1 | 10 | 20
vat_amount      numeric(10,2)       -- KDV-Betrag
stopaj_amount   numeric(10,2)       -- Stopaj (Quellensteuer, Jahresende fällig)
amount_gross    numeric(10,2)       -- Brutto (= net + KDV + Stopaj)
payment_type    text NOT NULL       -- 'offiziell' | 'bar' | 'schwarz'
payment_method  text                -- 'überweisung' | 'karte' | 'nakit'
description     text
has_receipt     boolean DEFAULT false   -- explizit: Beleg vorhanden ja/nein
source          text  -- 'manual' | 'foto' | 'pdf' | 'import'
-- Für Periodenkosten (Miete, Strom etc.)
period_from     date
period_to       date
-- Für Amortisation
amort_months    integer             -- über wie viele Monate verteilen?
amort_start     date                -- ab wann amortisieren?
notes           text
created_at      timestamptz DEFAULT now()
```

---

## Amortisationslogik

### Miete (Sonderfall)
- Gezahlt: 1.200.000 ₺ einmalig für 2 Jahre (April 2026 – März 2028)
- `amort_months = 24`, `amort_start = 2026-04-01`
- Monatlicher Anteil: **50.000 ₺/Monat**
- 3. Jahr: neuer Eintrag wenn fällig → `amort_start = 2028-04-01`

### Investitionen (Umbau etc.)
- Ablösesumme 1,5 Mio ₺: `amort_months = 34` (Jun 2026 – Apr 2029)
- Umbaukosten gesamt: `amort_months = 34`
- Monatlicher Anteil = `amount_gross / amort_months`

### Einmalkosten
- `amort_months = 1` (fließt nur in dem Monat ein)

### Gesamtbilanz-Sicht
- Alle Ausgaben ohne Amortisation → realer Cash-Abfluss
- Monatskalkulations-Sicht → amortisierte Werte

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
| 1 | Einkaufspreise pro Zutat | ✅ in Excel, 🔜 in DB |
| 2 | Rezepturen / Mengen pro Pizza | ✅ in Excel, 🔜 in DB |
| 3 | Fixkosten vollständig | ⚠️ teilweise (Gas/Strom/Wasser fehlen noch) |
| 4 | Investitionen vollständig | ✅ 146 Einträge in Excel |
| 5 | Pizzen/Monat Ø | ✅ aus Einnahmen-Daten berechenbar |
| 6 | Stopaj-Schätzung Jahresende | 🔜 erfassen |

---

## Schwarzzahlungen — Handhabung

Analog zu den Einnahmen (dort: `payment_method = 'schwarz'`):
- `payment_type = 'schwarz'` ist ein expliziter Wert — kein Verstecken
- In der UI: dezent gekennzeichnet, nicht auffällig
- In der Kalkulation: voll einbezogen (es sind echte Kosten)
- In Exporten für Steuerberater: Optional ausblendbar

---

## Vollständigkeits-Check (gegen Konto_Abgleich_v2)

Die 99 Transaktionen aus dem Kontoauszug (08.04.–21.05.2026) dienen als Referenz:
- Abgleich: Jede Kontoabbuchung soll einem `expense`-Eintrag zugeordnet sein
- Schwarzzahlungen (Nakit/bar) sind nicht im Konto → separat manuell erfassen
- Status-Felder aus dem Abgleich: MATCH | MATCH (Teil) | BETRAG WEICHT AB | NICHT ZUGEORDNET

⚠️ **Offene To-Dos aus Konto-Abgleich:**
- TürkTelekom 18.05.: doppelt bezahlt (2× 1.102,25 ₺) → Rückbuchung klären
- Einige Positionen mit "BETRAG WEICHT AB" → Differenzen dokumentieren

---

## Händler (aus Daten bekannt)

| Händler | Kategorie | Art |
|---|---|---|
| Atılım Şengida | Lebensmittel-Lieferant | laufend |
| Royal Bounty Gıda | Lebensmittel-Lieferant | laufend |
| WIO Gayrimenkul | Lebensmittel-Lieferant (Lavazza) | laufend |
| BIM | Supermarkt | laufend |
| Muhtar | Supermarkt/Lokal | laufend |
| Hakbilenler | Handwerker (Umbau) | Investition |
| Koru Patent | Beratung (Patent/Marke) | Investition |
| Architekt (Halk Bankası) | Architekt | Investition |
| Notar | Behörde | Investition |
| TürkTelekom | Telekommunikation | laufend |
| Tüpgaz | Gas | laufend |
| … | … | … |

---

## Nächste Schritte (Reihenfolge)

### Kurzfristig (nächste Chats)
1. **patch19**: `suppliers` + `receipts` Tabellen + ETTN-Duplikat in scan-receipt
2. **patch20**: `expense_categories` + `expenses` Tabellen
3. **Import-Script**: Investitionskosten.xlsx → `expenses` Tabelle (146 Einträge)
4. **Import-Script**: Preiskalkulation_v5.xlsx → `purchase_products` + `purchase_prices`
5. **UI**: Ausgaben-Seite um Tab "Fixkosten & Investitionen" erweitern
6. **Laufende Kosten nacherfassen**: Gas, Strom, Wasser (Beträge noch offen)

### Mittelfristig
7. **Vollständigkeits-Check UI**: Abgleich gegen Konto-Abgleich-Daten
8. **Amortisations-Ansicht**: monatlicher Kostenanteil pro Periode
9. **Rezept-Modul**: Zutatenlisten aus Excel importieren

### Langfristig
10. **Kalkulations-Seite**: Kosten/Pizza automatisch berechnen + Preisvorschlag
11. **Stopaj-Jahresübersicht**: Was wird Ende 2026 fällig?
