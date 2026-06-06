'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  FRESHNESS_TASKS, BELAG_TASKS, DAILY_TASKS, LOG_TASKS,
  type KitchenUser, type TaskDef, type DoughStage,
  hoursAgo, formatRelative, formatTs, isToday, freshnessColor, COLOR,
} from '@/lib/kitchen'

interface DoughBatch {
  id: string
  stage: DoughStage
  teig_at: string | null
  teiglinge_at: string | null
  kuehlschrank_at: string | null
  draussen_at: string | null
  fertig_at: string | null
  draussen_stunden: number
  user_id: string
}

interface TaskLog {
  task_key: string
  logged_at: string
}

const STAGE_LABELS: Record<DoughStage, string> = {
  teig_gemacht: 'Teig gemacht',
  teiglinge_geformt: 'Teiglinge geformt',
  kuehlschrank: 'Im Kühlschrank',
  draussen: 'Draußen (akkl.)',
  fertig: 'Fertig! ✅',
}

const STAGE_TIMER_HOURS: Partial<Record<DoughStage, number>> = {
  teig_gemacht: 24,
  teiglinge_geformt: 24,
  kuehlschrank: 24,
}

function stageTimestamp(b: DoughBatch): string | null {
  if (b.stage === 'teig_gemacht') return b.teig_at
  if (b.stage === 'teiglinge_geformt') return b.teiglinge_at
  if (b.stage === 'kuehlschrank') return b.kuehlschrank_at
  if (b.stage === 'draussen') return b.draussen_at
  return b.fertig_at
}

function stageNextLabel(stage: DoughStage): string {
  if (stage === 'teig_gemacht') return 'Teiglinge formen →'
  if (stage === 'teiglinge_geformt') return 'In Kühlschrank →'
  if (stage === 'kuehlschrank') return 'Raus aus Kühlschrank →'
  if (stage === 'draussen') return 'Fertig markieren →'
  return ''
}

function stageColor(stage: DoughStage, ts: string | null, draussen_stunden: number): 'green' | 'yellow' | 'red' | 'grey' {
  if (stage === 'fertig') return 'green'
  if (!ts) return 'grey'
  const h = hoursAgo(ts)!
  const limit = stage === 'draussen' ? draussen_stunden : (STAGE_TIMER_HOURS[stage] ?? 24)
  if (h < limit * 0.75) return 'green'
  if (h < limit) return 'yellow'
  return 'red'
}

