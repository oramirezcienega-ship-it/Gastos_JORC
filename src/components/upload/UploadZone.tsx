'use client'
import { useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'

interface Props {
  onClose?: () => void
}

export function UploadZone({ onClose }: Props) {
  const { accounts, uploadFile } = useAppStore()
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [accountId, setAccountId] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return
    setStatus('uploading')
    setError('')
    try {
      await uploadFile(selectedFile, accountId || undefined, month, year)
      setStatus('success')
      setTimeout(() => onClose?.(), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo')
      setStatus('error')
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date(2024, i, 1)),
  }))

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

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

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {status === 'success' ? (
        <div className="flex items-center justify-center gap-2 text-emerald-400 py-2">
          <CheckCircle className="w-5 h-5" />
          <span>Archivo subido. Procesando transacciones...</span>
        </div>
      ) : (
        <button
          onClick={handleUpload}
          disabled={!selectedFile || status === 'uploading'}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {status === 'uploading' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Subir estado de cuenta
            </>
          )}
        </button>
      )}
    </div>
  )
}
