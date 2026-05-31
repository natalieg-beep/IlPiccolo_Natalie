'use client'

import { useState } from 'react'
import Link from 'next/link'

type Phrase = { id: string; category: string; turkish: string; german: string; pronunciation: string; formality: string }

const CAT_ORDER = ['Willkommen', 'Vorstellung', 'Getränke', 'Pizza', 'Nachfragen', 'Zahlung', 'Verabschiedung', 'Problem']

export default function PhrasenClient({ phrases }: { phrases: Phrase[] }) {
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [mode, setMode] = useState<'formal' | 'informal'>('formal')

  const visible = phrases.filter(p => {
    const fMatch = p.formality === 'both' || p.formality === mode
    if (!fMatch) return false
    if (!search) return true
    return p.turkish.toLowerCase().includes(search.toLowerCase()) ||
           p.german.toLowerCase().includes(search.toLowerCase())
  })

  const byCategory = CAT_ORDER.reduce((acc, cat) => {
    const items = visible.filter(p => p.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Phrase[]>)

  function copy(text: string) {
    navigator.clipboard?.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '32px', background: '#F7F4F0', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{
        background: '#FFFDF9', borderBottom: '1px solid #E5E0D8',
        padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#2E7D32' }}>🇹🇷 Türkçe</div>
            <div style={{ fontSize: '10px', color: '#8A7A60' }}>Antippen = Kopieren</div>
          </div>
          {/* Sie / Du Toggle */}
          <div style={{
            display: 'flex', background: '#F0EDE8', borderRadius: '8px', padding: '2px', gap: '2px',
          }}>
            <button onClick={() => setMode('formal')} style={{
              background: mode === 'formal' ? '#FFFFFF' : 'transparent',
              border: 'none', borderRadius: '6px', padding: '5px 10px',
              fontSize: '12px', fontWeight: '700', cursor: 'pointer',
              color: mode === 'formal' ? '#B8882A' : '#8A7A60',
              boxShadow: mode === 'formal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>Sie</button>
            <button onClick={() => setMode('informal')} style={{
              background: mode === 'informal' ? '#FFFFFF' : 'transparent',
              border: 'none', borderRadius: '6px', padding: '5px 10px',
              fontSize: '12px', fontWeight: '700', cursor: 'pointer',
              color: mode === 'informal' ? '#B8882A' : '#8A7A60',
              boxShadow: mode === 'informal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>Du</button>
          </div>
        </div>
        <Link href="/service">
          <button style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '6px 11px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
            ← Tische
          </button>
        </Link>
      </div>

      <div style={{ padding: '10px 14px' }}>
        <input
          type="search" placeholder="Suchen…" value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px',
            padding: '8px 12px', color: '#1A1207', fontSize: '14px', outline: 'none', marginBottom: '10px',
          }}
        />

        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2E7D32', marginBottom: '4px', fontWeight: '700' }}>
              {cat}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {items.map(p => (
                <div key={p.id} onClick={() => copy(p.turkish)} style={{
                  background: copied === p.turkish ? '#F0FAF0' : '#FFFFFF',
                  border: `1px solid ${copied === p.turkish ? '#4CAF50' : '#EAE6E0'}`,
                  borderRadius: '7px', padding: '6px 10px', cursor: 'pointer',
                  transition: 'background 0.12s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1A1207' }}>{p.turkish}</span>
                    {p.pronunciation && (
                      <span style={{ fontSize: '10px', color: '#B8882A', fontStyle: 'italic' }}>
                        [{p.pronunciation}]
                      </span>
                    )}
                    {copied === p.turkish && <span style={{ fontSize: '10px', color: '#4CAF50', marginLeft: 'auto' }}>✓</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '1px' }}>{p.german}</div>
                </div>
              ))}
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
