'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/kueche', label: 'Küche', icon: '🍕', match: '/kueche' },
  { href: '/service', label: 'Service', icon: '🍽️', match: '/service' },
  { href: '/management', label: 'Management', icon: '📊', match: '/management' },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login' || pathname === '/') return null

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'calc(56px + env(safe-area-inset-bottom))',
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: '#FFFFFF',
      borderTop: '1px solid #E5E0D8',
      display: 'flex',
      zIndex: 1000,
    }}>
      {tabs.map(tab => {
        const active = pathname.startsWith(tab.match)
        const color = active
          ? tab.match === '/kueche' ? '#2D5A2D'
          : tab.match === '/service' ? '#B8882A'
          : '#1A1207'
          : '#A09880'
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              textDecoration: 'none',
              color,
              background: active ? (
                tab.match === '/kueche' ? '#F0F4F0'
                : tab.match === '/service' ? '#FFF8EC'
                : '#F5F3F0'
              ) : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: active ? 700 : 400, letterSpacing: '0.01em' }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
