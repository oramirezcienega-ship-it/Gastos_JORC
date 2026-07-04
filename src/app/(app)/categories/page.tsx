'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Category, TransactionType } from '@/lib/supabase/types'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: 'Gastos',
  income: 'Ingresos',
  investment: 'Inversiones',
  credit: 'Crédito',
}

const TYPE_COLORS: Record<TransactionType, string> = {
  expense: 'text-red-400 border-red-900 bg-red-900/20',
  income: 'text-emerald-400 border-emerald-900 bg-emerald-900/20',
  investment: 'text-violet-400 border-violet-900 bg-violet-900/20',
  credit: 'text-orange-400 border-orange-900 bg-orange-900/20',
}

const TYPES: TransactionType[] = ['expense', 'income', 'investment', 'credit']

const PRESET_ICONS = ['🛒','🍔','🚗','⛽','🏠','💊','🎬','✈️','👔','📚','💻','🏋️','🐾','🎁','💈','🏥','⚡','💧','📱','🎓','💰','📈','🏦','💳','🏢','🎯','🛠️','🍕','☕','🎮']

interface FormState {
  name: string
  icon: string
  type: TransactionType
  color: string
}

const DEFAULT_FORM: FormState = { name: '', icon: '📌', type: 'expense', color: '#6366f1' }

export default function CategoriesPage() {
  const { categories, createCategory, updateCategory, deleteCategory } = useAppStore()
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openCreate = () => {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setError('')
    setCreating(true)
  }

  const openEdit = (cat: Category) => {
    setCreating(false)
    setForm({ name: cat.name, icon: cat.icon ?? '📌', type: cat.type, color: cat.color ?? '#6366f1' })
    setError('')
    setEditing(cat)
  }

  const closeModal = () => { setCreating(false); setEditing(null) }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es requerido'); return }
    setLoading(true); setError('')
    try {
      if (editing) {
        await updateCategory({ id: editing.id, ...form })
      } else {
        await createCategory(form)
      }
      closeModal()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"? Las transacciones asignadas quedarán sin categoría.`)) return
    setLoading(true)
    try { await deleteCategory(cat.id) } finally { setLoading(false) }
  }

  const showModal = creating || editing !== null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Categorías</h1>
          <p className="text-gray-500 text-sm mt-0.5">{categories.length} categorías en total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva categoría
        </button>
      </div>

      <div className="space-y-6">
        {TYPES.map(type => {
          const cats = categories.filter(c => c.type === type)
          if (cats.length === 0) return null
          return (
            <div key={type}>
              <h2 className={cn('text-xs font-semibold uppercase tracking-widest mb-3 px-1', TYPE_COLORS[type].split(' ')[0])}>
                {TYPE_LABELS[type]}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cats.map(cat => (
                  <div
                    key={cat.id}
                    className={cn(
                      'flex items-center justify-between gap-3 px-4 py-3 rounded-xl border',
                      cat.is_default ? 'bg-gray-900 border-gray-800' : TYPE_COLORS[type]
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg leading-none">{cat.icon ?? '📌'}</span>
                      <span className="text-sm font-medium text-gray-200 truncate">{cat.name}</span>
                    </div>
                    {cat.is_default ? (
                      <span className="text-[10px] text-gray-600 flex-shrink-0">default</span>
                    ) : (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(cat)} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(cat)} className="p-1 text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="font-semibold text-gray-100">{editing ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Tipo</label>
                <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                  {TYPES.map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={cn('flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                        form.type === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-300')}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Supermercado, Salud..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Ícono</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ICONS.map(icon => (
                    <button key={icon} type="button"
                      onClick={() => setForm(f => ({ ...f, icon }))}
                      className={cn(
                        'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors',
                        form.icon === icon ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-gray-800 hover:bg-gray-700'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">O escribe un emoji:</span>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-center text-gray-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Color</label>
                <div className="flex items-center gap-3">
                  {['#6366f1','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16'].map(c => (
                    <button key={c} type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ backgroundColor: c }}
                    >
                      {form.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <input type="color" value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
                    title="Color personalizado"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button onClick={closeModal}
                  className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-300 text-sm transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-50">
                  {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear categoría'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
