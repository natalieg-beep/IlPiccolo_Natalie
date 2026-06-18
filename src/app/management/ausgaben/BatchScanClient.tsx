'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Typen ─────────────────────────────────────────────────────────────────────

interface FileResult {
  filename: string | null
  receipt_id: string | null
  item_count: number
  duplicate: boolean
  error: string | null
}

interface BatchResult {
  processed: number
  results: FileResult[]
}

type Phase = 'idle' | 'uploading' | 'done' | 'error'

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

async function fileToBase64(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Fotos: client-seitig auf 1400px komprimieren
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 1400
        let w = img.width, h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX }
          else { w = Math.round(w * MAX / h); h = MAX }
        }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(dataUrl.split(',')[1])
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

// ── Komponente ────────────────────────────────────────────────────────────────

export default function BatchScanClient() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [files, setFiles] = useState<File[]>([])
  const [batchId, setBatchId] = useState<string | null>(null)
  const [processed, setProcessed] = useState(0)
  const [total, setTotal] = useState(0)
  const [allResults, setAllResults] = useState<FileResult[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()
  const EDGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scan-batch`
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles(selected)
    setPhase('idle')
    setAllResults([])
    setErrorMsg(null)
  }

  async function startBatch() {
    if (files.length === 0) return
    setPhase('uploading')
    setProcessed(0)
    setTotal(files.length)
    setAllResults([])
    setErrorMsg(null)

    // 1. scan_batch anlegen
    const { data: batch, error: batchErr } = await supabase
      .from('scan_batches')
      .insert({ total_files: files.length, processed_files: 0, status: 'scanning' })
      .select('id')
      .single()

    if (batchErr || !batch) {
      setErrorMsg(`Batch anlegen fehlgeschlagen: ${batchErr?.message}`)
      setPhase('error')
      return
    }
    setBatchId(batch.id)

    // 2. Dateien einzeln verarbeiten (1 pro Edge-Function-Aufruf — PDFs können groß sein)
    const chunks = chunkArray(files, 1)
    const accumulated: FileResult[] = []

    for (const chunk of chunks) {
      // Base64 parallel konvertieren
      let payloadFiles: { base64: string; type: string; filename: string }[]
      try {
        payloadFiles = await Promise.all(
          chunk.map(async (f) => ({
            base64: await fileToBase64(f),
            type: f.type || 'application/pdf',
            filename: f.name,
          }))
        )
      } catch (convErr) {
        setErrorMsg(`Datei-Konvertierung fehlgeschlagen: ${convErr}`)
        setPhase('error')
        return
      }

      // Edge Function aufrufen — Fehler pro Datei loggen, NICHT abbrechen
      let batchResult: BatchResult
      try {
        const res = await fetch(EDGE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`,
          },
          body: JSON.stringify({ batch_id: batch.id, files: payloadFiles }),
        })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`)
        }
        batchResult = await res.json()
      } catch (fetchErr) {
        // Fehler für diese Datei(en) als Error-Ergebnis eintragen — Batch läuft weiter
        const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
        const errorResults: FileResult[] = chunk.map(f => ({
          filename: f.name, receipt_id: null, item_count: 0, duplicate: false, error: errMsg,
        }))
        accumulated.push(...errorResults)
        setAllResults([...accumulated])
        setProcessed(p => p + chunk.length)
        continue  // nächste Datei
      }

      accumulated.push(...batchResult.results)
      setAllResults([...accumulated])
      setProcessed(p => p + chunk.length)
    }

    setPhase('done')
  }

  function reset() {
    setPhase('idle')
    setFiles([])
    setBatchId(null)
    setProcessed(0)
    setTotal(0)
    setAllResults([])
    setErrorMsg(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Auswertung der Ergebnisse ──────────────────────────────────────────────
  const countOK        = allResults.filter(r => !r.error && !r.duplicate).length
  const countDuplicate = allResults.filter(r => r.duplicate).length
  const countError     = allResults.filter(r => r.error && !r.duplicate).length
  const totalItems     = allResults.reduce((s, r) => s + r.item_count, 0)
  const progress       = total > 0 ? Math.round((processed / total) * 100) : 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '16px' }}>

      {/* Datei-Auswahl */}
      <div style={{
        background: '#FFF', borderRadius: '14px', padding: '20px', marginBottom: '16px',
        border: '2px dashed #D4B483', textAlign: 'center',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📥</div>
        <p style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#1A1207' }}>
          Rechnungen Batch-Upload
        </p>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#666' }}>
          PDFs und Fotos auf einmal — Claude scannt alle automatisch
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="batch-file-input"
        />
        <label htmlFor="batch-file-input" style={{
          display: 'inline-block', background: '#B8882A', color: '#FFF',
          padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
          fontSize: '14px', fontWeight: 700,
        }}>
          📁 Dateien wählen
        </label>
        {files.length > 0 && (
          <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#1A1207', fontWeight: 600 }}>
            {files.length} Datei{files.length !== 1 ? 'en' : ''} ausgewählt
          </p>
        )}
      </div>

      {/* Dateiliste (bei kleiner Auswahl) */}
      {files.length > 0 && files.length <= 20 && phase === 'idle' && (
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
          {files.map((f, i) => (
            <div key={i} style={{ fontSize: '12px', color: '#555', padding: '3px 0', borderBottom: i < files.length - 1 ? '1px solid #F0EDE8' : 'none' }}>
              {f.type === 'application/pdf' ? '📄' : '🖼️'} {f.name}
            </div>
          ))}
        </div>
      )}

      {/* Start-Button */}
      {files.length > 0 && phase === 'idle' && (
        <button onClick={startBatch} style={{
          width: '100%', background: '#1A1207', color: '#FFF', border: 'none',
          borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: 800, cursor: 'pointer',
        }}>
          🚀 Batch starten — {files.length} Datei{files.length !== 1 ? 'en' : ''} scannen
        </button>
      )}

      {/* Fortschritt */}
      {(phase === 'uploading' || phase === 'done') && (
        <div style={{ background: '#FFF', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1207' }}>
              {phase === 'uploading' ? '⏳ Scanne...' : '✅ Abgeschlossen'}
            </span>
            <span style={{ fontSize: '14px', color: '#B8882A', fontWeight: 700 }}>
              {processed} / {total}
            </span>
          </div>

          {/* Fortschrittsbalken */}
          <div style={{ background: '#F0EDE8', borderRadius: '8px', height: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{
              height: '100%', borderRadius: '8px',
              background: phase === 'done' ? '#2D6A2D' : '#B8882A',
              width: `${progress}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Zwischenergebnis */}
          {allResults.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#2D6A2D', fontWeight: 600 }}>✅ {countOK} neu</span>
              {countDuplicate > 0 && <span style={{ fontSize: '13px', color: '#B8882A', fontWeight: 600 }}>⏭️ {countDuplicate} Duplikat{countDuplicate !== 1 ? 'e' : ''}</span>}
              {countError > 0 && <span style={{ fontSize: '13px', color: '#C0392B', fontWeight: 600 }}>❌ {countError} Fehler</span>}
              <span style={{ fontSize: '13px', color: '#555' }}>📦 {totalItems} Positionen</span>
            </div>
          )}
        </div>
      )}

      {/* Fehler */}
      {phase === 'error' && errorMsg && (
        <div style={{ background: '#FFF0F0', border: '1px solid #C0392B', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#C0392B', fontWeight: 600 }}>❌ Fehler</p>
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#C0392B' }}>{errorMsg}</p>
          <button onClick={reset} style={{ marginTop: '12px', background: '#C0392B', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
            Neu versuchen
          </button>
        </div>
      )}

      {/* Zusammenfassung nach Abschluss */}
      {phase === 'done' && (
        <>
          <div style={{ background: '#F0FFF0', border: '1px solid #2D6A2D', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 800, color: '#1A1207' }}>
              🎉 Batch abgeschlossen
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#FFF', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#2D6A2D' }}>{countOK}</div>
                <div style={{ fontSize: '11px', color: '#555' }}>neu gescannt</div>
              </div>
              <div style={{ background: '#FFF', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#1A1207' }}>{totalItems}</div>
                <div style={{ fontSize: '11px', color: '#555' }}>Positionen gesamt</div>
              </div>
              {countDuplicate > 0 && (
                <div style={{ background: '#FFF', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#B8882A' }}>{countDuplicate}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>Duplikate übersprungen</div>
                </div>
              )}
              {countError > 0 && (
                <div style={{ background: '#FFF8F8', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#C0392B' }}>{countError}</div>
                  <div style={{ fontSize: '11px', color: '#C0392B' }}>Fehler</div>
                </div>
              )}
            </div>
            {batchId && (
              <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#999', fontFamily: 'monospace' }}>
                Batch-ID: {batchId.slice(0, 8)}…
              </p>
            )}
            <p style={{ margin: 0, fontSize: '13px', color: '#2D6A2D', fontWeight: 600 }}>
              Nächster Schritt: Positionen kategorisieren (kommt bald → Tab "📋 Kategorisieren")
            </p>
          </div>

          {/* Detailliste bei Fehlern */}
          {countError > 0 && (
            <div style={{ background: '#FFF', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#C0392B' }}>❌ Fehlerhafte Dateien:</p>
              {allResults.filter(r => r.error && !r.duplicate).map((r, i) => (
                <div key={i} style={{ fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #F0EDE8', color: '#C0392B' }}>
                  <span style={{ fontWeight: 600 }}>{r.filename ?? '(unbekannt)'}</span>
                  <br />
                  <span style={{ color: '#999' }}>{r.error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Detailliste Duplikate */}
          {countDuplicate > 0 && (
            <div style={{ background: '#FFF', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#B8882A' }}>⏭️ Duplikate (bereits vorhanden):</p>
              {allResults.filter(r => r.duplicate).map((r, i) => (
                <div key={i} style={{ fontSize: '12px', padding: '4px 0', color: '#B8882A' }}>
                  {r.filename ?? '(unbekannt)'}
                </div>
              ))}
            </div>
          )}

          <button onClick={reset} style={{
            width: '100%', background: '#F0EDE8', color: '#1A1207', border: 'none',
            borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          }}>
            ↩ Weitere Dateien scannen
          </button>
        </>
      )}
    </div>
  )
}
