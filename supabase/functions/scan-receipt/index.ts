// Supabase Edge Function: scan-receipt
// Nimmt ein Base64-Bild oder Text-Inhalt, schickt es an Claude Vision,
// gibt strukturierte Produktliste zurück (noch nicht gespeichert — UI bestätigt zuerst)

const CLAUDE_MODEL = 'claude-opus-4-8'

interface ScanRequest {
  image_base64?: string  // base64-kodiertes Bild (JPEG/PNG/WebP/PDF)
  image_type?: string    // 'image/jpeg' | 'image/png' | 'application/pdf'
  text?: string          // alternativ: reiner Text aus PDF copy-paste
}

interface ExtractedItem {
  name: string
  price_tl: number
  quantity: number
  unit: string
  category_hint: string
  notes: string
}

const SYSTEM_PROMPT = `Du bist ein Assistent, der türkische Einkaufsbelege und Rechnungen liest.
Extrahiere alle Produkte mit Preis, Menge und Einheit.
Antworte NUR mit einem JSON-Array, kein Markdown, kein sonstiger Text.

Für jedes Produkt:
{
  "name": "Produktname auf Deutsch wenn möglich, sonst Türkisch",
  "price_tl": <Gesamtpreis in TL als Zahl>,
  "quantity": <Menge als Zahl, z.B. 5 für 5kg>,
  "unit": <"kg" | "g" | "Stk" | "L" | "ml" | "Pkg">,
  "category_hint": <"molkerei" | "wurst" | "mehl" | "gemuese" | "getraenke" | "backen" | "verpackung" | "reinigung" | "sonstiges">,
  "notes": "<kurze Notiz wenn hilfreich, sonst leerer String>"
}

Regeln:
- Preis ist IMMER der Gesamtpreis für die angegebene Menge (nicht Stückpreis)
- Mengen von Belegen exakt übernehmen (5kg → quantity:5 unit:kg)
- Wenn Einheit unklar → "Stk"
- Ignoriere: Summen, MwSt, Rabatte, Zahlungsinfos
- Sortiere nach Kategorie`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), { status: 500 })

  const body: ScanRequest = await req.json()

  // Claude-Nachricht aufbauen
  type ContentBlock = { type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  const content: ContentBlock[] = []

  if (body.image_base64) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: (body.image_type || 'image/jpeg') as string,
        data: body.image_base64,
      },
    })
    content.push({ type: 'text', text: 'Lies diesen Kassenbeleg / diese Rechnung und extrahiere alle Produkte mit Preisen.' })
  } else if (body.text) {
    content.push({ type: 'text', text: `Lies diesen Belegtext und extrahiere alle Produkte mit Preisen:\n\n${body.text}` })
  } else {
    return new Response(JSON.stringify({ error: 'Kein Inhalt (image_base64 oder text erforderlich)' }), { status: 400 })
  }

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
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!claudeRes.ok) {
    const err = await claudeRes.text()
    return new Response(JSON.stringify({ error: 'Claude API Fehler', detail: err }), { status: 502 })
  }

  const claudeData = await claudeRes.json()
  const rawText = claudeData.content?.[0]?.text ?? ''

  let items: ExtractedItem[] = []
  try {
    items = JSON.parse(rawText)
  } catch {
    // Claude hat manchmal Markdown-Fences → strip
    const match = rawText.match(/\[[\s\S]*\]/)
    if (match) {
      try { items = JSON.parse(match[0]) } catch { /* leer lassen */ }
    }
  }

  return new Response(JSON.stringify({ items }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
