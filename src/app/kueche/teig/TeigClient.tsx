'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type KitchenUser, type DoughStage, COLOR, toLocalInputValue, nowLocalInput, localInputToISO } from '@/lib/kitchen'

interface DoughBatch {
  id: string
  stage: DoughStage
  teig_at: string | null
  teiglinge_at: string | null
  kuehlschrank_at: string | null  // legacy
  draussen_at: string | null
  fertig_at: string | null
  draussen_stunden: number
  kg_teig: number | null
  anzahl_teiglinge: number | null
  notes: string | null
  user_id: string
  created_at: string
  kitchen_users?: { name: string }
}

// ── Prozess ────────────────────────────────────────────────────────────────
// teig_gemacht (24h Kühlschrank) → teiglinge_geformt (24h Kühlschrank)
// → draussen/rausgeholt (2h Raumtemp) → fertig ODER zurück in Kühlschrank
// Gesamtlaufzeit: 96h ab teig_at

const STAGE_LABELS: Record<string, string> = {
  teig_gemacht:       '1. Teig gemacht — im Kühlschrank',
  teiglinge_geformt:  '2. Teiglinge geformt — im Kühlschrank',
  kuehlschrank:       '2. Im Kühlschrank',   // legacy
  draussen:           '3. Rausgeholt — Raumtemperatur',
  fertig:             '✅ Verarbeitet',
}

const STAGE_TIMER_H: Partial<Record<string, number>> = {
  teig_gemacht:      24,
  teiglinge_geformt: 24,
  kuehlschrank:      24,  // legacy
}

function stageTs(b: DoughBatch): string | null {
  if (b.stage === 'teig_gemacht')      return b.teig_at
  if (b.stage === 'teiglinge_geformt') return b.teiglinge_at
  if (b.stage === 'kuehlschrank')      return b.kuehlschrank_at
  if (b.stage === 'draussen')          return b.draussen_at
  return b.fertig_at
}

function hoursAgo(ts: string | null): number {
  if (!ts) return 0
  return (Date.now() - new Date(ts).getTime()) / 3_600_000
}

