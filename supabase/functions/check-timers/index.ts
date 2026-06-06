// Supabase Edge Function: check-timers
// Läuft jede Stunde via Cron → prüft Teig-Timers → sendet Telegram-Nachrichten
//
// Secrets in Supabase Dashboard setzen (Settings → Edge Functions → Secrets):
//   TELEGRAM_BOT_TOKEN  → 8951191011:AAH7JQPxrbfse0gBlPkxJgub7rEDx-IT5u0
//   TELEGRAM_CHAT_VEDAT → 5170867099
//   TELEGRAM_CHAT_RAKIM → (später eintragen wenn Rakim den Bot angeschrieben hat)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STAGE_LABELS: Record<string, string> = {
  teig_gemacht:       '➡️ Teiglinge formen!',
  teiglinge_geformt:  '➡️ In den Kühlschrank!',
  kuehlschrank:       '➡️ Raus aus dem Kühlschrank!',
  draussen:           '✅ Teig fertig zum Backen!',
}

const STAGE_HOURS: Record<string, number> = {
  teig_gemacht:      24,
  teiglinge_geformt: 24,
  kuehlschrank:      24,
}

async function sendTelegram(token: string, chatId: string, text: string) {
  if (!chatId) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const token      = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
  const chatVedat  = Deno.env.get('TELEGRAM_CHAT_VEDAT') ?? ''
  const chatRakim  = Deno.env.get('TELEGRAM_CHAT_RAKIM') ?? ''
  const chatNatalie = Deno.env.get('TELEGRAM_CHAT_NATALIE') ?? ''

  const { data: batches } = await supabase
    .from('kitchen_dough_batches')
    .select('*')
    .neq('stage', 'fertig')

  if (!batches) return new Response('ok', { status: 200 })

  const now = Date.now()
  const notified: string[] = []

  for (const b of batches) {
    const stage = b.stage as string
    const tsField = stage === 'teig_gemacht'      ? b.teig_at
      : stage === 'teiglinge_geformt' ? b.teiglinge_at
      : stage === 'kuehlschrank'      ? b.kuehlschrank_at
      : stage === 'draussen'          ? b.draussen_at
      : null

    if (!tsField) continue

    const elapsedH = (now - new Date(tsField).getTime()) / 3_600_000
    const limitH = stage === 'draussen' ? (b.draussen_stunden ?? 2) : (STAGE_HOURS[stage] ?? 999)

    // Nur senden wenn der Timer in dieser Stunde abgelaufen ist (verhindert Doppel-Nachrichten)
    if (elapsedH >= limitH && elapsedH < limitH + 1) {
      const action = STAGE_LABELS[stage] ?? 'Nächste Stage'
      const gestartet = new Date(b.teig_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      const msg = `🍕 <b>Il Piccolo Küche</b>\n⏰ <b>TEIG BEREIT!</b>\n${action}\n\n<i>Charge gestartet: ${gestartet}</i>`

      await sendTelegram(token, chatVedat, msg)
      await sendTelegram(token, chatRakim, msg)
      await sendTelegram(token, chatNatalie, msg)

      notified.push(`${b.id} (${stage})`)
    }
  }

  return new Response(JSON.stringify({ checked: batches.length, notified }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
