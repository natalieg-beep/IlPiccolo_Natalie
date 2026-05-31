export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#1a1a1a', color: '#f0ede8' }}>
      {children}
    </div>
  )
}
