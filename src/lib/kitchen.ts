export type KitchenUser = { id: string; name: string; whatsapp: string | null }

// ── Aufgaben-Definitionen ─────────────────────────────────────────────────────

export type TaskType = 'freshness' | 'daily' | 'logonly'

export interface TaskDef {
  key: string
  label: string
  type: TaskType
  hours?: number   // freshness: rot nach X Stunden / daily: ignoriert (immer täglich)
  icon: string
}

export const FRESHNESS_TASKS: TaskDef[] = [
  { key: 'zwiebeln',  label: 'Zwiebeln geschnitten', type: 'freshness', hours: 24, icon: '🧅' },
  { key: 'paprika',   label: 'Paprika geschnitten',  type: 'freshness', hours: 48, icon: '🫑' },
  { key: 'pilze',     label: 'Pilze geschnitten',    type: 'freshness', hours: 24, icon: '🍄' },
  { key: 'mozza',     label: 'Mozza geöffnet',       type: 'freshness', hours: 24, icon: '🧀' },
]

export const BELAG_TASKS: TaskDef[] = [
  { key: 'sucuk',        label: 'Sucuk',              type: 'freshness', hours: 48, icon: '🥩' },
  { key: 'salami',       label: 'Ital. Salami',       type: 'freshness', hours: 48, icon: '🍕' },
  { key: 'salami_scharf',label: 'Scharfe Ital. Salami',type: 'freshness', hours: 48, icon: '🌶️' },
  { key: 'jambon',       label: 'Jambon',             type: 'freshness', hours: 48, icon: '🥓' },
  { key: 'pastirma',     label: 'Pastırma',           type: 'freshness', hours: 48, icon: '🥩' },
]

export const DESSERT_TASKS: TaskDef[] = [
  { key: 'tiramisu',      label: 'Tiramisu',       type: 'freshness', hours: 48, icon: '🍰' },
  { key: 'piccolo_crunch',label: 'Piccolo Crunch', type: 'freshness', hours: 48, icon: '🍫' },
]

export const DAILY_TASKS: TaskDef[] = [
  { key: 'klo',              label: 'Klo putzen',       type: 'daily', icon: '🚽' },
  { key: 'innen_wischen',    label: 'Innen wischen',    type: 'daily', icon: '🧹' },
  { key: 'terrasse_wasser',  label: 'Terrasse Wasser',  type: 'daily', icon: '💧' },
  { key: 'terrasse_wischen', label: 'Terrasse wischen', type: 'daily', icon: '🪣' },
]

export const LOG_TASKS: TaskDef[] = [
  { key: 'gas',        label: 'Gasflaschen Wechsel', type: 'logonly', icon: '🔥' },
  { key: 'klimawasser',label: 'Klimawasser',         type: 'logonly', icon: '❄️' },
]

// ── Dough-Stages ──────────────────────────────────────────────────────────────

export type DoughStage = 'teig_gemacht' | 'teiglinge_geformt' | 'kuehlschrank' | 'draussen' | 'fertig'

export const DOUGH_STAGES: { key: DoughStage; label: string; next: string; desc: string }[] = [
  { key: 'teig_gemacht',     label: 'Teig gemacht',       next: 'Teiglinge formen',    desc: '24h warten' },
  { key: 'teiglinge_geformt',label: 'Teiglinge geformt',  next: 'In Kühlschrank',      desc: '24h Kühlschrank' },
  { key: 'kuehlschrank',     label: 'Im Kühlschrank',     next: 'Raus aus Kühlschrank',desc: '24h lagern' },
  { key: 'draussen',         label: 'Draußen (akkl.)',    next: 'Fertig!',             desc: 'X Stunden akklimatisieren' },
  { key: 'fertig',           label: 'Fertig zum Backen',  next: '',                    desc: '' },
]

// Stunden bis zur nächsten Stage (für Timer)
export const DOUGH_TIMER_HOURS: Partial<Record<DoughStage, number>> = {
  teig_gemacht:      24,
  teiglinge_geformt: 24,
  kuehlschrank:      24,
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

export function hoursAgo(ts: string | null | undefined): number | null {
  if (!ts) return null
  return (Date.now() - new Date(ts).getTime()) / 3_600_000
}

export function formatRelative(ts: string | null | undefined): string {
  if (!ts) return '—'
  const h = hoursAgo(ts)!
  if (h < 1) return `vor ${Math.round(h * 60)} Min`
  if (h < 24) return `vor ${Math.round(h)} Std`
  const d = Math.floor(h / 24)
  return `vor ${d} Tag${d > 1 ? 'en' : ''}`
}

export function formatTs(ts: string | null | undefined): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

export function formatTsFull(ts: string | null | undefined): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

export function nextDueTs(ts: string, hours: number): string {
  const due = new Date(new Date(ts).getTime() + hours * 3_600_000)
  return due.toLocaleString('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

export function isToday(ts: string | null | undefined): boolean {
  if (!ts) return false
  const d = new Date(ts)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

// Ampel-Farbe für Frische-Tasks
export function freshnessColor(ts: string | null | undefined, hours: number): 'green' | 'yellow' | 'red' | 'grey' {
  if (!ts) return 'grey'
  const h = hoursAgo(ts)!
  if (h < hours * 0.75) return 'green'
  if (h < hours)        return 'yellow'
  return 'red'
}

// Ampel für MDH
export function mdhColor(expiresAt: string): 'green' | 'yellow' | 'red' {
  const days = (new Date(expiresAt).getTime() - Date.now()) / 86_400_000
  if (days > 3)  return 'green'
  if (days >= 0) return 'yellow'
  return 'red'
}

export const COLOR = {
  green:  { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
  yellow: { bg: '#FFF8E1', border: '#FFB300', text: '#8B6900' },
  red:    { bg: '#FFEBEE', border: '#E53935', text: '#B71C1C' },
  grey:   { bg: '#F5F5F5', border: '#BDBDBD', text: '#616161' },
}