export default function HomeClient() {
  const router = useRouter()
  const [user, setUser] = useState<KitchenUser | null>(null)
  const [batches, setBatches] = useState<DoughBatch[]>([])
  const [logs, setLogs] = useState<TaskLog[]>([])
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('kitchen_user')
    if (!u) { router.replace('/kueche'); return }
    setUser(JSON.parse(u))
  }, [router])

  const load = useCallback(async () => {
    const db = createClient()
    const [{ data: b }, { data: l }] = await Promise.all([
      db.from('kitchen_dough_batches').select('*').neq('stage', 'fertig').order('created_at', { ascending: false }),
      db.from('kitchen_task_logs').select('task_key, logged_at').order('logged_at', { ascending: false }).limit(200),
    ])
    setBatches((b ?? []) as DoughBatch[])
    setLogs(l ?? [])
  }, [])

  useEffect(() => { if (user) load() }, [user, load])

  // Latest log per task key
  const latestLog = (key: string): string | null =>
    logs.find(l => l.task_key === key)?.logged_at ?? null

  async function logTask(task: TaskDef) {
    if (!user) return
    setSaving(task.key)
    await createClient().from('kitchen_task_logs').insert({ task_key: task.key, user_id: user.id })
    await load()
    setSaving(null)
  }

  async function advanceDough(batch: DoughBatch) {
    if (!user) return
    setSaving('dough-' + batch.id)
    const db = createClient()
    const now = new Date().toISOString()
    const updates: Record<string, string | DoughStage> = {}

    if (batch.stage === 'teig_gemacht')      { updates.stage = 'teiglinge_geformt'; updates.teiglinge_at = now }
    else if (batch.stage === 'teiglinge_geformt') { updates.stage = 'kuehlschrank'; updates.kuehlschrank_at = now }
    else if (batch.stage === 'kuehlschrank') { updates.stage = 'draussen'; updates.draussen_at = now }
    else if (batch.stage === 'draussen')     { updates.stage = 'fertig'; updates.fertig_at = now }

    await db.from('kitchen_dough_batches').update(updates).eq('id', batch.id)
    await load()
    setSaving(null)
  }

  async function newDoughBatch() {
    if (!user) return
    setSaving('new-dough')
    await createClient().from('kitchen_dough_batches').insert({
      user_id: user.id, stage: 'teig_gemacht', teig_at: new Date().toISOString(),
    })
    await load()
    setSaving(null)
  }

  if (!user) return null

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ background: '#1B3A1B', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '800', margin: 0 }}>🍕 Küche</h1>
          <p style={{ color: '#8FBF8F', fontSize: '12px', margin: '2px 0 0' }}>
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/kueche/mdh">
            <button style={{ background: '#2D5A2D', border: 'none', color: '#FFFFFF', padding: '7px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>📦 MDH</button>
          </Link>
          <button
            onClick={() => { localStorage.removeItem('kitchen_user'); router.push('/kueche') }}
            style={{ background: 'transparent', border: '1px solid #4A6A4A', color: '#8FBF8F', padding: '7px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
          >
            👤 {user.name}
          </button>
        </div>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ── TEIG ─────────────────────────────────────────────── */}
        <Section title="🫓 Teig" action={
          <button onClick={newDoughBatch} disabled={saving === 'new-dough'}
            style={btnStyle('#3A7A3A', '#FFFFFF')}>
            + Neuer Teig
          </button>
        }>
          {batches.length === 0 && (
            <p style={{ color: '#888', fontSize: '13px', margin: '4px 0' }}>Kein aktiver Teig.</p>
          )}
          {batches.map(b => {
            const ts = stageTimestamp(b)
            const col = stageColor(b.stage, ts, b.draussen_stunden)
            const timerH = b.stage === 'draussen' ? b.draussen_stunden : (STAGE_TIMER_HOURS[b.stage] ?? 0)
            const elapsed = ts ? hoursAgo(ts)! : null
            const remaining = elapsed !== null && timerH ? Math.max(0, timerH - elapsed) : null
            return (
              <div key={b.id} style={{ background: COLOR[col].bg, border: `1.5px solid ${COLOR[col].border}`, borderRadius: '12px', padding: '12px 14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: COLOR[col].text }}>{STAGE_LABELS[b.stage]}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>seit: {formatTs(ts)}</div>
                    {remaining !== null && b.stage !== 'fertig' && (
                      <div style={{ fontSize: '12px', color: COLOR[col].text, marginTop: '2px' }}>
                        {remaining < 0.1 ? '⏰ Fällig!' : `⏱ noch ~${Math.ceil(remaining)} Std`}
                      </div>
                    )}
                  </div>
                  {b.stage !== 'fertig' && (
                    <button
                      onClick={() => advanceDough(b)}
                      disabled={saving === 'dough-' + b.id}
                      style={btnStyle('#3A7A3A', '#FFFFFF', '13px')}
                    >
                      {stageNextLabel(b.stage)}
                    </button>
                  )}
                </div>
                {/* Draußen: Stunden anpassen */}
                {b.stage === 'kuehlschrank' && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#555' }}>
                    Akkl. Stunden (nach Kühlschrank):{' '}
                    {[1,2,3,4].map(h => (
                      <button key={h} onClick={async () => {
                        await createClient().from('kitchen_dough_batches').update({ draussen_stunden: h }).eq('id', b.id)
                        await load()
                      }} style={{
                        marginLeft: '4px', padding: '2px 8px', borderRadius: '6px', border: '1px solid #999',
                        background: b.draussen_stunden === h ? '#3A7A3A' : '#FFF',
                        color: b.draussen_stunden === h ? '#FFF' : '#333',
                        cursor: 'pointer', fontSize: '12px',
                      }}>{h}h</button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <Link href="/kueche/teig" style={{ fontSize: '13px', color: '#3A7A3A', textDecoration: 'none' }}>Alle Chargen → </Link>
        </Section>

        {/* ── FRISCHE ──────────────────────────────────────────── */}
        <Section title="🥬 Frische">
          {FRESHNESS_TASKS.map(t => <TaskRow key={t.key} task={t} ts={latestLog(t.key)} onLog={() => logTask(t)} saving={saving === t.key} />)}
        </Section>

        {/* ── BELAG VORBEREITUNG ────────────────────────────────── */}
        <Section title="🍕 Belag Vorbereitung">
          {BELAG_TASKS.map(t => <TaskRow key={t.key} task={t} ts={latestLog(t.key)} onLog={() => logTask(t)} saving={saving === t.key} />)}
        </Section>

        {/* ── TÄGLICH ──────────────────────────────────────────── */}
        <Section title="🧹 Täglich">
          {DAILY_TASKS.map(t => {
            const ts = latestLog(t.key)
            const done = isToday(ts)
            const col = done ? 'green' : 'red'
            return (
              <div key={t.key} style={{ background: COLOR[col].bg, border: `1.5px solid ${COLOR[col].border}`, borderRadius: '10px', padding: '10px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '16px' }}>{t.icon}</span>{' '}
                  <span style={{ fontWeight: '600', fontSize: '14px', color: COLOR[col].text }}>{t.label}</span>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{done ? `✓ ${formatRelative(ts)}` : 'Heute noch nicht'}</div>
                </div>
                <button onClick={() => logTask(t)} disabled={saving === t.key}
                  style={btnStyle(done ? '#4CAF50' : '#E53935', '#FFFFFF', '13px')}>
                  {done ? '✓ Nochmal' : 'Erledigt'}
                </button>
              </div>
            )
          })}
        </Section>

        {/* ── SONSTIGES ────────────────────────────────────────── */}
        <Section title="🔧 Sonstiges">
          {LOG_TASKS.map(t => {
            const ts = latestLog(t.key)
            return (
              <div key={t.key} style={{ background: '#FFFFFF', border: '1.5px solid #DDEEDD', borderRadius: '10px', padding: '10px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '16px' }}>{t.icon}</span>{' '}
                  <span style={{ fontWeight: '600', fontSize: '14px', color: '#1B3A1B' }}>{t.label}</span>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Zuletzt: {formatRelative(ts)}</div>
                </div>
                <button onClick={() => logTask(t)} disabled={saving === t.key}
                  style={btnStyle('#3A7A3A', '#FFFFFF', '13px')}>
                  Jetzt
                </button>
              </div>
            )
          })}
        </Section>

      </div>
    </div>
  )
}

// ── Sub-Komponenten ───────────────────────────────────────────────────────────

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1B3A1B', margin: 0 }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function TaskRow({ task, ts, onLog, saving }: { task: TaskDef; ts: string | null; onLog: () => void; saving: boolean }) {
  const col = freshnessColor(ts, task.hours ?? 24)
  return (
    <div style={{ background: COLOR[col].bg, border: `1.5px solid ${COLOR[col].border}`, borderRadius: '10px', padding: '10px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <span style={{ fontSize: '16px' }}>{task.icon}</span>{' '}
        <span style={{ fontWeight: '600', fontSize: '14px', color: COLOR[col].text }}>{task.label}</span>
        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
          {ts ? `Zuletzt: ${formatRelative(ts)}` : 'Noch nie'}
          {task.hours && ts ? ` · noch ${Math.max(0, Math.ceil((task.hours ?? 0) - hoursAgo(ts)!))}h frisch` : ''}
        </div>
      </div>
      <button onClick={onLog} disabled={saving} style={btnStyle('#3A7A3A', '#FFFFFF', '13px')}>
        Jetzt ✓
      </button>
    </div>
  )
}

function btnStyle(bg: string, color: string, fontSize = '14px') {
  return {
    background: bg, color, border: 'none', borderRadius: '8px',
    padding: '8px 12px', fontSize, fontWeight: '600' as const,
    cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0,
  }
}
