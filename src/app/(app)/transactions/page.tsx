'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { Transaction } from '@/lib/supabase/types'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { BulkEditModal } from '@/components/transactions/BulkEditModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Plus, SlidersHorizontal, X, ArrowUpDown, ArrowUp, ArrowDown, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = {
  expense: 'text-red-400', income: 'text-emerald-400',
  investment: 'text-violet-400', credit: 'text-orange-400',
}
const TYPE_LABELS: Record<string, string> = {
  expense: 'Gasto', income: 'Ingreso', investment: 'Inversión', credit: 'Crédito',
}

function thisMonth() {
  const now = new Date()
  const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, now.getMonth() + 1, 0).getDate()
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${last}` }
}
function lastMonth() {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, d.getMonth() + 1, 0).getDate()
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${last}` }
}

interface Filters {
  search: string; type: string; dateFrom: string; dateTo: string
  amountMin: string; amountMax: string; sort: string; business: string
}
const DEFAULT_FILTERS: Filters = {
  search: '', type: '', dateFrom: '', dateTo: '',
  amountMin: '', amountMax: '', sort: 'date_desc', business: '',
}
function activeFilterCount(f: Filters) {
  return [f.type, f.dateFrom, f.dateTo, f.amountMin, f.amountMax, f.business].filter(Boolean).length
}

