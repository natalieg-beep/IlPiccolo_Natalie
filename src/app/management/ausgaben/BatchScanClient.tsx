'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FileResult {
  path: string
  filename: string
  receipt_id: string | null
  item_count: number
  duplicate: boolean
  error: string | null
}

type Phase = 'idle' | 'uploading' | 'scanning' | 'done' | 'error'

const EDGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scan-batch`
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BUCKET = 'receipts-pdfs'

export default function BatchScanClient() {
  const [phase, setPhase]         = useState<Phase>('idle')
  const [files, setFiles]         = useState<File[]>([])
  const [batchId, setBatchId]     = useState<string | null>(null)
  const [uploadDone, setUploadDone] = useState(0)
  const [scanDone, setScanDone]   = useState(0)
  const [total, setTotal]         = useState(0)
  const [results, setResults]     = useState<FileResult[]>([])
  const [errorMsg, setErrorMsg]   = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const db = createClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []))
    setPhase('idle'); setResults([]); setErrorMsg(null)
  }

  async function startBatch() {
    if (files.length === 0) return
    setPhase('uploading')
    setUploadDone(0); setScanDone(0); setTotal(files.length); setResults([])

    // 1. scan_batch anlegen
    const { data: batch, error: batchErr } = await db
      .from('scan_batches')
      .insert({ total_files: files.length, processed_files: 0, status: 'scanning' })
      .select('id').single()

    if (batchErr || !batch) {
      setErrorMsg(`Batch anlegen fehlgeschlagen: ${batchErr?.message}`)
      setPhase('error'); return
    }
    setBatchId(batch.id)

    // 2. Alle Dateien nacheinander hochladen (kein base64 im Browser nötig)
    const uploadedPaths: string[] = []
    for (const file of files) {
      const path = `${batch.id}/${file.name}`
      const { error: upErr } = await db.storage.from(BUCKET).upload(path, file, { upsert: true })
      if (upErr) {
        // Upload-Fehler loggen, aber weitermachen
        setResults(prev => [...prev, { path, filename: file.name, receipt_id: null, item_count: 0, duplicate: false, error: `Upload: ${upErr.message}` }])
      } else {
        uploadedPaths.push(path)
      }
      setUploadDone(p => p + 1)
    }

    if (uploadedPaths.length === 0) {
      setErrorMsg('Kein Upload erfolgreich.')
      setPhase('error'); return
    }

    // 3. Scan starten — Edge Function liest Dateien aus Storage
    setPhase('scanning')

    // In Gruppen à 5 zur Edge Function schicken (nur Pfade, keine Dateien!)
    const chunks: string[][] = []
    for (let i = 0; i < uploadedPaths.length; i += 5) chunks.push(uploadedPaths.slice(i, i + 5))

    const accumulated: FileResult[] = results.slice() // Upload-Fehler übernehmen

    for (const chunk of chunks) {
      try {
        const res = await fetch(EDGE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
          body: JSON.stringify({ batch_id: batch.id, storage_paths: chunk }),
        })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`)
        }
        const data = await res.json()
        const chunkResults: FileResult[] = (data.results ?? []).map((r: { path: string; receipt_id: string | null; item_count: number; duplicate: boolean; error: string | null }) => ({
          ...r,
          filename: r.path.split('/').pop() ?? r.path,
        }))
        accumulated.push(...chunkResults)
        setResults([...accumulated])
        setScanDone(p => p + chunk.length)
      } catch (err) {
        // Edge Function Fehler → alle Dateien dieses Chunks als Fehler markieren
        for (const p of chunk) {
          accumulated.push({ path: p, filename: p.split('/').pop() ?? p, receipt_id: null, item_count: 0, duplicate: false, error: err instanceof Error ? err.message : String(err) })
        }
        setResults([...accumulated])
        setScanDone(p => p + chunk.length)
      }
    }

    setPhase('done')
  }

  function reset() {
    setPhase('idle'); setFiles([]); setBatchId(null)
    setUploadDone(0); setScanDone(0); setTotal(0)
    setResults([]); setErrorMsg(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const countOK        = results.filter(r => !r.error && !r.duplicate).length
  const countDuplicate = results.filter(r => r.duplicate).length
  const countError     = results.filter(r => !!r.error).length
  const totalItems     = results.reduce((s, r) => s + r.item_count, 0)

  // Fortschritt je nach Phase
  const uploadPct = total > 0 ? Math.round((uploadDone / total) * 100) : 0
  const scanPct   = total > 0 ? Math.round((scanDone  / total) * 100) : 0

  return (
    <div style={{ padding: '16px' }}>

      {/* Datei-Auswahl */}
      <div style={{ background: '#FFF', borderRadius: '14px', padding: '20px', marginBottom: '16px', border: '2px dashed #D4B483', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📥</div>
        <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#1A1207' }}>Rechnungen Batch-Upload</p>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#666' }}>PDFs und Fotos auf einmal — Claude scannt alle automatisch</p>
        <input ref={inputRef} type="file" multiple accept=".pdf,image/*" onChange={handleFileChange} style={{ display: 'none' }} id="batch-file-input" />
        <label htmlFor="batch-file-input" style={{ display: 'inline-block', background: '#B8882A', color: '#FFF', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
          📁 Dateien wählen
        </label>
        {files.length > 0 && <p style={{ margin: '12px 0 0', fontSize: '13px', fontWeight: 600 }}>{files.length} Datei{files.length !== 1 ? 'en' : ''} ausgewählt</p>}
      </div>

      {/* Start */}
      {files.length > 0 && phase === 'idle' && (
        <button onClick={startBatch} style={{ width: '100%', background: '#1A1207', color: '#FFF', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: 800, cursor: 'pointer' }}>
          🚀 Batch starten — {files.length} Datei{files.length !== 1 ? 'en' : ''} scannen
        </button>
      )}

      {/* Fortschritt: Upload */}
      {(phase === 'uploading' || phase === 'scanning' || phase === 'done') && (
        <div style={{ background: '#FFF', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>

          {/* Upload-Fortschritt */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>☁️ Upload</span>
              <span style={{ fontSize: '13px', color: '#B8882A' }}>{uploadDone} / {total}</span>
            </div>
            <div style={{ background: '#F0EDE8', borderRadius: '6px', height: '8px' }}>
              <div style={{ height: '100%', borderRadius: '6px', background: uploadDone >= total ? '#2D6A2D' : '#B8882A', width: `${uploadPct}%`, transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Scan-Fortschritt */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>🔍 Scan (Claude)</span>
              <span style={{ fontSize: '13px', color: '#B8882A' }}>{scanDone} / {uploadDone}</span>
            </div>
            <div style={{ background: '#F0EDE8', borderRadius: '6px', height: '8px' }}>
              <div style={{ height: '100%', borderRadius: '6px', background: phase === 'done' ? '#2D6A2D' : '#1565C0', width: `${uploadDone > 0 ? Math.round((scanDone / uploadDone) * 100) : 0}%`, transition: 'width 0.3s' }} />
            </div>
          </div>

          {results.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
              {countOK > 0 && <span style={{ fontSize: '13px', color: '#2D6A2D', fontWeight: 600 }}>✅ {countOK} neu</span>}
              {countDuplicate > 0 && <span style={{ fontSize: '13px', color: '#B8882A', fontWeight: 600 }}>⏭️ {countDuplicate} Duplikat{countDuplicate !== 1 ? 'e' : ''}</span>}
              {countError > 0 && <span style={{ fontSize: '13px', color: '#C0392B', fontWeight: 600 }}>❌ {countError} Fehler</span>}
              {totalItems > 0 && <span style={{ fontSize: '13px', color: '#555' }}>📦 {totalItems} Positionen</span>}
            </div>
          )}
        </div>
      )}

      {/* Fehler */}
      {phase === 'error' && errorMsg && (
        <div style={{ background: '#FFF0F0', border: '1px solid #C0392B', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#C0392B' }}>❌ Fehler</p>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#C0392B' }}>{errorMsg}</p>
          <button onClick={reset} style={{ background: '#C0392B', color: '#FFF', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>Neu versuchen</button>
        </div>
      )}

      {/* Abgeschlossen */}
      {phase === 'done' && (
        <>
          <div style={{ background: '#F0FFF0', border: '1px solid #2D6A2D', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 800 }}>🎉 Batch abgeschlossen</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#FFF', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#2D6A2D' }}>{countOK}</div>
                <div style={{ fontSize: '11px', color: '#555' }}>neu gescannt</div>
              </div>
              <div style={{ background: '#FFF', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800 }}>{totalItems}</div>
                <div style={{ fontSize: '11px', color: '#555' }}>Positionen gesamt</div>
              </div>
              {countDuplicate > 0 && (
                <div style={{ background: '#FFF', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#B8882A' }}>{countDuplicate}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>Duplikate</div>
                </div>
              )}
              {countError > 0 && (
                <div style={{ background: '#FFF8F8', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#C0392B' }}>{countError}</div>
                  <div style={{ fontSize: '11px', color: '#C0392B' }}>Fehler</div>
                </div>
              )}
            </div>
            {countOK > 0 && <p style={{ margin: 0, fontSize: '13px', color: '#2D6A2D', fontWeight: 600 }}>→ Tab "📋 Review" öffnen und Positionen kategorisieren</p>}
          </div>

          {countError > 0 && (
            <div style={{ background: '#FFF', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#C0392B' }}>❌ Fehlerhafte Dateien:</p>
              {results.filter(r => r.error).map((r, i) => (
                <div key={i} style={{ fontSize: '12px', padding: '5px 0', borderBottom: '1px solid #F0EDE8', color: '#C0392B' }}>
                  <span style={{ fontWeight: 600 }}>{r.filename}</span><br />
                  <span style={{ color: '#999' }}>{r.error}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={reset} style={{ width: '100%', background: '#F0EDE8', color: '#1A1207', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            ↩ Weitere Dateien scannen
          </button>
        </>
      )}
    </div>
  )
}
