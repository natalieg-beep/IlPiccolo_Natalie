'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type KitchenUser, mdhColor, COLOR } from '@/lib/kitchen'

interface Product {
  id: string
  name: string
  category: string
  expires_at: string
  notes: string | null
  created_at: string
}

const CATEGORIES = [
  { key: 'kaese', label: '🧀 Käse' },
  { key: 'wurst', label: '🥩 Wurst/Aufschnitt' },
  { key: 'sonstiges', label: '📦 Sonstiges' },
]

const COMMON_PRODUCTS = [
  'Sucuk', 'Pastırma', 'Jambon', 'Ital. Salami', 'Mozza', 'Kaşar',
  'Beyaz Peynir', 'Hellim', 'Parmesan', 'Cream Cheese',
]

export default function MdhClient() {
  const router = useRouter()
  const [user, setUser] = useState<KitchenUser | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'wurst', expires_at: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('kitchen_user')
    if (!u) { router.replace('/kueche'); return }
    setUser(JSON.parse(u))
  }, [router])

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from('kitchen_products')
      .select('*')
      .order('expires_at', { ascending: true })
    setProducts(data ?? [])
  }, [])

  useEffect(() => { if (user) load() }, [user, load])

  async function addProduct() {
    if (!user || !form.name || !form.expires_at) return
    setSaving(true)
    await createClient().from('kitchen_products').insert({
      name: form.name,
      category: form.category,
      expires_at: form.expires_at,
      notes: form.notes || null,
      created_by: user.id,
    })
    setForm({ name: '', category: 'wurst', expires_at: '', notes: '' })
    setShowForm(false)
    await load()
    setSaving(false)
  }

  async function deleteProduct(id: string) {
    await createClient().from('kitchen_products').delete().eq('id', id)
    await load()
  }

  function daysLeft(expires_at: string): number {
    return Math.ceil((new Date(expires_at).getTime() - Date.now()) / 86_400_000)
  }

  if (!user) return null

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: products.filter(p => p.category === cat.key),
  })).filter(g => g.items.length > 0)

  return (
    <div style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
      <div style={{ background: '#1B3A1B', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '800', margin: 0 }}>📦 Mindesthaltbarkeit</h1>
          <p style={{ color: '#8FBF8F', fontSize: '12px', margin: '2px 0 0' }}>{user.name}</p>
        </div>
        <Link href="/kueche/home">
          <button style={{ background: '#2D5A2D', border: 'none', color: '#FFF', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>← Zurück</button>
        </Link>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* + Produkt Button */}
        <button onClick={() => setShowForm(s => !s)} style={{
          background: '#3A7A3A', color: '#FFF', border: 'none', borderRadius: '12px',
          padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
        }}>
          {showForm ? '✕ Abbrechen' : '+ Produkt eintragen'}
        </button>

        {/* Formular */}
        {showForm && (
          <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Produkt</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="z.B. Sucuk"
                style={inputStyle}
                list="common-products"
              />
              <datalist id="common-products">
                {COMMON_PRODUCTS.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div>
              <label style={labelStyle}>Kategorie</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => setForm(f => ({ ...f, category: c.key }))} style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid',
                    borderColor: form.category === c.key ? '#3A7A3A' : '#DDD',
                    background: form.category === c.key ? '#E8F5E9' : '#FFF',
                    color: form.category === c.key ? '#1B3A1B' : '#555',
                    cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  }}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>MHD (Ablaufdatum)</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Notiz (optional)</label>
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="z.B. Charge A, geöffnet am…"
                style={inputStyle}
              />
            </div>
            <button onClick={addProduct} disabled={saving || !form.name || !form.expires_at} style={{
              background: saving ? '#888' : '#3A7A3A', color: '#FFF', border: 'none',
              borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
            }}>
              Speichern
            </button>
          </div>
        )}

        {/* Produkt-Liste */}
        {products.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center', fontSize: '14px' }}>Noch keine Produkte eingetragen.</p>
        )}

        {grouped.map(g => (
          <div key={g.key} style={{ background: '#FFFFFF', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#1B3A1B', margin: '0 0 10px' }}>{g.label}</h2>
            {g.items.map(p => {
              const col = mdhColor(p.expires_at)
              const days = daysLeft(p.expires_at)
              return (
                <div key={p.id} style={{ background: COLOR[col].bg, border: `1.5px solid ${COLOR[col].border}`, borderRadius: '10px', padding: '10px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: COLOR[col].text }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
                      MHD: {new Date(p.expires_at).toLocaleDateString('de-DE')}{' '}
                      <span style={{ fontWeight: '600', color: COLOR[col].text }}>
                        {days < 0 ? `(${Math.abs(days)}d abgelaufen!)` : days === 0 ? '(heute!)' : `(noch ${days}d)`}
                      </span>
                    </div>
                    {p.notes && <div style={{ fontSize: '11px', color: '#888' }}>{p.notes}</div>}
                  </div>
                  <button onClick={() => deleteProduct(p.id)} style={{
                    background: 'transparent', border: 'none', color: '#999', fontSize: '18px', cursor: 'pointer', padding: '4px 8px',
                  }}>🗑</button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #DDD', fontSize: '15px', boxSizing: 'border-box' }
