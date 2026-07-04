'use client'
import { useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'

interface Props {
  onClose?: () => void
}

type Phase = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export function UploadZone({ onClose }: Props) {
  const { accounts, uploadFile, fetchDashboard, token } = useAppStore()
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [accountId, setAccountId] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [txCount, setTxCount] = useState<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = () => {
    if (pollRef.current) clearTimeout(pollRef.current)
  }

  const pollStatus = useCallback(async (fileId: string, attempt = 0) => {
    if (!token) return
    try {
      const res = await fetch(`/api/files?id=${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.status === 'done') {
        setTxCount(data.transactionCount)
        setPhase('done')
        fetchDashboard()
        setTimeout(() => onClose?.(), 3500)
      } else if (data.status === 'error') {
        setPhase('error')
        setError('El archivo no pudo ser procesado. Verifica el formato.')
      } else {
        // Still processing — retry with backoff (max ~30s)
        const delay = Math.min(2000 + attempt * 500, 5000)
        pollRef.current = setTimeout(() => pollStatus(fileId, attempt + 1), delay)
      }
    } catch {
      // network hiccup — keep retrying for a bit
      if (attempt < 10) {
        pollRef.current = setTimeout(() => pollStatus(fileId, attempt + 1), 3000)
      } else {
        setPhase('error')
        setError('No se pudo verificar el estado del procesamiento.')
      }
    }
  }, [token, fetchDashboard, onClose])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return
    setPhase('uploading')
    setError('')
    setTxCount(null)
    stopPolling()
    try {
      const { fileId } = await uploadFile(selectedFile, accountId || undefined, month, year)
      setPhase('processing')
      pollStatus(fileId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo')
      setPhase('error')
    }
  }

  const handleReset = () => {
    stopPolling()
    setPhase('idle')
    setSelectedFile(null)
    setError('')
    setTxCount(null)
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date(2024, i, 1)),
  }))

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  if (phase === 'done') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
          <p className="text-emerald-300 font-semibold text-lg">¡Archivo procesado!</p>
          {txCount !== null && (
            <p className="text-gray-400 text-sm">
              {txCount > 0
                ? `Se importaron ${txCount} transacción${txCount !== 1 ? 'es' : ''}`
                : 'No se encontraron transacciones en el archivo. Prueba exportar como Excel/CSV.'}
            </p>
          )}
        </div>
        <button onClick={handleReset} className="w-full text-sm text-indigo-400 hover:text-indigo-300">
          Subir otro archivo
        </button>
      </div>
    )
  }

  if (phase === 'processing') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-gray-200 font-medium">Procesando transacciones...</p>
          <p className="text-gray-500 text-sm">Esto puede tardar unos segundos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-700 hover:border-gray-600'
        }`}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          className="hidden"
          onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
        />
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span className="text-gray-200 font-medium">{selectedFile.name}</span>
            <button
              onClick={e => { e.stopPropagation(); setSelectedFile(null) }}
              className="text-gray-500 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-300 font-medium">Arrastra o haz clic para subir</p>
            <p className="text-gray-500 text-sm mt-1">PDF, Excel (.xlsx, .xls) o CSV</p>
          </>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Mes del estado de cuenta</label>
          <select
            value={month}
            onChange={e => setMonth(parseInt(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            {months.map(m => (
              <option key={m.value} value={m.value} className="capitalize">{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Año</label>
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Cuenta (opcional)</label>
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">Sin cuenta específica</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {phase === 'error' && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || phase === 'uploading'}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {phase === 'uploading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Subir estado de cuenta
          </>
        )}
      </button>
    </div>
  )
}
