'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Table = { id: string; label: string; location: string }

const STATUS_COLOR: Record<string, string> = {
  open: '#2a3a15',
  transferred: '#1e2a3a',
}
const STATUS_BORDER: Record<string, string> = {
  open: '#5a8a20',
  transferred: '#2060a0',
}
const STATUS_LABEL: Record<string, string> = {
  open: 'Offen',
  transferred: 'Übertragen',
}

export default function TablesClient({
  tables,
  tableStatus,
}: {
  tables: Table[]
  tableStatus: Record<string, string>
}) {
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const outside = tables.filter(t => t.location === 'outside')
  const inside = tables.filter(t => t.location === 'inside')

  function TableBtn({ t }: { t: Table }) {
    const status = tableStatus[t.id]
    return (
      <Link href={`/service/tisch/${t.id}`} style={{ textDecoration: 'none' }}>
        <div style={{
          background: status ? STATUS_COLOR[status] : '#2a2a2a',
          border: `2px solid ${status ? STATUS_BORDER[status] : '#3a3a3a'}`,
          borderRadius: '16px',
          padding: '20px 8px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'transform 0.1s',
          userSelect: 'none',
        }}>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#d4a843', lineHeight: 1 }}>
            {t.label}
          </div>
          <div style={{ fontSize: '11px', color: '#9a8060', marginTop: '4px' }}>
            {t.location === 'outside' ? 'Außen' : 'Innen'}
          </div>
          {status && (
            <div style={{ fontSize: '10px', color: STATUS_BORDER[status], marginTop: '4px', fontWeight: '600' }}>
              {STATUS_LABEL[status]}
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: '#2a2015', borderBottom: '1px solid #4a3a20',
        padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 50
      }}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#d4a843' }}>Il Piccolo N</div>
          <div style={{ fontSize: '11px', color: '#9a8060' }}>Service · Tisch wählen</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/service/phrasen">
            <button style={{
              background: '#1e2a1e', border: '1px solid #2a4a2a', color: '#6abf6a',
              padding: '7px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
            }}>🇹🇷 Phrasen</button>
          </Link>
          <Link href="/management">
            <button style={{
              background: '#4a3a20', border: 'none', color: '#d4a843',
              padding: '7px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
            }}>⚙️</button>
          </Link>
          <button onClick={logout} style={{
            background: '#2a2a2a', border: '1px solid #3a3a3a', color: '#9a8060',
            padding: '7px 10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
          }}>↩</button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9a8060', marginBottom: '10px' }}>
          Außen
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {outside.map(t => <TableBtn key={t.id} t={t} />)}
        </div>

        <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#9a8060', marginBottom: '10px' }}>
          Innen
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {inside.map(t => <TableBtn key={t.id} t={t} />)}
        </div>

        <div style={{ marginTop: '12px', fontSize: '12px', color: '#5a5050', display: 'flex', gap: '16px' }}>
          <span>🟢 Offen</span>
          <span>🔵 Übertragen</span>
          <span style={{ color: '#3a3a3a' }}>⬜ Frei</span>
        </div>
      </div>
    </div>
  )
}
