'use client'

import { useState } from 'react'
import Link from 'next/link'

type Phrase = { id: string; category: string; turkish: string; german: string; pronunciation: string }

const CAT_ORDER = ['Begrüßung', 'Bestellung', 'Empfehlung', 'Bezahlung', 'Smalltalk', 'Problem', 'Verabschiedung']

export default function PhrasenClient({ phrases }: { phrases: Phrase[] }) {
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const filtered = phrases.filter(p =>
    !search || p.turkish.toLowerCase().includes(search.toLowerCase()) ||
    p.german.toLowerCase().includes(search.toLowerCase())
  )

  const byCategory = CAT_ORDER.reduce((acc, cat) => {
    const items = filtered.filter(p => p.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Phrase[]>)

  function copy(text: string) {
    navigator.clipboard?.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '32px', background: '#F7F4F0', minHeight: '100dvh' }}>
      <div style={{
        background: '#FFFDF9', borderBottom: '1px solid #E5E0D8',
        padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#2E7D32' }}>🇹🇷 Türkçe Cümleler</div>
          <div style={{ fontSize: '11px', color: '#8A7A60' }}>Antippen zum Kopieren</div>
        </div>
        <Link href="/service">
          <button style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '8px 14px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>
            ← Tische
          </button>
        </Link>
      </div>

      <div style={{ padding: '16px' }}>
        <input
          type="search" placeholder="Suchen…" value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '10px',
            padding: '12px 14px', color: '#1A1207', fontSize: '15px', outline: 'none', marginBottom: '16px',
          }}
        />

        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2E7D32', marginBottom: '8px', fontWeight: '600' }}>
              {cat}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map(p => (
                <div key={p.id} onClick={() => copy(p.turkish)} style={{
                  background: copied === p.turkish ? '#F0FAF0' : '#FFFFFF',
                  border: `1px solid ${copied === p.turkish ? '#4CAF50' : '#E5E0D8'}`,
                  borderRadius: '10px', padding: '12px 14px', cursor: 'pointer',
                  transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1A1207' }}>{p.turkish}</div>
                  {p.pronunciation && (
                    <div style={{ fontSize: '12px', color: '#B8882A', marginTop: '2px', fontStyle: 'italic' }}>
                      [{p.pronunciation}]
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#8A7A60', marginTop: '3px' }}>{p.german}</div>
                  {copied === p.turkish && <div style={{ fontSize: '11px', color: '#4CAF50', marginTop: '4px' }}>✓ Kopiert</div>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#8A7A60', padding: '40px 0' }}>Keine Treffer</p>
        )}
      </div>
    </div>
  )
}