function fmtTs(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// Batch-Name: "Teig vom 05.06.2026 — Im Kühlschrank"
const STAGE_SHORT: Record<string, string> = {
  teig_gemacht:       'Im Kühlschrank (Teig)',
  teiglinge_geformt:  'Im Kühlschrank (Teiglinge)',
  kuehlschrank:       'Im Kühlschrank',
  draussen:           'Rausgeholt',
  fertig:             'Verarbeitet ✅',
}

function batchName(b: DoughBatch): string {
  const datum = b.teig_at
    ? new Date(b.teig_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '?'
  return `Teig vom ${datum} — ${STAGE_SHORT[b.stage] ?? b.stage}`
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function TeigClient() {
  const router = useRouter()
  const [user, setUser] = useState<KitchenUser | null>(null)
  const [batches, setBatches] = useState<DoughBatch[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [showFinished, setShowFinished] = useState(false)

  // Neuer Teig — Formular
  const [showNewForm, setShowNewForm] = useState(false)
  const [newDT,  setNewDT]  = useState(nowLocalInput)
  const [newKg,  setNewKg]  = useState('')
  const [newAnz, setNewAnz] = useState('')

  // Manuell eintragen
  const [showManual, setShowManual] = useState(false)
  const [manStage, setManStage] = useState<DoughStage>('teiglinge_geformt')
  const [manDT,   setManDT]   = useState(nowLocalInput)
  const [manKg,   setManKg]   = useState('')
  const [manAnz,  setManAnz]  = useState('')

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

  async function createNew() {
    if (!user) return
    setSaving('new')
    await createClient().from('kitchen_dough_batches').insert({
      user_id: user.id,
      stage: 'teig_gemacht',
      teig_at: localInputToISO(newDT),
      kg_teig: newKg ? parseFloat(newKg) : null,
      anzahl_teiglinge: newAnz ? parseInt(newAnz) : null,
    })
    setShowNewForm(false); setNewDT(nowLocalInput()); setNewKg(''); setNewAnz('')
    await load(); setSaving(null)
  }

  async function createManual() {
    if (!user) return
    setSaving('manual')
    const ts = localInputToISO(manDT)
    const stageOrder = ['teig_gemacht', 'teiglinge_geformt', 'draussen']
    const idx = stageOrder.indexOf(manStage)
    const fields: Record<string, string | number | null> = {
      user_id: user.id, stage: manStage,
      kg_teig: manKg ? parseFloat(manKg) : null,
      anzahl_teiglinge: manAnz ? parseInt(manAnz) : null,
    }
    const tsFields = ['teig_at', 'teiglinge_at', 'draussen_at']
    for (let i = 0; i <= idx; i++) {
      const backH = (idx - i) * 24
      fields[tsFields[i]] = new Date(new Date(ts).getTime() - backH * 3_600_000).toISOString()
    }
    await createClient().from('kitchen_dough_batches').insert(fields)
    setShowManual(false); setManDT(nowLocalInput()); setManKg(''); setManAnz('')
    await load(); setSaving(null)
  }

  async function advance(b: DoughBatch) {
    setSaving(b.id)
    const now = new Date().toISOString()
    const u: Record<string, string | DoughStage> = {}
    if (b.stage === 'teig_gemacht')                          { u.stage = 'teiglinge_geformt'; u.teiglinge_at = now }
    else if (b.stage === 'teiglinge_geformt' || b.stage === 'kuehlschrank') { u.stage = 'draussen'; u.draussen_at = now }
    else if (b.stage === 'draussen')                         { u.stage = 'fertig'; u.fertig_at = now }
    await createClient().from('kitchen_dough_batches').update(u).eq('id', b.id)
    await load(); setSaving(null)
  }

  async function zurueckInKuehlschrank(b: DoughBatch) {
    setSaving(b.id + '-back')
    // Zurück → Stage auf teiglinge_geformt, neues teiglinge_at = jetzt
    await createClient().from('kitchen_dough_batches')
      .update({ stage: 'teiglinge_geformt', teiglinge_at: new Date().toISOString(), draussen_at: null })
      .eq('id', b.id)
    await load(); setSaving(null)
  }

  async function deleteBatch(b: DoughBatch) {
    if (!confirm(`Charge wirklich löschen?`)) return
    await createClient().from('kitchen_dough_batches').delete().eq('id', b.id)
    await load()
  }

  async function saveEdit(id: string, updates: Record<string, string | number | null | DoughStage>) {
    await createClient().from('kitchen_dough_batches').update(updates).eq('id', id)
    await load()
  }

  async function setDraussen(b: DoughBatch, h: number) {
    await createClient().from('kitchen_dough_batches').update({ draussen_stunden: h }).eq('id', b.id)
    await load()
  }

  const active   = batches.filter(b => b.stage !== 'fertig')
  const finished = batches.filter(b => b.stage === 'fertig')
  if (!user) return null

  return (
    <div style={{ paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ background: '#1B3A1B', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#FFF', fontSize: '18px', fontWeight: '800', margin: 0 }}>🫓 Teig-Tracker</h1>
          <p style={{ color: '#8FBF8F', fontSize: '12px', margin: '2px 0 0' }}>{user.name}</p>
        </div>
        <Link href="/kueche/home">
          <button style={{ background: '#2D5A2D', border: 'none', color: '#FFF', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>← Zurück</button>
        </Link>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Prozess-Erklärung */}
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#1B3A1B', lineHeight: '1.6' }}>
          <b>Prozess:</b> Teig machen → 24h Kühlschrank → Teiglinge formen → 24h Kühlschrank → Rausnehmen → ~2h Raumtemperatur → Verarbeiten (oder zurück in Kühlschrank)<br/>
          <b>Gesamtlaufzeit: 96h ab Teig-Herstellung</b>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setShowNewForm(s => !s); setShowManual(false) }} style={{
            flex: 1, background: '#3A7A3A', color: '#FFF', border: 'none', borderRadius: '12px',
            padding: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
          }}>🫓 + Neuer Teig</button>
          <button onClick={() => { setShowManual(s => !s); setShowNewForm(false) }} style={{
            flex: 1, background: '#FFF', color: '#3A7A3A', border: '2px solid #3A7A3A',
            borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
          }}>✏️ Manuell eintragen</button>
        </div>

        {/* Neuer Teig Formular */}
        {showNewForm && (
          <FormCard title="Neuer Teig — jetzt gemacht" onClose={() => setShowNewForm(false)}>
            <FormRow label="Zeitpunkt">
              <input type="datetime-local" value={newDT} onChange={e => setNewDT(e.target.value)} style={inp} />
            </FormRow>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>KG Teig</label>
                <input type="number" step="0.1" min="0" placeholder="z.B. 5.5" value={newKg}
                  onChange={e => setNewKg(e.target.value)} style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Anz. Teiglinge (später)</label>
                <input type="number" min="0" placeholder="z.B. 18" value={newAnz}
                  onChange={e => setNewAnz(e.target.value)} style={inp} />
              </div>
            </div>
            <SaveBtn onClick={createNew} disabled={saving === 'new'} label="Teig eintragen" />
          </FormCard>
        )}

        {/* Manuell Formular */}
        {showManual && (
          <FormCard title="Bestehende Charge eintragen" onClose={() => setShowManual(false)}>
            <FormRow label="Aktuelles Stadium">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {[
                  { key: 'teig_gemacht' as DoughStage,      label: '1. Teig gemacht (gerade in Kühlschrank)' },
                  { key: 'teiglinge_geformt' as DoughStage, label: '2. Teiglinge geformt (gerade in Kühlschrank)' },
                  { key: 'draussen' as DoughStage,          label: '3. Gerade rausgeholt' },
                ].map(s => (
                  <button key={s.key} onClick={() => setManStage(s.key)} style={{
                    padding: '9px 12px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                    border: `1.5px solid ${manStage === s.key ? '#3A7A3A' : '#DDD'}`,
                    background: manStage === s.key ? '#E8F5E9' : '#FFF',
                    color: manStage === s.key ? '#1B3A1B' : '#555',
                    fontWeight: manStage === s.key ? '700' : '400', fontSize: '13px',
                  }}>{s.label}</button>
                ))}
              </div>
            </FormRow>
            <FormRow label="Wann war das?">
              <input type="datetime-local" value={manDT} onChange={e => setManDT(e.target.value)} style={inp} />
            </FormRow>
            <div style={{ background: '#F5F9F5', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color: '#555' }}>
              💡 Frühere Stadien werden automatisch mit je -24h berechnet.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>KG Teig</label>
                <input type="number" step="0.1" min="0" placeholder="z.B. 5.5" value={manKg}
                  onChange={e => setManKg(e.target.value)} style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Anz. Teiglinge</label>
                <input type="number" min="0" placeholder="z.B. 18" value={manAnz}
                  onChange={e => setManAnz(e.target.value)} style={inp} />
              </div>
            </div>
            <SaveBtn onClick={createManual} disabled={saving === 'manual'} label="Speichern" />
          </FormCard>
        )}

        {/* Aktive Chargen */}
        {active.length === 0 && !showNewForm && !showManual && (
          <p style={{ color: '#888', textAlign: 'center', fontSize: '14px' }}>Keine aktiven Chargen.</p>
        )}
        {active.map(b => (
          <BatchCard key={b.id}
            b={b}
            onAdvance={() => advance(b)}
            onBack={() => zurueckInKuehlschrank(b)}
            onDelete={() => deleteBatch(b)}
            onSaveEdit={(u) => saveEdit(b.id, u)}
            onSetDraussen={(h) => setDraussen(b, h)}
            saving={saving === b.id || saving === b.id + '-back'}
          />
        ))}

        {/* Fertige Chargen */}
        {finished.length > 0 && (
          <>
            <button onClick={() => setShowFinished(s => !s)} style={{
              background: '#F5F5F5', border: '1px solid #DDD', borderRadius: '10px',
              padding: '10px', fontSize: '13px', cursor: 'pointer', color: '#555',
            }}>
              {showFinished ? '▲ Ausblenden' : `▼ ${finished.length} verarbeitete Chargen`}
            </button>
            {showFinished && finished.map(b => (
              <BatchCard key={b.id} b={b} saving={false} finished
                onDelete={() => deleteBatch(b)}
                onSaveEdit={(u) => saveEdit(b.id, u)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ── BatchCard ─────────────────────────────────────────────────────────────────

function BatchCard({ b, onAdvance, onBack, onDelete, onSaveEdit, onSetDraussen, saving, finished }: {
  b: DoughBatch
  onAdvance?: () => void
  onBack?: () => void
  onDelete?: () => void
  onSaveEdit?: (u: Record<string, string | number | null | DoughStage>) => void
  onSetDraussen?: (h: number) => void
  saving: boolean
  finished?: boolean
}) {
  const [editMode, setEditMode] = useState(false)
  const [eTeig,   setETeig]   = useState(toLocalInputValue(b.teig_at))
  const [eTeigl,  setETeigl]  = useState(toLocalInputValue(b.teiglinge_at))
  const [eDraus,  setEDraus]  = useState(toLocalInputValue(b.draussen_at))
  const [eStage,  setEStage]  = useState<DoughStage>(b.stage)
  const [eKg,     setEKg]     = useState(b.kg_teig ? String(b.kg_teig) : '')
  const [eAnz,    setEAnz]    = useState(b.anzahl_teiglinge ? String(b.anzahl_teiglinge) : '')

  function saveEdit() {
    onSaveEdit?.({
      stage: eStage,
      teig_at:       eTeig  ? localInputToISO(eTeig)  : null,
      teiglinge_at:  eTeigl ? localInputToISO(eTeigl) : null,
      draussen_at:   eDraus ? localInputToISO(eDraus) : null,
      kg_teig:       eKg  ? parseFloat(eKg)  : null,
      anzahl_teiglinge: eAnz ? parseInt(eAnz) : null,
    })
    setEditMode(false)
  }

  const ts = stageTs(b)
  const timerH = b.stage === 'draussen' ? b.draussen_stunden : (STAGE_TIMER_H[b.stage] ?? 0)
  const elapsed = ts ? hoursAgo(ts) : null
  const remaining = elapsed !== null && timerH ? Math.max(0, timerH - elapsed) : null
  const overdue = remaining === 0

  // 96h Gesamtlaufzeit
  const totalElapsed = b.teig_at ? hoursAgo(b.teig_at) : null
  const totalLeft = totalElapsed !== null ? Math.max(0, 96 - totalElapsed) : null
  const totalPct  = totalElapsed !== null ? Math.min(100, (totalElapsed / 96) * 100) : 0
  const totalColor = totalLeft === null ? '#999' : totalLeft > 24 ? '#3A7A3A' : totalLeft > 8 ? '#FF8F00' : '#E53935'

  const col = finished ? 'green'
    : !ts ? 'grey'
    : overdue ? 'red'
    : remaining !== null && remaining < timerH * 0.25 ? 'yellow'
    : 'green'

  const nextLabel = b.stage === 'teig_gemacht'      ? 'Teiglinge geformt →'
    : (b.stage === 'teiglinge_geformt' || b.stage === 'kuehlschrank') ? 'Rausnehmen →'
    : b.stage === 'draussen' ? '✅ Verarbeitet'
    : ''

  return (
    <div style={{ background: COLOR[col].bg, border: `2px solid ${COLOR[col].border}`, borderRadius: '14px', padding: '14px' }}>

      {/* Kopfzeile */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '15px', color: COLOR[col].text }}>{batchName(b)}</div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
            seit: {fmtTs(ts)}
            {remaining !== null && !finished && (
              <span style={{ color: COLOR[col].text, fontWeight: '700', marginLeft: '8px' }}>
                {overdue ? '⏰ FÄLLIG!' : `⏱ noch ~${Math.ceil(remaining)}h`}
              </span>
            )}
          </div>
          {/* KG + Anzahl */}
          <div style={{ fontSize: '11px', color: '#666', marginTop: '3px', display: 'flex', gap: '12px' }}>
            {b.kg_teig ? <span>⚖️ {b.kg_teig} kg</span> : null}
            {b.anzahl_teiglinge ? <span>🫓 {b.anzahl_teiglinge} Stück</span> : null}
            <span style={{ color: '#888' }}>von {(b.kitchen_users as { name: string } | undefined)?.name ?? '—'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
          {!finished && (
            <button onClick={() => setEditMode(e => !e)} style={{
              background: editMode ? '#555' : '#FFF', border: '1px solid #999',
              color: editMode ? '#FFF' : '#555', borderRadius: '8px',
              padding: '7px 9px', fontSize: '13px', cursor: 'pointer',
            }}>✏️</button>
          )}
          {onDelete && (
            <button onClick={onDelete} style={{
              background: 'transparent', border: '1px solid #E53935', color: '#E53935',
              borderRadius: '8px', padding: '7px 9px', fontSize: '13px', cursor: 'pointer',
            }}>🗑</button>
          )}
        </div>
      </div>

      {/* 96h Gesamtlaufzeit */}
      {b.teig_at && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: totalColor, fontWeight: '600', marginBottom: '3px' }}>
            <span>Gesamtlaufzeit (96h)</span>
            <span>{totalLeft !== null ? (totalLeft < 0.5 ? 'Abgelaufen!' : `noch ~${Math.ceil(totalLeft)}h`) : '—'}</span>
          </div>
          <div style={{ height: '5px', background: '#E0E0E0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${totalPct}%`, background: totalColor, borderRadius: '3px', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Aktions-Buttons */}
      {!finished && !editMode && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: b.stage === 'draussen' ? '0' : '0' }}>
          {nextLabel && (
            <button onClick={onAdvance} disabled={saving} style={{
              flex: 2, background: '#3A7A3A', color: '#FFF', border: 'none', borderRadius: '8px',
              padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            }}>{nextLabel}</button>
          )}
          {b.stage === 'draussen' && onBack && (
            <button onClick={onBack} disabled={saving} style={{
              flex: 1, background: '#FFF', color: '#1565C0', border: '1.5px solid #1565C0',
              borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}>🔄 Zurück in Kühlschrank</button>
          )}
        </div>
      )}

      {/* Raumtemp-Stunden (bei draussen) */}
      {b.stage === 'draussen' && !editMode && onSetDraussen && (
        <div style={{ marginTop: '8px', background: '#FFFFFF88', borderRadius: '8px', padding: '8px' }}>
          <div style={{ fontSize: '11px', color: '#555', marginBottom: '5px' }}>Raumtemperatur-Zeit:</div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[1, 2, 3, 4].map(h => (
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
      {!editMode && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
          {[
            { label: 'Teig',      ts: b.teig_at },
            { label: 'Teiglinge', ts: b.teiglinge_at },
            { label: 'Raus',      ts: b.draussen_at },
            { label: 'Fertig',    ts: b.fertig_at },
          ].map((s, i) => {
            const done = !!s.ts
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: '4px', borderRadius: '2px', background: done ? '#3A7A3A' : '#CCC' }} />
                <div style={{ fontSize: '9px', color: done ? '#3A7A3A' : '#AAA', marginTop: '3px' }}>
                  {s.ts ? new Date(s.ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : s.label}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Formular */}
      {editMode && (
        <div style={{ background: '#FFFFFFCC', borderRadius: '10px', padding: '12px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1B3A1B' }}>Zeitstempel bearbeiten</div>
          {[
            { label: '1. Teig gemacht',      val: eTeig,  set: setETeig },
            { label: '2. Teiglinge geformt', val: eTeigl, set: setETeigl },
            { label: '3. Rausgeholt',        val: eDraus, set: setEDraus },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '12px', color: '#555', minWidth: '130px' }}>{row.label}</div>
              <input type="datetime-local" value={row.val} onChange={e => row.set(e.target.value)}
                style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '13px' }} />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: '#555', minWidth: '130px' }}>Stadium</div>
            <select value={eStage} onChange={e => setEStage(e.target.value as DoughStage)}
              style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '13px' }}>
              <option value="teig_gemacht">1. Teig gemacht</option>
              <option value="teiglinge_geformt">2. Teiglinge geformt</option>
              <option value="draussen">3. Rausgeholt</option>
              <option value="fertig">Verarbeitet</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>KG Teig</label>
              <input type="number" step="0.1" value={eKg} onChange={e => setEKg(e.target.value)}
                placeholder="z.B. 5.5" style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Anz. Teiglinge</label>
              <input type="number" value={eAnz} onChange={e => setEAnz(e.target.value)}
                placeholder="z.B. 18" style={inp} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEditMode(false)} style={{
              flex: 1, background: '#F5F5F5', border: '1px solid #DDD', borderRadius: '8px',
              padding: '10px', fontSize: '13px', cursor: 'pointer', color: '#555',
            }}>Abbrechen</button>
            <button onClick={saveEdit} style={{
              flex: 2, background: '#3A7A3A', border: 'none', borderRadius: '8px',
              padding: '10px', fontSize: '13px', fontWeight: '700', color: '#FFF', cursor: 'pointer',
            }}>Speichern</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hilfskomponenten ──────────────────────────────────────────────────────────

function FormCard({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ background: '#FFF', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1B3A1B' }}>{title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' }}>✕</button>
      </div>
      {children}
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  )
}

function SaveBtn({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? '#888' : '#3A7A3A', color: '#FFF', border: 'none',
      borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: '700',
      cursor: 'pointer', width: '100%',
    }}>{label}</button>
  )
}

// ── Style-Konstanten ──────────────────────────────────────────────────────────
const lbl: React.CSSProperties = { fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }
const inp: React.CSSProperties = { width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #DDD', fontSize: '14px', boxSizing: 'border-box' }
