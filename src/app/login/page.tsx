'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('natalie.guenes.tr@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/service'
    }
  }

  async function handleMagicLink() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a1a', padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🍕</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#d4a843' }}>Il Piccolo N</h1>
          <p style={{ fontSize: '13px', color: '#9a8060', marginTop: '4px' }}>Internes Tool · Kaş</p>
        </div>

        {sent ? (
          <div style={{
            background: '#1e2a1e', border: '1px solid #2a4a2a', borderRadius: '14px',
            padding: '20px', textAlign: 'center', color: '#6abf6a'
          }}>
            ✓ Magic Link gesendet — check deine E-Mail!
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '10px',
                padding: '14px 16px', color: '#f0ede8', fontSize: '16px', outline: 'none',
                width: '100%'
              }}
            />
            {error && <p style={{ color: '#e06060', fontSize: '13px' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              style={{
                background: '#d4a843', color: '#1a1a1a', border: 'none', borderRadius: '10px',
                padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                opacity: loading || !password ? 0.6 : 1
              }}
            >
              {loading ? 'Lädt…' : 'Einloggen'}
            </button>
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              style={{
                background: 'transparent', color: '#9a8060', border: '1px solid #3a3a3a',
                borderRadius: '10px', padding: '12px', fontSize: '14px', cursor: 'pointer'
              }}
            >
              Magic Link per E-Mail
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
