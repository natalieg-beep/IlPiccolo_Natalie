'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Supplier = {
  id: string
  name: string
  category: string
  notes: string | null
  active: boolean
}

const CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: 'supermarkt', label: 'Supermarkt',   icon: '🏪' },
  { key: 'lieferant',  label: 'Lieferant',    icon: '🚚' },
  { key: 'handwerker', label: 'Handwerker',   icon: '🔨' },
  { key: 'behoerde',   label: 'Behörde',      icon: '🏛️' },
  { key: 'sonstiges',  label: 'Sonstiges',    icon: '📦' },
]

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

const EMPTY_FORM = { name: '', category: 'lieferant', notes: '' }

export default function LieferantenClient({ suppliers: initial }: { suppliers: Supplier[] }) {
  const supabase = createClient()
  const [suppliers, setSuppliers] = useState<Supplier[]>(initial)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editForm, setEditForm]     = useState({ name: '', category: '', notes: '' })
  const [adding, setAdding]         = useState(false)
  const [newForm, setNewForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState<string>('alle')

  const filtered = suppliers.filter(s => {
    const matchCat = filterCat === 'alle' || s.category === filterCat
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.notes ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const grouped = CATEGORIES.map(c => ({
    ...c,
    items: filtered.filter(s => s.category === c.key),
  })).filter(g => g.items.length > 0)

  function startEdit(s: Supplier) {
    setEditingId(s.id)
    setEditForm({ name: s.name, category: s.category, notes: s.notes ?? '' })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const { data, error } = await supabase.from('suppliers')
      .update({ name: editForm.name, category: editForm.category, notes: editForm.notes || null })
      .eq('id', id).select().single()
    if (error) { alert('Fehler: ' + error.message); setSaving(false); return }
    setSuppliers(prev => prev.map(s => s.id === id ? data as Supplier : s))
    setEditingId(null)
    setSaving(false)
  }

  async function toggleActive(s: Supplier) {
    const { data } = await supabase.from('suppliers')
      .update({ active: !s.active }).eq('id', s.id).select().single()
    if (data) setSuppliers(prev => prev.map(x => x.id === s.id ? data as Supplier : x))
  }

  async function saveNew() {
    if (!newForm.name.trim()) return alert('Name erforderlich')
    setSaving(true)
    const { data, error } = await supabase.from('suppliers')
      .insert({ name: newForm.name.trim(), category: newForm.category, notes: newForm.notes || null, active: true })
      .select().single()
    if (error) { alert('Fehler: ' + error.message); setSaving(false); return }
    setSuppliers(prev => [...prev, data as Supplier].sort((a, b) => a.name.localeCompare(b.name)))
    setNewForm(EMPTY_FORM)
    setAdding(false)
    setSaving(false)
  }

  const S = {
    input: { width: '100%', padding: '9px 10px', border: '1px solid #E5E0D8', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' } as React.CSSProperties,
    select: { width: '100%', padding: '9px 10px', border: '1px solid #E5E0D8', borderRadius: '8px', fontSize: '14px', background: '#FFF', boxSizing: 'border-box' } as React.CSSProperties,
    card: { background: '#FFF', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as React.CSSProperties,
    btn: (bg: string, color = '#FFF'): React.CSSProperties => ({ background: bg, color, border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }),
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#F7F4F0', minHeight: '100dvh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div style={{ background: '#1A1207', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Link href="/management" style={{ color: '#B8882A', fontSize: '13px', textDecoration: 'none' }}>← Management</Link>
          <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFF', flex: 1 }}>🏪 Händler & Lieferanten</h1>
          <button onClick={() => { setAdding(true); setEditingId(null) }}
            style={{ ...S.btn('#B8882A'), padding: '7px 14px', fontSize: '13px' }}>+ Neu</button>
        </div>
        {/* Suche */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Suchen…"
          style={{ width: '100%', padding: '8px 12px', border: 'none', borderRadius: '8px', fontSize: '14px', background: 'rgba(255,255,255,0.12)', color: '#FFF', boxSizing: 'border-box' }} />
      </div>

      <div style={{ padding: '12px 16px' }}>
        {/* Kategorie-Filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[{ key: 'alle', label: 'Alle', icon: '🗂️' }, ...CATEGORIES].map(c => (
            <button key={c.key} onClick={() => setFilterCat(c.key)} style={{
              padding: '6px 12px', border: '1px solid #E5E0D8', borderRadius: '20px', fontSize: '12px', whiteSpace: 'nowrap',
              background: filterCat === c.key ? '#B8882A' : '#FFF',
              color: filterCat === c.key ? '#FFF' : '#5A5040',
              fontWeight: filterCat === c.key ? 700 : 400, cursor: 'pointer',
            }}>{c.icon} {c.label}</button>
          ))}
        </div>

        {/* Neuer Lieferant */}
        {adding && (
          <div style={{ ...S.card, border: '2px solid #B8882A', marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#B8882A' }}>✦ Neuer Händler</div>
            <input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name *" style={{ ...S.input, marginBottom: '8px' }} />
            <select value={newForm.category} onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))}
              style={{ ...S.select, marginBottom: '8px' }}>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
            </select>
            <input value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notiz (optional)" style={{ ...S.input, marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setAdding(false)} style={S.btn('#E0E0E0', '#555')}>Abbrechen</button>
              <button onClick={saveNew} disabled={saving} style={{ ...S.btn('#2E7D32'), flex: 1 }}>
                {saving ? '…' : '✓ Speichern'}
              </button>
            </div>
          </div>
        )}

        {/* Zähler */}
        <div style={{ fontSize: '12px', color: '#8A7A60', marginBottom: '10px' }}>
          {filtered.length} von {suppliers.length} Händlern
          {suppliers.filter(s => !s.active).length > 0 &&
            <span style={{ marginLeft: '8px', color: '#A09880' }}>· {suppliers.filter(s => !s.active).length} inaktiv</span>}
        </div>

        {/* Gruppen */}
        {grouped.map(group => (
          <div key={group.key} style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#8A7A60', letterSpacing: '0.05em', marginBottom: '6px', paddingLeft: '2px' }}>
              {group.icon} {group.label.toUpperCase()} ({group.items.length})
            </div>
            {group.items.map(s => (
              <div key={s.id} style={{ ...S.card, opacity: s.active ? 1 : 0.5 }}>
                {editingId === s.id ? (
                  <div>
                    <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      style={{ ...S.input, marginBottom: '8px', fontWeight: 600 }} />
                    <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                      style={{ ...S.select, marginBottom: '8px' }}>
                      {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                    </select>
                    <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Notiz (optional)" style={{ ...S.input, marginBottom: '10px' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEditingId(null)} style={S.btn('#E0E0E0', '#555')}>Abbrechen</button>
                      <button onClick={() => saveEdit(s.id)} disabled={saving} style={{ ...S.btn('#2E7D32'), flex: 1 }}>
                        {saving ? '…' : '✓ Speichern'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: s.active ? '#1A1207' : '#A09880' }}>{s.name}</div>
                      {s.notes && <div style={{ fontSize: '12px', color: '#8A7A60', marginTop: '2px' }}>{s.notes}</div>}
                    </div>
                    <button onClick={() => toggleActive(s)}
                      style={{ ...S.btn(s.active ? '#E8F5E9' : '#F5F5F5', s.active ? '#2E7D32' : '#9E9E9E'), padding: '5px 10px', fontSize: '11px' }}>
                      {s.active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                    <button onClick={() => startEdit(s)}
                      style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>✏️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#8A7A60', padding: '40px 0' }}>
            Keine Händler gefunden.
          </div>
        )}
      </div>
    </div>
  )
}
