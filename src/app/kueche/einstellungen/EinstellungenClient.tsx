'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Setting {
  task_key: string
  label: string
  hours: number
}

const ICONS: Record<string, string> = {
  zwiebeln: '🧅', paprika: '🫑', pilze: '🍄', mozza: '🧀',
  sucuk: '🥩', salami: '🍕', salami_scharf: '🌶️', jambon: '🥓', pastirma: '🥩',
  tiramisu: '🍰', piccolo_crunch: '🍫',
}

const QUICK_HOURS = [12, 24, 48, 72, 96, 120]

export default function EinstellungenClient() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
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

  async function save(task_key: string, hours: number) {
    if (hours < 1 || hours > 720) return
    setSaving(task_key)
    await createClient()
      .from('kitchen_freshness_settings')
      .update({ hours })
      .eq('task_key', task_key)
    setSaved(task_key)
    setTimeout(() => setSaved(null), 2000)
    setEditing(null)
    await load()
    setSaving(null)
  }

  function hoursLabel(h: number): string {
    if (h < 24) return `${h} Stunden`
    if (h === 24) return '1 Tag'
    if (h % 24 === 0) return `${h / 24} Tage`
    return `${h} Stunden`
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ background: '#1B3A1B', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#FFF', fontSize: '18px', fontWeight: '800', margin: 0 }}>⚙️ Frischezeiten</h1>
          <p style={{ color: '#8FBF8F', fontSize: '12px', margin: '2px 0 0' }}>Wann wird etwas „nicht mehr frisch"?</p>
        </div>
        <Link href="/kueche/home">
          <button style={{ background: '#2D5A2D', border: 'none', color: '#FFF', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>← Zurück</button>
        </Link>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#1B3A1B' }}>
          💡 Hier stellst du ein, nach wie vielen Stunden ein Produkt als „nicht mehr frisch" gilt. Du bekommst dann eine Telegram-Nachricht.
        </div>

        {settings.map(s => (
          <div key={s.task_key} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1B3A1B' }}>
                  {ICONS[s.task_key] ?? '📦'} {s.label}
                </div>
                <div style={{ fontSize: '13px', color: saved === s.task_key ? '#3A7A3A' : '#666', marginTop: '3px', fontWeight: saved === s.task_key ? '700' : '400' }}>
                  {saved === s.task_key ? '✓ Gespeichert!' : `Aktuell: ${hoursLabel(s.hours)}`}
                </div>
              </div>
              <button onClick={() => { setEditing(s.task_key); setEditVal(String(s.hours)) }}
                style={{ background: '#F0F4F0', border: '1px solid #CCC', borderRadius: '8px', padding: '7px 12px', fontSize: '13px', cursor: 'pointer', color: '#333' }}>
                ✏️ Ändern
              </button>
            </div>

            {editing === s.task_key && (
              <div style={{ marginTop: '12px', borderTop: '1px solid #EEE', paddingTop: '12px' }}>
                {/* Schnellauswahl */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Schnellauswahl:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {QUICK_HOURS.map(h => (
                      <button key={h} onClick={() => setEditVal(String(h))} style={{
                        padding: '6px 12px', borderRadius: '8px', border: '1.5px solid',
                        borderColor: editVal === String(h) ? '#3A7A3A' : '#DDD',
                        background: editVal === String(h) ? '#E8F5E9' : '#FFF',
                        color: editVal === String(h) ? '#1B3A1B' : '#555',
                        cursor: 'pointer', fontSize: '13px', fontWeight: editVal === String(h) ? '700' : '400',
                      }}>{hoursLabel(h)}</button>
                    ))}
                  </div>
                </div>

                {/* Manuelle Eingabe */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', color: '#555' }}>Oder manuell:</div>
                  <input
                    type="number" min="1" max="720" value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    style={{ width: '80px', padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #DDD', fontSize: '15px', textAlign: 'center' }}
                  />
                  <div style={{ fontSize: '13px', color: '#555' }}>Stunden</div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEditing(null)} style={{
                    flex: 1, background: '#F5F5F5', border: '1px solid #DDD', borderRadius: '8px',
                    padding: '10px', fontSize: '14px', cursor: 'pointer', color: '#555',
                  }}>Abbrechen</button>
                  <button
                    onClick={() => save(s.task_key, parseInt(editVal))}
                    disabled={saving === s.task_key || !editVal}
                    style={{
                      flex: 2, background: '#3A7A3A', border: 'none', borderRadius: '8px',
                      padding: '10px', fontSize: '14px', fontWeight: '700', color: '#FFF', cursor: 'pointer',
                    }}>
                    {hoursLabel(parseInt(editVal) || 0)} speichern
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {settings.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginTop: '20px' }}>
            Bitte zuerst patch16 in Supabase ausführen.
          </p>
        )}
      </div>
    </div>
  )
}
