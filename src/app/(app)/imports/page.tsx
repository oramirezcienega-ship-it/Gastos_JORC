'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { FileText, Trash2, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportFile {
  id: string
  file_name: string
  file_type: 'pdf' | 'excel'
  status: 'pending' | 'processing' | 'done' | 'error'
  period_month: number | null
  period_year: number | null
  created_at: string
  transactionCount: number
  account: { name: string } | null
}

const MONTH_NAMES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const STATUS_CONFIG = {
  done: { icon: CheckCircle, color: 'text-emerald-400', label: 'Completado' },
  error: { icon: AlertCircle, color: 'text-red-400', label: 'Error' },
  processing: { icon: Clock, color: 'text-yellow-400', label: 'Procesando' },
  pending: { icon: Clock, color: 'text-gray-400', label: 'Pendiente' },
}

export default function ImportsPage() {
  const { token, fetchDashboard } = useAppStore()
  const [files, setFiles] = useState<ImportFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/files', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files)
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      await fetch(`/api/files?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setFiles(prev => prev.filter(f => f.id !== id))
      fetchDashboard()
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Historial de importaciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">{files.length} archivos importados</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Aún no hay importaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(file => {
            const StatusIcon = STATUS_CONFIG[file.status].icon
            const isConfirming = confirmId === file.id
            const isDeleting = deletingId === file.id

            return (
              <div
                key={file.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4"
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">{file.file_name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    {file.period_month && file.period_year && (
                      <span>{MONTH_NAMES[file.period_month]} {file.period_year}</span>
                    )}
                    {file.account && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        {file.account.name}
                      </span>
                    )}
                    <span>{new Date(file.created_at).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>

                {/* Transaction count */}
                <div className="text-right flex-shrink-0">
                  {file.status === 'done' && (
                    <p className="text-sm font-semibold text-gray-200">
                      {file.transactionCount} <span className="text-gray-500 font-normal">transacciones</span>
                    </p>
                  )}
                  <div className={cn('flex items-center gap-1 text-xs mt-0.5 justify-end', STATUS_CONFIG[file.status].color)}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {STATUS_CONFIG[file.status].label}
                  </div>
                </div>

                {/* Delete */}
                <div className="flex-shrink-0 ml-2">
                  {isConfirming ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">¿Eliminar y deshacer?</span>
                      <button
                        onClick={() => handleDelete(file.id)}
                        disabled={isDeleting}
                        className="text-xs bg-red-700 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? '...' : 'Sí, eliminar'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(file.id)}
                      title="Deshacer importación"
                      className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
