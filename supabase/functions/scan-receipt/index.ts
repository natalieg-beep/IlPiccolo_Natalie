// Supabase Edge Function: scan-receipt
// Zwei Modi:
//   mode=products (default) → Produktliste aus Einkaufsbeleg
//   mode=expense            → Belegkopf (ETTN, Händler, Betrag, KDV, Datum) + Duplikat-Check

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CLAUDE_MODEL = 'claude-sonnet-4-6'

interface ScanRequest {
  image_base64?: string
  image_type?: string    // 'image/jpeg' | 'image/png' | 'application/pdf'
  text?: string
  mode?: 'products' | 'expense'   // default: 'products'
}

interface ExtractedItem {
  name: string
  price_tl: number
  quantity: number
  unit: string
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
      "price_tl": <Gesamtpreis in TL als Zahl>,
      "quantity": <Anzahl der EINZELNEN Einheiten als Zahl>,
      "unit": <"kg" | "g" | "Stk" | "L" | "ml" | "Pkg">,
      "category_hint": <"molkerei" | "wurst" | "mehl" | "gemuese" | "getraenke" | "backen" | "verpackung" | "reinigung" | "sonstiges">,
      "notes": "<kurze Notiz wenn hilfreich, sonst leerer String>"
    }
  ]
}

Regeln für items:
- Preis ist IMMER der Gesamtpreis für alle Einzeleinheiten zusammen
- Menge = ANZAHL DER EINZELSTÜCKE, nicht Kartons/Kisten/Gebinde:
    Cola Kiste 24×0,5L 480₺  → quantity:24  unit:"Stk"  (= 20₺/Stk)
    Mehl 5×1kg Sack 250₺     → quantity:5   unit:"kg"   (= 50₺/kg)
    Mozza 3×125g 150₺         → quantity:375 unit:"g"    (= 0,40₺/g)
    Olivenöl 2L Flasche 120₺  → quantity:2   unit:"L"    (= 60₺/L)
- Wenn Gebindegröße nicht erkennbar → quantity=1, unit="Pkg", notes="Gebinde"
- IGNORIERE vollständig: Depozit, Güvence, Kaution (Pfand auf Flaschen) — nicht im Array
- IGNORIERE: Summen, MwSt/KDV, Rabatte, Zahlungsinfos
- Wenn Einheit unklar → "Stk"
- ZUSAMMENFASSEN: Erscheint dasselbe Produkt mehrfach als einzelne Zeilen, fasse sie zu EINEM item zusammen:
    Wasser 10₺ / Wasser 10₺ / Wasser 10₺  →  name:"Wasser", quantity:3, price_tl:30
    (quantity aufsummieren, price_tl aufsummieren, NICHT mehrere Einträge)
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
  type ContentBlock = { type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  const content: ContentBlock[] = []

  if (body.image_base64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: (body.image_type || 'image/jpeg') as string, data: body.image_base64 },
    })
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
    return new Response(JSON.stringify({ error: 'Kein Inhalt (image_base64 oder text erforderlich)' }), { status: 400 })
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
      max_tokens: 2048,
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

  return new Response(
    JSON.stringify({
      expense,
      duplicate: duplicate ? { found: true, receipt_id: duplicate.id, date: duplicate.date, total_tl: duplicate.total_tl } : { found: false },
      supplier_match,
    }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
  )
})
