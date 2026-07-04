'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { TransactionType } from '@/lib/supabase/types'
import { X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  selectedIds: string[]
  onClose: () => void
  onDone: () => void
}

const TYPES: { value: TransactionType; label: string; active: string; inactive: string }[] = [
  { value: 'expense',    label: 'Gasto',     active: 'bg-red-600 border-red-600 text-white',     inactive: 'bg-gray-800 border-gray-700 text-gray-400' },
  { value: 'income',    label: 'Ingreso',    active: 'bg-emerald-600 border-emerald-600 text-white', inactive: 'bg-gray-800 border-gray-700 text-gray-400' },
  { value: 'investment',label: 'Inversión',  active: 'bg-violet-600 border-violet-600 text-white',  inactive: 'bg-gray-800 border-gray-700 text-gray-400' },
  { value: 'credit',    label: 'Crédito',   active: 'bg-orange-600 border-orange-600 text-white',  inactive: 'bg-gray-800 border-gray-700 text-gray-400' },
]

const KEEP = '__keep__'
const PERSONAL = '__personal__'

export function BulkEditModal({ selectedIds, onClose, onDone }: Props) {
  const { categories, accounts, businesses, token, fetchDashboard } = useAppStore()

  const [type, setType]             = useState<TransactionType | typeof KEEP>(KEEP)
  const [categoryId, setCategoryId] = useState(KEEP)
  const [accountId, setAccountId]   = useState(KEEP)
  const [businessId, setBusinessId] = useState(KEEP)
  const [date, setDate]             = useState('')
  const [notes, setNotes]           = useState(KEEP)
  const [notesVal, setNotesVal]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const filteredCategories = type !== KEEP
    ? categories.filter(c => c.type === type)
    : categories

  const anyChange =
    type !== KEEP ||
    categoryId !== KEEP ||
    accountId !== KEEP ||
    businessId !== KEEP ||
    date !== '' ||
    notes !== KEEP

  const handleApply = async () => {
    if (!token) return
    if (!anyChange) { setError('Modifica al menos un campo para aplicar.'); return }
    setLoading(true); setError('')
    try {
      const updates: Record<string, string | null> = {}
      if (type !== KEEP)       updates.type        = type
      if (categoryId !== KEEP) updates.category_id = categoryId === '' ? null : categoryId
      if (accountId !== KEEP)  updates.account_id  = accountId === '' ? null : accountId
      if (businessId !== KEEP) updates.business_id = businessId === PERSONAL ? null : businessId
      if (date !== '')         updates.date        = date
      if (notes !== KEEP)      updates.notes       = notesVal || null

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
            <p className="text-xs text-gray-500 mt-0.5">{selectedIds.length} transacciones · solo se aplican los campos que cambies</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">

          {/* Tipo */}
          <Field label="Tipo" changed={type !== KEEP}>
            <div className="flex flex-wrap gap-1.5">
              <Chip label="Sin cambio" active={type === KEEP} onClick={() => { setType(KEEP); setCategoryId(KEEP) }} color="neutral" />
              {TYPES.map(t => (
                <Chip key={t.value} label={t.label} active={type === t.value}
                  onClick={() => { setType(t.value); setCategoryId(KEEP) }} color={t.value} />
              ))}
            </div>
          </Field>

          {/* Categoría */}
          <Field label="Categoría" changed={categoryId !== KEEP}>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={KEEP}>Sin cambio</option>
              <option value="">— Sin categoría —</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </Field>

          {/* Cuenta */}
          <Field label="Cuenta" changed={accountId !== KEEP}>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={KEEP}>Sin cambio</option>
              <option value="">— Sin cuenta —</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>

          {/* Personal / Negocio */}
          <Field label="Personal / Negocio" changed={businessId !== KEEP}>
            <div className="flex flex-wrap gap-1.5">
              <Chip label="Sin cambio" active={businessId === KEEP}    onClick={() => setBusinessId(KEEP)}     color="neutral" />
              <Chip label="👤 Personal" active={businessId === PERSONAL} onClick={() => setBusinessId(PERSONAL)} color="green" />
              {businesses.map(b => (
                <Chip key={b.id} label={`🏢 ${b.name}`} active={businessId === b.id}
                  onClick={() => setBusinessId(b.id)} color="violet" />
              ))}
            </div>
          </Field>

          {/* Fecha */}
          <Field label="Fecha" changed={date !== ''}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            />
            {date === '' && <p className="text-xs text-gray-600 mt-1">Deja vacío para no cambiar la fecha</p>}
          </Field>

          {/* Notas */}
          <Field label="Notas" changed={notes !== KEEP}>
            <input
              type="text"
              value={notesVal}
              onChange={e => { setNotesVal(e.target.value); setNotes('__set__') }}
              placeholder="Escribe para aplicar a todas (vacío = borrar nota)..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
            {notes === KEEP && <p className="text-xs text-gray-600 mt-1">Deja vacío para no cambiar las notas</p>}
          </Field>

          {error && <p className="text-red-400 text-xs bg-red-900/20 border border-red-900 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-300 text-sm transition-colors">
              Cancelar
            </button>
            <button onClick={handleApply} disabled={loading || !anyChange}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-40">
              {loading ? 'Aplicando...' : `Aplicar a ${selectedIds.length}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, changed, children }: { label: string; changed: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-xl border p-3 transition-colors', changed ? 'border-indigo-700 bg-indigo-950/20' : 'border-gray-800')}>
      <p className={cn('text-xs font-semibold uppercase tracking-wider mb-2', changed ? 'text-indigo-400' : 'text-gray-500')}>
        {label} {changed && <span className="normal-case tracking-normal font-normal text-indigo-500">· se aplicará</span>}
      </p>
      {children}
    </div>
  )
}

function Chip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: string }) {
  const activeClass =
    color === 'neutral'    ? 'bg-gray-600 border-gray-500 text-white' :
    color === 'expense'    ? 'bg-red-600 border-red-600 text-white' :
    color === 'income'     ? 'bg-emerald-600 border-emerald-600 text-white' :
    color === 'investment' ? 'bg-violet-600 border-violet-600 text-white' :
    color === 'credit'     ? 'bg-orange-600 border-orange-600 text-white' :
    color === 'green'      ? 'bg-emerald-700 border-emerald-600 text-white' :
    color === 'violet'     ? 'bg-violet-700 border-violet-600 text-white' :
    'bg-indigo-600 border-indigo-600 text-white'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
        active ? activeClass : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
      )}
    >
      {active && <Check className="w-3 h-3" />}
      {label}
    </button>
  )
}
