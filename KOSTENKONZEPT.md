# Il Piccolo N — Kostenerfassung & Preiskalkulation
**Stand: 2026-06-09**

---

## Ziel

Alle Kosten des Restaurants vollständig erfassen → daraus Preise richtig kalkulieren.

---

## Was wir erfassen wollen

### 1. Laufende Produktkosten (bereits teilweise gebaut)
Einkaufspreise für Zutaten: Mehl, Käse, Wurst, Gemüse, Getränke, Verpackung etc.
→ Preisverlauf über Zeit, Preisvergleich zwischen Händlern

### 2. Fixkosten / Betriebskosten (noch nicht gebaut)
Monatlich wiederkehrend oder einmalig:
- Miete
- Strom, Gas, Wasser
- Steuerberater, Buchhaltung
- Versicherungen
- Kassensystem, Software-Abos
- Personalkosten (wenn relevant)

### 3. Investitionen & Umbaukosten (noch nicht gebaut)
Einmalige größere Ausgaben seit April 2026:
- Umbau / Renovierung
- Geräte (Ofen, Kühlschrank, Kasse …)
- Erstausstattung
- Sonstiges (Deko, Schilder, …)

---

## Aktuelle Datenbankstruktur

### `purchase_products` — Produktkatalog
```
id, name, category, unit, notes, active, created_at
```
Kategorien: molkerei | wurst | mehl | gemuese | getraenke | backen | verpackung | reinigung | sonstiges
Einheiten: kg | g | Stk | L | ml | Pkg

**Flexibilität:** ✅ gut — Kategorien und Einheiten könnten bei Bedarf per CHECK-Änderung erweitert werden.

### `purchase_prices` — Preisverlauf
```
id, product_id (FK), price_tl, quantity, unit, price_per_unit (GENERATED), 
date, source (manual|scan), receipt_ref, notes, created_at
```
- `price_per_unit` wird automatisch berechnet (price_tl / quantity)
- `receipt_ref` ist bisher nur ein Text-Feld — noch keine echte Verknüpfung zu Belegen

**Was fehlt noch:**
- `supplier_id` → Händler-Verknüpfung (geplant: patch19)
- Echte `receipt_id` → Verknüpfung zum gescannten Beleg
- Duplikat-Erkennung (ETTN / Beleg-Hash)

### Geplant (patch19): `suppliers` + `receipts`
```
suppliers: id, name, category, notes
receipts:  id, supplier_id, ettn (UNIQUE), fatura_no, date, total_tl, scanned_at, notes
```
→ ETTN = türkische E-Rechnung UUID (eindeutig)
→ Belege ohne ETTN: Hash des Bildinhalts als Duplikat-Schutz

---

## Geplante neue Tabellen

### `expense_categories` — Kostenkategorien (übergreifend)
```sql
id          uuid PRIMARY KEY
name        text NOT NULL         -- z.B. "Miete", "Strom", "Umbau Terrasse"
type        text NOT NULL         -- 'laufend' | 'einmalig' | 'investition'
icon        text                  -- Emoji
notes       text
```

### `expenses` — Einzelne Ausgaben / Rechnungen
```sql
id            uuid PRIMARY KEY
category_id   uuid FK → expense_categories
receipt_id    uuid FK → receipts (nullable, wenn gescannt)
date          date NOT NULL
amount_tl     numeric(10,2) NOT NULL
vat_rate      numeric(5,2)        -- KDV-Satz in %, z.B. 18.00
amount_net    numeric(10,2)       -- Netto (berechnet oder manuell)
description   text
source        text  -- 'manual' | 'scan' | 'pdf'
supplier_id   uuid FK → suppliers (nullable)
period_from   date                -- für Miete: Monat-von
period_to     date                -- für Miete: Monat-bis
notes         text
created_at    timestamptz DEFAULT now()
```

**Warum so flexibel?**
- `receipt_id` nullable → manuelle Einträge ohne Scan möglich
- `period_from/to` → Miete und andere Periodenkosten korrekt zuordnen
- `vat_rate` → KDV (türk. MwSt) korrekt trennen für Buchhaltung
- `source` → unterscheiden ob manuell, Foto-Scan oder PDF

---

## Duplikat-Erkennung

### Für türkische E-Rechnungen (e-fatura / e-arşiv)
- Haben immer eine **ETTN** (UUID, z.B. `3F2A1B9C-...`)
- ETTN in `receipts.ettn` als `UNIQUE` Constraint
- Beim Scan: Claude extrahiert ETTN → DB-Check → Warnung wenn schon vorhanden

