export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#F7F4F0', color: '#1A1207' }}>
      {children}
    </div>
  )
}
