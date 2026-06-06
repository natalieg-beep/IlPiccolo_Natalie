'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Setting {
  task_key: string
  label: string
  hours: number
  warn_before_hours: number | null
}

const ICONS: Record<string, string> = {
  zwiebeln: '🧅', paprika: '🫑', pilze: '🍄', mozza: '🧀',
  sucuk: '🥩', salami: '🍕', salami_scharf: '🌶️', jambon: '🥓', pastirma: '🥩',
  thunfisch: '🐟', tiramisu: '🍰', piccolo_crunch: '🍫',
}

const QUICK_HOURS = [12, 24, 48, 72, 96, 120]
const WARN_OPTIONS = [
  { val: null, label: 'Keine Vorwarnung' },
  { val: 1,    label: '1h vorher' },
  { val: 2,    label: '2h vorher' },
  { val: 3,    label: '3h vorher' },
  { val: 6,    label: '6h vorher' },
  { val: 12,   label: '12h vorher' },
]

export default function EinstellungenClient() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editHours, setEditHours] = useState('')
  const [editWarn, setEditWarn] = useState<number | null>(1)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from('kitchen_freshness_settings')
      .select('*')
      .order('task_key')
    setSettings(data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  function startEdit(s: Setting) {
    setEditing(s.task_key)
    setEditHours(String(s.hours))
    setEditWarn(s.warn_before_hours ?? null)
  }

  async function save(task_key: string) {
    const hours = parseInt(editHours)
    if (hours < 1 || hours > 720) return
    setSaving(task_key)
    await createClient()
      .from('kitchen_freshness_settings')
      .update({ hours, warn_before_hours: editWarn })
      .eq('task_key', task_key)
    setSaved(task_key)
    setTimeout(() => setSaved(null), 2000)
    setEditing(null)
    await load()
    setSaving(null)
  }

  function hoursLabel(h: number): string {
    if (h < 24) return `${h} Std`
    if (h === 24) return '1 Tag'
    if (h % 24 === 0) return `${h / 24} Tage`
    return `${h} Std`
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ background: '#1B3A1B', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#FFF', fontSize: '18px', fontWeight: '800', margin: 0 }}>⚙️ Benachrichtigungen</h1>
          <p style={{ color: '#8FBF8F', fontSize: '12px', margin: '2px 0 0' }}>Frischezeiten & Vorwarnung</p>
        </div>
        <Link href="/kueche/home">
          <button style={{ background: '#2D5A2D', border: 'none', color: '#FFF', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>← Zurück</button>
        </Link>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#1B3A1B', lineHeight: '1.6' }}>
          💡 <b>Frischezeit:</b> Wann gilt etwas als nicht mehr frisch?<br/>
          💬 <b>Vorwarnung:</b> Telegram-Nachricht X Stunden vorher + nochmal genau zur Fälligkeit.
        </div>

        {settings.map(s => (
          <div key={s.task_key} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

            {/* Kopfzeile */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1B3A1B' }}>
                  {ICONS[s.task_key] ?? '📦'} {s.label}
                </div>
                <div style={{ fontSize: '12px', color: saved === s.task_key ? '#3A7A3A' : '#666', marginTop: '3px', fontWeight: saved === s.task_key ? '700' : '400' }}>
                  {saved === s.task_key ? '✓ Gespeichert!' : (
                    <>
                      Frisch: <b>{hoursLabel(s.hours)}</b>
                      {' · '}
                      {s.warn_before_hours
                        ? <span style={{ color: '#E65100' }}>⏰ {s.warn_before_hours}h vorher + bei Fälligkeit</span>
                        : <span style={{ color: '#888' }}>nur bei Fälligkeit</span>}
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => editing === s.task_key ? setEditing(null) : startEdit(s)} style={{
                background: editing === s.task_key ? '#555' : '#F0F4F0',
                border: '1px solid #CCC', color: editing === s.task_key ? '#FFF' : '#333',
                borderRadius: '8px', padding: '7px 12px', fontSize: '13px', cursor: 'pointer',
              }}>
                {editing === s.task_key ? '✕' : '✏️'}
              </button>
            </div>

            {/* Edit-Bereich */}
            {editing === s.task_key && (
              <div style={{ marginTop: '12px', borderTop: '1px solid #EEE', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Frischezeit */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#333', marginBottom: '6px' }}>Frischezeit (wie lange hält es?)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {QUICK_HOURS.map(h => (
                      <button key={h} onClick={() => setEditHours(String(h))} style={{
                        padding: '6px 12px', borderRadius: '8px', border: '1.5px solid',
                        borderColor: editHours === String(h) ? '#3A7A3A' : '#DDD',
                        background: editHours === String(h) ? '#E8F5E9' : '#FFF',
                        color: editHours === String(h) ? '#1B3A1B' : '#555',
                        cursor: 'pointer', fontSize: '13px', fontWeight: editHours === String(h) ? '700' : '400',
                      }}>{hoursLabel(h)}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="number" min="1" max="720" value={editHours}
                      onChange={e => setEditHours(e.target.value)}
                      style={{ width: '80px', padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #DDD', fontSize: '15px', textAlign: 'center' }} />
                    <span style={{ fontSize: '13px', color: '#555' }}>Stunden manuell</span>
                  </div>
                </div>

                {/* Vorwarnung */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#333', marginBottom: '6px' }}>Telegram-Vorwarnung</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {WARN_OPTIONS.map(opt => (
                      <button key={String(opt.val)} onClick={() => setEditWarn(opt.val)} style={{
                        padding: '6px 12px', borderRadius: '8px', border: '1.5px solid',
                        borderColor: editWarn === opt.val ? '#E65100' : '#DDD',
                        background: editWarn === opt.val ? '#FFF3E0' : '#FFF',
                        color: editWarn === opt.val ? '#E65100' : '#555',
                        cursor: 'pointer', fontSize: '13px', fontWeight: editWarn === opt.val ? '700' : '400',
                      }}>{opt.label}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                    {editWarn
                      ? `→ Nachricht ${editWarn}h vor Ablauf + nochmal genau bei Fälligkeit`
                      : '→ Nur eine Nachricht genau bei Fälligkeit'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEditing(null)} style={{
                    flex: 1, background: '#F5F5F5', border: '1px solid #DDD', borderRadius: '8px',
                    padding: '10px', fontSize: '14px', cursor: 'pointer', color: '#555',
                  }}>Abbrechen</button>
                  <button onClick={() => save(s.task_key)} disabled={saving === s.task_key} style={{
                    flex: 2, background: '#3A7A3A', border: 'none', borderRadius: '8px',
                    padding: '10px', fontSize: '14px', fontWeight: '700', color: '#FFF', cursor: 'pointer',
                  }}>Speichern</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {settings.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginTop: '20px' }}>
            Keine Einstellungen gefunden — SQL patch16 ausführen.
          </p>
        )}
      </div>
    </div>
  )
}
