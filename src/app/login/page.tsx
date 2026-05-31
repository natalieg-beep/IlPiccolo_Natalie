'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const email = 'natalie.guenes.tr@gmail.com'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else window.location.href = '/service'
  }

  async function handleMagicLink() {
    setLoading(true)
    setError('')
    const { error } = await createClient().auth.signInWithOtp({ email })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F4F0', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '340px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🍕</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#B8882A' }}>Il Piccolo N</h1>
          <p style={{ fontSize: '13px', color: '#8A7A60', marginTop: '4px' }}>Internes Tool · Kaş</p>
        </div>

        {sent ? (
          <div style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', borderRadius: '14px', padding: '20px', textAlign: 'center', color: '#2E7D32', fontWeight: '600' }}>
            ✓ Magic Link gesendet — check deine E-Mail!
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password" placeholder="Passwort" value={password} onChange={e => setPassword(e.target.value)}
              style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '10px', padding: '14px 16px', color: '#1A1207', fontSize: '16px', outline: 'none', width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            />
            {error && <p style={{ color: '#C62828', fontSize: '13px' }}>{error}</p>}
            <button type="submit" disabled={loading || !password} style={{ background: '#B8882A', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', opacity: loading || !password ? 0.6 : 1 }}>
              {loading ? 'Lädt…' : 'Einloggen'}
            </button>
            <button type="button" onClick={handleMagicLink} disabled={loading} style={{ background: '#FFFFFF', color: '#8A7A60', border: '1px solid #E5E0D8', borderRadius: '10px', padding: '12px', fontSize: '14px', cursor: 'pointer' }}>
              Magic Link per E-Mail
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
