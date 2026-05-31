'use client'

import { useState } from 'react'
import Link from 'next/link'

type Phrase = { id: string; category: string; turkish: string; german: string; pronunciation: string }

const CAT_ORDER = ['Willkommen', 'Vorstellung', 'Getränke', 'Pizza', 'Nachfragen', 'Zahlung', 'Verabschiedung', 'Problem']

export default function PhrasenClient({ phrases }: { phrases: Phrase[] }) {
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const filtered = phrases.filter(p =>
    !search ||
    p.turkish.toLowerCase().includes(search.toLowerCase()) ||
    p.german.toLowerCase().includes(search.toLowerCase())
  )

  const byCategory = CAT_ORDER.reduce((acc, cat) => {
    const items = filtered.filter(p => p.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Phrase[]>)

  // also catch any categories not in CAT_ORDER
  filtered.forEach(p => {
    if (!CAT_ORDER.includes(p.category) && !byCategory[p.category]) {
      byCategory[p.category] = filtered.filter(x => x.category === p.category)
    }
  })

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
        padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#2E7D32' }}>🇹🇷 Türkçe Cümleler</div>
          <div style={{ fontSize: '11px', color: '#8A7A60' }}>Antippen zum Kopieren</div>
        </div>
        <Link href="/service">
          <button style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '7px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
            ← Tische
          </button>
        </Link>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <input
          type="search" placeholder="Suchen…" value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px',
            padding: '9px 12px', color: '#1A1207', fontSize: '14px', outline: 'none', marginBottom: '12px',
          }}
        />

        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2E7D32', marginBottom: '5px', fontWeight: '700' }}>
              {cat}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {items.map(p => (
                <div key={p.id} onClick={() => copy(p.turkish)} style={{
                  background: copied === p.turkish ? '#F0FAF0' : '#FFFFFF',
                  border: `1px solid ${copied === p.turkish ? '#4CAF50' : '#E8E4DE'}`,
                  borderRadius: '8px', padding: '7px 11px', cursor: 'pointer',
                  transition: 'background 0.12s',
                }}>
                  {/* Turkish + Aussprache on same line */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1207' }}>{p.turkish}</span>
                    {p.pronunciation && (
                      <span style={{ fontSize: '11px', color: '#B8882A', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                        [{p.pronunciation}]
                      </span>
                    )}
                    {copied === p.turkish && <span style={{ fontSize: '10px', color: '#4CAF50', marginLeft: 'auto' }}>✓</span>}
                  </div>
                  {/* German below */}
                  <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '1px' }}>{p.german}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#8A7A60', padding: '32px 0' }}>Keine Treffer</p>
        )}
      </div>
    </div>
  )
}
