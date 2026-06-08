export default function KuecheLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#F0F4F0', maxWidth: '480px', margin: '0 auto', paddingBottom: 0 }}>
      {children}
    </div>
  )
}
