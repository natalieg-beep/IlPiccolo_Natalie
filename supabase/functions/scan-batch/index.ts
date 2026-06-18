// Supabase Edge Function: scan-batch
//
// Nimmt einen Batch von bis zu 5 PDFs/Fotos, scannt jeden einzeln mit Claude,
// legt Ergebnisse als receipt_items (status=pending) in die DB.
//
// Request:
//   {
//     batch_id: string,   // UUID eines existierenden scan_batches
//     files: [
//       { base64: string, type: string, filename?: string }
//     ]
//   }
//
// Response:
//   {
//     processed: number,
//     results: Array<{
//       filename: string | null,
//       receipt_id: string | null,
//       item_count: number,
//       duplicate: boolean,
//       error: string | null
//     }>
//   }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CLAUDE_MODEL = 'claude-sonnet-4-6'

const SCAN_PROMPT = `Du bist ein Assistent, der türkische Einkaufsbelege und Rechnungen liest.
Antworte NUR mit einem einzigen JSON-Objekt, kein Markdown, kein sonstiger Text.

{
  "supplier_name": "<Name des VERKÄUFERS/LIEFERANTEN — NICHT der Käufer>",
  "date": "<Datum des Belegs als YYYY-MM-DD — null wenn nicht erkennbar>",
  "ettn": "<ETTN UUID falls vorhanden (e-fatura/e-arşiv) — sonst null>",
  "fatura_no": "<Rechnungsnummer falls vorhanden — sonst null>",
  "total_tl": <Gesamtbetrag (Ödenecek Tutar / Genel Toplam) als Zahl — null wenn nicht erkennbar>,
  "vat_amount": <KDV-Gesamtbetrag als Zahl — null wenn nicht erkennbar>,
  "receipt_type": <"e-fatura" | "e-arsiv" | "kassenbon" | "handrechnung" — null wenn unklar>,
  "items": [
    {
      "name": "Produktname auf Deutsch wenn möglich, sonst Türkisch",
      "price_tl": <Gesamtpreis in TL als Zahl — GENAU wie auf dem Beleg gedruckt, KEINE Umrechnung>,
      "is_gross": <true wenn Kassenbon/Supermarkt (BIM, Migros, Şok etc.) — false wenn e-Arşiv/HORECA/Rechnung>,
      "quantity": <Anzahl der EINZELNEN Einheiten als Zahl>,
      "unit": <"kg" | "g" | "Stk" | "L" | "ml" | "Pkg">,
      "vat_rate": <KDV-Satz als Zahl: 1 | 10 | 20 — oder null wenn nicht erkennbar>,
      "category_hint": <"molkerei" | "wurst" | "mehl" | "gemuese" | "getraenke" | "backen" | "verpackung" | "reinigung" | "sonstiges">
    }
  ]
}

Wichtig zur Händler-Erkennung:
- Der KÄUFER auf allen Rechnungen ist Il Piccolo N / BH28 Turizm / VKN 1681461403 / Adresse Kaş Andifli — NIEMALS als supplier_name!
- Auf e-Arşiv Rechnungen: "SAYIN ..." = Käufer = wir. IGNORIEREN.
- Der VERKÄUFER steht oben links auf dem Beleg.
- Trendyol: URL enthält "trendyol.com" ODER Fatura-Nr beginnt mit "TY/TYA" ODER Satış Kanalı = "Trendyol" → supplier_name = "Trendyol".

Regeln für items:
- price_tl = GENAU der gedruckte Preis — KEINE Berechnungen!
  * KASSENBON (BIM, Migros, Şok): is_gross=true, price_tl = Zahl nach dem *
  * e-ARŞİV/HORECA/RECHNUNG: is_gross=false, price_tl = Netto-Preis wie gedruckt
  * Rabatte (TUR PROM ISK., YERINDE TUKETIM): vom Preis abziehen
- Menge = ANZAHL DER EINZELSTÜCKE (Cola 24×0,5L → quantity:24 unit:"Stk")
- DEPOZIT: nur DPZ.CC/DPZ.FAN/DPZ.SPR/DPZ.ZERO als Produkte (name: "Depozit Coca-Cola" etc., category_hint: "verpackung"). Alle anderen DPZ ignorieren.
- IGNORIERE vollständig: TOPLAM KDV, Ödenecek, Zahlungsinfos, Bankzeilen.
- BIM-Format "N ad X PP,PP" = Mengen-Info für nächste Produktzeile. Nicht als eigenes Produkt.
- vat_rate: %1 (Grundnahrung), %10 (Lebensmittel), %20 (Non-Food).
- Gleiche Produkte auf EINER Rechnung zusammenfassen.`