export default function TransactionsPage() {
  const { token, businesses, fetchDashboard } = useAppStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null | undefined>(undefined)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showBulk, setShowBulk] = useState(false)
  const [clientSort, setClientSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      // Limit 1000 to load all results server-side
      const params = new URLSearchParams({ page: '1', limit: '1000', sort: filters.sort })
      if (filters.search) params.set('search', filters.search)
      if (filters.type) params.set('type', filters.type)
      if (filters.dateFrom) params.set('date_from', filters.dateFrom)
      if (filters.dateTo) params.set('date_to', filters.dateTo)
      if (filters.amountMin) params.set('amount_min', filters.amountMin)
      if (filters.amountMax) params.set('amount_max', filters.amountMax)
      if (filters.business) params.set('business', filters.business)
      const res = await fetch(`/api/transactions?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      setTransactions(data.transactions)
      setTotal(data.total)
      setSelected(new Set())
    } finally {
      setLoading(false)
    }
  }, [token, filters])

  useEffect(() => { load() }, [load])

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(f => ({ ...f, [key]: value }))
  }

  const applyFilters = () => { setFilters(draft); setShowFilters(false) }
  const clearFilters = () => {
    const r = { ...DEFAULT_FILTERS, sort: filters.sort }
    setFilters(r); setDraft(r)
  }

  const setPeriod = (preset: 'this' | 'last' | '') => {
    if (preset === '') return setFilters(f => ({ ...f, dateFrom: '', dateTo: '' }))
    const { from, to } = preset === 'this' ? thisMonth() : lastMonth()
    setFilters(f => ({ ...f, dateFrom: from, dateTo: to }))
  }

  const activePeriod = (() => {
    const tm = thisMonth(), lm = lastMonth()
    if (filters.dateFrom === tm.from && filters.dateTo === tm.to) return 'this'
    if (filters.dateFrom === lm.from && filters.dateTo === lm.to) return 'last'
    return ''
  })()

  const allSelected = transactions.length > 0 && transactions.every(t => selected.has(t.id))
  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(transactions.map(t => t.id)))
  }
  const toggleOne = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const active = activeFilterCount(filters)

  const serverCols = ['date', 'description', 'type', 'amount'] as const
  type ServerCol = typeof serverCols[number]

  const cycleSort = (col: string) => {
    setClientSort(null)
    if (serverCols.includes(col as ServerCol)) {
      const next = filters.sort === `${col}_desc` ? `${col}_asc` : `${col}_desc`
      setFilter('sort', next)
    } else {
      setClientSort(prev =>
        prev?.col === col ? { col, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { col, dir: 'asc' }
      )
    }
  }

  const getSortDir = (col: string): 'asc' | 'desc' | null => {
    if (serverCols.includes(col as ServerCol)) {
      if (filters.sort === `${col}_desc`) return 'desc'
      if (filters.sort === `${col}_asc`) return 'asc'
      return null
    }
    return clientSort?.col === col ? clientSort.dir : null
  }

  const SortIcon = ({ col }: { col: string }) => {
    const dir = getSortDir(col)
    if (dir === 'desc') return <ArrowDown className="w-3 h-3 ml-1 inline text-indigo-400" />
    if (dir === 'asc') return <ArrowUp className="w-3 h-3 ml-1 inline text-indigo-400" />
    return <ArrowUpDown className="w-3 h-3 ml-1 inline text-gray-600" />
  }

  const sortedTransactions = useMemo(() => {
    if (!clientSort) return transactions
    return [...transactions].sort((a, b) => {
      const dir = clientSort.dir === 'asc' ? 1 : -1
      const av = clientSort.col === 'account' ? (a.account?.name ?? '')
        : clientSort.col === 'category' ? (a.category?.name ?? '')
        : clientSort.col === 'business' ? (a.business?.name ?? '')
        : ''
      const bv = clientSort.col === 'account' ? (b.account?.name ?? '')
        : clientSort.col === 'category' ? (b.category?.name ?? '')
        : clientSort.col === 'business' ? (b.business?.name ?? '')
        : ''
      return av.localeCompare(bv, 'es') * dir
    })
  }, [transactions, clientSort])

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Transacciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} registros</p>
        </div>
        <button onClick={() => setEditingTx(null)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nueva transacción
        </button>
      </div>

      {/* Row 1: search + Filtros */}
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Buscar descripción..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button onClick={() => { setDraft(filters); setShowFilters(s => !s) }}
          className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors relative',
            showFilters || active > 0
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200')}>
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {active > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
              {active}
            </span>
          )}
        </button>
      </div>

      {/* Row 2: quick filter chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Period */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {[
            { key: '', label: 'Todo' },
            { key: 'this', label: 'Este mes' },
            { key: 'last', label: 'Último mes' },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => setPeriod(key as 'this' | 'last' | '')}
              className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                activePeriod === key && (key !== '' || (!filters.dateFrom && !filters.dateTo))
                  ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Type */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {['', 'expense', 'income', 'investment', 'credit'].map(t => (
            <button key={t}
              onClick={() => setFilter('type', t)}
              className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filters.type === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300')}
            >
              {t === '' ? 'Todos' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Personal / Negocio */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          <button
            onClick={() => setFilter('business', '')}
            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              filters.business === '' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300')}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('business', filters.business === 'personal' ? '' : 'personal')}
            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              filters.business === 'personal' ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:text-gray-300')}
          >
            👤 Personal
          </button>
          {businesses.map(b => (
            <button key={b.id}
              onClick={() => setFilter('business', filters.business === b.id ? '' : b.id)}
              className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filters.business === b.id ? 'bg-violet-700 text-white' : 'text-gray-400 hover:text-gray-300')}
            >
              🏢 {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Fecha desde', key: 'dateFrom', type: 'date' },
              { label: 'Fecha hasta', key: 'dateTo', type: 'date' },
              { label: 'Monto mínimo', key: 'amountMin', type: 'number' },
              { label: 'Monto máximo', key: 'amountMax', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined}
                  placeholder={type === 'number' ? '0.00' : undefined}
                  value={draft[key as keyof Filters]}
                  onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={applyFilters}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              Aplicar filtros
            </button>
            {active > 0 && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-700 text-gray-400 hover:text-gray-200 text-sm rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" /> Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {active > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-3">
          {filters.dateFrom && !activePeriod && <Chip label={`Desde ${filters.dateFrom}`} onRemove={() => setFilter('dateFrom', '')} />}
          {filters.dateTo && !activePeriod && <Chip label={`Hasta ${filters.dateTo}`} onRemove={() => setFilter('dateTo', '')} />}
          {filters.amountMin && <Chip label={`Mín $${filters.amountMin}`} onRemove={() => setFilter('amountMin', '')} />}
          {filters.amountMax && <Chip label={`Máx $${filters.amountMax}`} onRemove={() => setFilter('amountMax', '')} />}
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-300 underline">Limpiar todo</button>
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
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider select-none">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="rounded border-gray-600 bg-gray-800 text-indigo-500 cursor-pointer" />
                </th>
                {([
                  { col: 'date', label: 'Fecha', align: 'left' },
                  { col: 'description', label: 'Descripción', align: 'left' },
                  { col: 'account', label: 'Cuenta', align: 'left' },
                  { col: 'category', label: 'Categoría', align: 'left' },
                  { col: 'business', label: 'Personal / Negocio', align: 'left' },
                  { col: 'type', label: 'Tipo', align: 'left' },
                  { col: 'amount', label: 'Monto', align: 'right' },
                ] as const).map(({ col, label, align }) => (
                  <th key={col} className={`px-4 py-3 text-${align}`}>
                    <button onClick={() => cycleSort(col)}
                      className={cn('hover:text-gray-300 transition-colors inline-flex items-center gap-0.5', align === 'right' && 'ml-auto')}>
                      {label}<SortIcon col={col} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map(t => (
                <tr key={t.id}
                  className={cn('border-b border-gray-800/50 transition-colors',
                    selected.has(t.id) ? 'bg-indigo-900/20' : 'hover:bg-gray-800/50')}>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleOne(t.id)}
                      className="rounded border-gray-600 bg-gray-800 text-indigo-500 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap cursor-pointer" onClick={() => setEditingTx(t)}>
                    {formatDate(t.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-200 cursor-pointer" onClick={() => setEditingTx(t)}>
                    <div className="flex items-center gap-2">
                      <span>{t.category?.icon ?? '📌'}</span>
                      <span className="truncate max-w-[200px]">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap cursor-pointer" onClick={() => setEditingTx(t)}>
                    {t.account
                      ? <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />{t.account.name}</span>
                      : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 cursor-pointer" onClick={() => setEditingTx(t)}>
                    {t.category?.name ?? <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => setEditingTx(t)}>
                    {t.business
                      ? <span className="flex items-center gap-1.5 text-violet-400"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />{t.business.name}</span>
                      : <span className="flex items-center gap-1.5 text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />Personal</span>}
                  </td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setEditingTx(t)}>
                    <span className={cn('text-xs font-medium', TYPE_COLORS[t.type])}>{TYPE_LABELS[t.type]}</span>
                  </td>
                  <td className={cn('px-4 py-3 text-sm font-semibold text-right whitespace-nowrap cursor-pointer', TYPE_COLORS[t.type])} onClick={() => setEditingTx(t)}>
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 shadow-2xl">
          <span className="text-sm text-gray-300 font-medium">{selected.size} seleccionadas</span>
          <div className="w-px h-5 bg-gray-700" />
          <button onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
            <Pencil className="w-4 h-4" /> Editar selección
          </button>
          <button onClick={() => setSelected(new Set())} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {editingTx !== undefined && (
        <TransactionModal transaction={editingTx} onClose={() => { setEditingTx(undefined); load(); fetchDashboard() }} />
      )}
      {showBulk && (
        <BulkEditModal selectedIds={[...selected]} onClose={() => setShowBulk(false)} onDone={() => { setShowBulk(false); load() }} />
      )}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-indigo-900/50 border border-indigo-800 text-indigo-300 text-xs px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-white ml-0.5"><X className="w-3 h-3" /></button>
    </span>
  )
}
