'use client'
import { Transaction } from '@/lib/supabase/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  transactions: Transaction[]
  onEdit?: (t: Transaction) => void
}

const typeLabels: Record<string, { label: string; color: string }> = {
  expense: { label: 'Gasto', color: 'text-red-400' },
  income: { label: 'Ingreso', color: 'text-emerald-400' },
  investment: { label: 'Inversión', color: 'text-violet-400' },
}

export function RecentTransactions({ transactions, onEdit }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="font-semibold text-gray-100 mb-4">Transacciones recientes</h3>
      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-6">Sin transacciones</p>
      ) : (
        <div className="space-y-1">
          {transactions.map(t => {
            const meta = typeLabels[t.type]
            return (
              <div
                key={t.id}
                onClick={() => onEdit?.(t)}
                className={cn(
                  'flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer group'
                )}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 text-sm flex-shrink-0">
                  {t.category?.icon ?? (t.type === 'income' ? '💵' : t.type === 'investment' ? '📈' : '💳')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{t.description}</p>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>{formatDate(t.date)}</span>
                    {t.category && <span>· {t.category.name}</span>}
                    {t.business && <span>· {t.business.name}</span>}
                  </div>
                </div>
                <span className={cn('font-semibold text-sm flex-shrink-0', meta.color)}>
                  {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
