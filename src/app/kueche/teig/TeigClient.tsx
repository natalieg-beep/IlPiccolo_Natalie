'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type KitchenUser, nowLocalInput, localInputToISO, toLocalInputValue } from '@/lib/kitchen'

// ── Types ─────────────────────────────────────────────────────────────────────

type BoxStatus = 'kuehlschrank' | 'draussen' | 'fertig'

interface Batch {
  id: string
  stage: string
  teig_at: string | null
  teiglinge_at: string | null
  fertig_at: string | null
  user_id: string
  created_at: string
  kitchen_users?: { name: string }
}

interface Box {
  id: string
  batch_id: string
  box_number: number
  teiglinge_count: number
  status: BoxStatus
  draussen_at: string | null
  fertig_at: string | null
}

// ── Farben ────────────────────────────────────────────────────────────────────

const C = {
  green:  { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
  yellow: { bg: '#FFF8E1', border: '#FFB300', text: '#E65100' },
  red:    { bg: '#FFEBEE', border: '#E53935', text: '#B71C1C' },
  grey:   { bg: '#F5F5F5', border: '#BDBDBD', text: '#757575' },
  blue:   { bg: '#E3F2FD', border: '#42A5F5', text: '#1565C0' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hoursAgo(ts: string | null): number {
  if (!ts) return 0
  return (Date.now() - new Date(ts).getTime()) / 3_600_000
}

function fmtTs(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function kühlTimer(ts: string | null, minH: number, maxH: number): { color: keyof typeof C; label: string } {
  if (!ts) return { color: 'grey', label: '—' }
  const h = hoursAgo(ts)
  const rem = minH - h
  if (h < minH * 0.8) return { color: 'blue',   label: `noch ~${Math.ceil(rem)}h bis bereit` }
  if (h < minH)       return { color: 'yellow',  label: `noch ~${Math.ceil(rem)}h bis mind. ${minH}h` }
  if (h <= maxH)      return { color: 'green',   label: `✓ Bereit (${Math.round(h * 10) / 10}h im Kühlschrank)` }
  return                     { color: 'red',     label: `⚠️ ${Math.round(h - maxH)}h über Maximum (${maxH}h)!` }
}

function draussenTimer(ts: string | null): { color: keyof typeof C; label: string } {
  if (!ts) return { color: 'grey', label: '—' }
  const h = hoursAgo(ts)
  if (h < 2)  return { color: 'blue',   label: `noch ~${Math.ceil(2 - h)}h bis bereit` }
  if (h <= 4) return { color: 'green',  label: `✓ Bereit zum Backen (${Math.round(h * 10) / 10}h draußen)` }
  return            { color: 'red',    label: `⚠️ Schon ${Math.round(h * 10) / 10}h draußen!` }
}

function btnS(bg: string, color = '#FFF', small = false): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: '8px',
    padding: small ? '8px 12px' : '13px 16px',
    fontSize: small ? '13px' : '14px', fontWeight: 700 as const,
    cursor: 'pointer', whiteSpace: 'nowrap' as const,
  }
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function TeigClient() {
  const router = useRouter()
  const [user,     setUser]     = useState<KitchenUser | null>(null)
  const [batches,  setBatches]  = useState<Batch[]>([])
  const [allBoxes, setAllBoxes] = useState<Box[]>([])
  const [saving,   setSaving]   = useState<string | null>(null)
  const [showHist, setShowHist] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('kitchen_user')
    if (!u) { router.replace('/kueche'); return }
    setUser(JSON.parse(u))
  }, [router])

  const load = useCallback(async () => {
    const db = createClient()
    const [{ data: bData }, { data: bxData }] = await Promise.all([
      db.from('kitchen_dough_batches')
        .select('id, stage, teig_at, teiglinge_at, fertig_at, user_id, created_at, kitchen_users(name)')
        .order('created_at', { ascending: false })
        .limit(40),
      db.from('kitchen_dough_boxes')
        .select('id, batch_id, box_number, teiglinge_count, status, draussen_at, fertig_at')
        .order('box_number'),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setBatches((bData ?? []) as any as Batch[])
    setAllBoxes((bxData ?? []) as Box[])
  }, [])

  useEffect(() => { if (user) load() }, [user, load])

  if (!user) return null

  const active   = batches.filter(b => b.stage !== 'fertig')
  const finished = batches.filter(b => b.stage === 'fertig')

  function belegtVonAnderen(batchId: string): Set<number> {
    const andereIds = new Set(active.filter(b => b.id !== batchId).map(b => b.id))
    return new Set(
      allBoxes
        .filter(bx => andereIds.has(bx.batch_id) && bx.status !== 'fertig')
        .map(bx => bx.box_number)
    )
  }

  return (
    <div style={{ paddingBottom: '60px', background: '#F0F4F0', minHeight: '100dvh' }}>

      <div style={{ background: '#1B3A1B', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <div>
          <h1 style={{ color: '#FFF', fontSize: '18px', fontWeight: 800, margin: 0 }}>🫓 Teig-Tracker</h1>
          <p style={{ color: '#8FBF8F', fontSize: '12px', margin: '2px 0 0' }}>{user.name}</p>
        </div>
        <Link href="/kueche/home">
          <button style={{ background: '#2D5A2D', border: 'none', color: '#FFF', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>← Zurück</button>
        </Link>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <NeuerTeigButton user={user} saving={saving} setSaving={setSaving} onCreated={load} />

        {active.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', padding: '20px 0' }}>
            Keine aktiven Chargen.
          </p>
        )}

        {active.map(b => (
          <BatchCard
            key={b.id}
            batch={b}
            boxes={allBoxes.filter(bx => bx.batch_id === b.id)}
            belegtVonAnderen={belegtVonAnderen(b.id)}
            saving={saving}
            setSaving={setSaving}
            onRefresh={load}
          />
        ))}

        {finished.length > 0 && (
          <div>
            <button
              onClick={() => setShowHist(s => !s)}
              style={{ width: '100%', background: '#FFF', border: '1px solid #CCC', borderRadius: '10px', padding: '12px', fontSize: '13px', cursor: 'pointer', color: '#555' }}
            >
              {showHist ? '▲ Historie ausblenden' : `▼ ${finished.length} abgeschlossene Chargen`}
            </button>
            {showHist && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {finished.map(b => (
                  <HistoryCard key={b.id} batch={b} boxes={allBoxes.filter(bx => bx.batch_id === b.id)} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ── Neuer Teig ────────────────────────────────────────────────────────────────

function NeuerTeigButton({ user, saving, setSaving, onCreated }: {
  user: KitchenUser
  saving: string | null
  setSaving: (s: string | null) => void
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [dt,   setDt]   = useState(nowLocalInput)

  async function create() {
    setSaving('new')
    await createClient().from('kitchen_dough_batches').insert({
      user_id:  user.id,
      stage:    'teig_gemacht',
      teig_at:  localInputToISO(dt),
    })
    setOpen(false)
    setDt(nowLocalInput())
    await onCreated()
    setSaving(null)
  }

  return (
    <div>
      <button
        onClick={() => { setOpen(o => !o); if (!open) setDt(nowLocalInput()) }}
        style={{ width: '100%', background: open ? '#888' : '#3A7A3A', color: '#FFF', border: 'none', borderRadius: '12px', padding: '15px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
      >
        {open ? '✕ Abbrechen' : '🫓 + Neuer Teig'}
      </button>
      {open && (
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '16px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A1B' }}>Wann wurde der Teig gemacht?</div>
          <input type="datetime-local" value={dt} onChange={e => setDt(e.target.value)}
            style={{ padding: '11px', borderRadius: '8px', border: '1.5px solid #CCC', fontSize: '15px', width: '100%', boxSizing: 'border-box' }} />
          <button onClick={create} disabled={saving === 'new'} style={{ ...btnS('#3A7A3A'), width: '100%' }}>
            ✓ Teig eintragen
          </button>
        </div>
      )}
    </div>
  )
}

// ── BatchCard ─────────────────────────────────────────────────────────────────

function BatchCard({ batch: b, boxes, belegtVonAnderen, saving, setSaving, onRefresh }: {
  batch: Batch
  boxes: Box[]
  belegtVonAnderen: Set<number>
  saving: string | null
  setSaving: (s: string | null) => void
  onRefresh: () => void
}) {
  const db = createClient()

  // Timestamp-Edit States
  const [editTeig,  setEditTeig]  = useState(false)
  const [teigDt,    setTeigDt]    = useState(() => toLocalInputValue(b.teig_at))
  const [editTeigl, setEditTeigl] = useState(false)
  const [teigLDt,   setTeigLDt]   = useState(() => toLocalInputValue(b.teiglinge_at))

  const t1 = kühlTimer(b.teig_at,      24, 36)
  const t2 = kühlTimer(b.teiglinge_at, 24, 72)

  const inFridge = boxes.filter(bx => bx.status === 'kuehlschrank')
  const draussen = boxes.filter(bx => bx.status === 'draussen')

  // ── Aktionen ──────────────────────────────────────────────────────────────

  async function saveTeigTs() {
    await db.from('kitchen_dough_batches').update({ teig_at: localInputToISO(teigDt) }).eq('id', b.id)
    setEditTeig(false); await onRefresh()
  }

  async function markTeiglinge() {
    setSaving(b.id + '-teigl')
    const now = new Date().toISOString()
    await db.from('kitchen_dough_batches').update({ stage: 'teiglinge_geformt', teiglinge_at: now }).eq('id', b.id)
    await onRefresh(); setSaving(null)
  }

  async function saveTeiglTs() {
    await db.from('kitchen_dough_batches').update({ teiglinge_at: localInputToISO(teigLDt) }).eq('id', b.id)
    setEditTeigl(false); await onRefresh()
  }

  async function deleteBatch() {
    if (!confirm('Charge wirklich löschen?')) return
    await db.from('kitchen_dough_boxes').delete().eq('batch_id', b.id)
    await db.from('kitchen_dough_batches').delete().eq('id', b.id)
    await onRefresh()
  }

  async function toggleBox(n: number) {
    // Box bekommt den Zeitstempel von Schritt 2 (teiglinge_at)
    const existing = boxes.find(bx => bx.box_number === n)
    setSaving(b.id + '-bx' + n)
    if (existing && existing.status === 'kuehlschrank') {
      await db.from('kitchen_dough_boxes').delete().eq('id', existing.id)
    } else if (!existing && !belegtVonAnderen.has(n)) {
      await db.from('kitchen_dough_boxes').insert({
        batch_id: b.id,
        box_number: n,
        teiglinge_count: 6,
        status: 'kuehlschrank',
        // draussen_at bleibt null – Box ist im Kühlschrank seit teiglinge_at (aus Batch)
      })
    }
    await onRefresh(); setSaving(null)
  }

  async function updateBoxCount(boxId: string, count: number) {
    await db.from('kitchen_dough_boxes').update({ teiglinge_count: count }).eq('id', boxId)
    await onRefresh()
  }

  async function takeOutBox(boxId: string) {
    setSaving('out-' + boxId)
    await db.from('kitchen_dough_boxes').update({
      status: 'draussen',
      draussen_at: new Date().toISOString(),
    }).eq('id', boxId)
    await onRefresh(); setSaving(null)
  }

  async function boxVerarbeitet(boxId: string) {
    setSaving('done-' + boxId)
    await db.from('kitchen_dough_boxes').update({ status: 'fertig', fertig_at: new Date().toISOString() }).eq('id', boxId)
    const { data: rest } = await db.from('kitchen_dough_boxes')
      .select('id').eq('batch_id', b.id).neq('status', 'fertig')
    if (rest && rest.length === 0) {
      await db.from('kitchen_dough_batches').update({ stage: 'fertig', fertig_at: new Date().toISOString() }).eq('id', b.id)
    }
    await onRefresh(); setSaving(null)
  }

  async function boxZurueck(boxId: string) {
    setSaving('back-' + boxId)
    await db.from('kitchen_dough_boxes').update({ status: 'kuehlschrank', draussen_at: null }).eq('id', boxId)
    await onRefresh(); setSaving(null)
  }

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>

      {/* ── Kopfleiste ── */}
      <div style={{ background: '#1B3A1B', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '14px', color: '#FFF' }}>
          Teig vom {b.teig_at ? new Date(b.teig_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '?'}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#8FBF8F' }}>
            {(b.kitchen_users as { name: string } | undefined)?.name ?? '—'}
          </span>
          <button onClick={deleteBatch} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#FFF', borderRadius: '8px', padding: '5px 9px', fontSize: '13px', cursor: 'pointer' }}>🗑</button>
        </div>
      </div>

      {/* ── Schritt 1: Teig ── */}
      <SchrittBlock
        nummer="①"
        titel="Teig gemacht"
        color={t1.color}
        done={!!b.teig_at}
      >
        {b.teig_at ? (
          <ZeitstempelZeile
            ts={b.teig_at}
            timerLabel={t1.label}
            timerColor={t1.color}
            hinweis="im Kühlschrank (mind. 24h)"
            editing={editTeig}
            dt={teigDt}
            setDt={setTeigDt}
            onEdit={() => setEditTeig(true)}
            onSave={saveTeigTs}
            onCancel={() => { setEditTeig(false); setTeigDt(toLocalInputValue(b.teig_at)) }}
          />
        ) : (
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>Noch kein Teig eingetragen.</p>
        )}
      </SchrittBlock>

      {/* ── Schritt 2: Teiglinge ── */}
      <SchrittBlock
        nummer="②"
        titel="Teiglinge geformt"
        color={b.teiglinge_at ? t2.color : 'grey'}
        done={!!b.teiglinge_at}
      >
        {b.teiglinge_at ? (
          <>
            <ZeitstempelZeile
              ts={b.teiglinge_at}
              timerLabel={t2.label}
              timerColor={t2.color}
              hinweis="Teiglinge im Kühlschrank (mind. 24h · max. 72h)"
              editing={editTeigl}
              dt={teigLDt}
              setDt={setTeigLDt}
              onEdit={() => setEditTeigl(true)}
              onSave={saveTeiglTs}
              onCancel={() => { setEditTeigl(false); setTeigLDt(toLocalInputValue(b.teiglinge_at)) }}
            />

            {/* Box-Grid */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B3A1B', marginBottom: '6px' }}>
                📦 Boxen zuweisen — Klick = Box bekommt Zeitstempel von ②
              </div>
              <BoxGrid
                boxes={boxes}
                belegtVonAnderen={belegtVonAnderen}
                saving={saving}
                batchId={b.id}
                onToggle={toggleBox}
              />
            </div>

            {/* Kühlschrank-Boxen */}
            {inFridge.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1565C0' }}>❄️ Im Kühlschrank</div>
                {inFridge.map(bx => (
                  <BoxKühlschrankRow
                    key={bx.id}
                    box={bx}
                    batchTeiglAt={b.teiglinge_at}
                    saving={saving}
                    onTakeOut={() => takeOutBox(bx.id)}
                    onUpdateCount={c => updateBoxCount(bx.id, c)}
                  />
                ))}
              </div>
            )}

            {boxes.length === 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                Noch keine Boxen zugewiesen — oben antippen
              </div>
            )}
          </>
        ) : (
          <button
            onClick={markTeiglinge}
            disabled={!!saving || !b.teig_at}
            style={{ ...btnS('#3A7A3A'), width: '100%' }}
          >
            ✓ Teiglinge geformt — jetzt eintragen
          </button>
        )}
      </SchrittBlock>

      {/* ── Schritt 3: Draußen ── */}
      {draussen.length > 0 && (
        <SchrittBlock
          nummer="③"
          titel="Draußen (Raumtemperatur)"
          color={draussen.some(bx => draussenTimer(bx.draussen_at).color === 'red') ? 'red'
               : draussen.some(bx => draussenTimer(bx.draussen_at).color === 'green') ? 'green'
               : 'blue'}
          done={false}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {draussen.map(bx => (
              <BoxDraussenRow
                key={bx.id}
                box={bx}
                saving={saving}
                onVerarbeitet={() => boxVerarbeitet(bx.id)}
                onZurueck={() => boxZurueck(bx.id)}
              />
            ))}
          </div>
        </SchrittBlock>
      )}

    </div>
  )
}

// ── SchrittBlock ──────────────────────────────────────────────────────────────

function SchrittBlock({ nummer, titel, color, done, children }: {
  nummer: string
  titel: string
  color: keyof typeof C
  done: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ background: C[color].bg, borderTop: `3px solid ${C[color].border}` }}>
      <div style={{ padding: '10px 14px 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px', fontWeight: 800, color: C[color].text }}>{nummer}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: C[color].text }}>{titel}</span>
        {done && <span style={{ fontSize: '11px', color: C[color].text, opacity: 0.7, marginLeft: 'auto' }}>✓ erledigt</span>}
      </div>
      <div style={{ padding: '8px 14px 14px' }}>
        {children}
      </div>
    </div>
  )
}

// ── ZeitstempelZeile ──────────────────────────────────────────────────────────

function ZeitstempelZeile({ ts, timerLabel, timerColor, hinweis, editing, dt, setDt, onEdit, onSave, onCancel }: {
  ts: string | null
  timerLabel: string
  timerColor: keyof typeof C
  hinweis?: string
  editing: boolean
  dt: string
  setDt: (v: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '10px', padding: '10px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1207' }}>{fmtTs(ts)}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: C[timerColor].text, marginTop: '3px' }}>{timerLabel}</div>
          {hinweis && <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>{hinweis}</div>}
        </div>
        {!editing && (
          <button onClick={onEdit} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '8px', padding: '7px 10px', fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}>✏️</button>
        )}
      </div>
      {editing && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="datetime-local" value={dt} onChange={e => setDt(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1.5px solid #CCC', fontSize: '15px', width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onCancel} style={{ flex: 1, ...btnS('#E0E0E0', '#555', true) }}>Abbrechen</button>
            <button onClick={onSave}   style={{ flex: 2, ...btnS('#3A7A3A', '#FFF', true) }}>Speichern</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── BoxGrid ───────────────────────────────────────────────────────────────────

function BoxGrid({ boxes, belegtVonAnderen, saving, batchId, onToggle }: {
  boxes: Box[]
  belegtVonAnderen: Set<number>
  saving: string | null
  batchId: string
  onToggle: (n: number) => void
}) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => {
          const bx      = boxes.find(b => b.box_number === n)
          const belegt  = belegtVonAnderen.has(n)
          const isSav   = saving === batchId + '-bx' + n
          const canClick = !belegt && (!bx || bx.status === 'kuehlschrank')

          let bg = '#FAFAFA', border = '2px dashed #CCC', color = '#AAA', icon = '+'
          if (bx?.status === 'kuehlschrank') { bg = '#E3F2FD'; border = '2px solid #42A5F5'; color = '#1565C0'; icon = '❄️' }
          else if (bx?.status === 'draussen') { bg = '#FFF3E0'; border = '2px solid #FFB300'; color = '#E65100'; icon = '🌡️' }
          else if (bx?.status === 'fertig')   { bg = '#E8F5E9'; border = '2px solid #81C784'; color = '#2E7D32'; icon = '✅' }
          else if (belegt)                    { bg = '#F5F5F5'; border = '2px solid #DDD';    color = '#CCC';    icon = '🔒' }

          return (
            <button
              key={n}
              disabled={isSav || !canClick}
              onClick={() => onToggle(n)}
              style={{
                background: bg, border, color, borderRadius: '10px',
                padding: '8px 2px', fontSize: '11px', fontWeight: 700,
                cursor: canClick ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                opacity: isSav ? 0.4 : 1,
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
              <span>Box {n}</span>
            </button>
          )
        })}
      </div>
      <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
        antippen = zuweisen · ❄️ nochmal = entfernen · 🔒 = andere Charge
      </div>
    </div>
  )
}

// ── BoxKühlschrankRow ─────────────────────────────────────────────────────────

function BoxKühlschrankRow({ box, batchTeiglAt, saving, onTakeOut, onUpdateCount }: {
  box: Box
  batchTeiglAt: string | null   // Zeitstempel von Schritt 2 → "im Kühlschrank seit"
  saving: string | null
  onTakeOut: () => void
  onUpdateCount: (c: number) => void
}) {
  const [editCount, setEditCount] = useState(false)
  const [count,     setCount]     = useState(box.teiglinge_count.toString())

  // Timer läuft ab dem Zeitstempel von Schritt 2 (teiglinge_at des Batches)
  const timer = kühlTimer(batchTeiglAt, 24, 72)

  return (
    <div style={{ background: '#E3F2FD', border: '1.5px solid #42A5F5', borderRadius: '10px', padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, color: '#1565C0', fontSize: '14px' }}>❄️ Box {box.box_number}</span>
          <div style={{ fontSize: '11px', color: C[timer.color].text, marginTop: '2px' }}>{timer.label}</div>
        </div>

        {editCount ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number" min="1" max="12" value={count}
              onChange={e => setCount(e.target.value)}
              style={{ width: '52px', padding: '6px', borderRadius: '6px', border: '1px solid #90CAF9', fontSize: '14px', textAlign: 'center' }}
              autoFocus
            />
            <span style={{ fontSize: '12px', color: '#555' }}>Teigl.</span>
            <button onClick={() => { onUpdateCount(parseInt(count) || 6); setEditCount(false) }} style={btnS('#3A7A3A', '#FFF', true)}>✓</button>
            <button onClick={() => setEditCount(false)} style={{ ...btnS('#E0E0E0', '#555', true) }}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#1565C0' }}>{box.teiglinge_count} Teigl.</span>
            <button onClick={() => { setCount(box.teiglinge_count.toString()); setEditCount(true) }}
              style={{ background: 'none', border: 'none', fontSize: '15px', cursor: 'pointer', padding: '2px 4px' }}>✏️</button>
            <button onClick={onTakeOut} disabled={!!saving} style={btnS('#E65100')}>
              Rausnehmen 🌡️
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── BoxDraussenRow ────────────────────────────────────────────────────────────

function BoxDraussenRow({ box, saving, onVerarbeitet, onZurueck }: {
  box: Box
  saving: string | null
  onVerarbeitet: () => void
  onZurueck: () => void
}) {
  const [editDt,   setEditDt]   = useState(false)
  const [draussDt, setDraussDt] = useState(() => toLocalInputValue(box.draussen_at))
  const db = createClient()

  const timer = draussenTimer(box.draussen_at)

  async function saveDraussTs() {
    await db.from('kitchen_dough_boxes').update({ draussen_at: localInputToISO(draussDt) }).eq('id', box.id)
    setEditDt(false)
    // kein onRefresh nötig – parent lädt nach boxVerarbeitet / boxZurueck ohnehin neu
    // hier trotzdem page reload via window wenn nötig
    window.location.reload()
  }

  return (
    <div style={{ background: C[timer.color].bg, border: `1.5px solid ${C[timer.color].border}`, borderRadius: '10px', padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: C[timer.color].text }}>🌡️ Box {box.box_number}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: C[timer.color].text, marginTop: '2px' }}>{timer.label}</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '1px' }}>
            rausgeholt: {fmtTs(box.draussen_at)}
          </div>
        </div>
        {!editDt && (
          <button onClick={() => setEditDt(true)} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '8px', padding: '6px 9px', fontSize: '13px', cursor: 'pointer' }}>✏️</button>
        )}
      </div>

      {editDt && (
        <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <input type="datetime-local" value={draussDt} onChange={e => setDraussDt(e.target.value)}
            style={{ padding: '9px', borderRadius: '8px', border: '1.5px solid #CCC', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEditDt(false)} style={{ flex: 1, ...btnS('#E0E0E0', '#555', true) }}>Abbrechen</button>
            <button onClick={saveDraussTs}           style={{ flex: 2, ...btnS('#3A7A3A', '#FFF', true) }}>Speichern</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onVerarbeitet} disabled={!!saving} style={{ flex: 2, ...btnS('#3A7A3A') }}>
          ✅ Verarbeitet
        </button>
        <button onClick={onZurueck} disabled={!!saving}
          style={{ flex: 1, background: '#FFF', border: '2px solid #1565C0', color: '#1565C0', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          🔄 Zurück
        </button>
      </div>
    </div>
  )
}

// ── HistoryCard ───────────────────────────────────────────────────────────────

function HistoryCard({ batch: b, boxes }: { batch: Batch; boxes: Box[] }) {
  const total   = boxes.reduce((s, bx) => s + bx.teiglinge_count, 0)
  const boxNums = boxes.map(bx => bx.box_number).sort((a, z) => a - z).join(', ')

  return (
    <div style={{ background: '#FFF', border: '1px solid #C8E6C9', borderRadius: '12px', padding: '12px 14px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: '#2E7D32', marginBottom: '4px' }}>
        ✅ Teig vom {b.teig_at ? new Date(b.teig_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
      </div>
      <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.7 }}>
        ① Teig: {fmtTs(b.teig_at)}<br />
        ② Teiglinge: {fmtTs(b.teiglinge_at)}<br />
        ✅ Fertig: {fmtTs(b.fertig_at)}
      </div>
      {boxes.length > 0 && (
        <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '6px', fontWeight: 600 }}>
          📦 Boxen {boxNums} · {total} Teiglinge gesamt
        </div>
      )}
    </div>
  )
}
