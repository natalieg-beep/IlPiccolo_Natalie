'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { KitchenUser } from '@/lib/kitchen'

export default function KuecheLoginPage() {
  const [users, setUsers] = useState<KitchenUser[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    createClient()
      .from('kitchen_users')
      .select('*')
      .order('name')
      .then(({ data }) => { setUsers(data ?? []); setLoading(false) })
  }, [])

  function select(user: KitchenUser) {
    localStorage.setItem('kitchen_user', JSON.stringify(user))
    router.push('/kueche/home')
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: '32px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🍕</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1B3A1B', margin: 0 }}>Il Piccolo</h1>
        <p style={{ fontSize: '14px', color: '#5A7A5A', margin: '4px 0 0' }}>Küche</p>
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Laden…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '280px' }}>
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => select(u)}
              style={{
                background: '#FFFFFF',
                border: '2px solid #3A7A3A',
                borderRadius: '16px',
                padding: '20px',
                fontSize: '20px',
                fontWeight: '700',
                color: '#1B3A1B',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'transform 0.1s',
              }}
              onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.97)')}
              onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              👤 {u.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
