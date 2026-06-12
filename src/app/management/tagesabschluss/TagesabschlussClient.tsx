'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Entry = { id: string; entry_type: string; amount: number | null; kdv: number | null; note: string | null }

function addDays(d: string, n: number) {
  const dt = new Date(d); dt.setDate(dt.getDate() + n)
  return dt.toISOString().slice(0, 10)
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function kdvAuto(brutto: string) {
  const n = parseFloat(brutto.replace(',', '.'))
  if (!n) return ''
  return (n / 11).toFixed(2)
}
function netAuto(brutto: string, kdv: string) {
  const b = parseFloat(brutto.replace(',', '.')) || 0
  const k = parseFloat(kdv.replace(',', '.')) || 0
  return (b - k).toFixed(2)
}

const inp = (highlight: boolean) => ({
  width: '100%', background: '#F5F2EC',
  border: `1px solid ${highlight ? '#B8882A' : '#E5E0D8'}`,
  borderRadius: '8px', padding: '10px 12px',
  fontSize: '15px', color: '#1A1207', outline: 'none',
})
const inpSm = (highlight: boolean) => ({
  ...inp(highlight), fontSize: '13px', padding: '8px 12px',
})

function BruttoKdvBlock({
  label, icon, brutto, kdv, setBrutto, setKdv,
}: {
  label: string; icon: string
  brutto: string; kdv: string
  setBrutto: (v: string) => void; setKdv: (v: string) => void
}) {
  const net = netAuto(brutto, kdv)
  const S = {
    section: { background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px', padding: '14px', marginBottom: '12px' },
    sectionTitle: { fontSize: '13px', fontWeight: '700', color: '#B8882A', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' },
    row: { display: 'flex', gap: '8px', marginBottom: '6px' },
    label: { fontSize: '11px', color: '#8A7A60', marginBottom: '4px', fontWeight: '600' },
  }
  function handleBrutto(val: string) {
    setBrutto(val)
    setKdv(kdvAuto(val))
  }
  return (
    <div style={S.section}>
      <div style={S.sectionTitle as React.CSSProperties}>{icon} {label}</div>
      <div style={S.row as React.CSSProperties}>
        <div style={{ flex: 2 }}>
          <div style={S.label}>Brutto (inkl. KDV)</div>
          <input type="number" min="0" step="0.01" placeholder="z.B. 6271"
            value={brutto}
            onChange={e => handleBrutto(e.target.value)}
            style={inp(!!brutto)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={S.label}>KDV (÷11, änderbar)</div>
          <input type="number" min="0" step="0.01" placeholder="auto"
            value={kdv}
            onChange={e => setKdv(e.target.value)}
            style={inpSm(!!kdv)}
          />
        </div>
      </div>
      {brutto && (
        <div style={{ fontSize: '12px', color: '#8A7A60', marginTop: '4px' }}>
          Net (ohne KDV): <strong style={{ color: '#1A1207' }}>{parseFloat(net).toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</strong>
        </div>
      )}
    </div>
  )
}

export default function TagesabschlussClient({
  date, initialEntries, schwarzBarFromOrders, appRevenue,
}: {
  date: string
  initialEntries: Entry[]
  schwarzBarFromOrders: number
  appRevenue: number
}) {
  const supabase = createClient()
  const today    = new Date().toISOString().slice(0, 10)
  const isToday  = date === today

  // ── State für jede Quelle ─────────────────────────────────────────
  const [menuluxBrutto, setMenuluxBrutto] = useState('')
  const [menuluxKdv,    setMenuluxKdv]    = useState('')

  const [beko1Brutto, setBeko1Brutto] = useState('')
  const [beko1Kdv,    setBeko1Kdv]    = useState('')

  const [beko2Brutto, setBeko2Brutto] = useState('')
  const [beko2Kdv,    setBeko2Kdv]    = useState('')

  const [barOffiziell, setBarOffiziell] = useState('')

  const [trinkgeld,             setTrinkgeld]             = useState('')

  const [entnahmePrivat,        setEntnahmePrivat]        = useState('')
  const [entnahmePrivatNote,    setEntnahmePrivatNote]    = useState('')
  const [entnahmeGeschaeft,     setEntnahmeGeschaeft]     = useState('')
  const [entnahmeGeschaeftNote, setEntnahmeGeschaeftNote] = useState('')

  const [ids,   setIds]   = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  // ── Lade bestehende Einträge ──────────────────────────────────────
  useEffect(() => {
    const newIds: Record<string, string> = {}
    ;(initialEntries ?? []).forEach(e => {
      newIds[e.entry_type] = e.id
      const amt = e.amount?.toString() ?? ''
      const kdv = e.kdv?.toString() ?? ''
      if (e.entry_type === 'menulux_brutto' || e.entry_type === 'menulux_total') {
        setMenuluxBrutto(amt); setMenuluxKdv(kdv || kdvAuto(amt))
      }
      if (e.entry_type === 'beko1_brutto' || e.entry_type === 'beko_total') {
        setBeko1Brutto(amt); setBeko1Kdv(kdv || kdvAuto(amt))
      }
      if (e.entry_type === 'beko2_brutto') {
        setBeko2Brutto(amt); setBeko2Kdv(kdv || kdvAuto(amt))
      }
      if (e.entry_type === 'bar_offiziell')     setBarOffiziell(amt)
      if (e.entry_type === 'trinkgeld')         setTrinkgeld(amt)
      if (e.entry_type === 'entnahme_privat')   { setEntnahmePrivat(amt); setEntnahmePrivatNote(e.note ?? '') }
      if (e.entry_type === 'entnahme_geschaeft'){ setEntnahmeGeschaeft(amt); setEntnahmeGeschaeftNote(e.note ?? '') }
    })
    setIds(newIds)
  }, [initialEntries])

  // ── Auto-KDV wenn Brutto geändert ────────────────────────────────
  function handleBrutto(setter: (v: string) => void, kdvSetter: (v: string) => void, val: string) {
    setter(val)
    kdvSetter(kdvAuto(val))
  }

  // ── Speichern ────────────────────────────────────────────────────
  async function save() {
    async function upsert(type: string, amount: number, extra?: { kdv?: number; note?: string | null }) {
      const existingId = ids[type]
      const payload: Record<string, unknown> = { amount, ...extra }
      if (existingId) {
        await supabase.from('daily_entries').update(payload).eq('id', existingId)
        return existingId
      } else {
        const { data } = await supabase.from('daily_entries')
          .insert({ date, entry_type: type, ...payload }).select('id').single()
        return data?.id as string | undefined
      }
    }

    const results = await Promise.all([
      upsert('menulux_brutto', parseFloat(menuluxBrutto) || 0, { kdv: parseFloat(menuluxKdv) || 0 }),
      upsert('beko1_brutto',   parseFloat(beko1Brutto)   || 0, { kdv: parseFloat(beko1Kdv)   || 0 }),
      upsert('beko2_brutto',   parseFloat(beko2Brutto)   || 0, { kdv: parseFloat(beko2Kdv)   || 0 }),
      upsert('bar_offiziell',  parseFloat(barOffiziell)  || 0),
      upsert('trinkgeld',          parseFloat(trinkgeld)        || 0),
      upsert('entnahme_privat',   parseFloat(entnahmePrivat)   || 0, { note: entnahmePrivatNote || null }),
      upsert('entnahme_geschaeft',parseFloat(entnahmeGeschaeft)|| 0, { note: entnahmeGeschaeftNote || null }),
    ])

    const types = ['menulux_brutto','beko1_brutto','beko2_brutto','bar_offiziell','trinkgeld','entnahme_privat','entnahme_geschaeft']
    const newIds = { ...ids }
    results.forEach((id, i) => { if (id) newIds[types[i]] = id })
    setIds(newIds)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ── Berechnungen ─────────────────────────────────────────────────
  // LOGIK: Menulux = Gesamtumsatz (Karte wird dort als Bar gebucht)
  //        Beko = nur Kartenzahlungen (Teilmenge von Menulux, NICHT addieren!)
  //        Bar tatsächlich = Menulux - Beko
  const mlBrutto = parseFloat(menuluxBrutto) || 0
  const b1Brutto = parseFloat(beko1Brutto)   || 0
  const b2Brutto = parseFloat(beko2Brutto)   || 0
  const entPriv  = parseFloat(entnahmePrivat)   || 0
  const entGesch = parseFloat(entnahmeGeschaeft)|| 0

  const mlKdv = parseFloat(menuluxKdv) || 0

  const trinkgeldN     = parseFloat(trinkgeld) || 0
  const bekoKarte      = b1Brutto + b2Brutto              // Kartenzahlungen (Teilmenge)
  const barTatsaechlich = Math.max(0, mlBrutto - bekoKarte) // Bar = Menulux - Beko
  const totalBrutto    = mlBrutto + schwarzBarFromOrders + trinkgeldN  // Menulux ist Gesamt!
  const totalKdv       = mlKdv                             // KDV nur aus Menulux
  const totalNet       = totalBrutto - totalKdv
  const totalEntnahme  = entPriv + entGesch
  const netto          = totalBrutto - totalEntnahme

  const S = {
    section: { background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '12px', padding: '14px', marginBottom: '12px' },
    sectionTitle: { fontSize: '13px', fontWeight: '700', color: '#B8882A', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' },
    row: { display: 'flex', gap: '8px', marginBottom: '6px' },
    label: { fontSize: '11px', color: '#8A7A60', marginBottom: '4px', fontWeight: '600' },
  }



  return (
    <div style={{ minHeight: '100dvh', background: '#F7F4F0' }}>

      {/* Header */}
      <div style={{ background: '#FFFDF9', borderBottom: '1px solid #E5E0D8', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '700', color: '#B8882A' }}>📋 Tagesabschluss</h1>
          <Link href="/management">
            <button style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>← Management</button>
          </Link>
        </div>
        {/* Datum-Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/management/tagesabschluss?date=${addDays(date, -1)}`}>
            <button style={{ background: '#F5F2EC', border: '1px solid #E5E0D8', color: '#5A5040', padding: '5px 10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>←</button>
          </Link>
          <span style={{ flex: 1, textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#1A1207' }}>
            {formatDate(date)}
          </span>
          <Link href={`/management/tagesabschluss?date=${addDays(date, 1)}`}>
            <button style={{ background: '#F5F2EC', border: '1px solid #E5E0D8', color: isToday ? '#D0C8BE' : '#5A5040', padding: '5px 10px', borderRadius: '8px', fontSize: '13px', cursor: isToday ? 'default' : 'pointer', opacity: isToday ? 0.4 : 1 }} disabled={isToday}>→</button>
          </Link>
          {!isToday && (
            <Link href="/management/tagesabschluss">
              <button style={{ background: '#FFF8EC', border: '1px solid #E8C878', color: '#B8882A', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Heute</button>
            </Link>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', paddingBottom: 'calc(160px + env(safe-area-inset-bottom))' }}>

        {/* App-Überblick (read-only) */}
        <div style={{ background: '#FFF8EC', border: '1px solid #E8C878', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#B8882A', marginBottom: '8px' }}>📱 App heute (automatisch)</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#B8882A' }}>{appRevenue.toLocaleString('de-DE')} ₺</div>
              <div style={{ fontSize: '10px', color: '#8A7A60' }}>Offiziell</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#2E7D32' }}>{schwarzBarFromOrders.toLocaleString('de-DE')} ₺</div>
              <div style={{ fontSize: '10px', color: '#8A7A60' }}>Freunde (Bar)</div>
            </div>
          </div>
        </div>

        {/* Menulux */}
        <BruttoKdvBlock
          label="Menulux" icon="🍽️"
          brutto={menuluxBrutto} kdv={menuluxKdv}
          setBrutto={setMenuluxBrutto} setKdv={setMenuluxKdv}
        />

        {/* Beko = Kartenzahlungen */}
        <div style={S.section}>
          <div style={S.sectionTitle}>💳 Beko (= Kartenzahlungen)</div>
          <div style={{ fontSize: '11px', color: '#8A7A60', marginBottom: '8px', background: '#FFF8EC', padding: '6px 10px', borderRadius: '6px' }}>
            ℹ️ Beko erfasst nur Karte — ist eine Teilmenge von Menulux, wird nicht addiert
          </div>
          <div style={S.row as React.CSSProperties}>
            <div style={{ flex: 1 }}>
              <div style={S.label}>Beko 1 Brutto</div>
              <input type="number" min="0" step="0.01" placeholder="z.B. 6271"
                value={beko1Brutto} onChange={e => handleBrutto(setBeko1Brutto, setBeko1Kdv, e.target.value)}
                style={inp(!!beko1Brutto)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={S.label}>Beko 2 Brutto</div>
              <input type="number" min="0" step="0.01" placeholder="optional"
                value={beko2Brutto} onChange={e => handleBrutto(setBeko2Brutto, setBeko2Kdv, e.target.value)}
                style={inp(!!beko2Brutto)}
              />
            </div>
          </div>
          {mlBrutto > 0 && (b1Brutto > 0 || b2Brutto > 0) && (
            <div style={{ marginTop: '8px', padding: '8px', background: '#F0FAF0', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#5A5040' }}>💳 Karte (Beko gesamt)</span>
                <span style={{ fontWeight: '700', color: '#1565C0' }}>{(b1Brutto + b2Brutto).toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: '#5A5040' }}>💵 Bar tatsächlich (Menulux − Beko)</span>
                <span style={{ fontWeight: '700', color: '#2E7D32' }}>{barTatsaechlich.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</span>
              </div>
            </div>
          )}
        </div>

        {/* Trinkgeld */}
        <div style={S.section}>
          <div style={S.sectionTitle}>🙏 Trinkgeld</div>
          <div style={S.label}>Betrag in ₺</div>
          <input type="number" min="0" placeholder="z.B. 150"
            value={trinkgeld} onChange={e => setTrinkgeld(e.target.value)}
            style={inp(!!trinkgeld)}
          />
        </div>

        {/* Bar Freunde (aus App) */}
        <div style={{ background: '#F0FAF0', border: '1px solid #A5D6A7', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#2E7D32', marginBottom: '4px' }}>🤝 Bar Freunde (aus App)</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#2E7D32' }}>{schwarzBarFromOrders.toLocaleString('de-DE')} ₺</div>
          <div style={{ fontSize: '11px', color: '#8A7A60', marginTop: '2px' }}>Automatisch aus Bestellungen (schwarz_bar)</div>
        </div>

        {/* Entnahmen */}
        <div style={S.section}>
          <div style={S.sectionTitle}>📤 Entnahmen</div>
          <div style={{ marginBottom: '10px' }}>
            <div style={S.label}>🏠 Privat-Entnahme</div>
            <input type="number" min="0" placeholder="Betrag in ₺"
              value={entnahmePrivat} onChange={e => setEntnahmePrivat(e.target.value)}
              style={{ ...inp(!!entnahmePrivat), marginBottom: '5px' }}
            />
            <input type="text" placeholder="Notiz (optional)"
              value={entnahmePrivatNote} onChange={e => setEntnahmePrivatNote(e.target.value)}
              style={inpSm(!!entnahmePrivatNote)}
            />
          </div>
          <div>
            <div style={S.label}>💼 Geschäftliche Entnahme</div>
            <input type="number" min="0" placeholder="Betrag in ₺"
              value={entnahmeGeschaeft} onChange={e => setEntnahmeGeschaeft(e.target.value)}
              style={{ ...inp(!!entnahmeGeschaeft), marginBottom: '5px' }}
            />
            <input type="text" placeholder="Notiz (optional)"
              value={entnahmeGeschaeftNote} onChange={e => setEntnahmeGeschaeftNote(e.target.value)}
              style={inpSm(!!entnahmeGeschaeftNote)}
            />
          </div>
        </div>

        {/* Zusammenfassung */}
        {mlBrutto > 0 && (
          <div style={{ background: '#FFFFFF', border: '2px solid #B8882A', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#B8882A', marginBottom: '10px' }}>📊 Zusammenfassung</div>

            {/* Menulux = Gesamt */}
            <div style={{ fontSize: '13px', padding: '5px 0', borderBottom: '1px solid #F0EDE8', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#5A5040', fontWeight: '600' }}>🍽️ Menulux (Gesamtumsatz)</span>
              <span style={{ fontWeight: '700', color: '#B8882A' }}>
                {mlBrutto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺
                {mlKdv > 0 && <span style={{ color: '#8A7A60', fontSize: '11px', marginLeft: '6px' }}>KDV: {mlKdv.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>}
              </span>
            </div>

            {/* Aufschlüsselung Karte / Bar */}
            {bekoKarte > 0 && (
              <>
                <div style={{ fontSize: '12px', padding: '3px 0 3px 12px', display: 'flex', justifyContent: 'space-between', color: '#5A5040' }}>
                  <span>↳ 💳 davon Karte (Beko)</span>
                  <span style={{ fontWeight: '600', color: '#1565C0' }}>{bekoKarte.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</span>
                </div>
                <div style={{ fontSize: '12px', padding: '3px 0 3px 12px', borderBottom: '1px solid #F0EDE8', display: 'flex', justifyContent: 'space-between', color: '#5A5040' }}>
                  <span>↳ 💵 davon Bar</span>
                  <span style={{ fontWeight: '600', color: '#2E7D32' }}>{barTatsaechlich.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</span>
                </div>
              </>
            )}

            {/* Zusätzlich */}
            {schwarzBarFromOrders > 0 && (
              <div style={{ fontSize: '13px', padding: '3px 0', borderBottom: '1px solid #F0EDE8', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#5A5040' }}>🤝 Bar Freunde (inoffiziell)</span>
                <span style={{ fontWeight: '600', color: '#2E7D32' }}>{schwarzBarFromOrders.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</span>
              </div>
            )}
            {trinkgeldN > 0 && (
              <div style={{ fontSize: '13px', padding: '3px 0', borderBottom: '1px solid #F0EDE8', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#5A5040' }}>🙏 Trinkgeld</span>
                <span style={{ fontWeight: '600', color: '#1A1207' }}>{trinkgeldN.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</span>
              </div>
            )}

            {/* Gesamt */}
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '2px solid #E8C878' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: '#B8882A' }}>
                <span>Gesamt Einnahmen</span>
                <span>{totalBrutto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</span>
              </div>
              {totalKdv > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8A7A60', marginTop: '3px' }}>
                  <span>davon KDV (Menulux)</span>
                  <span>{totalKdv.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#1A1207', marginTop: '3px' }}>
                <span>Net (ohne KDV)</span>
                <span>{totalNet.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</span>
              </div>
            </div>

            {/* Entnahmen */}
            {totalEntnahme > 0 && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F5F2EC' }}>
                {[
                  { label: '🏠 Privat-Entnahme',     value: entPriv },
                  { label: '💼 Geschäftl. Entnahme',  value: entGesch },
                ].filter(r => r.value > 0).map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '2px 0', color: '#C62828' }}>
                    <span>{r.label}</span>
                    <span>−{r.value.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: '800', marginTop: '6px', paddingTop: '6px', borderTop: '2px solid #E5E0D8', color: netto >= 0 ? '#2E7D32' : '#C62828' }}>
                  <span>Netto</span>
                  <span>{netto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺</span>
                </div>
              </div>
            )}

            {/* Differenz App ↔ Menulux */}
            {appRevenue > 0 && (
              <div style={{ marginTop: '8px', padding: '8px', background: '#F5F2EC', borderRadius: '8px', fontSize: '12px', color: '#8A7A60' }}>
                Differenz App ↔ Menulux: {Math.abs(appRevenue - mlBrutto).toLocaleString('de-DE', { minimumFractionDigits: 2 })} ₺
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Save Bar */}
      <div style={{ position: 'fixed', bottom: 'calc(56px + env(safe-area-inset-bottom))', left: 0, right: 0, background: '#FFFDF9', borderTop: `2px solid ${saved ? '#4CAF50' : '#B8882A'}`, padding: '12px 16px', zIndex: 1001, boxShadow: '0 -2px 12px rgba(0,0,0,0.08)', transition: 'border-color 0.3s' }}>
        <button onClick={save} style={{
          width: '100%', background: saved ? '#4CAF50' : '#B8882A',
          color: '#FFFFFF', border: 'none', borderRadius: '10px',
          padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
          transition: 'background 0.3s',
        }}>
          {saved ? '✓ Gespeichert!' : '💾 Tagesabschluss speichern'}
        </button>
      </div>
    </div>
  )
}
