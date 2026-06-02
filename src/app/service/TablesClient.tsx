'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Table = { id: string; label: string; location: string }

const STATUS_STYLE: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  open:        { bg: '#F0FAF0', border: '#4CAF50', dot: '#4CAF50', label: 'Offen' },
  transferred: { bg: '#EEF4FF', border: '#1976D2', dot: '#1976D2', label: 'Übertragen' },
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

  const outside  = tables.filter(t => t.location === 'outside')
  const inside   = tables.filter(t => t.location === 'inside')
  const takeaway = tables.filter(t => t.location === 'takeaway')
  const privat   = tables.filter(t => t.location === 'privat')

  function TableBtn({ t }: { t: Table }) {
    const status = tableStatus[t.id]
    const style = status ? STATUS_STYLE[status] : null
    return (
      <Link href={`/service/tisch/${t.id}`} style={{ textDecoration: 'none' }}>
        <div style={{
          background: style?.bg ?? '#FFFFFF',
          border: `2px solid ${style?.border ?? '#E5E0D8'}`,
          borderRadius: '16px',
          padding: '18px 8px',
          textAlign: 'center',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#B8882A', lineHeight: 1 }}>
            {t.label}
          </div>
          <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '3px' }}>
            {t.location === 'outside' ? 'Außen' : 'Innen'}
          </div>
          {status && (
            <div style={{ fontSize: '10px', color: style?.dot, marginTop: '3px', fontWeight: '700' }}>
              ● {style?.label}
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
        background: '#FFFDF9',
        borderBottom: '1px solid #E5E0D8',
        padding: '14px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#B8882A' }}>Il Piccolo N</div>
          <div style={{ fontSize: '11px', color: '#8A7A60' }}>Service · Tisch wählen</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/service/phrasen">
            <button style={{
              background: '#F0FAF0', border: '1px solid #A5D6A7', color: '#2E7D32',
              padding: '7px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
              fontWeight: '600',
            }}>🇹🇷 Phrasen</button>
          </Link>
          <Link href="/management">
            <button style={{
              background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A',
              padding: '7px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
            }}>⚙️</button>
          </Link>
          <button onClick={logout} style={{
            background: '#F5F2EC', border: '1px solid #E5E0D8', color: '#8A7A60',
            padding: '7px 10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
          }}>↩</button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#8A7A60', marginBottom: '10px' }}>
          Außen
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {outside.map(t => <TableBtn key={t.id} t={t} />)}
        </div>

        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#8A7A60', marginBottom: '10px' }}>
          Innen
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {inside.map(t => <TableBtn key={t.id} t={t} />)}
        </div>

        {/* TakeAway + Privat */}
        {(takeaway.length > 0 || privat.length > 0) && (
          <>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#8A7A60', marginBottom: '10px' }}>
              Sonstiges
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {takeaway.map(t => (
                <Link key={t.id} href={`/service/tisch/${t.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: tableStatus[t.id] ? STATUS_STYLE[tableStatus[t.id]]?.bg ?? '#FFFFFF' : '#FFFFFF',
                    border: `2px solid ${tableStatus[t.id] ? STATUS_STYLE[tableStatus[t.id]]?.border ?? '#E5E0D8' : '#E5E0D8'}`,
                    borderRadius: '16px', padding: '16px 8px', textAlign: 'center', cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ fontSize: '26px' }}>🥡</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#B8882A', marginTop: '4px' }}>TakeAway</div>
                    {tableStatus[t.id] && (
                      <div style={{ fontSize: '10px', color: STATUS_STYLE[tableStatus[t.id]]?.dot, marginTop: '3px', fontWeight: '700' }}>
                        ● {STATUS_STYLE[tableStatus[t.id]]?.label}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {privat.map(t => (
                <Link key={t.id} href={`/service/tisch/${t.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: tableStatus[t.id] ? STATUS_STYLE[tableStatus[t.id]]?.bg ?? '#FFF8EC' : '#FFF8EC',
                    border: `2px solid ${tableStatus[t.id] ? STATUS_STYLE[tableStatus[t.id]]?.border ?? '#E8C878' : '#E8C878'}`,
                    borderRadius: '16px', padding: '16px 8px', textAlign: 'center', cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ fontSize: '26px' }}>🏠</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#B8882A', marginTop: '4px' }}>Privat Essen</div>
                    {tableStatus[t.id] && (
                      <div style={{ fontSize: '10px', color: STATUS_STYLE[tableStatus[t.id]]?.dot, marginTop: '3px', fontWeight: '700' }}>
                        ● {STATUS_STYLE[tableStatus[t.id]]?.label}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: '4px', fontSize: '12px', color: '#B0A898', display: 'flex', gap: '16px' }}>
          <span>● <span style={{ color: '#4CAF50' }}>Offen</span></span>
          <span>● <span style={{ color: '#1976D2' }}>Übertragen</span></span>
          <span style={{ color: '#C8C0B8' }}>○ Frei</span>
        </div>
      </div>
    </div>
  )
}
