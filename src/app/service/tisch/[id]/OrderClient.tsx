'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MENU, CATEGORIES } from '@/lib/menu'

type Table = { id: string; label: string; location: string }
type OrderItem = { id: string; name: string; qty: number; unit_price: number }
type Order = { id: string; status: string; order_items: OrderItem[] }

export default function OrderClient({
  table,
  existingOrder,
}: {
  table: Table
  existingOrder: Order | null
}) {
  const router = useRouter()
  const supabase = createClient()

  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [items, setItems] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    existingOrder?.order_items.forEach(i => { m[i.name] = i.qty })
    return m
  })
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)

  const totalCount = Object.values(items).reduce((a, b) => a + b, 0)
  const totalPrice = Object.entries(items).reduce((sum, [name, qty]) => {
    const item = MENU.find(m => m.name === name)
    return sum + (item?.price ?? 0) * qty
  }, 0)

  function changeQty(name: string, price: number, delta: number) {
    setItems(prev => {
      const val = Math.max(0, (prev[name] ?? 0) + delta)
      if (val === 0) { const n = { ...prev }; delete n[name]; return n }
      return { ...prev, [name]: val }
    })
  }

  async function saveOrder() {
    setSaving(true)
    const entries = Object.entries(items)
    if (entries.length === 0) { setSaving(false); return }

    let orderId = existingOrder?.id
    if (!orderId) {
      const { data, error } = await supabase
        .from('orders')
        .insert({ table_id: table.id, status: 'open', note: note || null })
        .select('id')
        .single()
      if (error || !data) { alert('Fehler beim Speichern'); setSaving(false); return }
      orderId = data.id
    } else if (note) {
      await supabase.from('orders').update({ note }).eq('id', orderId)
    }

    await supabase.from('order_items').delete().eq('order_id', orderId)
    await supabase.from('order_items').insert(
      entries.map(([name, qty]) => ({
        order_id: orderId,
        name,
        qty,
        unit_price: MENU.find(m => m.name === name)?.price ?? 0,
      }))
    )

    router.push('/service')
    router.refresh()
  }

  async function markTransferred() {
    if (!existingOrder?.id) return
    setSaving(true)
    await supabase.from('orders').update({ status: 'transferred', closed_at: new Date().toISOString() }).eq('id', existingOrder.id)
    router.push('/service')
    router.refresh()
  }

  async function closeOrder() {
    if (!existingOrder?.id) return
    if (!confirm('Bestellung schließen?')) return
    setSaving(true)
    await supabase.from('orders').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', existingOrder.id)
    router.push('/service')
    router.refresh()
  }

  const filteredMenu = selectedCat ? MENU.filter(m => m.category === selectedCat) : []

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '120px' }}>
      {/* Header */}
      <div style={{
        background: '#2a2015', borderBottom: '1px solid #4a3a20',
        padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 50
      }}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#d4a843' }}>
            Tisch {table.label}
          </div>
          <div style={{ fontSize: '11px', color: '#9a8060' }}>
            {table.location === 'outside' ? 'Außen' : 'Innen'}
            {existingOrder && ' · Bestellung offen'}
          </div>
        </div>
        <button onClick={() => router.push('/service')} style={{
          background: '#4a3a20', border: 'none', color: '#d4a843',
          padding: '8px 14px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer'
        }}>← Tische</button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Kategorien */}
        <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9a8060', marginBottom: '10px' }}>
          Kategorie
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCat(selectedCat === cat.key ? null : cat.key)}
              style={{
                background: selectedCat === cat.key ? '#2a2015' : '#2a2a2a',
                border: `2px solid ${selectedCat === cat.key ? '#d4a843' : '#3a3a3a'}`,
                borderRadius: '12px', padding: '10px 4px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.1s',
              }}
            >
              <div style={{ fontSize: '22px' }}>{cat.icon}</div>
              <div style={{ fontSize: '10px', color: '#d4a843', marginTop: '3px', fontWeight: '600' }}>
                {cat.label}
              </div>
            </button>
          ))}
        </div>

        {/* Produkte */}
        {selectedCat && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9a8060', marginBottom: '10px' }}>
              {CATEGORIES.find(c => c.key === selectedCat)?.label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredMenu.map(item => {
                const qty = items[item.name] ?? 0
                return (
                  <div key={item.name} style={{
                    background: qty > 0 ? '#2a2015' : '#2a2a2a',
                    border: `1.5px solid ${qty > 0 ? '#d4a843' : '#3a3a3a'}`,
                    borderRadius: '12px', padding: '12px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600' }}>{item.name}</div>
                      {item.desc && (
                        <div style={{ fontSize: '11px', color: '#7a7060', marginTop: '2px', lineHeight: 1.4 }}>
                          {item.desc}
                        </div>
                      )}
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#d4a843', marginTop: '4px' }}>
                        {item.price} ₺
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                      <button onClick={() => changeQty(item.name, item.price, -1)} style={{
                        background: '#4a3a20', border: 'none', color: '#d4a843',
                        width: '32px', height: '32px', borderRadius: '8px', fontSize: '20px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>−</button>
                      <span style={{ fontSize: '16px', fontWeight: '700', minWidth: '22px', textAlign: 'center' }}>
                        {qty}
                      </span>
                      <button onClick={() => changeQty(item.name, item.price, 1)} style={{
                        background: '#4a3a20', border: 'none', color: '#d4a843',
                        width: '32px', height: '32px', borderRadius: '8px', fontSize: '20px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Aktuelle Bestellung */}
        {totalCount > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9a8060', marginBottom: '10px' }}>
              Bestellung
            </p>
            {Object.entries(items).map(([name, qty]) => (
              <div key={name} style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                borderBottom: '1px solid #2a2a2a', fontSize: '14px',
              }}>
                <span>{name} <span style={{ color: '#9a8060' }}>×{qty}</span></span>
                <span style={{ color: '#d4a843' }}>
                  {(MENU.find(m => m.name === name)?.price ?? 0) * qty} ₺
                </span>
              </div>
            ))}

            {/* Notiz */}
            <button onClick={() => setShowNote(!showNote)} style={{
              background: 'transparent', border: 'none', color: '#9a8060',
              fontSize: '12px', cursor: 'pointer', marginTop: '8px', padding: '0',
            }}>
              {showNote ? '▼' : '▶'} Notiz {note && '✓'}
            </button>
            {showNote && (
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Tischnotiz (optional)"
                rows={2}
                style={{
                  width: '100%', background: '#2a2a2a', border: '1px solid #3a3a3a',
                  borderRadius: '8px', padding: '10px', color: '#f0ede8', fontSize: '14px',
                  marginTop: '8px', resize: 'none', outline: 'none',
                }}
              />
            )}
          </div>
        )}

        {/* Aktionen wenn existierende Bestellung */}
        {existingOrder && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button onClick={markTransferred} disabled={saving} style={{
              flex: 1, background: '#1e2a3a', border: '1px solid #2060a0', color: '#60a0e0',
              padding: '12px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: '600',
            }}>
              ✓ Ins Menulux übertragen
            </button>
            <button onClick={closeOrder} disabled={saving} style={{
              background: '#3a1a1a', border: '1px solid #6a2a2a', color: '#e06060',
              padding: '12px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
            }}>
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {totalCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#2a2015', borderTop: '2px solid #d4a843',
          padding: '12px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', zIndex: 100, maxWidth: '480px', margin: '0 auto',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#9a8060' }}>Tisch {table.label}</div>
            <div>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#d4a843' }}>{totalCount}</span>
              <span style={{ fontSize: '12px', color: '#9a8060' }}> Artikel · </span>
              <span style={{ fontSize: '15px', fontWeight: '700' }}>{totalPrice} ₺</span>
            </div>
          </div>
          <button onClick={saveOrder} disabled={saving} style={{
            background: '#d4a843', color: '#1a1a1a', border: 'none',
            padding: '12px 20px', borderRadius: '10px', fontSize: '15px',
            fontWeight: '700', cursor: 'pointer', opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Speichert…' : 'Speichern →'}
          </button>
        </div>
      )}
    </div>
  )
}
