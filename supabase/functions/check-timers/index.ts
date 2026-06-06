// Supabase Edge Function: check-timers
// Läuft jede Stunde → prüft Teig-Timer + Frische-Tasks → Telegram an alle

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Frische-Regeln (müssen mit kitchen.ts übereinstimmen) ────────────────────
const FRESHNESS_TASKS = [
  { key: 'zwiebeln',       label: 'Zwiebeln',            hours: 24 },
  { key: 'paprika',        label: 'Paprika',              hours: 48 },
  { key: 'pilze',          label: 'Pilze',                hours: 24 },
  { key: 'mozza',          label: 'Mozza',                hours: 24 },
  { key: 'sucuk',          label: 'Sucuk',                hours: 48 },
  { key: 'salami',         label: 'Ital. Salami',         hours: 48 },
  { key: 'salami_scharf',  label: 'Scharfe Ital. Salami', hours: 48 },
  { key: 'jambon',         label: 'Jambon',               hours: 48 },
  { key: 'pastirma',       label: 'Pastırma',             hours: 48 },
  { key: 'tiramisu',       label: 'Tiramisu',             hours: 48 },
  { key: 'piccolo_crunch', label: 'Piccolo Crunch',       hours: 48 },
]

const DOUGH_STAGE_LABELS: Record<string, string> = {
  teig_gemacht:       '➡️ Teiglinge formen!',
  teiglinge_geformt:  '➡️ In den Kühlschrank!',
  kuehlschrank:       '➡️ Raus aus dem Kühlschrank!',
  draussen:           '✅ Teig fertig zum Backen!',
}

const DOUGH_STAGE_HOURS: Record<string, number> = {
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

async function broadcast(token: string, chats: string[], text: string) {
  for (const chat of chats) {
    if (chat) await sendTelegram(token, chat, text)
  }
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const token   = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
  const chats   = [
    Deno.env.get('TELEGRAM_CHAT_VEDAT')   ?? '',
    Deno.env.get('TELEGRAM_CHAT_RAKIM')   ?? '',
    Deno.env.get('TELEGRAM_CHAT_NATALIE') ?? '',
  ]

  const now = Date.now()
  const notified: string[] = []

  // ── 1. Teig-Timer prüfen ─────────────────────────────────────────────────
  const { data: batches } = await supabase
    .from('kitchen_dough_batches')
    .select('*')
    .neq('stage', 'fertig')

  for (const b of batches ?? []) {
    const stage = b.stage as string
    const tsField = stage === 'teig_gemacht'      ? b.teig_at
      : stage === 'teiglinge_geformt' ? b.teiglinge_at
      : stage === 'kuehlschrank'      ? b.kuehlschrank_at
      : stage === 'draussen'          ? b.draussen_at
      : null

    if (!tsField) continue
    const elapsedH = (now - new Date(tsField).getTime()) / 3_600_000
    const limitH = stage === 'draussen' ? (b.draussen_stunden ?? 2) : (DOUGH_STAGE_HOURS[stage] ?? 999)

    if (elapsedH >= limitH && elapsedH < limitH + 1) {
      const action = DOUGH_STAGE_LABELS[stage] ?? 'Nächste Stage'
      const gestartet = new Date(b.teig_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      const msg = `🍕 <b>Il Piccolo Küche</b>\n⏰ <b>TEIG BEREIT!</b>\n${action}\n\n<i>Charge gestartet: ${gestartet}</i>`
      await broadcast(token, chats, msg)
      notified.push(`teig:${b.id}(${stage})`)
    }
  }

  // ── 2. Frische-Tasks prüfen ───────────────────────────────────────────────
  // Letzten Log pro Task holen
  const { data: logs } = await supabase
    .from('kitchen_task_logs')
    .select('task_key, logged_at')
    .order('logged_at', { ascending: false })

  // Neuesten Log pro task_key
  const latestLog: Record<string, string> = {}
  for (const log of logs ?? []) {
    if (!latestLog[log.task_key]) latestLog[log.task_key] = log.logged_at
  }

  for (const task of FRESHNESS_TASKS) {
    const ts = latestLog[task.key]
    if (!ts) continue // noch nie eingetragen → keine Nachricht

    const elapsedH = (now - new Date(ts).getTime()) / 3_600_000

    // Sende genau wenn die Grenze in dieser Stunde überschritten wurde
    if (elapsedH >= task.hours && elapsedH < task.hours + 1) {
      const zeitpunkt = new Date(ts).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      const msg = `🍕 <b>Il Piccolo Küche</b>\n⚠️ <b>${task.label} nicht mehr frisch!</b>\n\nEingetragen: ${zeitpunkt}\nBitte neu vorbereiten.`
      await broadcast(token, chats, msg)
      notified.push(`frische:${task.key}`)
    }
  }

  return new Response(JSON.stringify({ checked_batches: batches?.length ?? 0, notified }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
