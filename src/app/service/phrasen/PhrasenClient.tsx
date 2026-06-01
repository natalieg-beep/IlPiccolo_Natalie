'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Phrase = { id: string; category: string; turkish: string; german: string; pronunciation: string; formality: string }

const CAT_ORDER = ['Willkommen', 'Vorstellung', 'Orientierung', 'Kommunikation', 'Getränke', 'Pizza', 'Küche', 'Nachfragen', 'Smalltalk', 'Zahlung', 'Verabschiedung', 'Problem']
const CAT_EMOJI: Record<string, string> = {
  Willkommen: '👋', Vorstellung: '🙋', Orientierung: '🚻', Kommunikation: '📱',
  Getränke: '🥤', Pizza: '🍕', Küche: '👨‍🍳', Nachfragen: '❓',
  Smalltalk: '💬', Zahlung: '💳', Verabschiedung: '🤝', Problem: '🆘',
}

export default function PhrasenClient({ phrases }: { phrases: Phrase[] }) {
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [mode, setMode] = useState<'formal' | 'informal'>('formal')
  const [favs, setFavs] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem('phrase-favs')
      if (stored) setFavs(new Set(JSON.parse(stored)))
    } catch {}
  }, [])

  function toggleFav(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setFavs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem('phrase-favs', JSON.stringify([...next]))
      return next
    })
  }

  const visible = phrases.filter(p => {
    const fMatch = p.formality === 'both' || p.formality === mode
    if (!fMatch) return false
    if (!search) return true
    return p.turkish.toLowerCase().includes(search.toLowerCase()) ||
           p.german.toLowerCase().includes(search.toLowerCase())
  })

  const favPhrases = visible.filter(p => favs.has(p.id))

  const byCategory = CAT_ORDER.reduce((acc, cat) => {
    const items = visible.filter(p => p.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Phrase[]>)

  visible.forEach(p => {
    if (!byCategory[p.category]) byCategory[p.category] = visible.filter(x => x.category === p.category)
  })

  function copy(text: string) {
    navigator.clipboard?.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1200)
  }

  function jumpTo(cat: string) {
    sectionRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const visibleCats = CAT_ORDER.filter(c => byCategory[c])

  function PhraseCard({ p }: { p: Phrase }) {
    const isFav = favs.has(p.id)
    return (
      <div style={{
        background: copied === p.turkish ? '#F0FAF0' : '#FFFFFF',
        border: `1px solid ${copied === p.turkish ? '#4CAF50' : isFav ? '#E8C878' : '#EAE6E0'}`,
        borderRadius: '7px', padding: '6px 10px', cursor: 'pointer',
        transition: 'background 0.12s', display: 'flex', alignItems: 'flex-start', gap: '6px',
      }}>
        <div style={{ flex: 1 }} onClick={() => copy(p.turkish)}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1A1207' }}>{p.turkish}</span>
            {p.pronunciation && (
              <span style={{ fontSize: '10px', color: '#B8882A', fontStyle: 'italic' }}>[{p.pronunciation}]</span>
            )}
            {copied === p.turkish && <span style={{ fontSize: '10px', color: '#4CAF50', marginLeft: 'auto' }}>✓</span>}
          </div>
          <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '1px' }}>{p.german}</div>
        </div>
        <button
          onClick={e => toggleFav(p.id, e)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '15px', lineHeight: 1, padding: '1px 0', flexShrink: 0,
            color: isFav ? '#E8A800' : '#D0C8BE',
          }}
        >★</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '32px', background: '#F7F4F0', minHeight: '100dvh' }}>

      {/* Header */}
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#2E7D32' }}>🇹🇷 Türkçe</div>
              <div style={{ fontSize: '10px', color: '#8A7A60' }}>Tippen = Kopieren · ★ = Favorit</div>
            </div>
            <div style={{ display: 'flex', background: '#F0EDE8', borderRadius: '8px', padding: '2px', gap: '2px' }}>
              {(['formal', 'informal'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  background: mode === m ? '#FFFFFF' : 'transparent', border: 'none', borderRadius: '6px',
                  padding: '5px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  color: mode === m ? '#B8882A' : '#8A7A60',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s',
                }}>{m === 'formal' ? 'Sie' : 'Du'}</button>
              ))}
            </div>
          </div>
          <Link href="/service">
            <button style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '6px 11px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
              ← Tische
            </button>
          </Link>
        </div>

        <div style={{ padding: '0 14px 8px' }}>
          <input type="search" placeholder="Suchen…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: '#F5F2EC', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '7px 12px', color: '#1A1207', fontSize: '14px', outline: 'none' }} />
        </div>

        {!search && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '0 14px 10px', scrollbarWidth: 'none' }}>
            {favPhrases.length > 0 && (
              <button onClick={() => jumpTo('__favs')} style={{
                background: '#FFF8EC', border: '1px solid #E8A800', borderRadius: '20px',
                padding: '4px 10px', fontSize: '11px', fontWeight: '700', color: '#B8882A',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}>★ Favoriten</button>
            )}
            {visibleCats.map(cat => (
              <button key={cat} onClick={() => jumpTo(cat)} style={{
                background: '#FFF8EC', border: '1px solid #E8C878', borderRadius: '20px',
                padding: '4px 10px', fontSize: '11px', fontWeight: '600', color: '#B8882A',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}>{CAT_EMOJI[cat] ?? ''} {cat}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 14px' }}>

        {/* Favoriten-Sektion */}
        {favPhrases.length > 0 && !search && (
          <div ref={el => { sectionRefs.current['__favs'] = el }} style={{ marginBottom: '14px', scrollMarginTop: '150px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#B8882A', marginBottom: '4px', fontWeight: '700' }}>
              ★ Favoriten
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {favPhrases.map(p => <PhraseCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {/* Alle Kategorien */}
        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} ref={el => { sectionRefs.current[cat] = el }} style={{ marginBottom: '14px', scrollMarginTop: '150px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2E7D32', marginBottom: '4px', fontWeight: '700' }}>
              {CAT_EMOJI[cat] ?? ''} {cat}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {items.map(p => <PhraseCard key={p.id} p={p} />)}
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <p style={{ textAlign: 'center', color: '#8A7A60', padding: '32px 0' }}>Keine Treffer</p>
        )}
      </div>
    </div>
  )
}
