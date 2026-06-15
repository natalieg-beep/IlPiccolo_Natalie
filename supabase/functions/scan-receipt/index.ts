// Supabase Edge Function: scan-receipt
// Zwei Modi:
//   mode=products (default) → Produktliste aus Einkaufsbeleg
//   mode=expense            → Belegkopf (ETTN, Händler, Betrag, KDV, Datum) + Duplikat-Check

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CLAUDE_MODEL = 'claude-sonnet-4-6'

interface ScanRequest {
  image_base64?: string
  image_type?: string    // 'image/jpeg' | 'image/png' | 'application/pdf'
  images?: { base64: string; type: string }[]   // mehrere Bilder (langer Bon)
  text?: string
  mode?: 'products' | 'expense'   // default: 'products'
}

interface ExtractedItem {
  name: string
  price_tl: number
  is_gross: boolean       // true = Brutto-Preis (BIM etc.), false = Netto-Preis (HORECA/e-Arşiv)
  quantity: number
  unit: string
  vat_rate: number | null
  category_hint: string
  notes: string
}

interface ExtractedExpense {
  ettn: string | null           // E-Rechnung UUID falls vorhanden
  fatura_no: string | null      // Rechnungsnummer
  supplier_name: string | null  // Händlername
  date: string | null           // ISO date YYYY-MM-DD
  total_tl: number | null       // Gesamtbetrag
  vat_amount: number | null     // KDV-Betrag
  vat_rate: number | null       // KDV-Satz: 1 | 10 | 20
  receipt_type: string | null   // 'e-fatura' | 'e-arsiv' | 'kassenbon' | 'handrechnung'
  notes: string
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const PRODUCTS_PROMPT = `Du bist ein Assistent, der türkische Einkaufsbelege und Rechnungen liest.
Antworte NUR mit einem einzigen JSON-Objekt, kein Markdown, kein sonstiger Text.

{
  "supplier_name": "<Name des Geschäfts / Händlers vom Belegkopf, z.B. 'Muhtar', 'BIM', 'Bostan' — null wenn nicht erkennbar>",
  "date": "<Datum des Belegs als YYYY-MM-DD — null wenn nicht erkennbar>",
  "items": [
    {
      "name": "Produktname auf Deutsch wenn möglich, sonst Türkisch",
      "price_tl": <Gesamtpreis in TL als Zahl — GENAU wie auf dem Beleg gedruckt, KEINE Umrechnung>,
      "is_gross": <true wenn Kassenbon/Supermarkt (BIM, Migros, Şok etc.) — false wenn e-Arşiv/HORECA/Rechnung>,
      "quantity": <Anzahl der EINZELNEN Einheiten als Zahl>,
      "unit": <"kg" | "g" | "Stk" | "L" | "ml" | "Pkg">,
      "vat_rate": <KDV-Satz als Zahl: 1 | 10 | 20 — oder null wenn nicht erkennbar>,
      "category_hint": <"molkerei" | "wurst" | "mehl" | "gemuese" | "getraenke" | "backen" | "verpackung" | "reinigung" | "sonstiges">,
      "notes": "<kurze Notiz wenn hilfreich, sonst leerer String>"
    }
  ]
}

Regeln für items:
- price_tl = GENAU der gedruckte Preis auf dem Beleg — KEINE Berechnungen, KEINE Umrechnungen!
  * KASSENBON/SUPERMARKT (BIM, Migros, Şok): is_gross=true, price_tl = Zahl nach dem * wie gedruckt
    Beispiel: "TEREYAĞ 1 KG %1. *469,00" → price_tl: 469, is_gross: true, vat_rate: 1
    Beispiel: "YUH.ŞEK. HARİBO %1. *158,00" → price_tl: 158, is_gross: true, vat_rate: 1
  * e-ARŞİV/HORECA/RECHNUNG: is_gross=false, price_tl = Netto-Preis wie gedruckt
    Beispiel: Netto 367,58₺ auf e-Arşiv → price_tl: 367.58, is_gross: false, vat_rate: 10
  * Rabatte (TUR PROM ISK., YERINDE TUKETIM etc.): vom gedruckten Preis abziehen → neuen Preis eintragen
    Beispiel: 626,40₺ − 222,06₺ Rabatt → price_tl: 404.34, is_gross: true, vat_rate: 10
- Preis ist IMMER der Gesamtpreis für alle Einzeleinheiten zusammen
- Menge = ANZAHL DER EINZELSTÜCKE, nicht Kartons/Kisten/Gebinde:
    Cola Kiste 24×0,5L 480₺  → quantity:24  unit:"Stk"
    Mehl 5×1kg Sack 250₺     → quantity:5   unit:"kg"
    Olivenöl 2L Flasche 120₺  → quantity:2   unit:"L"
- Wenn Gebindegröße nicht erkennbar → quantity=1, unit="Pkg", notes="Gebinde"
- DEPOZIT / PFAND (Flaschenkaution): Zeilen mit "DPZ", "BOS KOMPLE", "AMBALAJ", "Güvence", "Kaution" NUR für folgende Produkte als eigenes Item aufnehmen (category_hint: "verpackung", is_gross: false, vat_rate: 20):
    * DPZ.CC oder DPZ Coca-Cola → name: "Depozit Coca-Cola"
    * DPZ.CC ZERO oder DPZ Zero → name: "Depozit Coca-Cola Zero"
    * DPZ.FAN oder DPZ Fanta → name: "Depozit Fanta"
    * DPZ.SPR oder DPZ Sprite → name: "Depozit Sprite"
  Alle anderen DPZ/Güvence/Pfand-Zeilen (z.B. für Wasser, unbekannte Produkte) IGNORIERE vollständig.
- IGNORIERE vollständig: "TOPLAM KDV", "Ödenecek", "KDV Dahil Tutar", Zahlungsinfos, Bankzeilen — das sind KEINE Produkte
- BIM-Format: Zeilen wie "2 ad X 79,00" oder "N ad X PP,PP" sind Mengen-Info-Zeilen für das NÄCHSTE Produkt. Nicht als eigenes Produkt. Die Produktzeile danach hat den *Gesamtpreis. Beispiel: "2 ad X 79,00" dann "YUH.ŞEK. HARİBO *158,00" → quantity:2, price_tl:158
- Wenn Einheit unklar → "Stk"
- vat_rate: %1 (Grundnahrung), %10 (Lebensmittel), %20 (Non-Food). Auf BIM-Kassenzetteln steht "%1." oder "%20" direkt am Produktnamen
- Produktname: lesbaren Namen schreiben. Mengenangaben nur aus explizit ausgeschriebenem Text
- ZUSAMMENFASSEN: Gleiches Produkt mehrmals → ein item (quantity + price_tl aufsummieren)
- Sortiere nach Kategorie`

const EXPENSE_PROMPT = `Du bist ein Assistent, der türkische Rechnungen und Belege liest.
Extrahiere die Kopfdaten des Belegs.
Antworte NUR mit einem einzigen JSON-Objekt, kein Markdown, kein sonstiger Text.

{
  "ettn": "<ETTN UUID falls vorhanden, z.B. 3F2A1B9C-... — nur bei e-fatura/e-arşiv, sonst null>",
  "fatura_no": "<Rechnungsnummer falls vorhanden, sonst null>",
  "supplier_name": "<Name des Ausstellers / Händlers, sonst null>",
  "date": "<Datum als YYYY-MM-DD, sonst null>",
  "total_tl": <Gesamtbetrag in TL als Zahl, sonst null>,
  "vat_amount": <KDV-Betrag in TL als Zahl, sonst null>,
  "vat_rate": <KDV-Satz als Zahl: 1 oder 10 oder 20, sonst null>,
  "receipt_type": <"e-fatura" | "e-arsiv" | "kassenbon" | "handrechnung">,
  "notes": "<kurze Auffälligkeit wenn relevant, sonst leerer String>"
}

Hinweise:
- ETTN steht auf e-fatura/e-arşiv Belegen als UUID (Format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
- Bei normalen Kassenbons: ettn = null, fatura_no = Bon-Nummer falls sichtbar
- KDV-Satz: In der Türkei gibt es 1%, 10% und 20%
- Gesamtbetrag: Der finale zu zahlende Betrag (TOPLAM oder GENEL TOPLAM)`

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    })
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), { status: 500 })

  const body: ScanRequest = await req.json()
  const mode = body.mode ?? 'products'

  // Claude-Nachricht aufbauen
  type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
    | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
  const content: ContentBlock[] = []

  // Mehrere Bilder/PDFs (langer Bon in Teilfotos oder PDF-Rechnung)
  const allImages: { base64: string; type: string }[] = body.images
    ?? (body.image_base64 ? [{ base64: body.image_base64, type: body.image_type || 'image/jpeg' }] : [])

  if (allImages.length > 0) {
    if (allImages.length > 1) {
      content.push({
        type: 'text',
        text: `Dieser Kassenbeleg wurde in ${allImages.length} Teilfotos aufgenommen (oben → unten). Behandle alle Bilder als EINEN zusammenhängenden Beleg. Dedupliziere Produkte die in mehreren Bildern sichtbar sind — jedes Produkt nur einmal erfassen.`,
      })
    }
    for (const img of allImages) {
      if (img.type === 'application/pdf') {
        // PDFs als document-Block senden (Claude API Anforderung)
        content.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: img.base64 },
        })
      } else {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: img.type as string, data: img.base64 },
        })
      }
    }
    content.push({
      type: 'text',
      text: mode === 'expense'
        ? 'Lies diese Rechnung / diesen Beleg und extrahiere die Kopfdaten.'
        : 'Lies diesen Kassenbeleg und extrahiere alle Produkte mit Preisen.',
    })
  } else if (body.text) {
    content.push({
      type: 'text',
      text: mode === 'expense'
        ? `Lies diesen Belegtext und extrahiere die Kopfdaten:\n\n${body.text}`
        : `Lies diesen Belegtext und extrahiere alle Produkte mit Preisen:\n\n${body.text}`,
    })
  } else {
    return new Response(JSON.stringify({ error: 'Kein Inhalt (image_base64, images oder text erforderlich)' }), { status: 400 })
  }

  // Claude aufrufen
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: mode === 'expense' ? EXPENSE_PROMPT : PRODUCTS_PROMPT,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!claudeRes.ok) {
    const err = await claudeRes.text()
    return new Response(JSON.stringify({ error: 'Claude API Fehler', detail: err }), { status: 502 })
  }

  const claudeData = await claudeRes.json()
  const rawText = claudeData.content?.[0]?.text ?? ''

  // ── Modus: Produkte ────────────────────────────────────────────────────────
  if (mode === 'products') {
    let parsed: { supplier_name?: string | null; date?: string | null; items?: ExtractedItem[] } = {}
    try {
      parsed = JSON.parse(rawText)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) { try { parsed = JSON.parse(match[0]) } catch { /* leer */ } }
    }
    const items: ExtractedItem[] = parsed.items ?? []

    // Händler-Match gegen suppliers-Tabelle
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const db = createClient(supabaseUrl, supabaseKey)

    let supplier_match: { id: string; name: string; category: string } | null = null
    if (parsed.supplier_name) {
      const { data } = await db
        .from('suppliers')
        .select('id, name, category')
        .ilike('name', `%${parsed.supplier_name}%`)
        .limit(1)
        .maybeSingle()
      if (data) supplier_match = data
    }

    return new Response(
      JSON.stringify({ items, supplier_name: parsed.supplier_name ?? null, date: parsed.date ?? null, supplier_match }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  }

  // ── Modus: Expense (Belegkopf + Duplikat-Check) ────────────────────────────
  let expense: ExtractedExpense | null = null
  try {
    expense = JSON.parse(rawText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (match) { try { expense = JSON.parse(match[0]) } catch { /* leer */ } }
  }

  if (!expense) {
    return new Response(JSON.stringify({ error: 'Konnte Beleg nicht lesen', raw: rawText }), { status: 422 })
  }

  // Duplikat-Check in Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const db = createClient(supabaseUrl, supabaseKey)

  let duplicate: { id: string; date: string | null; total_tl: number | null; notes: string | null } | null = null

  if (expense.ettn) {
    const { data } = await db.from('receipts').select('id, date, total_tl, notes').eq('ettn', expense.ettn).maybeSingle()
    if (data) duplicate = data
  } else if (expense.fatura_no) {
    const { data } = await db.from('receipts').select('id, date, total_tl, notes').eq('fatura_no', expense.fatura_no).maybeSingle()
    if (data) duplicate = data
  }

  // Händler-Match in Supabase (für Vorauswahl in UI)
  let supplier_match: { id: string; name: string; category: string } | null = null
  if (expense.supplier_name) {
    const { data } = await db
      .from('suppliers')
      .select('id, name, category')
      .ilike('name', `%${expense.supplier_name}%`)
      .maybeSingle()
    if (data) supplier_match = data
  }

  // Bestehenden Eintrag in expenses suchen (für "Beleg zuordnen" statt Neu anlegen)
  // Match-Strategie: gleicher Betrag (±5%) + gleiches Datum ODER gleicher Betrag + gleicher Monat + gleicher Händler
  let expense_match: { id: string; description: string | null; amount_gross: number; date: string | null; has_receipt: boolean } | null = null
  if (expense.total_tl && expense.total_tl > 0) {
    const tolerance = expense.total_tl * 0.05
    const lo = expense.total_tl - tolerance
    const hi = expense.total_tl + tolerance

    // Versuch 1: gleicher Betrag + gleiches Datum
    if (expense.date) {
      const { data } = await db
        .from('expenses')
        .select('id, description, amount_gross, date, has_receipt')
        .gte('amount_gross', lo).lte('amount_gross', hi)
        .eq('date', expense.date)
        .maybeSingle()
      if (data) expense_match = data
    }

    // Versuch 2: gleicher Betrag + gleicher Monat + gleicher Händler
    if (!expense_match && expense.date && supplier_match) {
      const monthStart = expense.date.slice(0, 7) + '-01'
      const monthEnd  = expense.date.slice(0, 7) + '-31'
      const { data } = await db
        .from('expenses')
        .select('id, description, amount_gross, date, has_receipt')
        .gte('amount_gross', lo).lte('amount_gross', hi)
        .gte('date', monthStart).lte('date', monthEnd)
        .eq('supplier_id', supplier_match.id)
        .maybeSingle()
      if (data) expense_match = data
    }

    // Versuch 3: gleicher Betrag + gleicher Monat (ohne Händler, wenn kein Match)
    if (!expense_match && expense.date) {
      const monthStart = expense.date.slice(0, 7) + '-01'
      const monthEnd  = expense.date.slice(0, 7) + '-31'
      const { data } = await db
        .from('expenses')
        .select('id, description, amount_gross, date, has_receipt')
        .gte('amount_gross', lo).lte('amount_gross', hi)
        .gte('date', monthStart).lte('date', monthEnd)
        .maybeSingle()
      if (data) expense_match = data
    }
  }

  return new Response(
    JSON.stringify({
      expense,
      duplicate: duplicate ? { found: true, receipt_id: duplicate.id, date: duplicate.date, total_tl: duplicate.total_tl } : { found: false },
      supplier_match,
      expense_match,
    }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
  )
})
