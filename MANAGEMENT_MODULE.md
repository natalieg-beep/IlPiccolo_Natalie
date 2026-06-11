# Management-Modul — Dokumentation

**Stand: 2026-06-11**

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

**Zusammenfassung:**
- Menulux → Karte (Beko) / Bar (Menulux − Beko) aufgeteilt
- Freunde-Bar (kommt automatisch aus App-Bestellungen)
- Trinkgeld
- Gesamt, KDV, Netto
- Entnahmen abgezogen → Netto-Einnahmen
- Differenz App ↔ Menulux als Kontrolle

**Gespeichert in:** `daily_entries` (upsert — mehrfach speicherbar pro Tag)

---

## 💰 Ausgaben `/management/ausgaben`

### Tab 1: 🛒 Einkaufspreise

**Zweck:** Produktkatalog mit Preishistorie. Basis für Rezept-Preiskalkulation.

**Eingabe:**
- 📷 Scan: Foto oder PDF-Text → Claude Vision → Bestätigungs-Screen (Menge/Einheit editierbar, Privat-Toggle) → speichern
- + Preis: Manuell für bestehendes Produkt
- + Produkt: Neues Produkt anlegen (Name, Kategorie, Einheit)
- ✏️ auf Produkt: Name, Kategorie, Einheit ändern oder löschen
- ✏️ auf Preis-Eintrag: Menge, Einheit, Gesamtpreis, Datum, Privat-Flag nachträglich korrigieren

**Filter:** Geschäftlich 🏢 / Alle / Privat 🏠

**Produktkarte:** Letzter Preis pro Einheit (`price_per_unit` = `price_tl ÷ quantity`), Preisverlauf aufklappbar.

**Einheitenkonvertierung:** Wenn Einheit kg → automatisch ₺/100g und ₺/g berechnet und angezeigt
(z.B. Mozza: 1kg = 400₺ → 40₺/100g → 0,40₺/g)

**Subtab 📊 Auswertung:** Wochen-/Monats-Navigation, Gesamt-/Geschäftlich-/Privat-Split,
Balkendiagramm nach Kategorie, tägliche Einkaufsliste.

**Gespeichert in:** `purchase_products` + `purchase_prices`

### Tab 2: 📊 Investitionen & Fixkosten

**Zweck:** Alle Betriebsausgaben tracken — Miete, Umbau, Geräte, laufende Kosten.

**Eingabe:**
- + Button: Neue Ausgabe (Kategorie, Beschreibung, Händler, Betrag, KDV, Zahlungsart Offiziell/Bar/Schwarz, Amortisation über X Monate)
- 📷 Scan: Rechnung scannen → Claude liest Belegkopf (ETTN, Händler, Betrag, KDV, Datum) → Formular vorausgefüllt → Duplikat-Check gegen `receipts`

**Filter:** Alle / Investition 🔨 / Laufend 🔄 / Einmalig ⚡

**Ansicht:** Monatlich (amortisiert) oder Gesamt.
Bei monatlich: Investitionen werden auf ihre Laufzeit verteilt
(z.B. 50.000 ₺ Umbau ÷ 24 Monate = 2.083 ₺/Monat).

**Gespeichert in:** `expenses` + `expense_categories` + `suppliers`

---

## 📋 Rezepte & Kalkulation `/management/rezepte`

**Zweck:** Pizzen und Getränke mit Zutaten verknüpfen → automatische Preiskalkulation.

**Status:** Tabellen vorhanden (`menu_items`, `recipe_ingredients`, `recipe_product_assignments`).
Preiskalkulation wird aktiv sobald `purchase_products` mit Preisen befüllt ist.

**Ziel:** Pro Pizza: Zutatenkosten ₺, Verkaufspreis, Marge %.

---

## Offene Punkte

| Feature | Status |
|---|---|
| Rezepte → Preiskalkulation aktivieren | 🔜 nächster Schritt |
| Fixkosten (Gas, Strom, Wasser) nacherfassen | 🔜 Beträge noch offen |
| Burrata-Zähler | 🔜 später, Karte wird noch hochgeladen |
| Differenz App ↔ Gerätekasse direkt in Einnahmen-Seite | ⚠️ nur im Tagesabschluss sichtbar |