interface FileInput {
  base64: string
  type: string
  filename?: string
}

interface ScanBatchRequest {
  batch_id: string
  files: FileInput[]
}

interface ClaudeItem {
  name: string
  price_tl: number
  is_gross: boolean
  quantity: number
  unit: string
  vat_rate: number | null
  category_hint: string
}

interface ClaudeResult {
  supplier_name?: string | null
  date?: string | null
  ettn?: string | null
  fatura_no?: string | null
  total_tl?: number | null
  vat_amount?: number | null
  receipt_type?: string | null
  items?: ClaudeItem[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), { status: 500 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const db = createClient(supabaseUrl, supabaseKey)

  let body: ScanBatchRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Ungültiger JSON-Body' }), { status: 400 })
  }

  if (!body.batch_id || !Array.isArray(body.files) || body.files.length === 0) {
    return new Response(JSON.stringify({ error: 'batch_id und files[] erforderlich' }), { status: 400 })
  }

  // Händler-Tabelle einmal laden (für alle Dateien im Batch)
  const { data: allSuppliers } = await db.from('suppliers').select('id, name, category, aliases')
  type Sup = { id: string; name: string; category: string; aliases: string | null }
  const suppliers: Sup[] = (allSuppliers as Sup[]) ?? []

  function matchSupplier(supplierName: string): Sup | null {
    const sn = supplierName.toLowerCase()
    return suppliers
      .filter(s => {
        const name = s.name.toLowerCase()
        const aliases = s.aliases ? s.aliases.split(',').map(a => a.trim().toLowerCase()) : []
        return sn.includes(name) || name.includes(sn)
          || aliases.some(a => sn.includes(a) || a.includes(sn))
      })
      .sort((a, b) => b.name.length - a.name.length)[0] ?? null
  }

  const results: Array<{
    filename: string | null
    receipt_id: string | null
    item_count: number
    duplicate: boolean
    error: string | null
  }> = []

