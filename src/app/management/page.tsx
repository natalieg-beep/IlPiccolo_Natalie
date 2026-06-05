import Link from 'next/link'

export default function ManagementPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#F7F4F0', padding: '0', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#B8882A' }}>Management</h1>
          <p style={{ fontSize: '11px', color: '#8A7A60' }}>Il Piccolo N · Kaş</p>
        </div>
        <Link href="/service">
          <button style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '8px 14px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>← Service</button>
        </Link>
      </div>

      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {[
          { label: 'Tagesabschluss', icon: '📋', desc: 'Beko, Menulux, KDV, Entnahmen', href: '/management/tagesabschluss' },
          { label: 'Übersicht', icon: '📊', desc: 'Bestellungen & Umsatz', href: '/management/uebersicht' },
          { label: 'Tages-Kasse', icon: '💰', desc: 'Trinkgeld, Schwarz, Notizen', href: '/management/kasse' },
          { label: 'Ausgaben', icon: '🧾', desc: 'Belege, Wareneinstand, Privat', href: '/management/ausgaben' },
          { label: 'Fixkosten', icon: '📋', desc: 'Monatliche laufende Kosten', href: '/management/fixkosten' },
        ].map(item => (
          <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '14px', padding: '20px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '28px' }}>{item.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#B8882A', marginTop: '8px' }}>{item.label}</div>
              <div style={{ fontSize: '12px', color: '#8A7A60', marginTop: '4px' }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
