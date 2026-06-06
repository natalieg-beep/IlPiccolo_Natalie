'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type KitchenUser, type DoughStage, formatTs, hoursAgo, COLOR } from '@/lib/kitchen'

interface DoughBatch {
  id: string
  stage: DoughStage
  teig_at: string | null
  teiglinge_at: string | null
  kuehlschrank_at: string | null
  draussen_at: string | null
  fertig_at: string | null
  draussen_stunden: number
  notes: string | null
  user_id: string
  created_at: string
  kitchen_users?: { name: string }
}

const STAGE_LABELS: Record<DoughStage, string> = {
  teig_gemacht: '1. Teig gemacht',
  teiglinge_geformt: '2. Teiglinge geformt',
  kuehlschrank: '3. Im Kühlschrank',
  draussen: '4. Draußen (akklimatisieren)',
  fertig: '5. Fertig ✅',
}

const STAGE_TIMER: Partial<Record<DoughStage, number>> = {
  teig_gemacht: 24,
  teiglinge_geformt: 24,
  kuehlschrank: 24,
}

function stageTs(b: DoughBatch): string | null {
  const map: Record<DoughStage, string | null> = {
    teig_gemacht: b.teig_at,
    teiglinge_geformt: b.teiglinge_at,
    kuehlschrank: b.kuehlschrank_at,
    draussen: b.draussen_at,
    fertig: b.fertig_at,
  }
  return map[b.stage]
}

export default function TeigClient() {
  const router = useRouter()
  const [user, setUser] = useState<KitchenUser | null>(null)
  const [batches, setBatches] = useState<DoughBatch[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [showFinished, setShowFinished] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('kitchen_user')
    if (!u) { router.replace('/kueche'); return }
    setUser(JSON.parse(u))
  }, [router])

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from('kitchen_dough_batches')
      .select('*, kitchen_users(name)')
      .order('created_at', { ascending: false })
      .limit(50)
    setBatches((data ?? []) as DoughBatch[])
  }, [])

  useEffect(() => { if (user) load() }, [user, load])

  async function newBatch() {
    if (!user) return
    setSaving('new')
    await createClient().from('kitchen_dough_batches').insert({
      user_id: user.id, stage: 'teig_gemacht', teig_at: new Date().toISOString(),
    })
    await load()
    setSaving(null)
  }

  async function advance(b: DoughBatch) {
    setSaving(b.id)
    const now = new Date().toISOString()
    const updates: Record<string, string | DoughStage> = {}
    if (b.stage === 'teig_gemacht')       { updates.stage = 'teiglinge_geformt'; updates.teiglinge_at = now }
    else if (b.stage === 'teiglinge_geformt') { updates.stage = 'kuehlschrank'; updates.kuehlschrank_at = now }
    else if (b.stage === 'kuehlschrank')  { updates.stage = 'draussen'; updates.draussen_at = now }
    else if (b.stage === 'draussen')      { updates.stage = 'fertig'; updates.fertig_at = now }
    await createClient().from('kitchen_dough_batches').update(updates).eq('id', b.id)
    await load()
    setSaving(null)
  }

  async function setDraussen(b: DoughBatch, h: number) {
    await createClient().from('kitchen_dough_batches').update({ draussen_stunden: h }).eq('id', b.id)
    await load()
  }

  const active = batches.filter(b => b.stage !== 'fertig')
  const finished = batches.filter(b => b.stage === 'fertig')

  if (!user) return null

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ background: '#1B3A1B', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '800', margin: 0 }}>🫓 Teig-Tracker</h1>
          <p style={{ color: '#8FBF8F', fontSize: '12px', margin: '2px 0 0' }}>{user.name}</p>
        </div>
        <Link href="/kueche/home">
          <button style={{ background: '#2D5A2D', border: 'none', color: '#FFF', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>← Zurück</button>
        </Link>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={newBatch} disabled={saving === 'new'} style={{
          background: '#3A7A3A', color: '#FFF', border: 'none', borderRadius: '12px',
          padding: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', width: '100%',
        }}>
          🫓 + Neuer Teig jetzt gemacht
        </button>

        {active.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center', fontSize: '14px' }}>Keine aktiven Chargen.</p>
        )}

        {active.map(b => <BatchCard key={b.id} b={b} onAdvance={() => advance(b)} onSetDraussen={(h) => setDraussen(b, h)} saving={saving === b.id} />)}

        {finished.length > 0 && (
          <>
            <button onClick={() => setShowFinished(s => !s)} style={{
              background: '#F5F5F5', border: '1px solid #DDD', borderRadius: '10px',
              padding: '10px', fontSize: '13px', cursor: 'pointer', color: '#555',
            }}>
              {showFinished ? '▲ Fertige ausblenden' : `▼ ${finished.length} fertige Chargen anzeigen`}
            </button>
            {showFinished && finished.map(b => <BatchCard key={b.id} b={b} saving={false} finished />)}
          </>
        )}
      </div>
    </div>
  )
}

