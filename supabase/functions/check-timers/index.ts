// Supabase Edge Function: check-timers
// Läuft jede Stunde via Cron → prüft Teig-Timers → sendet WhatsApp via CallMeBot
//
// Umgebungsvariablen in Supabase Dashboard setzen:
//   CALLMEBOT_KEY_VEDAT   → API Key von Vedat (nach CallMeBot Aktivierung)
//   CALLMEBOT_KEY_RAKIM   → API Key von Rakim (nach CallMeBot Aktivierung)
//   SUPABASE_URL          → automatisch gesetzt
//   SUPABASE_SERVICE_ROLE_KEY → automatisch gesetzt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PHONE_VEDAT = '905542527254'
const PHONE_RAKIM = '905347459719'

const STAGE_LABELS: Record<string, string> = {
  teig_gemacht:      'Teiglinge formen',
  teiglinge_geformt: 'In den Kühlschrank',
  kuehlschrank:      'Raus aus dem Kühlschrank',
  draussen:          'Teig ist fertig zum Backen',
}

const STAGE_HOURS: Record<string, number> = {
  teig_gemacht:      24,
  teiglinge_geformt: 24,
  kuehlschrank:      24,
}

async function sendWhatsApp(phone: string, apiKey: string, message: string) {
  if (!apiKey) return
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`
  await fetch(url)
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const keyVedat = Deno.env.get('CALLMEBOT_KEY_VEDAT') ?? ''
  const keyRakim = Deno.env.get('CALLMEBOT_KEY_RAKIM') ?? ''

  // Hole alle aktiven (nicht fertige) Chargen
  const { data: batches } = await supabase
    .from('kitchen_dough_batches')
    .select('*, kitchen_users(name)')
    .neq('stage', 'fertig')

  if (!batches) return new Response('ok', { status: 200 })

  const now = Date.now()
  const notified: string[] = []

  for (const b of batches) {
    const stage = b.stage as string
    const tsField = stage === 'teig_gemacht' ? b.teig_at
      : stage === 'teiglinge_geformt' ? b.teiglinge_at
      : stage === 'kuehlschrank' ? b.kuehlschrank_at
      : stage === 'draussen' ? b.draussen_at
      : null

    if (!tsField) continue

    const elapsedH = (now - new Date(tsField).getTime()) / 3_600_000
    const limitH = stage === 'draussen' ? (b.draussen_stunden ?? 2) : (STAGE_HOURS[stage] ?? 999)

    // Sende Nachricht wenn timer genau überschritten wurde (within this hour)
    // Prüfe ob elapsed zwischen limitH und limitH+1 liegt (damit wir nur einmal senden)
    if (elapsedH >= limitH && elapsedH < limitH + 1) {
      const action = STAGE_LABELS[stage] ?? 'Nächste Stage'
      const msg = `🍕 Il Piccolo Küche\n⏰ TEIG BEREIT!\n➡️ ${action}\n(Charge gestartet: ${new Date(b.teig_at).toLocaleString('de-DE')})`

      await sendWhatsApp(PHONE_VEDAT, keyVedat, msg)
      await sendWhatsApp(PHONE_RAKIM, keyRakim, msg)

      notified.push(`${b.id} (${stage})`)
    }
  }

  return new Response(JSON.stringify({ checked: batches.length, notified }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
