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
  const [search,  setSearch]  = useState('')
  const [copied,  setCopied]  = useState<string | null>(null)
  const [mode,    setMode]    = useState<'formal' | 'informal'>('formal')
  const [favs,    setFavs]    = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<string>('__favs_or_first')
  const tabsRef = useRef<HTMLDivElement>(null)

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

  function copy(text: string) {
    navigator.clipboard?.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1400)
  }

  // Gefilterte Phrasen nach Formalität
  const visible = phrases.filter(p =>
    p.formality === 'both' || p.formality === mode
  )

  const favPhrases  = visible.filter(p => favs.has(p.id))
  const hasFavs     = favPhrases.length > 0
  const availCats   = CAT_ORDER.filter(cat => visible.some(p => p.category === cat))

  // Aktiver Tab: beim ersten Render "Favoriten" wenn vorhanden, sonst erste Kategorie
  const resolvedTab = activeTab === '__favs_or_first'
    ? (hasFavs ? '__favs' : availCats[0] ?? '')
    : activeTab

  // Suchbetrieb: ignoriert Tabs, zeigt alle Treffer
  const searchResults = search
    ? visible.filter(p =>
        p.turkish.toLowerCase().includes(search.toLowerCase()) ||
        p.german.toLowerCase().includes(search.toLowerCase())
      )
    : []

  // Angezeigte Phrasen im Tab-Modus
  const tabPhrases = resolvedTab === '__favs'
    ? favPhrases
    : visible.filter(p => p.category === resolvedTab)

  function selectTab(tab: string) {
    setActiveTab(tab)
    setSearch('')
  }

  // Tab-Button in der Scrollleiste sichtbar scrollen
  function scrollTabIntoView(tab: string) {
    const el = tabsRef.current?.querySelector(`[data-tab="${tab}"]`) as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  function PhraseRow({ p }: { p: Phrase }) {
    const isFav   = favs.has(p.id)
    const isCopied = copied === p.turkish
    return (
      <div
        onClick={() => copy(p.turkish)}
        style={{
          background: isCopied ? '#F0FAF0' : '#FFFFFF',
          border: `1px solid ${isCopied ? '#4CAF50' : isFav ? '#E8C878' : '#EAE6E0'}`,
          borderRadius: '8px',
          padding: '9px 10px 9px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background 0.12s',
        }}
      >
        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1207' }}>{p.turkish}</span>
            {isCopied && <span style={{ fontSize: '11px', color: '#4CAF50', fontWeight: '700' }}>✓ kopiert</span>}
          </div>
          {p.pronunciation && (
            <div style={{ fontSize: '11px', color: '#B8882A', fontStyle: 'italic', marginTop: '1px' }}>
              [{p.pronunciation}]
            </div>
          )}
          <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '2px' }}>{p.german}</div>
        </div>

        {/* Favorit-Stern */}
        <button
          onClick={e => toggleFav(p.id, e)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '18px', lineHeight: 1, padding: '2px 4px', flexShrink: 0,
            color: isFav ? '#E8A800' : '#D8D0C8',
          }}
        >★</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', background: '#F7F4F0', minHeight: '100dvh', paddingBottom: '32px' }}>

      {/* ── Sticky Header ── */}
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>

        {/* Zeile 1: Titel + Sie/Du + Zurück */}
        <div style={{ padding: '10px 14px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#2E7D32', whiteSpace: 'nowrap' }}>🇹🇷 Türkçe</span>
            {/* Sie / Du Toggle */}
            <div style={{ display: 'flex', background: '#F0EDE8', borderRadius: '8px', padding: '2px', gap: '2px', flexShrink: 0 }}>
              {(['formal', 'informal'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  background: mode === m ? '#FFFFFF' : 'transparent',
                  border: 'none', borderRadius: '6px',
                  padding: '5px 11px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  color: mode === m ? '#B8882A' : '#8A7A60',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}>{m === 'formal' ? 'Sie' : 'Du'}</button>
              ))}
            </div>
          </div>
          <Link href="/service">
            <button style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '6px 11px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', flexShrink: 0 }}>
              ← Tische
            </button>
          </Link>
        </div>

        {/* Zeile 2: Suche */}
        <div style={{ padding: '0 14px 8px' }}>
          <input
            type="search" placeholder="🔍  Suchen auf Deutsch oder Türkisch…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: '#F5F2EC', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '8px 12px', color: '#1A1207', fontSize: '13px', outline: 'none' }}
          />
        </div>

        {/* Zeile 3: Kategorie-Tabs (nur ohne aktive Suche) */}
        {!search && (
          <div
            ref={tabsRef}
            style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '0 14px 10px', scrollbarWidth: 'none' }}
          >
            {/* Favoriten-Tab */}
            {hasFavs && (
              <button
                data-tab="__favs"
                onClick={() => { selectTab('__favs'); scrollTabIntoView('__favs') }}
                style={{
                  background:   resolvedTab === '__favs' ? '#FFF8EC' : '#F5F2EC',
                  border:       `1.5px solid ${resolvedTab === '__favs' ? '#E8A800' : '#E0D8CE'}`,
                  borderRadius: '20px', padding: '5px 12px', fontSize: '12px',
                  fontWeight:   resolvedTab === '__favs' ? '700' : '500',
                  color:        resolvedTab === '__favs' ? '#B8882A' : '#7A6E60',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                ★ Favoriten ({favPhrases.length})
              </button>
            )}
            {/* Kategorie-Tabs */}
            {availCats.map(cat => (
              <button
                key={cat}
                data-tab={cat}
                onClick={() => { selectTab(cat); scrollTabIntoView(cat) }}
                style={{
                  background:   resolvedTab === cat ? '#FFF8EC' : '#F5F2EC',
                  border:       `1.5px solid ${resolvedTab === cat ? '#B8882A' : '#E0D8CE'}`,
                  borderRadius: '20px', padding: '5px 12px', fontSize: '12px',
                  fontWeight:   resolvedTab === cat ? '700' : '500',
                  color:        resolvedTab === cat ? '#B8882A' : '#7A6E60',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {CAT_EMOJI[cat] ?? ''} {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Inhalt ── */}
      <div style={{ padding: '12px 14px' }}>

        {/* SUCHERGEBNISSE */}
        {search ? (
          searchResults.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8A7A60', padding: '40px 0' }}>Keine Treffer für „{search}"</p>
          ) : (
            <>
              <p style={{ fontSize: '11px', color: '#8A7A60', marginBottom: '8px' }}>
                {searchResults.length} Treffer
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {searchResults.map(p => <PhraseRow key={p.id} p={p} />)}
              </div>
            </>
          )
        ) : (
          /* TAB-INHALT */
          <>
            {/* Kategorie-Titel */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>
                {resolvedTab === '__favs' ? '★' : (CAT_EMOJI[resolvedTab] ?? '')}
              </span>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1207', margin: 0 }}>
                {resolvedTab === '__favs' ? 'Favoriten' : resolvedTab}
              </h2>
              <span style={{ fontSize: '12px', color: '#8A7A60', marginLeft: 'auto' }}>
                {tabPhrases.length} Sätze · Tippen = Kopieren
              </span>
            </div>

            {tabPhrases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8A7A60' }}>
                {resolvedTab === '__favs'
                  ? <p>Noch keine Favoriten — tippe ★ bei einem Satz</p>
                  : <p>Keine Sätze in dieser Kategorie</p>
                }
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {tabPhrases.map(p => <PhraseRow key={p.id} p={p} />)}
              </div>
            )}

            {/* Mini-Nav: andere Kategorien */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E0D8' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#8A7A60', marginBottom: '8px' }}>
                Weitere Kategorien
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {hasFavs && resolvedTab !== '__favs' && (
                  <button onClick={() => selectTab('__favs')} style={{
                    background: '#FFF8EC', border: '1px solid #E8A800', borderRadius: '16px',
                    padding: '5px 11px', fontSize: '12px', cursor: 'pointer', color: '#B8882A', fontWeight: '600',
                  }}>★ Favoriten</button>
                )}
                {availCats.filter(c => c !== resolvedTab).map(cat => (
                  <button key={cat} onClick={() => { selectTab(cat); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{
                    background: '#F5F2EC', border: '1px solid #E0D8CE', borderRadius: '16px',
                    padding: '5px 11px', fontSize: '12px', cursor: 'pointer', color: '#5A5040',
                  }}>{CAT_EMOJI[cat] ?? ''} {cat}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
