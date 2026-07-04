'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'

export default function DebugExcelPage() {
  const { token } = useAppStore()
  const [result, setResult] = useState<{ sheetName: string; totalRows: number; columns: string[]; preview: Record<string, unknown>[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/debug-excel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) throw new Error(await res.text())
      setResult(await res.json())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Debug Excel</h1>
      <p className="text-gray-500 text-sm mb-5">Muestra las columnas y primeras filas de tu archivo Excel.</p>

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
        className="block mb-4 text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer hover:file:bg-indigo-700"
      />

      {loading && <p className="text-indigo-400 text-sm animate-pulse">Leyendo archivo...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400">Hoja: <span className="text-white">{result.sheetName}</span> · {result.totalRows} filas</p>
            <p className="text-sm text-gray-400 mt-1">Columnas detectadas:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.columns.map(c => (
                <span key={c} className="bg-indigo-900/50 border border-indigo-700 text-indigo-300 text-xs px-2 py-1 rounded">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-auto">
            <p className="text-xs text-gray-500 mb-3">Primeras {result.preview.length} filas:</p>
            <pre className="text-xs text-gray-300 whitespace-pre font-mono">
              {JSON.stringify(result.preview, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
