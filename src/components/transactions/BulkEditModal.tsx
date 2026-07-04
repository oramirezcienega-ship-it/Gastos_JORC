'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { TransactionType } from '@/lib/supabase/types'
import { X, Toggle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  selectedIds: string[]
  onClose: () => void
  onDone: () => void
}

const TYPES: { value: TransactionType; label: string; color: string }[] = [
  { value: 'expense',    label: 'Gasto',     color: 'bg-red-600 border-red-600' },
  { value: 'income',     label: 'Ingreso',   color: 'bg-emerald-600 border-emerald-600' },
  { value: 'investment', label: 'Inversión', color: 'bg-violet-600 border-violet-600' },
  { value: 'credit',     label: 'Crédito',   color: 'bg-orange-600 border-orange-600' },
]

type FieldKey = 'type' | 'category_id' | 'account_id' | 'business_id' | 'date' | 'notes'

export function BulkEditModal({ selectedIds, onClose, onDone }: Props) {
  const { categories, accounts, businesses, token, fetchDashboard } = useAppStore()

  const [enabled, setEnabled] = useState<Record<FieldKey, boolean>>({
    type: false, category_id: false, account_id: false,
    business_id: false, date: false, notes: false,
  })
  const [type, setType] = useState<TransactionType>('expense')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [businessId, setBusinessId] = useState('__personal__')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggle = (key: FieldKey) =>
    setEnabled(e => ({ ...e, [key]: !e[key] }))

  const activeType = enabled.type ? type : null
  const filteredCategories = categories.filter(c =>
    activeType ? c.type === activeType : true
  )

  const handleApply = async () => {
    if (!token) return
    const anyEnabled = Object.values(enabled).some(Boolean)
    if (!anyEnabled) { setError('Activa al menos un campo para editar.'); return }
    setLoading(true); setError('')
    try {
      const updates: Record<string, string | null> = {}
      if (enabled.type) updates.type = type
      if (enabled.category_id) updates.category_id = categoryId || null
      if (enabled.account_id) updates.account_id = accountId || null
      if (enabled.business_id) updates.business_id = businessId === '__personal__' ? null : businessId
      if (enabled.date) updates.date = date
      if (enabled.notes) updates.notes = notes || null

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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-100">Edición masiva</h2>
            <p className="text-xs text-gray-500 mt-0.5">{selectedIds.length} transacciones · activa los campos a editar</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3">
          {/* Type */}
          <FieldRow label="Tipo" active={enabled.type} onToggle={() => toggle('type')}>
            <div className="flex gap-1 flex-wrap">
              {TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => { setType(t.value); setCategoryId('') }}
                  disabled={!enabled.type}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40',
                    type === t.value && enabled.type
                      ? `${t.color} text-white`
                      : 'bg-gray-800 border-gray-700 text-gray-400')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </FieldRow>

          {/* Category */}
          <FieldRow label="Categoría" active={enabled.category_id} onToggle={() => toggle('category_id')}>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              disabled={!enabled.category_id}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
            >
              <option value="">Sin categoría</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </FieldRow>

          {/* Account */}
          <FieldRow label="Cuenta" active={enabled.account_id} onToggle={() => toggle('account_id')}>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              disabled={!enabled.account_id}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
            >
              <option value="">Sin cuenta</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </FieldRow>

          {/* Business */}
          <FieldRow label="Personal / Negocio" active={enabled.business_id} onToggle={() => toggle('business_id')}>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setBusinessId('__personal__')}
                disabled={!enabled.business_id}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40',
                  businessId === '__personal__' && enabled.business_id
                    ? 'bg-emerald-700 border-emerald-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400')}
              >
                👤 Personal
              </button>
              {businesses.map(b => (
                <button key={b.id}
                  onClick={() => setBusinessId(b.id)}
                  disabled={!enabled.business_id}
                  className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40',
                    businessId === b.id && enabled.business_id
                      ? 'bg-violet-700 border-violet-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400')}
                >
                  🏢 {b.name}
                </button>
              ))}
            </div>
          </FieldRow>

          {/* Date */}
          <FieldRow label="Fecha" active={enabled.date} onToggle={() => toggle('date')}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              disabled={!enabled.date}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
            />
          </FieldRow>

          {/* Notes */}
          <FieldRow label="Notas" active={enabled.notes} onToggle={() => toggle('notes')}>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={!enabled.notes}
              placeholder="Nota que se aplicará a todas..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
            />
          </FieldRow>

          {error && <p className="text-red-400 text-xs pt-1">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-300 text-sm transition-colors">
              Cancelar
            </button>
            <button onClick={handleApply} disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-50">
              {loading ? 'Aplicando...' : `Aplicar a ${selectedIds.length}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldRow({ label, active, onToggle, children }: {
  label: string; active: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-xl border p-3 transition-colors', active ? 'border-indigo-700 bg-indigo-950/30' : 'border-gray-800 bg-gray-900/50')}>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full mb-2.5"
      >
        <span className={cn('text-xs font-semibold uppercase tracking-wider', active ? 'text-indigo-400' : 'text-gray-500')}>
          {label}
        </span>
        <span className={cn('w-8 h-4 rounded-full transition-colors relative flex-shrink-0', active ? 'bg-indigo-600' : 'bg-gray-700')}>
          <span className={cn('absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform', active ? 'translate-x-4' : 'translate-x-0.5')} />
        </span>
      </button>
      {children}
    </div>
  )
}