function BatchCard({ b, onAdvance, onSetDraussen, saving, finished }: {
  b: DoughBatch; onAdvance?: () => void; onSetDraussen?: (h: number) => void; saving: boolean; finished?: boolean
}) {
  const ts = stageTs(b)
  const timerH = b.stage === 'draussen' ? b.draussen_stunden : (STAGE_TIMER[b.stage] ?? 0)
  const elapsed = ts ? hoursAgo(ts)! : null
  const remaining = elapsed !== null && timerH ? Math.max(0, timerH - elapsed) : null
  const overdue = remaining !== null && remaining === 0

  const col = finished ? 'green'
    : !ts ? 'grey'
    : overdue ? 'red'
    : remaining !== null && remaining < timerH * 0.25 ? 'yellow'
    : 'green'

  const stages: Array<{ key: DoughStage; label: string; ts: string | null }> = [
    { key: 'teig_gemacht',      label: 'Teig gemacht',     ts: b.teig_at },
    { key: 'teiglinge_geformt', label: 'Teiglinge geformt',ts: b.teiglinge_at },
    { key: 'kuehlschrank',      label: 'Kühlschrank',       ts: b.kuehlschrank_at },
    { key: 'draussen',          label: 'Draußen',           ts: b.draussen_at },
    { key: 'fertig',            label: 'Fertig',            ts: b.fertig_at },
  ]
  const currentIdx = stages.findIndex(s => s.key === b.stage)

  return (
    <div style={{ background: COLOR[col].bg, border: `2px solid ${COLOR[col].border}`, borderRadius: '14px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: COLOR[col].text }}>{STAGE_LABELS[b.stage]}</div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
            {ts ? `seit ${formatTs(ts)}` : ''}
            {remaining !== null && !finished && (
              <span style={{ color: COLOR[col].text, fontWeight: '600', marginLeft: '6px' }}>
                {overdue ? '⏰ FÄLLIG!' : `⏱ ~${Math.ceil(remaining)} Std`}
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>von: {(b.kitchen_users as { name: string } | undefined)?.name ?? '—'}</div>
        </div>
        {!finished && b.stage !== 'fertig' && (
          <button onClick={onAdvance} disabled={saving} style={{
            background: '#3A7A3A', color: '#FFF', border: 'none', borderRadius: '8px',
            padding: '8px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>
            Nächste Stage →
          </button>
        )}
      </div>

      {/* Draußen Stunden-Auswahl (nur wenn Kühlschrank-Stage aktiv) */}
      {b.stage === 'kuehlschrank' && onSetDraussen && (
        <div style={{ background: '#FFFFFFAA', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>Akklimatisierungs-Stunden (nach Kühlschrank):</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1,2,3,4,6].map(h => (
              <button key={h} onClick={() => onSetDraussen(h)} style={{
                padding: '5px 10px', borderRadius: '6px', border: '1px solid #999',
                background: b.draussen_stunden === h ? '#3A7A3A' : '#FFF',
                color: b.draussen_stunden === h ? '#FFF' : '#333',
                cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              }}>{h}h</button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
        {stages.map((s, i) => (
          <div key={s.key} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: '4px', borderRadius: '2px',
              background: i <= currentIdx ? '#3A7A3A' : '#CCCCCC',
            }} />
            <div style={{ fontSize: '9px', color: i <= currentIdx ? '#3A7A3A' : '#AAA', marginTop: '3px' }}>
              {s.ts ? new Date(s.ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
