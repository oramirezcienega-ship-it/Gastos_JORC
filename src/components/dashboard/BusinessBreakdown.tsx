'use client'
import { DashboardData } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: DashboardData['byBusiness']
}

export function BusinessBreakdown({ data }: Props) {
  const total = data.reduce((s, d) => s + d.amount, 0)

  if (!data.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold text-gray-100 mb-4">Por negocio</h3>
        <p className="text-gray-500 text-center py-4 text-sm">
          Sin negocios asociados aún
        </p>
        <p className="text-gray-600 text-center text-xs">
          Crea negocios y asígnalos a tus transacciones
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="font-semibold text-gray-100 mb-4">Gastos por negocio</h3>
      <div className="space-y-3">
        {data.map((biz, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: biz.color }} />
                <span className="text-gray-200">{biz.name}</span>
              </span>
              <span className="text-gray-300 font-medium">{formatCurrency(biz.amount)}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-800">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: total > 0 ? `${(biz.amount / total) * 100}%` : '0%', background: biz.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
