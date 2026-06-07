// Supabase Edge Function: check-timers
// Läuft alle 30 Min → prüft Teig + Frische → sendet Vorwarnung (1h vorher) + Fälligkeit
//
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_VEDAT, TELEGRAM_CHAT_RAKIM, TELEGRAM_CHAT_NATALIE

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Fenster: Benachrichtigung gilt als "in dieser Periode" wenn elapsed im 30-Min-Fenster liegt
const WINDOW_H = 0.5

const DOUGH_STAGE_LABELS: Record<string, string> = {
  teig_gemacht:       '➡️ Jetzt Teiglinge formen!',
  teiglinge_geformt:  '➡️ Teiglinge in den Kühlschrank!',
  kuehlschrank:       '➡️ Teiglinge rausnehmen!',
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

function inWindow(elapsedH: number, targetH: number): boolean {
  return elapsedH >= targetH && elapsedH < targetH + WINDOW_H
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const isTest = url.searchParams.get('test') === 'true'
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
  const chats = [
    Deno.env.get('TELEGRAM_CHAT_VEDAT')   ?? '',
    Deno.env.get('TELEGRAM_CHAT_RAKIM')   ?? '',
    Deno.env.get('TELEGRAM_CHAT_NATALIE') ?? '',
  ]

  // Test-Modus: ?test=true → sofort Testnachricht an alle
  if (isTest) {
    await broadcast(token, chats, '🍕 <b>Il Piccolo Küche</b>\n✅ Telegram-Test erfolgreich! Benachrichtigungen funktionieren.')
    return new Response(JSON.stringify({ test: true, sent_to: chats.filter(Boolean).length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const now = Date.now()
  const notified: string[] = []

  // ── 1. Teig-Timer ───────────────────────────────────────────────────────────
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
    const action = DOUGH_STAGE_LABELS[stage] ?? 'Nächste Stage'
    const gestartet = new Date(b.teig_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    const gesamtLeft = Math.max(0, 96 - elapsedH)

    // Vorwarnung: 1h vor Fälligkeit
    if (inWindow(elapsedH, limitH - 1)) {
      const msg = `🍕 <b>Il Piccolo Küche</b>\n⚠️ <b>TEIG — noch 1 Stunde!</b>\n${action}\n\n<i>Charge: ${gestartet} · noch ~${Math.ceil(gesamtLeft)}h Gesamtlaufzeit</i>`
      await broadcast(token, chats, msg)
      notified.push(`teig-warn:${b.id}(${stage})`)
    }

    // Fälligkeit
    if (inWindow(elapsedH, limitH)) {
      const msg = `🍕 <b>Il Piccolo Küche</b>\n⏰ <b>TEIG JETZT FÄLLIG!</b>\n${action}\n\n<i>Charge: ${gestartet} · noch ~${Math.ceil(gesamtLeft)}h Gesamtlaufzeit</i>`
      await broadcast(token, chats, msg)
      notified.push(`teig-due:${b.id}(${stage})`)
    }
  }

  // ── 2. Frische-Tasks ────────────────────────────────────────────────────────
  const { data: settings } = await supabase
    .from('kitchen_freshness_settings')
    .select('task_key, label, hours, warn_before_hours')

  const { data: logs } = await supabase
    .from('kitchen_task_logs')
    .select('task_key, logged_at')
    .order('logged_at', { ascending: false })

  // Neuester Log pro task_key
  const latestLog: Record<string, string> = {}
  for (const log of logs ?? []) {
    if (!latestLog[log.task_key]) latestLog[log.task_key] = log.logged_at
  }

  for (const task of settings ?? []) {
    const ts = latestLog[task.task_key]
    if (!ts) continue

    const elapsedH = (now - new Date(ts).getTime()) / 3_600_000
    const limitH = task.hours
    const warnH = task.warn_before_hours  // null = keine Vorwarnung
    const zeitpunkt = new Date(ts).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

    // Vorwarnung (nur wenn warn_before_hours gesetzt)
    if (warnH && inWindow(elapsedH, limitH - warnH)) {
      const msg = `🍕 <b>Il Piccolo Küche</b>\n⚠️ <b>${task.label} — noch ${warnH}h frisch!</b>\n\nEingetragen: ${zeitpunkt}\nBitte bald neu vorbereiten.`
      await broadcast(token, chats, msg)
      notified.push(`frische-warn:${task.task_key}`)
    }

    // Fälligkeit
    if (inWindow(elapsedH, limitH)) {
      const msg = `🍕 <b>Il Piccolo Küche</b>\n🚨 <b>${task.label} nicht mehr frisch!</b>\n\nEingetragen: ${zeitpunkt}\nBitte sofort neu vorbereiten!`
      await broadcast(token, chats, msg)
      notified.push(`frische-due:${task.task_key}`)
    }
  }

  return new Response(JSON.stringify({ checked_batches: batches?.length ?? 0, notified }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