### Für normale Kassenbelege / Fotos
- Kein ETTN vorhanden
- Fallback: **SHA-256 Hash des Bildinhalts** in `receipts.image_hash`
- Beim Upload: Hash berechnen → DB-Check → Warnung wenn identisches Bild

### Für PDFs
- Text-Hash der ersten N Zeichen (Betrag + Datum + Händlername)
- Zusätzlich: `fatura_no` (Rechnungsnummer) als Soft-Check

---

## Scan-Funktionen (Claude Vision)

### Bestehend: `scan-receipt` Edge Function
→ Erkennt Produktlisten (Zutaten-Einkauf), gibt strukturierte Artikel zurück

### Geplant: Erweiterung für Ausgaben-Belege
Claude soll zusätzlich erkennen:
- **ETTN** (falls vorhanden, immer in e-fatura)
- **Fatura No** / Rechnungsnummer
- **Händlername**
- **Gesamtbetrag**
- **KDV-Betrag** (MwSt)
- **Datum**
- **Belegart** (e-fatura | e-arşiv | Kassenbon | Handrechnung)

---

## Kostenbereiche & Beispiele

### Laufende Kosten (monatlich)
| Kategorie | Beispiel | Typ |
|---|---|---|
| Miete | Monatsmiete April | laufend |
| Strom | Fatura April | laufend |
| Gas | Tüpgaz Rechnung | laufend |
| Wasser | Su faturası | laufend |
| Steuerberater | Muhasebe | laufend |
| Kassensystem | Yazarkasa | laufend |

### Investitionen (einmalig seit April)
| Kategorie | Beispiel | Typ |
|---|---|---|
| Umbau | Terrasse, Küche | investition |
| Geräte | Ofen, Kühlschrank | investition |
| Erstausstattung | Geschirr, Möbel | investition |
| Werbung | Logo, Schilder | investition |
| Sonstiges | Diverse Anschaffungen | einmalig |

### Produktkosten (bereits erfasst)
→ via `purchase_products` + `purchase_prices` (patch18)

---

## Preiskalkulation (Ziel)

Wenn alle Daten vorhanden, kann man berechnen:

```
Wareneinsatz pro Pizza = Summe(Zutaten × Einkaufspreis)
Fixkosten/Pizza        = Monatliche Fixkosten / Pizzen pro Monat
Gesamtkosten/Pizza     = Wareneinsatz + Fixkosten-Anteil
Zielpreis              = Gesamtkosten × (1 + Gewinnmarge%)
```

**Voraussetzungen:**
1. ✅ Einkaufspreise pro Zutat (patch18, teilweise)
2. 🔜 Rezepte / Mengenkalkulation pro Pizza-Typ
3. 🔜 Fixkosten vollständig erfasst
4. 🔜 Investitionen (auf Monate amortisiert)
5. 🔜 Durchschnittliche Pizzen/Monat (aus Einnahmen-Daten vorhanden!)

---

## Nächste Schritte (Reihenfolge)

### Kurzfristig
1. **patch19**: `suppliers` + `receipts` Tabellen (ETTN-Duplikat-Check)
2. **scan-receipt** erweitern: ETTN, Händler, Gesamtbetrag extrahieren
3. **UI Ausgaben**: Händler-Auswahl + Duplikat-Warnung

### Mittelfristig (nächste Phase)
4. **`expense_categories`** + **`expenses`** Tabellen anlegen
5. **Ausgaben-UI** um Tab "Fixkosten & Investitionen" erweitern
6. April-Belege (Umbau, Miete, Investitionen) nacherfassen
7. Monatliche Fixkosten-Übersicht

### Langfristig
8. **Rezept-Modul**: Zutatenliste pro Pizza mit Mengenangaben
9. **Kalkulations-Ansicht**: Kosten pro Pizza automatisch berechnen
10. **Preisvorschlag**: Basierend auf Kosten + Zielgewinn

---

## Offene Fragen / Entscheidungen

- **KDV (MwSt)**: Erfassen wir Brutto oder Netto? → Empfehlung: Brutto erfassen, KDV-Satz separat
- **Amortisation Investitionen**: Über wie viele Monate? → z.B. Umbau über 12–24 Monate
- **Händler-Kategorien**: Lieferant | Handwerker | Behörde | Sonstiges?
- **Rechnungen ohne Foto**: Nur manuell oder immer Scan-Pflicht?
- **April-Belege**: Hast du die Fotos/PDFs bereits gesammelt?