  for (const file of body.files) {
    const filename = file.filename ?? null

    try {
      // Claude-Content aufbauen
      type ContentBlock =
        | { type: 'text'; text: string }
        | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
        | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }

      const content: ContentBlock[] = []

      if (file.type === 'application/pdf') {
        content.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: file.base64 },
        })
      } else {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: file.type as string, data: file.base64 },
        })
      }
      content.push({ type: 'text', text: 'Lies diesen Beleg und extrahiere Kopfdaten + alle Produkte.' })

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
          system: SCAN_PROMPT,
          messages: [{ role: 'user', content }],
        }),
      })

      if (!claudeRes.ok) {
        const err = await claudeRes.text()
        results.push({ filename, receipt_id: null, item_count: 0, duplicate: false, error: `Claude API Fehler: ${err.slice(0, 200)}` })
        await db.from('scan_batches').update({ processed_files: db.rpc }).eq('id', body.batch_id)
        continue
      }

      const claudeData = await claudeRes.json()
      const rawText: string = claudeData.content?.[0]?.text ?? ''

      let parsed: ClaudeResult = {}
      try {
        parsed = JSON.parse(rawText)
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/)
        if (match) { try { parsed = JSON.parse(match[0]) } catch { /* leer */ } }
      }

      const items: ClaudeItem[] = parsed.items ?? []

      // ETTN/Fatura Duplikat-Check
      let existingReceiptId: string | null = null
      let isDuplicate = false

      if (parsed.ettn) {
        const { data } = await db.from('receipts').select('id').eq('ettn', parsed.ettn).maybeSingle()
        if (data) { existingReceiptId = data.id; isDuplicate = true }
      }
      if (!isDuplicate && parsed.fatura_no) {
        const { data } = await db.from('receipts').select('id').eq('fatura_no', parsed.fatura_no).maybeSingle()
        if (data) { existingReceiptId = data.id; isDuplicate = true }
      }

      // Händler matchen
      const supplierMatch = parsed.supplier_name ? matchSupplier(parsed.supplier_name) : null

      // Receipt anlegen (falls kein Duplikat)
      let receiptId: string | null = existingReceiptId

      if (!isDuplicate) {
        const { data: newReceipt, error: receiptErr } = await db
          .from('receipts')
          .insert({
            supplier_id:  supplierMatch?.id ?? null,
            ettn:         parsed.ettn ?? null,
            fatura_no:    parsed.fatura_no ?? null,
            date:         parsed.date ?? null,
            total_tl:     parsed.total_tl ?? null,
            vat_amount:   parsed.vat_amount ?? null,
            receipt_type: parsed.receipt_type ?? null,
            source:       'scan',
            filename:     filename,
            item_count:   items.length,
          })
          .select('id')
          .single()

        if (receiptErr) {
          // ETTN-Duplikat trotz Check (Race Condition) → als Duplikat behandeln
          if (receiptErr.code === '23505') {
            isDuplicate = true
          } else {
            results.push({ filename, receipt_id: null, item_count: 0, duplicate: false, error: receiptErr.message })
            await incrementProcessed(db, body.batch_id)
            continue
          }
        } else {
          receiptId = newReceipt?.id ?? null
        }
      }

      // receipt_items NUR für neue Receipts einfügen — Duplikate überspringen
      if (isDuplicate) {
        results.push({ filename, receipt_id: existingReceiptId, item_count: 0, duplicate: true, error: null })
        await incrementProcessed(db, body.batch_id)
        continue
      }

      if (items.length > 0 && receiptId) {
        const receiptItemRows = items.map(item => {
          // amount_gross immer als Brutto speichern
          const vatRate = item.vat_rate ?? 0
          const amountGross = item.is_gross
            ? item.price_tl
            : item.price_tl * (1 + vatRate / 100)

          return {
            receipt_id:  receiptId,
            batch_id:    body.batch_id,
            name:        item.name,
            amount_gross: amountGross,
            vat_rate:    vatRate,
            quantity:    item.quantity ?? 1,
            unit:        item.unit ?? null,
            date:        parsed.date ?? null,
            mode:        'einkauf',
            status:      'pending',
          }
        })

        await db.from('receipt_items').insert(receiptItemRows)
      }

      results.push({
        filename,
        receipt_id: receiptId,
        item_count: items.length,
        duplicate: isDuplicate,
        error: null,
      })
    } catch (err) {
      results.push({
        filename,
        receipt_id: null,
        item_count: 0,
        duplicate: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    await incrementProcessed(db, body.batch_id)
  }

  // batch als 'review' markieren wenn alle Dateien verarbeitet
  const { data: batchData } = await db
    .from('scan_batches')
    .select('total_files, processed_files')
    .eq('id', body.batch_id)
    .single()

  if (batchData && batchData.processed_files >= batchData.total_files) {
    await db.from('scan_batches').update({ status: 'review' }).eq('id', body.batch_id)
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
  )
})

async function incrementProcessed(db: ReturnType<typeof createClient>, batchId: string) {
  // processed_files um 1 erhöhen (kein direktes INCREMENT in Supabase JS Client → via RPC)
  await db.rpc('increment_batch_processed', { batch_id: batchId })
}
