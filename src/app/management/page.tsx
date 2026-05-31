import Link from 'next/link'

export default function ManagementPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#1a1a1a', color: '#f0ede8', padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#d4a843' }}>Management</h1>
          <p style={{ fontSize: '13px', color: '#9a8060' }}>Il Piccolo N · Kaş</p>
        </div>
        <Link href="/service">
          <button style={{
            background: '#4a3a20', border: 'none', color: '#d4a843',
            padding: '8px 14px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
          }}>← Service</button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {[
          { label: 'Ausgaben', icon: '🧾', desc: 'Belege, Wareneinstand, Privat', href: '/management/ausgaben' },
          { label: 'Fixkosten', icon: '📋', desc: 'Monatliche laufende Kosten', href: '/management/fixkosten' },
          { label: 'Zutaten', icon: '🥫', desc: 'Preise & Preisverlauf', href: '/management/zutaten' },
          { label: 'Übersicht', icon: '📊', desc: 'Kosten & Auswertung', href: '/management/uebersicht' },
        ].map(item => (
          <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '14px',
              padding: '20px', cursor: 'pointer',
            }}>
              <div style={{ fontSize: '28px' }}>{item.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#d4a843', marginTop: '8px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '12px', color: '#9a8060', marginTop: '4px' }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
