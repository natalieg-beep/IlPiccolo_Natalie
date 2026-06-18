// Supabase Edge Function: scan-batch (v2 — Storage-basiert)
//
// Request:
//   { batch_id: string, storage_paths: string[] }
//   (jeder Pfad zeigt auf eine Datei im receipts-pdfs Bucket)
//
// Response:
//   { processed: number, results: Array<{path, receipt_id, item_count, duplicate, error}> }

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
- Der KÄUFER ist Il Piccolo N / BH28 Turizm / VKN 1681461403 / Adresse Kaş Andifli — NIEMALS als supplier_name!
- Auf e-Arşiv Rechnungen: "SAYIN ..." = Käufer = wir. IGNORIEREN.
- Der VERKÄUFER steht oben links auf dem Beleg.
- Trendyol: URL enthält "trendyol.com" ODER Fatura-Nr beginnt mit "TY/TYA" ODER Satış Kanalı = "Trendyol" → supplier_name = "Trendyol".

Regeln für items:
- price_tl = GENAU der gedruckte Preis — KEINE Berechnungen!
  * KASSENBON (BIM, Migros, Şok): is_gross=true
  * e-ARŞİV/HORECA/RECHNUNG: is_gross=false, price_tl = Netto-Preis
  * Rabatte (TUR PROM ISK., YERINDE TUKETIM): vom Preis abziehen
