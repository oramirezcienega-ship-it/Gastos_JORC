'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'

export default function DebugPdfPage() {
  const { token } = useAppStore()
  const [lines, setLines] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setLoading(true)
    setError('')
    setLines([])
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/debug-pdf', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setLines(data.lines)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Debug extracción PDF</h1>
      <p className="text-gray-500 text-sm mb-5">
        Muestra el texto crudo que pdf-parse extrae de tu archivo. Útil para ajustar el parser.
      </p>

      <input
        type="file"
        accept=".pdf"
        onChange={handleFile}
        className="block mb-4 text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer hover:file:bg-indigo-700"
      />

      {loading && <p className="text-indigo-400 text-sm animate-pulse">Extrayendo texto...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {lines.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-auto max-h-[70vh]">
          <p className="text-gray-500 text-xs mb-3">{lines.length} líneas extraídas</p>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-5">
            {lines.join('\n')}
          </pre>
        </div>
      )}
    </div>
  )
}
