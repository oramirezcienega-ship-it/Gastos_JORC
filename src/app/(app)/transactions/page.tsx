'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Transaction } from '@/lib/supabase/types'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Plus, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = {
  expense: 'text-red-400',
  income: 'text-emerald-400',
  investment: 'text-violet-400',
}
const TYPE_LABELS: Record<string, string> = {
  expense: 'Gasto',
  income: 'Ingreso',
  investment: 'Inversión',
}
const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Fecha (más reciente)' },
  { value: 'date_asc', label: 'Fecha (más antigua)' },
  { value: 'amount_desc', label: 'Monto (mayor)' },
  { value: 'amount_asc', label: 'Monto (menor)' },
]

interface Filters {
  search: string
  type: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  sort: string
}

const DEFAULT_FILTERS: Filters = {
  search: '', type: '', dateFrom: '', dateTo: '',
  amountMin: '', amountMax: '', sort: 'date_desc',
}

function activeFilterCount(f: Filters) {
  return [f.type, f.dateFrom, f.dateTo, f.amountMin, f.amountMax]
    .filter(Boolean).length
}

export default function TransactionsPage() {
  const { token, categories, accounts, businesses, fetchDashboard } = useAppStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null | undefined>(undefined)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(), limit: '50', sort: filters.sort,
      })
      if (filters.search) params.set('search', filters.search)
      if (filters.type) params.set('type', filters.type)
      if (filters.dateFrom) params.set('date_from', filters.dateFrom)
      if (filters.dateTo) params.set('date_to', filters.dateTo)
      if (filters.amountMin) params.set('amount_min', filters.amountMin)
      if (filters.amountMax) params.set('amount_max', filters.amountMax)

      const res = await fetch(`/api/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setTransactions(data.transactions)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [token, page, filters])

  useEffect(() => { load() }, [load])

  const applyFilters = () => {
    setFilters(draft)
    setPage(1)
    setShowFilters(false)
  }

  const clearFilters = () => {
    const reset = { ...DEFAULT_FILTERS, sort: filters.sort }
    setFilters(reset)
    setDraft(reset)
    setPage(1)
  }

  const totalPages = Math.ceil(total / 50)
  const active = activeFilterCount(filters)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Transacciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} registros</p>
        </div>
        <button
          onClick={() => setEditingTx(null)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva transacción
        </button>
      </div>

      {/* Search + type + filter bar */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar descripción..."
            value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1) }}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Type pills */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {['', 'expense', 'income', 'investment'].map(t => (
            <button
              key={t}
              onClick={() => { setFilters(f => ({ ...f, type: t })); setPage(1) }}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filters.type === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
              )}
            >
              {t === '' ? 'Todos' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={filters.sort}
            onChange={e => { setFilters(f => ({ ...f, sort: e.target.value })); setPage(1) }}
            className="appearance-none bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>

        {/* Filter button */}
        <button
          onClick={() => { setDraft(filters); setShowFilters(s => !s) }}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors relative',
            showFilters || active > 0
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {active > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
              {active}
            </span>
          )}
        </button>
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fecha desde</label>
              <input
                type="date"
                value={draft.dateFrom}
                onChange={e => setDraft(d => ({ ...d, dateFrom: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fecha hasta</label>
              <input
                type="date"
                value={draft.dateTo}
                onChange={e => setDraft(d => ({ ...d, dateTo: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Monto mínimo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={draft.amountMin}
                onChange={e => setDraft(d => ({ ...d, amountMin: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Monto máximo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Sin límite"
                value={draft.amountMax}
                onChange={e => setDraft(d => ({ ...d, amountMax: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={applyFilters}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Aplicar filtros
            </button>
            {active > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-700 text-gray-400 hover:text-gray-200 text-sm rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {active > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-3">
          {filters.dateFrom && (
            <Chip label={`Desde ${filters.dateFrom}`} onRemove={() => { setFilters(f => ({ ...f, dateFrom: '' })); setPage(1) }} />
          )}
          {filters.dateTo && (
            <Chip label={`Hasta ${filters.dateTo}`} onRemove={() => { setFilters(f => ({ ...f, dateTo: '' })); setPage(1) }} />
          )}
          {filters.amountMin && (
            <Chip label={`Mín $${filters.amountMin}`} onRemove={() => { setFilters(f => ({ ...f, amountMin: '' })); setPage(1) }} />
          )}
          {filters.amountMax && (
            <Chip label={`Máx $${filters.amountMax}`} onRemove={() => { setFilters(f => ({ ...f, amountMax: '' })); setPage(1) }} />
          )}
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-300 underline">
            Limpiar todo
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">Sin transacciones</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Fecha</th>
                <th className="text-left px-5 py-3">Descripción</th>
                <th className="text-left px-5 py-3">Cuenta</th>
                <th className="text-left px-5 py-3">Categoría</th>
                <th className="text-left px-5 py-3">Tipo</th>
                <th className="text-right px-5 py-3">Monto</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr
                  key={t.id}
                  onClick={() => setEditingTx(t)}
                  className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 text-sm text-gray-400 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="px-5 py-3 text-sm text-gray-200">
                    <div className="flex items-center gap-2">
                      <span>{t.category?.icon ?? '📌'}</span>
                      <span className="truncate max-w-xs">{t.description}</span>
                    </div>
                    {t.business && (
                      <span className="text-xs text-gray-500 ml-6">{t.business.name}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400 whitespace-nowrap">
                    {t.account
                      ? <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />{t.account.name}</span>
                      : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">{t.category?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={cn('text-xs font-medium', TYPE_COLORS[t.type])}>
                      {TYPE_LABELS[t.type]}
                    </span>
                  </td>
                  <td className={cn('px-5 py-3 text-sm font-semibold text-right whitespace-nowrap', TYPE_COLORS[t.type])}>
                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-sm disabled:opacity-40 hover:text-white transition-colors"
          >
            Anterior
          </button>
          <span className="text-gray-500 text-sm">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-sm disabled:opacity-40 hover:text-white transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}

      {editingTx !== undefined && (
        <TransactionModal
          transaction={editingTx}
          onClose={() => { setEditingTx(undefined); load(); fetchDashboard() }}
        />
      )}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-indigo-900/50 border border-indigo-800 text-indigo-300 text-xs px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-white ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}
