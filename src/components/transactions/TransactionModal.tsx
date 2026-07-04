'use client'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Transaction, TransactionType } from '@/lib/supabase/types'
import { X, Trash2 } from 'lucide-react'

interface Props {
  transaction?: Transaction | null
  onClose: () => void
}

export function TransactionModal({ transaction, onClose }: Props) {
  const { categories, accounts, businesses, createTransaction, updateTransaction, deleteTransaction } = useAppStore()

  const [form, setForm] = useState({
    date: transaction?.date ?? new Date().toISOString().split('T')[0],
    description: transaction?.description ?? '',
    amount: transaction?.amount?.toString() ?? '',
    type: (transaction?.type ?? 'expense') as TransactionType,
    category_id: transaction?.category_id ?? '',
    account_id: transaction?.account_id ?? '',
    business_id: transaction?.business_id ?? '',
    notes: transaction?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)

  const filteredCategories = categories.filter(c => c.type === form.type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.category_id || null,
        account_id: form.account_id || null,
        business_id: form.business_id || null,
        notes: form.notes || null,
      }
      if (transaction) {
        await updateTransaction({ id: transaction.id, ...data })
      } else {
        await createTransaction(data)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!transaction || !confirm('¿Eliminar esta transacción?')) return
    setLoading(true)
    await deleteTransaction(transaction.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-gray-100">
            {transaction ? 'Editar transacción' : 'Nueva transacción'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type selector */}
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {(['expense', 'income', 'investment'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: t, category_id: '' }))}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  form.type === t
                    ? t === 'expense' ? 'bg-red-600 text-white'
                      : t === 'income' ? 'bg-emerald-600 text-white'
                      : 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : 'Inversión'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Monto (MXN)</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
              placeholder="Ej: Supermercado, gasolina, nómina..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Categoría</label>
              <select
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Sin categoría</option>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cuenta</label>
              <select
                value={form.account_id}
                onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Sin cuenta</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Negocio (opcional)</label>
            <select
              value={form.business_id}
              onChange={e => setForm(f => ({ ...f, business_id: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Personal / sin negocio</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Notas adicionales..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            {transaction && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : transaction ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
