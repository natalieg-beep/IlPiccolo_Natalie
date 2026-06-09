'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Entry = { id: string; entry_type: string; amount: number; note: string | null; created_at: string }

const TYPE_CONFIG = {
  tip:         { label: '💸 Trinkgeld',        color: '#2E7D32', bg: '#F0FAF0', border: '#A5D6A7' },
  schwarz_bar: { label: '🤝 Freunde/Fam. (bar)', color: '#1565C0', bg: '#EEF4FF', border: '#90CAF9' },
  note:        { label: '📝 Notiz',             color: '#8A7A60', bg: '#F5F2EC', border: '#E5E0D8' },
}

export default function KasseClient({
  initialEntries,
  schwarzFromOrders,
}: {
  initialEntries: Entry[]
  schwarzFromOrders: number
}) {
  const router    = useRouter()
  const supabase  = createClient()

  const [entries,   setEntries]   = useState<Entry[]>(initialEntries)
  const [type,      setType]      = useState<'tip' | 'schwarz_bar' | 'note'>('tip')
  const [amount,    setAmount]    = useState('')
  const [note,      setNote]      = useState('')
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState<string | null>(null)

  const tipTotal       = entries.filter(e => e.entry_type === 'tip').reduce((s, e) => s + e.amount, 0)
  const schwarzManual  = entries.filter(e => e.entry_type === 'schwarz_bar').reduce((s, e) => s + e.amount, 0)

  async function addEntry() {
    if (type !== 'note' && !amount) return
    setSaving(true)
    const { data, error } = await supabase.from('daily_entries').insert({
      entry_type: type,
      amount:     type === 'note' ? 0 : parseInt(amount) || 0,
      note:       note || null,
    }).select().single()
    if (!error && data) {
      setEntries(prev => [data, ...prev])
      setAmount('')
      setNote('')
    }
    setSaving(false)
  }

  async function deleteEntry(id: string) {
    setDeleting(id)
    await supabase.from('daily_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
  }

  const cfg = TYPE_CONFIG

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', background: '#F7F4F0', minHeight: '100dvh', paddingBottom: 'calc(32px + 56px + env(safe-area-inset-bottom))' }}>

      {/* Header */}
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#B8882A' }}>💰 Tages-Kasse</div>
          <div style={{ fontSize: '11px', color: '#8A7A60' }}>Trinkgeld · Schwarz · Notizen</div>
        </div>
        <button onClick={() => router.push('/management')} style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '7px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Tages-Zusammenfassung */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: 'Trinkgeld',          value: tipTotal,                            unit: ' ₺', color: '#2E7D32' },
            { label: 'Freunde (bar)',       value: schwarzManual + schwarzFromOrders,   unit: ' ₺', color: '#1565C0' },
            { label: '  davon Bestellungen', value: schwarzFromOrders,                  unit: ' ₺', color: '#8A7A60' },
          ].map(s => (
            <div key={s.label} style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '10px', padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: s.color }}>{s.value}{s.unit}</div>
              <div style={{ fontSize: '10px', color: '#8A7A60', marginTop: '2px', lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Eingabe */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#8A7A60', fontWeight: '600', marginBottom: '10px' }}>Eintrag hinzufügen</div>

          {/* Typ-Auswahl */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            {(Object.keys(cfg) as Array<keyof typeof cfg>).map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                flex: 1, background: type === t ? cfg[t].bg : '#F5F2EC',
                border: `1.5px solid ${type === t ? cfg[t].border : '#E5E0D8'}`,
                borderRadius: '8px', padding: '8px 4px', fontSize: '11px', cursor: 'pointer',
                color: type === t ? cfg[t].color : '#8A7A60',
                fontWeight: type === t ? '700' : '400',
              }}>
                {cfg[t].label}
              </button>
            ))}
          </div>

          {/* Betrag (nur bei Geld-Typen) */}
          {type !== 'note' && (
            <div style={{ marginBottom: '8px' }}>
              <input
                type="number" min="0" placeholder="Betrag in ₺"
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{ width: '100%', background: '#F5F2EC', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '9px 12px', fontSize: '15px', color: '#1A1207', outline: 'none' }}
              />
            </div>
          )}

          {/* Notiz */}
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text" placeholder={type === 'note' ? 'Notiz eingeben…' : 'Notiz (optional)'}
              value={note} onChange={e => setNote(e.target.value)}
              style={{ width: '100%', background: '#F5F2EC', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', color: '#1A1207', outline: 'none' }}
            />
          </div>

          <button onClick={addEntry} disabled={saving || (type !== 'note' && !amount)} style={{
            width: '100%', background: '#B8882A', color: '#FFFFFF', border: 'none',
            borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700',
            cursor: 'pointer', opacity: (saving || (type !== 'note' && !amount)) ? 0.5 : 1,
          }}>
            {saving ? 'Speichert…' : '+ Hinzufügen'}
          </button>
        </div>

        {/* Einträge heute */}
        {entries.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#8A7A60', marginBottom: '6px' }}>
              Heute ({entries.length} Einträge)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {entries.map(entry => {
                const c = cfg[entry.entry_type as keyof typeof cfg] ?? cfg.note
                const time = new Date(entry.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={entry.id} style={{
                    background: '#FFFFFF', border: `1px solid ${c.border}`,
                    borderRadius: '10px', padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: c.color }}>{c.label}</span>
                        <span style={{ fontSize: '11px', color: '#8A7A60' }}>{time} Uhr</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '2px', alignItems: 'baseline' }}>
                        {entry.amount > 0 && (
                          <span style={{ fontSize: '16px', fontWeight: '800', color: c.color }}>{entry.amount} ₺</span>
                        )}
                        {entry.note && (
                          <span style={{ fontSize: '13px', color: '#5A5040' }}>{entry.note}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} disabled={deleting === entry.id} style={{
                      background: '#FFF0F0', border: '1px solid #FFCDD2', color: '#C62828',
                      borderRadius: '6px', padding: '5px 9px', fontSize: '13px', cursor: 'pointer',
                    }}>✕</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8A7A60' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>💰</div>
            <p style={{ fontSize: '13px' }}>Noch keine Einträge heute</p>
          </div>
        )}
      </div>
    </div>
  )
}