- Menge = ANZAHL DER EINZELSTÜCKE (Cola 24×0,5L → quantity:24 unit:"Stk")
- DEPOZIT: nur DPZ.CC/DPZ.FAN/DPZ.SPR/DPZ.ZERO als Produkte. Alle anderen DPZ ignorieren.
- IGNORIERE vollständig: TOPLAM KDV, Ödenecek, Zahlungsinfos, Bankzeilen.
- BIM "N ad X PP,PP" = Mengen-Info für nächste Zeile, kein eigenes Produkt.
- vat_rate: %1 (Grundnahrung), %10 (Lebensmittel), %20 (Non-Food).
- Gleiche Produkte auf EINER Rechnung zusammenfassen.`

interface ClaudeItem {
  name: string; price_tl: number; is_gross: boolean
  quantity: number; unit: string; vat_rate: number | null; category_hint: string
}
interface ClaudeResult {
  supplier_name?: string | null; date?: string | null; ettn?: string | null
  fatura_no?: string | null; total_tl?: number | null; vat_amount?: number | null
  receipt_type?: string | null; items?: ClaudeItem[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), { status: 500 })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const db = createClient(supabaseUrl, supabaseKey)

  let body: { batch_id: string; storage_paths: string[] }
  try { body = await req.json() }
  catch { return new Response(JSON.stringify({ error: 'Ungültiger JSON-Body' }), { status: 400 }) }

  if (!body.batch_id || !Array.isArray(body.storage_paths) || body.storage_paths.length === 0) {
    return new Response(JSON.stringify({ error: 'batch_id und storage_paths[] erforderlich' }), { status: 400 })
  }

  // Händler einmal laden
  const { data: allSuppliers } = await db.from('suppliers').select('id, name, category, aliases')
  type Sup = { id: string; name: string; category: string; aliases: string | null }
  const suppliers: Sup[] = (allSuppliers as Sup[]) ?? []

  function matchSupplier(supplierName: string): Sup | null {
    const sn = supplierName.toLowerCase()
    return suppliers.filter(s => {
      const name = s.name.toLowerCase()
      const aliases = s.aliases ? s.aliases.split(',').map(a => a.trim().toLowerCase()) : []
      return sn.includes(name) || name.includes(sn) || aliases.some(a => sn.includes(a) || a.includes(sn))
    }).sort((a, b) => b.name.length - a.name.length)[0] ?? null
  }

  const results: Array<{ path: string; receipt_id: string | null; item_count: number; duplicate: boolean; error: string | null }> = []

  for (const storagePath of body.storage_paths) {
    const filename = storagePath.split('/').pop() ?? storagePath

    try {
      // Datei aus Storage laden
      const { data: fileData, error: storageErr } = await db.storage
        .from('receipts-pdfs')
        .download(storagePath)

      if (storageErr || !fileData) {
        results.push({ path: storagePath, receipt_id: null, item_count: 0, duplicate: false, error: `Storage: ${storageErr?.message ?? 'Datei nicht gefunden'}` })
        await incrementProcessed(db, body.batch_id)
        continue
      }

      // Blob → base64
      const arrayBuffer = await fileData.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
      }
      const base64 = btoa(binary)

      // Dateityp bestimmen
      const isPdf = filename.toLowerCase().endsWith('.pdf')
      const mediaType = isPdf ? 'application/pdf' : 'image/jpeg'

      // Claude aufrufen
      type ContentBlock =
        | { type: 'text'; text: string }
        | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
        | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }

      const content: ContentBlock[] = isPdf
        ? [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }]
        : [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }]
      content.push({ type: 'text', text: 'Lies diesen Beleg und extrahiere Kopfdaten + alle Produkte.' })

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 4096, system: SCAN_PROMPT, messages: [{ role: 'user', content }] }),
      })

      if (!claudeRes.ok) {
        const err = await claudeRes.text()
        results.push({ path: storagePath, receipt_id: null, item_count: 0, duplicate: false, error: `Claude: ${err.slice(0, 200)}` })
        await incrementProcessed(db, body.batch_id)
        continue
      }

      const claudeData = await claudeRes.json()
      const rawText: string = claudeData.content?.[0]?.text ?? ''

      let parsed: ClaudeResult = {}
      try { parsed = JSON.parse(rawText) }
      catch { const m = rawText.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]) } catch { /* leer */ } } }

      const items: ClaudeItem[] = parsed.items ?? []

      // Duplikat-Check
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

      if (isDuplicate) {
        results.push({ path: storagePath, receipt_id: existingReceiptId, item_count: 0, duplicate: true, error: null })
        await incrementProcessed(db, body.batch_id)
        continue
      }

      // Händler matchen + Receipt anlegen
      const supplierMatch = parsed.supplier_name ? matchSupplier(parsed.supplier_name) : null

      const { data: newReceipt, error: receiptErr } = await db.from('receipts').insert({
        supplier_id: supplierMatch?.id ?? null,
        ettn: parsed.ettn ?? null, fatura_no: parsed.fatura_no ?? null,
        date: parsed.date ?? null, total_tl: parsed.total_tl ?? null,
        vat_amount: parsed.vat_amount ?? null, receipt_type: parsed.receipt_type ?? null,
        source: 'scan', filename, item_count: items.length,
      }).select('id').single()

      if (receiptErr) {
        if (receiptErr.code === '23505') {
          // Race condition Duplikat — ignorieren
          results.push({ path: storagePath, receipt_id: null, item_count: 0, duplicate: true, error: null })
        } else {
          results.push({ path: storagePath, receipt_id: null, item_count: 0, duplicate: false, error: receiptErr.message })
        }
        await incrementProcessed(db, body.batch_id)
        continue
      }

      const receiptId = newReceipt!.id

      // receipt_items anlegen
      if (items.length > 0) {
        const rows = items.map(item => {
          const vatRate = item.vat_rate ?? 0
          const amountGross = item.is_gross ? item.price_tl : item.price_tl * (1 + vatRate / 100)
          return {
            receipt_id: receiptId, batch_id: body.batch_id,
            name: item.name, amount_gross: amountGross, vat_rate: vatRate,
            quantity: item.quantity ?? 1, unit: item.unit ?? null,
            date: parsed.date ?? null, mode: 'einkauf', status: 'pending',
          }
        })
        await db.from('receipt_items').insert(rows)
      }

      results.push({ path: storagePath, receipt_id: receiptId, item_count: items.length, duplicate: false, error: null })

    } catch (err) {
      results.push({ path: storagePath, receipt_id: null, item_count: 0, duplicate: false, error: err instanceof Error ? err.message : String(err) })
    }

    await incrementProcessed(db, body.batch_id)
  }

  // Batch abschließen
  const { data: batchData } = await db.from('scan_batches').select('total_files, processed_files').eq('id', body.batch_id).single()
  if (batchData && batchData.processed_files >= batchData.total_files) {
    await db.from('scan_batches').update({ status: 'review' }).eq('id', body.batch_id)
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})

async function incrementProcessed(db: ReturnType<typeof createClient>, batchId: string) {
  await db.rpc('increment_batch_processed', { batch_id: batchId })
}
