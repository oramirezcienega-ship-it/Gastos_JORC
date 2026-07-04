'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Building2, Plus, Trash2 } from 'lucide-react'

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6',
]

export default function BusinessesPage() {
  const { businesses, createBusiness, fetchBusinesses, token } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', color: '#6366f1' })
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await createBusiness(form)
    setForm({ name: '', color: '#6366f1' })
    setShowForm(false)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este negocio?') || !token) return
    await fetch('/api/businesses', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchBusinesses()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Negocios</h1>
          <p className="text-gray-500 text-sm mt-0.5">Asocia gastos e ingresos a tus negocios</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo negocio
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nombre del negocio</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              placeholder="Ej: Mi Empresa SA, Restaurante..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Color identificador</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color }))}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: color,
                    outline: form.color === color ? '2px solid white' : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear negocio'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {businesses.map(biz => (
          <div key={biz.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: biz.color + '33' }}>
              <Building2 className="w-5 h-5" style={{ color: biz.color }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-200">{biz.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full" style={{ background: biz.color }} />
                <span className="text-xs text-gray-500">Activo</span>
              </div>
            </div>
            <button onClick={() => handleDelete(biz.id)} className="text-gray-600 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {businesses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-700" />
            <p>Sin negocios registrados</p>
            <p className="text-xs mt-1 text-gray-600">Crea negocios para separar tus finanzas personales de las empresariales</p>
          </div>
        )}
      </div>
    </div>
  )
}
