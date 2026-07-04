'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { X, Tag, Building2 } from 'lucide-react'

interface Props {
  selectedIds: string[]
  onClose: () => void
  onDone: () => void
}

export function BulkCategorizeModal({ selectedIds, onClose, onDone }: Props) {
  const { categories, businesses, token, fetchDashboard } = useAppStore()
  const [categoryId, setCategoryId] = useState('')
  const [businessId, setBusinessId] = useState<string>('__keep__')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async () => {
    if (!token) return
    if (!categoryId && businessId === '__keep__') {
      setError('Selecciona al menos una categoría o negocio a asignar.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const updates: Record<string, string | null> = {}
      if (categoryId) updates.category_id = categoryId
      if (businessId !== '__keep__') updates.business_id = businessId === '__personal__' ? null : businessId

      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: selectedIds, updates }),
      })
      if (!res.ok) throw new Error(await res.text())
      fetchDashboard()
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aplicar')
    } finally {
      setLoading(false)
    }
  }

  const typeGroups = [
    { type: 'expense', label: 'Gastos' },
    { type: 'income', label: 'Ingresos' },
    { type: 'investment', label: 'Inversiones' },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-100">Categorizar en lote</h2>
            <p className="text-xs text-gray-500 mt-0.5">{selectedIds.length} transacciones seleccionadas</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Category */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Tag className="w-4 h-4 text-indigo-400" />
              Categoría
            </label>
            <div className="space-y-3">
              {typeGroups.map(({ type, label }) => {
                const cats = categories.filter(c => c.type === type)
                if (cats.length === 0) return null
                return (
                  <div key={type}>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">{label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cats.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setCategoryId(c.id === categoryId ? '' : c.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            categoryId === c.id
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {c.icon} {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {!categoryId && (
              <p className="text-xs text-gray-600 mt-1.5">Sin cambio en categoría si no seleccionas ninguna</p>
            )}
          </div>

          {/* Business / Personal */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Negocio / Personal
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setBusinessId('__keep__')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  businessId === '__keep__'
                    ? 'bg-gray-600 border-gray-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                Sin cambio
              </button>
              <button
                onClick={() => setBusinessId('__personal__')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  businessId === '__personal__'
                    ? 'bg-emerald-700 border-emerald-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                👤 Personal
              </button>
              {businesses.map(b => (
                <button
                  key={b.id}
                  onClick={() => setBusinessId(b.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    businessId === b.id
                      ? 'bg-violet-700 border-violet-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  🏢 {b.name}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Aplicando...' : `Aplicar a ${selectedIds.length}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
