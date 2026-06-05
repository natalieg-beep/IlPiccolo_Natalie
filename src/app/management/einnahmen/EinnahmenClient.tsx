'use client'

import Link from 'next/link'

type OrderItem = { unit_price: number; qty: number; on_the_house: boolean }
type Order = {
  id: string
  payment_method: string | null
  discount_percent: number | null
  discount_amount: number | null
  party_size: number | null
  tables: { label: string; location: string } | null
  order_items: OrderItem[]
}
type Entry = { entry_type: string; amount: number | null; kdv: number | null; date: string }

type Period = 'day' | 'week' | 'month' | 'year'

function periodLabel(period: Period, offset: number, startDate: string, endDate: string) {
  if (period === 'day') {
    const d = new Date(startDate)
    if (offset === 0) return 'Heute'
    if (offset === -1) return 'Gestern'
    return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  if (period === 'week') {
    const s = new Date(startDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
    const e = new Date(endDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
    return offset === 0 ? `Diese Woche (${s}–${e})` : `${s}–${e}`
  }
  if (period === 'month') {
    return new Date(startDate).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  }
  return new Date(startDate).getFullYear().toString()
}

function calcOrderRevenue(o: Order): number {
  if (o.payment_method === 'schwarz' || o.tables?.location === 'privat') return 0
  const base = (o.order_items ?? []).filter(i => !i.on_the_house).reduce((s, i) => s + i.unit_price * i.qty, 0)
  const afterPct = Math.round(base * (1 - (o.discount_percent ?? 0) / 100))
  return Math.max(0, afterPct - (o.discount_amount ?? 0))
}

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'day',   label: 'Tag' },
  { key: 'week',  label: 'Woche' },
  { key: 'month', label: 'Monat' },
  { key: 'year',  label: 'Jahr' },
]

export default function EinnahmenClient({
  orders, entries, period, offset, startDate, endDate,
}: {
  orders: Order[]
  entries: Entry[]
  period: Period
  offset: number
  startDate: string
  endDate: string
}) {
  // ── Berechnungen ─────────────────────────────────────────────────
  const nonPrivat = orders.filter(o => o.tables?.location !== 'privat')
  const privat    = orders.filter(o => o.tables?.location === 'privat')

  // Revenue by payment method (only non-privat)
  const byPayment = {
    card:         0,
    cash:         0,
    friends_card: 0,
    schwarz_bar:  0,
    schwarz:      0, // Warenwert (gratis)
  } as Record<string, number>

  const byPaymentCount: Record<string, number> = { card: 0, cash: 0, friends_card: 0, schwarz_bar: 0, schwarz: 0 }

  nonPrivat.forEach(o => {
    const pm = o.payment_method ?? 'unbekannt'
    const rev = calcOrderRevenue(o)
    // Warenwert (Brutto ohne Rabatt, ohne aufs-Haus) für schwarz
    const gross = (o.order_items ?? []).filter(i => !i.on_the_house).reduce((s, i) => s + i.unit_price * i.qty, 0)
    if (pm === 'schwarz') {
      byPayment.schwarz = (byPayment.schwarz ?? 0) + gross
    } else {
      byPayment[pm] = (byPayment[pm] ?? 0) + rev
    }
    byPaymentCount[pm] = (byPaymentCount[pm] ?? 0) + 1
  })

  // Verschenkte Posten (aufs Haus, ohne Privat und ohne schwarz)
  const gratisPosten = nonPrivat
    .filter(o => o.payment_method !== 'schwarz')
    .flatMap(o => (o.order_items ?? []).filter(i => i.on_the_house))
    .reduce((s, i) => s + i.unit_price * i.qty, 0)

  // Privat Warenwert
  const privatWarenwert = privat.reduce((s, o) =>
    s + (o.order_items ?? []).reduce((ss, i) => ss + i.unit_price * i.qty, 0), 0)

  // Gäste
  const guestCount = nonPrivat.reduce((s, o) => s + (o.party_size ?? 1), 0)

  // Offizieller Umsatz
  const officialRevenue = (byPayment.card ?? 0) + (byPayment.cash ?? 0) + (byPayment.friends_card ?? 0)
  const schwarzTotal    = (byPayment.schwarz_bar ?? 0) + (byPayment.schwarz ?? 0)

  // Menulux + Beko aus daily_entries
  const menuluxBrutto = entries.filter(e => e.entry_type === 'menulux_brutto' || e.entry_type === 'menulux_total').reduce((s, e) => s + (e.amount ?? 0), 0)
  const beko1Brutto   = entries.filter(e => e.entry_type === 'beko1_brutto'   || e.entry_type === 'beko_total').reduce((s, e) => s + (e.amount ?? 0), 0)
  const beko2Brutto   = entries.filter(e => e.entry_type === 'beko2_brutto').reduce((s, e) => s + (e.amount ?? 0), 0)
  const menuluxKdv    = entries.filter(e => e.entry_type === 'menulux_brutto' || e.entry_type === 'menulux_total').reduce((s, e) => s + (e.kdv ?? (e.amount ?? 0) / 11), 0)
  const beko1Kdv      = entries.filter(e => e.entry_type === 'beko1_brutto'   || e.entry_type === 'beko_total').reduce((s, e) => s + (e.kdv ?? (e.amount ?? 0) / 11), 0)

  const navLink = (newPeriod: Period, newOffset: number) =>
    `/management/einnahmen?p=${newPeriod}&o=${newOffset}`

  const isMaxOffset = offset === 0
  const label = periodLabel(period, offset, startDate, endDate)

  // ── Styles ───────────────────────────────────────────────────────
  const card = { background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px', padding: '14px', marginBottom: '10px' }
  const sectionTitle = { fontSize: '12px', fontWeight: '700' as const, color: '#8A7A60', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '10px' }
  const row = (highlight = false) => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid #F5F2EC',
    background: highlight ? '#FFF8EC' : 'transparent',
  })

  const rows: { icon: string; label: string; value: number; sub?: string; color?: string; dim?: boolean }[] = [
    { icon: '💳', label: 'Karte',             value: byPayment.card         ?? 0 },
    { icon: '💵', label: 'Bar offiziell',      value: byPayment.cash         ?? 0 },
    { icon: '👫', label: 'Freunde (Karte)',    value: byPayment.friends_card ?? 0 },
    { icon: '🤝', label: 'Freunde (Bar)',      value: byPayment.schwarz_bar  ?? 0, sub: 'inoffiziell', color: '#2E7D32' },
    { icon: '🎁', label: 'Freunde (gratis)',   value: byPayment.schwarz      ?? 0, sub: 'Warenwert, kein Umsatz', color: '#8A7A60', dim: true },
    { icon: '🏠', label: 'Privat',             value: privatWarenwert,             sub: 'Warenwert, kein Umsatz', color: '#8A7A60', dim: true },
    { icon: '🎀', label: 'Verschenkte Posten', value: gratisPosten,                sub: 'Aufs Haus', color: '#8A7A60', dim: true },
  ].filter(r => r.value > 0)

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F4F0' }}>

      {/* Header */}
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '700', color: '#B8882A' }}>📊 Einnahmen</h1>
          <Link href="/management">
            <button style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>← Management</button>
          </Link>
        </div>

        {/* Zeitraum-Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          {PERIODS.map(p => (
            <Link key={p.key} href={navLink(p.key, 0)} style={{ textDecoration: 'none', flex: 1 }}>
              <div style={{
                textAlign: 'center', padding: '7px 4px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                background: period === p.key ? '#B8882A' : '#F5F2EC',
                color: period === p.key ? '#FFFFFF' : '#5A5040',
                border: `1px solid ${period === p.key ? '#B8882A' : '#E5E0D8'}`,
                cursor: 'pointer',
              }}>{p.label}</div>
            </Link>
          ))}
        </div>

        {/* Zeitraum-Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={navLink(period, offset - 1)}>
            <button style={{ background: '#F5F2EC', border: '1px solid #E5E0D8', color: '#5A5040', padding: '5px 10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>←</button>
          </Link>
          <span style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#1A1207' }}>{label}</span>
          <Link href={navLink(period, offset + 1)}>
            <button style={{ background: '#F5F2EC', border: '1px solid #E5E0D8', color: isMaxOffset ? '#D0C8BE' : '#5A5040', padding: '5px 10px', borderRadius: '8px', fontSize: '13px', cursor: isMaxOffset ? 'default' : 'pointer', opacity: isMaxOffset ? 0.4 : 1 }} disabled={isMaxOffset}>→</button>
          </Link>
          {offset !== 0 && (
            <Link href={navLink(period, 0)}>
              <button style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Jetzt</button>
            </Link>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
          {[
            { label: 'Offiziell', value: fmt(officialRevenue) + ' ₺', color: '#B8882A' },
            { label: 'Bestellungen', value: nonPrivat.length.toString(), color: '#1A1207' },
            { label: 'Gäste (ca.)', value: guestCount.toString(), color: '#1A1207' },
          ].map(k => (
            <div key={k.label} style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '10px', color: '#8A7A60', marginTop: '2px' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Einnahmen nach Zahlungsart */}
        <div style={card}>
          <div style={sectionTitle}>Einnahmen nach Zahlungsart</div>
          {rows.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#8A7A60', textAlign: 'center', padding: '16px 0' }}>Keine Daten für diesen Zeitraum</p>
          ) : (
            rows.map(r => (
              <div key={r.label} style={row()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{r.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', color: r.dim ? '#8A7A60' : '#1A1207', fontWeight: '600' }}>{r.label}</div>
                    {r.sub && <div style={{ fontSize: '10px', color: '#B0A898' }}>{r.sub}</div>}
                  </div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: r.color ?? '#B8882A', textDecoration: r.dim ? 'line-through' : 'none', opacity: r.dim ? 0.7 : 1 }}>
                  {fmt(r.value)} ₺
                </span>
              </div>
            ))
          )}

          {/* Zusammenfassung */}
          {(officialRevenue > 0 || schwarzTotal > 0) && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #E8C878' }}>
              {officialRevenue > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', color: '#B8882A', padding: '2px 0' }}>
                  <span>Gesamt offiziell</span>
                  <span>{fmt(officialRevenue)} ₺</span>
                </div>
              )}
              {schwarzTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#2E7D32', padding: '2px 0' }}>
                  <span>Freunde gesamt (inoffiziell)</span>
                  <span>{fmt(schwarzTotal)} ₺</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menulux + Beko */}
        {(menuluxBrutto > 0 || beko1Brutto > 0 || beko2Brutto > 0) && (
          <div style={card}>
            <div style={sectionTitle}>Gerätekasse</div>
            {[
              { label: '🍽️ Menulux', brutto: menuluxBrutto, kdv: menuluxKdv },
              { label: '🏦 Beko 1',   brutto: beko1Brutto,   kdv: beko1Kdv },
              { label: '🏦 Beko 2',   brutto: beko2Brutto,   kdv: beko2Brutto / 11 },
            ].filter(r => r.brutto > 0).map(r => (
              <div key={r.label} style={row()}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1207' }}>{r.label}</div>
                  <div style={{ fontSize: '11px', color: '#8A7A60' }}>
                    Net: {fmt(r.brutto - r.kdv)} ₺ · KDV: {fmt(r.kdv)} ₺
                  </div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#B8882A' }}>{fmt(r.brutto)} ₺</span>
              </div>
            ))}
            {(menuluxBrutto + beko1Brutto + beko2Brutto) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', color: '#B8882A', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E8C878' }}>
                <span>Gesamt Gerätekasse</span>
                <span>{fmt(menuluxBrutto + beko1Brutto + beko2Brutto)} ₺</span>
              </div>
            )}
          </div>
        )}

        {/* Privat */}
        {privatWarenwert > 0 && (
          <div style={{ background: '#F5F2EC', border: '1px solid #E5E0D8', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
            <div style={sectionTitle}>Privat (nicht im Umsatz)</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#8A7A60', fontWeight: '600' }}>
              <span>🏠 {privat.length} Privat-Essen</span>
              <span style={{ textDecoration: 'line-through' }}>{fmt(privatWarenwert)} ₺</span>
            </div>
          </div>
        )}

        {/* Differenz App ↔ Gerätekasse */}
        {(menuluxBrutto > 0 || beko1Brutto > 0 || beko2Brutto > 0) && (
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px',
            padding: '14px', marginBottom: '10px',
          }}>
            <div style={sectionTitle}>📐 Differenz App ↔ Gerätekasse</div>
            {(() => {
              const geraetTotal = menuluxBrutto + beko1Brutto + beko2Brutto
              const diff = geraetTotal - officialRevenue
              const isOver = diff > 0
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0', borderBottom: '1px solid #F5F2EC' }}>
                    <span style={{ color: '#5A5040' }}>📱 App (offiziell)</span>
                    <span style={{ fontWeight: '600', color: '#B8882A' }}>{fmt(officialRevenue)} ₺</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0', borderBottom: '1px solid #F5F2EC' }}>
                    <span style={{ color: '#5A5040' }}>🏦 Gerätekasse gesamt</span>
                    <span style={{ fontWeight: '600', color: '#1A1207' }}>{fmt(geraetTotal)} ₺</span>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: '15px',
                    fontWeight: '800', marginTop: '8px', paddingTop: '8px',
                    borderTop: '2px solid #E5E0D8',
                    color: diff === 0 ? '#2E7D32' : '#C62828',
                  }}>
                    <span>Differenz</span>
                    <span>{diff > 0 ? '+' : ''}{fmt(diff)} ₺</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '6px' }}>
                    {diff === 0 && '✅ App und Gerätekasse stimmen überein'}
                    {isOver && diff > 0 && `⚠️ ${fmt(diff)} ₺ in Gerätekasse aber nicht in App erfasst`}
                    {!isOver && diff < 0 && `ℹ️ App zeigt ${fmt(Math.abs(diff))} ₺ mehr als Gerätekasse`}
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Link zu Bestellungen */}
        <Link href={`/management/uebersicht?date=${startDate}`} style={{ textDecoration: 'none' }}>
          <div style={{ background: '#EEF4FF', border: '1px solid #90CAF9', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1565C0' }}>🗂️ Bestellungen bearbeiten</span>
            <span style={{ color: '#1565C0' }}>→</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
