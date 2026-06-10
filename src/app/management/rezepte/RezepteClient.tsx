'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

type MenuItem = { id: string; name: string; category: string; vk_price: number | null; sort: number }
type Ingredient = { id: string; menu_item_id: string; name: string; quantity: number; unit: string; notes: string | null; sort: number }
type Assignment = {
  id: string; recipe_ingredient_id: string; product_id: string; price_mode: string
  pinned_price_id: string | null; notes: string | null
  purchase_products: { id: string; name: string; unit: string } | null
  purchase_prices: { id: string; price_tl: number; quantity: number; price_per_unit: number; date: string; unit: string } | null
}
type Product = { id: string; name: string; category: string; unit: string }
type Price = { id: string; product_id: string; price_tl: number; quantity: number; unit: string; price_per_unit: number; date: string }

const CAT_LABELS: Record<string, { label: string; icon: string }> = {
  pizza:    { label: 'Pizzen',    icon: '🍕' },
  dessert:  { label: 'Desserts',  icon: '🍰' },
  getraenk: { label: 'Getränke',  icon: '🥤' },
  kaffee:   { label: 'Kaffee',    icon: '☕' },
  extra:    { label: 'Extras',    icon: '➕' },
}

function fmtTL(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function RezepteClient({ menuItems, ingredients, assignments, products, prices }: {
  menuItems: MenuItem[]
  ingredients: Ingredient[]
  assignments: Assignment[]
  products: Product[]
  prices: Price[]
}) {
  const supabase = createClient()

  const [localAssignments, setLocalAssignments] = useState<Assignment[]>(assignments)
  const [selCategory, setSelCategory]           = useState<string>('pizza')
  const [selItem, setSelItem]                   = useState<MenuItem | null>(null)
  const [saving, setSaving]                     = useState<string | null>(null)

  // Neuester Preis eines Produkts
  const latestPrice = useCallback((productId: string): Price | null => {
    return prices.filter(p => p.product_id === productId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null
  }, [prices])

  // Alle Preise eines Produkts
  const productPrices = useCallback((productId: string): Price[] => {
    return prices.filter(p => p.product_id === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [prices])

  // Effektiver Preis einer Zuordnung
  const effectivePrice = useCallback((asgn: Assignment): Price | null => {
    if (asgn.price_mode === 'pinned' && asgn.pinned_price_id) {
      return prices.find(p => p.id === asgn.pinned_price_id) ?? null
    }
    return latestPrice(asgn.product_id)
  }, [prices, latestPrice])

  // Zuordnung für eine Zutat (erste aktive)
  const assignmentForIngredient = useCallback((ingredientId: string): Assignment | null => {
    return localAssignments.find(a => a.recipe_ingredient_id === ingredientId) ?? null
  }, [localAssignments])

  // Kosten einer Zutat berechnen
  const ingredientCost = useCallback((ing: Ingredient): number | null => {
    const asgn = assignmentForIngredient(ing.id)
    if (!asgn) return null
    const price = effectivePrice(asgn)
    if (!price) return null
    // price_per_unit ist Preis pro kg/L/Stk → ing.quantity in gleicher Einheit
    return ing.quantity * price.price_per_unit
  }, [assignmentForIngredient, effectivePrice])

  // Gesamtkosten eines Menüpunkts
  const totalCost = useCallback((itemId: string): number | null => {
    const ings = ingredients.filter(i => i.menu_item_id === itemId)
    let total = 0
    for (const ing of ings) {
      const cost = ingredientCost(ing)
      if (cost == null) return null // unvollständig
      total += cost
    }
    return total
  }, [ingredients, ingredientCost])

  // Zuordnung setzen/ändern
  async function assignProduct(ingredientId: string, productId: string) {
    setSaving(ingredientId)
    const existing = localAssignments.find(a => a.recipe_ingredient_id === ingredientId)
    if (existing) {
      // Update
      await supabase.from('recipe_product_assignments')
        .update({ product_id: productId, price_mode: 'latest', pinned_price_id: null })
        .eq('id', existing.id)
      setLocalAssignments(prev => prev.map(a =>
        a.id === existing.id ? { ...a, product_id: productId, price_mode: 'latest', pinned_price_id: null } : a
      ))
    } else {
      // Insert
      const { data } = await supabase.from('recipe_product_assignments')
        .insert({ recipe_ingredient_id: ingredientId, product_id: productId, price_mode: 'latest' })
        .select('*, purchase_products(id,name,unit), purchase_prices(id,price_tl,quantity,price_per_unit,date,unit)')
        .single()
      if (data) setLocalAssignments(prev => [...prev, data as Assignment])
    }
    setSaving(null)
  }

  // Preis pinnen / unpinnen
  async function togglePin(asgn: Assignment, priceId: string) {
    setSaving(asgn.recipe_ingredient_id)
    const newMode = (asgn.price_mode === 'pinned' && asgn.pinned_price_id === priceId) ? 'latest' : 'pinned'
    const newPinId = newMode === 'pinned' ? priceId : null
    await supabase.from('recipe_product_assignments')
      .update({ price_mode: newMode, pinned_price_id: newPinId })
      .eq('id', asgn.id)
    setLocalAssignments(prev => prev.map(a =>
      a.id === asgn.id ? { ...a, price_mode: newMode, pinned_price_id: newPinId } : a
    ))
    setSaving(null)
  }

  const S = {
    page:   { maxWidth: '600px', margin: '0 auto', background: '#F7F4F0', minHeight: '100dvh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' } as React.CSSProperties,
    card:   { background: '#FFF', borderRadius: '12px', padding: '14px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' } as React.CSSProperties,
    tag:    (color: string, bg: string): React.CSSProperties => ({ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: bg, color, fontWeight: 600 }),
  }

  const catItems = menuItems.filter(m => m.category === selCategory)

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ background: '#1A1207', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Link href="/management" style={{ color: '#B8882A', fontSize: '13px', textDecoration: 'none' }}>← Management</Link>
          <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFF' }}>📋 Rezepte & Kalkulation</h1>
        </div>
        {/* Kategorie-Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {Object.entries(CAT_LABELS).map(([key, { label, icon }]) => (
            <button key={key} onClick={() => { setSelCategory(key); setSelItem(null) }} style={{
              padding: '7px 12px', border: 'none', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: selCategory === key ? '#B8882A' : 'rgba(255,255,255,0.15)',
              color: selCategory === key ? '#FFF' : 'rgba(255,255,255,0.7)',
              fontWeight: selCategory === key ? 700 : 400,
            }}>{icon} {label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px' }}>
        {!selItem ? (
          // ── ÜBERSICHT: Alle Items dieser Kategorie ────────────────────────────
          <>
            <div style={{ fontSize: '12px', color: '#8A7A60', marginBottom: '10px' }}>
              {catItems.length} {CAT_LABELS[selCategory]?.label} — Tippen zum Bearbeiten
            </div>
            {catItems.map(item => {
              const cost = totalCost(item.id)
              const itemIngs = ingredients.filter(i => i.menu_item_id === item.id)
              const assigned = itemIngs.filter(i => assignmentForIngredient(i.id))
              const margin = item.vk_price && cost ? ((item.vk_price - cost) / item.vk_price * 100) : null
              return (
                <div key={item.id} style={{ ...S.card, cursor: 'pointer' }} onClick={() => setSelItem(item)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#1A1207' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#8A7A60', marginTop: '2px' }}>
                        {assigned.length}/{itemIngs.length} Zutaten zugeordnet
                        {assigned.length < itemIngs.length && (
                          <span style={{ color: '#E65100', marginLeft: '6px' }}>
                            ⚠️ {itemIngs.length - assigned.length} fehlen
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {item.vk_price && <div style={{ fontSize: '15px', fontWeight: 700, color: '#B8882A' }}>VK {fmtTL(item.vk_price)}</div>}
                      {cost != null && <div style={{ fontSize: '13px', color: '#5A5040' }}>EK {fmtTL(cost)}</div>}
                      {margin != null && (
                        <div style={{ fontSize: '12px', fontWeight: 700, color: margin > 60 ? '#2E7D32' : margin > 40 ? '#E65100' : '#C62828' }}>
                          {margin.toFixed(1)}% Marge
                        </div>
                      )}
                      {cost == null && itemIngs.length > 0 && <div style={{ fontSize: '11px', color: '#8A7A60' }}>unvollständig</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        ) : (
          // ── DETAIL: Rezept eines Items ────────────────────────────────────────
          <>
            <button onClick={() => setSelItem(null)} style={{ background: '#F5F2EC', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', marginBottom: '14px' }}>
              ← Zurück
            </button>

            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1A1207' }}>{selItem.name}</h2>
                <div style={{ textAlign: 'right' }}>
                  {selItem.vk_price && <div style={{ fontWeight: 700, color: '#B8882A' }}>VK {fmtTL(selItem.vk_price)}</div>}
                  {(() => {
                    const cost = totalCost(selItem.id)
                    const margin = selItem.vk_price && cost ? ((selItem.vk_price - cost) / selItem.vk_price * 100) : null
                    return cost != null ? (
                      <div>
                        <div style={{ color: '#5A5040', fontSize: '13px' }}>EK {fmtTL(cost)}</div>
                        {margin != null && (
                          <div style={{ fontSize: '12px', fontWeight: 700, color: margin > 60 ? '#2E7D32' : margin > 40 ? '#E65100' : '#C62828' }}>
                            {margin.toFixed(1)}% Marge
                          </div>
                        )}
                      </div>
                    ) : <div style={{ fontSize: '11px', color: '#8A7A60' }}>Kalkulation unvollständig</div>
                  })()}
                </div>
              </div>

              {/* Zutaten */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ingredients.filter(i => i.menu_item_id === selItem.id).map(ing => {
                  const asgn = assignmentForIngredient(ing.id)
                  const effPrice = asgn ? effectivePrice(asgn) : null
                  const cost = ingredientCost(ing)
                  const pPrices = asgn ? productPrices(asgn.product_id) : []
                  const isSaving = saving === ing.id

                  return (
                    <div key={ing.id} style={{ background: '#FAFAF8', borderRadius: '10px', padding: '12px', border: asgn ? '1px solid #E5E0D8' : '1px dashed #FFB300' }}>
                      {/* Zutat-Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A1207' }}>{ing.name}</span>
                          <span style={{ fontSize: '12px', color: '#8A7A60', marginLeft: '8px' }}>{ing.quantity} {ing.unit}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {cost != null ? (
                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#B8882A' }}>{fmtTL(cost)}</span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#E65100' }}>⚠️ kein Produkt</span>
                          )}
                        </div>
                      </div>

                      {/* Produktauswahl */}
                      <select
                        value={asgn?.product_id ?? ''}
                        disabled={isSaving}
                        onChange={e => { if (e.target.value) assignProduct(ing.id, e.target.value) }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #E5E0D8', borderRadius: '8px', fontSize: '13px', background: '#FFF', marginBottom: asgn ? '8px' : 0 }}
                      >
                        <option value="">— Produkt zuweisen —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                        ))}
                      </select>

                      {/* Preisverlauf + Pin-Option */}
                      {asgn && pPrices.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '11px', color: '#8A7A60', marginBottom: '2px' }}>
                            Verfügbare Preise — 📌 = wird verwendet
                          </div>
                          {pPrices.slice(0, 5).map(p => {
                            const isActive = effPrice?.id === p.id
                            const isPinned = asgn.price_mode === 'pinned' && asgn.pinned_price_id === p.id
                            return (
                              <div key={p.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '6px 8px', borderRadius: '6px',
                                background: isActive ? '#FFF8EC' : '#F5F5F5',
                                border: isActive ? '1px solid #B8882A' : '1px solid transparent',
                              }}>
                                <div style={{ fontSize: '12px', color: '#5A5040' }}>
                                  {fmtDate(p.date)} · {fmtTL(p.price_tl)} / {p.quantity}{p.unit}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#B8882A' }}>
                                    {fmtTL(p.price_per_unit)}/{p.unit}
                                  </span>
                                  <button
                                    onClick={() => togglePin(asgn, p.id)}
                                    disabled={isSaving}
                                    title={isPinned ? 'Pin aufheben' : 'Diesen Preis fixieren'}
                                    style={{
                                      background: isPinned ? '#B8882A' : '#E5E0D8', border: 'none',
                                      borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', fontSize: '13px',
                                    }}
                                  >
                                    {isPinned ? '📌' : '📍'}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                          {asgn.price_mode === 'latest' && (
                            <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '2px' }}>
                              🔄 Automatisch neuester Preis — 📍 tippen zum Fixieren
                            </div>
                          )}
                          {asgn.price_mode === 'pinned' && (
                            <div style={{ fontSize: '11px', color: '#B8882A', marginTop: '2px' }}>
                              📌 Preis fixiert (alte Lieferung) — 📌 tippen zum Aufheben
                            </div>
                          )}
                        </div>
                      )}

                      {isSaving && <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '4px' }}>Speichert…</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
