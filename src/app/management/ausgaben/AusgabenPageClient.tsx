'use client'

import { useState } from 'react'
import Link from 'next/link'
import AusgabenClient from './AusgabenClient'
import KostenClient, { type ExpenseCategory, type Expense, type Supplier } from './KostenClient'
import BatchScanClient from './BatchScanClient'

type Product  = { id: string; name: string; category: string; unit: string; notes: string | null; active: boolean }
type Price    = { id: string; product_id: string; price_tl: number; quantity: number; unit: string; price_per_unit: number; date: string; source: string; receipt_ref: string | null; notes: string | null; is_private: boolean; vat_rate: number | null }
type Receipt  = { id: string; supplier_id: string | null; ettn: string | null; fatura_no: string | null; date: string | null; total_tl: number | null; vat_amount: number | null; receipt_type: string | null; source: string; scanned_at: string; filename: string | null; item_count: number | null; notes: string | null }

export default function AusgabenPageClient({
  products, allPrices, categories, expenses, suppliers, receipts,
}: {
  products: Product[]
  allPrices: Price[]
  categories: ExpenseCategory[]
  expenses: Expense[]
  suppliers: Supplier[]
  receipts: Receipt[]
}) {
  const [tab, setTab] = useState<'einkauf' | 'kosten' | 'batch'>('einkauf')

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
            flex: 1, padding: '8px 4px', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
            background: tab === 'einkauf' ? '#B8882A' : 'transparent',
            color: tab === 'einkauf' ? '#FFF' : 'rgba(255,255,255,0.6)',
            fontWeight: tab === 'einkauf' ? 700 : 400,
          }}>🛒 Einkauf</button>
          <button onClick={() => setTab('kosten')} style={{
            flex: 1, padding: '8px 4px', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
            background: tab === 'kosten' ? '#B8882A' : 'transparent',
            color: tab === 'kosten' ? '#FFF' : 'rgba(255,255,255,0.6)',
            fontWeight: tab === 'kosten' ? 700 : 400,
          }}>📊 Kosten</button>
          <button onClick={() => setTab('batch')} style={{
            flex: 1, padding: '8px 4px', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
            background: tab === 'batch' ? '#B8882A' : 'transparent',
            color: tab === 'batch' ? '#FFF' : 'rgba(255,255,255,0.6)',
            fontWeight: tab === 'batch' ? 700 : 400,
          }}>📥 Batch</button>
        </div>
      </div>

      {/* Content */}
      {tab === 'einkauf' && <AusgabenClient products={products} allPrices={allPrices} suppliers={suppliers} receipts={receipts} />}
      {tab === 'kosten' && <KostenClient categories={categories} expenses={expenses} suppliers={suppliers} />}
      {tab === 'batch' && <BatchScanClient />}
    </div>
  )
}
