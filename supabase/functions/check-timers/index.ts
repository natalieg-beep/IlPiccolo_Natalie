// Supabase Edge Function: check-timers
// Läuft alle 30 Min → Teig: einzeln je Charge | Frische/Belag/Dessert: gebündelt
// Benachrichtigung: bei Fälligkeit + stündliche Erinnerung solange überfällig
//
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_VEDAT, TELEGRAM_CHAT_RAKIM, TELEGRAM_CHAT_NATALIE

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cron läuft alle 30 Min → Fenster 30 Min damit kein Schlag verpasst wird
const WINDOW_H = 0.5

const DOUGH_STAGE_LABELS: Record<string, string> = {
  teig_gemacht:      '➡️ Jetzt Teiglinge formen!',
  teiglinge_geformt: '➡️ Teiglinge rausnehmen!',
  kuehlschrank:      '➡️ Teiglinge rausnehmen!',
  draussen:          '✅ Teig fertig zum Backen!',
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

// Feuert bei Fälligkeit UND danach jede volle Stunde (0h, 1h, 2h überfällig...)
function needsNotification(elapsedH: number, limitH: number): boolean {
  if (elapsedH < limitH) return false
  const overdueH = elapsedH - limitH
  // Jede volle Stunde: 0.0–0.5, 1.0–1.5, 2.0–2.5 ...
  return overdueH % 1.0 < WINDOW_H
}

// Vorwarnung: nur einmalig X Stunden vor Fälligkeit
function inWarnWindow(elapsedH: number, limitH: number, warnH: number): boolean {
  const target = limitH - warnH
  return elapsedH >= target && elapsedH < target + WINDOW_H
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

  if (isTest) {
    await broadcast(token, chats, '🍕 <b>Il Piccolo Küche</b>\n✅ Telegram-Test erfolgreich! Benachrichtigungen funktionieren.')
    return new Response(JSON.stringify({ test: true, sent_to: chats.filter(Boolean).length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const now = Date.now()
  const notified: string[] = []

  // ── 1. Teig-Timer — je Charge einzeln ──────────────────────────────────────
  const { data: batches } = await supabase
    .from('kitchen_dough_batches')
    .select('*')
    .neq('stage', 'fertig')

  for (const b of batches ?? []) {
    const stage = b.stage as string
    const tsField = stage === 'teig_gemacht'      ? b.teig_at
      : stage === 'teiglinge_geformt' ? b.teiglinge_at
      : stage === 'kuehlschrank'      ? (b.kuehlschrank_at ?? b.teiglinge_at)
      : stage === 'draussen'          ? b.draussen_at
      : null
    if (!tsField) continue

    const elapsedH = (now - new Date(tsField).getTime()) / 3_600_000
    const limitH = stage === 'draussen' ? (b.draussen_stunden ?? 2) : (DOUGH_STAGE_HOURS[stage] ?? 999)
    const action = DOUGH_STAGE_LABELS[stage] ?? 'Nächste Stage'
    const gestartet = new Date(b.teig_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

    // Vorwarnung: 1h vor Fälligkeit (einmalig)
    if (inWarnWindow(elapsedH, limitH, 1)) {
      const msg = `🍕 <b>Il Piccolo Küche</b>\n⚠️ <b>TEIG — noch 1 Stunde!</b>\n${action}\n\n<i>Charge: ${gestartet}</i>`
      await broadcast(token, chats, msg)
      notified.push(`teig-warn:${b.id}(${stage})`)
    }

    // Fälligkeit + stündliche Erinnerung
    if (needsNotification(elapsedH, limitH)) {
      const overdueH = Math.floor(elapsedH - limitH)
      const overdueText = overdueH >= 1 ? ` (seit ${overdueH}h überfällig)` : ''
      const msg = `🍕 <b>Il Piccolo Küche</b>\n⏰ <b>TEIG FÄLLIG${overdueText}!</b>\n${action}\n\n<i>Charge: ${gestartet}</i>`
      await broadcast(token, chats, msg)
      notified.push(`teig-due:${b.id}(${stage})+${overdueH}h`)
    }
  }

  // ── 2. Frische/Belag/Dessert — gebündelt ───────────────────────────────────
  const { data: settings } = await supabase
    .from('kitchen_freshness_settings')
    .select('task_key, label, hours, warn_before_hours')

  const { data: logs } = await supabase
    .from('kitchen_task_logs')
    .select('task_key, logged_at')
    .order('logged_at', { ascending: false })

  const latestLog: Record<string, string> = {}
  for (const log of logs ?? []) {
    if (!latestLog[log.task_key]) latestLog[log.task_key] = log.logged_at
  }

  const warnItems: string[] = []
  const overdueItems: { label: string; overdueH: number }[] = []

  for (const task of settings ?? []) {
    const ts = latestLog[task.task_key]
    if (!ts) continue

    const elapsedH = (now - new Date(ts).getTime()) / 3_600_000
    const limitH = task.hours
    const warnH = task.warn_before_hours

    // Vorwarnung (einmalig, nur wenn konfiguriert)
    if (warnH && inWarnWindow(elapsedH, limitH, warnH)) {
      warnItems.push(`⚠️ ${task.label} — noch ${warnH}h frisch`)
      notified.push(`frische-warn:${task.task_key}`)
    }

    // Fälligkeit + stündliche Erinnerung → sammeln für gebündelte Nachricht
    if (needsNotification(elapsedH, limitH)) {
      const overdueH = Math.floor(elapsedH - limitH)
      overdueItems.push({ label: task.label, overdueH })
      notified.push(`frische-due:${task.task_key}+${overdueH}h`)
    }
  }

  // Vorwarnungen gebündelt senden
  if (warnItems.length > 0) {
    const msg = `🍕 <b>Il Piccolo Küche — Vorwarnung</b>\n\n${warnItems.join('\n')}\n\n<i>Bitte bald neu vorbereiten.</i>`
    await broadcast(token, chats, msg)
  }

  // Überfällige gebündelt senden
  if (overdueItems.length > 0) {
    const maxOverdue = Math.max(...overdueItems.map(i => i.overdueH))
    const overdueText = maxOverdue >= 1 ? ` (bis zu ${maxOverdue}h überfällig)` : ''
    const lines = overdueItems.map(i =>
      i.overdueH >= 1 ? `🚨 ${i.label} (${i.overdueH}h überfällig)` : `🚨 ${i.label}`
    ).join('\n')
    const msg = `🍕 <b>Il Piccolo Küche — Nicht mehr frisch${overdueText}!</b>\n\n${lines}\n\n<i>Bitte sofort neu vorbereiten!</i>`
    await broadcast(token, chats, msg)
  }

  return new Response(JSON.stringify({ checked_batches: batches?.length ?? 0, notified }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
