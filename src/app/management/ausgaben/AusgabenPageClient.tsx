'use client'

import { useState } from 'react'
import Link from 'next/link'
import AusgabenClient from './AusgabenClient'
import KostenClient, { type ExpenseCategory, type Expense, type Supplier } from './KostenClient'

type Product  = { id: string; name: string; category: string; unit: string; notes: string | null; active: boolean }
type Price    = { id: string; product_id: string; price_tl: number; quantity: number; unit: string; price_per_unit: number; date: string; source: string; receipt_ref: string | null; notes: string | null; is_private: boolean }

export default function AusgabenPageClient({
  products, allPrices, categories, expenses, suppliers,
}: {
  products: Product[]
  allPrices: Price[]
  categories: ExpenseCategory[]
  expenses: Expense[]
  suppliers: Supplier[]
}) {
  const [tab, setTab] = useState<'einkauf' | 'kosten'>('einkauf')

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#F7F4F0', minHeight: '100dvh', paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div style={{ background: '#1A1207', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Link href="/management" style={{ color: '#B8882A', fontSize: '13px', textDecoration: 'none' }}>← Management</Link>
          <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFF', flex: 1 }}>💰 Ausgaben</h1>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '3px', gap: '3px' }}>
          <button onClick={() => setTab('einkauf')} style={{
            flex: 1, padding: '9px', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
            background: tab === 'einkauf' ? '#B8882A' : 'transparent',
            color: tab === 'einkauf' ? '#FFF' : 'rgba(255,255,255,0.6)',
            fontWeight: tab === 'einkauf' ? 700 : 400,
          }}>🛒 Einkaufspreise</button>
          <button onClick={() => setTab('kosten')} style={{
            flex: 1, padding: '9px', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
            background: tab === 'kosten' ? '#B8882A' : 'transparent',
            color: tab === 'kosten' ? '#FFF' : 'rgba(255,255,255,0.6)',
            fontWeight: tab === 'kosten' ? 700 : 400,
          }}>📊 Investitionen & Fixkosten</button>
        </div>
      </div>

      {/* Content */}
      {tab === 'einkauf'
        ? <AusgabenClient products={products} allPrices={allPrices} />
        : <KostenClient categories={categories} expenses={expenses} suppliers={suppliers} />
      }
    </div>
  )
}
