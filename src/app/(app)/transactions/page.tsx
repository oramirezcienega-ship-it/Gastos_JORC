'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Transaction } from '@/lib/supabase/types'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Plus, Filter } from 'lucide-react'
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

export default function TransactionsPage() {
  const { fetchTransactions, categories } = useAppStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null | undefined>(undefined)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchTransactions(page, typeFilter || undefined, search || undefined)
      setTransactions(result.transactions)
      setTotal(result.total)
    } finally {
      setLoading(false)
    }
  }, [fetchTransactions, page, typeFilter, search])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
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

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar descripción..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {['', 'expense', 'income', 'investment'].map(t => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1) }}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                typeFilter === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
              )}
            >
              {t === '' ? 'Todos' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-500">Sin transacciones</div>
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
                    {t.account ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                        {t.account.name}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">{t.category?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={cn('text-xs font-medium', TYPE_COLORS[t.type])}>
                      {TYPE_LABELS[t.type]}
                    </span>
                  </td>
                  <td className={cn('px-5 py-3 text-sm font-semibold text-right', TYPE_COLORS[t.type])}>
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
          onClose={() => { setEditingTx(undefined); load() }}
        />
      )}
    </div>
  )
}
