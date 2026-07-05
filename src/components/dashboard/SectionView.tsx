'use client'
import React, { useState, useMemo } from 'react'
import { Transaction } from '@/lib/supabase/types'
import { DashboardData } from '@/lib/store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, CreditCard, PiggyBank, Wallet, Info, Download, X } from 'lucide-react'

type SectionType = 'income' | 'expense' | 'credit' | 'investment' | 'balance'

interface Props {
  section: SectionType
  summary: DashboardData['summary']
  transactions: Transaction[]
  byCategory: DashboardData['byCategory']
  onEdit?: (t: Transaction) => void
}

const SECTION_META: Record<SectionType, {
  label: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
  dot: string
  filterType?: string
}> = {
  income: {
    label: 'Ingresos',
    description: 'Dinero que entró a tus cuentas en el período seleccionado.',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    filterType: 'income',
  },
  expense: {
    label: 'Gastos',
    description: 'Compras y pagos realizados en el período seleccionado.',
    icon: TrendingDown,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
    filterType: 'expense',
  },
  credit: {
    label: 'Créditos',
    description: 'Compromisos adquiridos previamente: meses sin intereses, pagos a tarjeta, etc.',
    icon: CreditCard,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
    filterType: 'credit',
  },
  investment: {
    label: 'Inversiones',
    description: 'Dinero destinado a inversiones, ahorros y fondos.',
    icon: PiggyBank,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    dot: 'bg-violet-400',
    filterType: 'investment',
  },
  balance: {
    label: 'Balance',
    description: 'Resumen financiero: ingresos menos todos los egresos.',
    icon: Wallet,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    dot: 'bg-sky-400',
  },
}

function getTotalForSection(section: SectionType, summary: DashboardData['summary']): number {
  if (section === 'income') return summary.totalIncome
  if (section === 'expense') return summary.totalExpenses
  if (section === 'credit') return summary.totalCredits
  if (section === 'investment') return summary.totalInvestments
  return summary.balance
}

const TYPE_COLORS: Record<string, string> = {
  income: 'text-emerald-400',
  expense: 'text-red-400',
  credit: 'text-amber-400',
  investment: 'text-violet-400',
}

function exportCSV(transactions: Transaction[], label: string) {
  const rows = [
    ['Fecha', 'Descripción', 'Tipo', 'Categoría', 'Cuenta', 'Negocio', 'Monto'],
    ...transactions.map(t => [
      t.date,
      t.description,
      t.type,
      t.category?.name ?? '',
      t.account?.name ?? '',
      t.business?.name ?? '',
      t.amount.toString(),
    ]),
  ]
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gastos-jorc-${label}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function SectionView({ section, summary, transactions, byCategory, onEdit }: Props) {
  const meta = SECTION_META[section]
  const Icon = meta.icon
  const total = getTotalForSection(section, summary)
  const [sort, setSort] = useState<{ col: 'date' | 'amount' | 'description'; dir: 'asc' | 'desc' }>({ col: 'date', dir: 'desc' })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const cycleSort = (col: 'date' | 'amount' | 'description') => {
    setSort(s => s.col === col ? { col, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { col, dir: col === 'date' ? 'desc' : 'asc' })
  }

  const filtered = useMemo(() => {
    let list = meta.filterType
      ? transactions.filter(t => t.type === meta.filterType)
      : transactions
    if (selectedCategory) list = list.filter(t => t.category?.name === selectedCategory)
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.col === 'amount') return [...list].sort((a, b) => (a.amount - b.amount) * dir)
    if (sort.col === 'description') return [...list].sort((a, b) => a.description.localeCompare(b.description, 'es') * dir)
    return sort.dir === 'asc' ? [...list].sort((a, b) => a.date.localeCompare(b.date)) : list
  }, [transactions, meta.filterType, sort, selectedCategory])

  const filteredCategories = meta.filterType
    ? byCategory.filter(c => c.type === meta.filterType)
    : byCategory

  const categoryTotal = filteredCategories.reduce((s, c) => s + c.amount, 0)
  const listTotal = filtered.reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Banner de sección */}
      <div className={cn('rounded-2xl border p-5', meta.bg, meta.border)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-xl border', meta.bg, meta.border)}>
              <Icon className={cn('w-6 h-6', meta.color)} />
            </div>
            <div>
              <h2 className={cn('text-xl font-bold', meta.color)}>{meta.label}</h2>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {meta.description}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500 mb-1">Total del período</p>
            <p className={cn('text-2xl font-bold', section === 'balance' && total < 0 ? 'text-orange-400' : meta.color)}>
              {section === 'income' ? '+' : section === 'balance' && total < 0 ? '' : section === 'balance' ? '+' : '-'}
              {formatCurrency(Math.abs(total))}
            </p>
            {section === 'balance' && (
              <p className="text-xs text-gray-500 mt-1">Tasa de ahorro: {summary.savingsRate.toFixed(1)}%</p>
            )}
          </div>
        </div>

        {/* Balance breakdown */}
        {section === 'balance' && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Ingresos', value: summary.totalIncome, color: 'text-emerald-400', sign: '+' },
              { label: 'Gastos', value: summary.totalExpenses, color: 'text-red-400', sign: '-' },
              { label: 'Créditos', value: summary.totalCredits, color: 'text-amber-400', sign: '-' },
              { label: 'Inversiones', value: summary.totalInvestments, color: 'text-violet-400', sign: '-' },
            ].map(item => (
              <div key={item.label} className="bg-black/20 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className={cn('text-base font-semibold', item.color)}>
                  {item.sign}{formatCurrency(item.value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={cn('grid gap-5', section !== 'balance' && filteredCategories.length > 0 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1')}>
        {/* Lista de transacciones */}
        <div className={cn('bg-gray-900 border border-gray-800 rounded-xl p-5', section !== 'balance' && filteredCategories.length > 0 ? 'lg:col-span-2' : '')}>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-100 text-sm">
              {section === 'balance' ? 'Todas las transacciones' : `Transacciones — ${meta.label}`}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                {filtered.length} registros
              </span>
              <div className="flex rounded-lg overflow-hidden border border-gray-700 text-xs">
                {(['date', 'amount', 'description'] as const).map((s, i) => (
                  <button key={s} onClick={() => cycleSort(s)}
                    className={cn('px-2 py-1 transition-colors flex items-center gap-0.5', i > 0 && 'border-l border-gray-700',
                      sort.col === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200')}
                  >
                    {s === 'date' ? 'Fecha' : s === 'amount' ? 'Monto' : 'A–Z'}
                    {sort.col === s && (sort.dir === 'asc' ? ' ↑' : ' ↓')}
                  </button>
                ))}
              </div>
              <button
                onClick={() => exportCSV(filtered, meta.label.toLowerCase())}
                title="Exportar CSV"
                className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-gray-500 text-sm">Sin transacciones de {meta.label.toLowerCase()} en este período</p>
            </div>
          ) : (
            <>
              <div className="space-y-1 max-h-[32rem] overflow-y-auto pr-1">
                {filtered.map(t => {
                  const isIncome = t.type === 'income'
                  return (
                    <div
                      key={t.id}
                      onClick={() => onEdit?.(t)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 text-sm flex-shrink-0">
                        {t.category?.icon ?? (isIncome ? '💵' : t.type === 'investment' ? '📈' : t.type === 'credit' ? '💳' : '🧾')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{t.description}</p>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>{formatDate(t.date)}</span>
                          {t.category && <span>· {t.category.name}</span>}
                          {t.business && <span>· {t.business.name}</span>}
                        </div>
                      </div>
                      <span className={cn('font-semibold text-sm flex-shrink-0', TYPE_COLORS[t.type] ?? 'text-gray-400')}>
                        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Subtotal verificable — debe coincidir con el total del banner */}
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Suma de {filtered.length} transacciones
                </span>
                <span className={cn('text-sm font-bold', meta.color)}>
                  {section === 'income' ? '+' : '-'}{formatCurrency(listTotal)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Breakdown por categoría (no aplica en Balance) */}
        {section !== 'balance' && filteredCategories.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-100 text-sm">Por categoría</h3>
              {selectedCategory && (
                <button onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                  <X className="w-3 h-3" /> Quitar filtro
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
              {filteredCategories.map(cat => {
                const pct = categoryTotal > 0 ? (cat.amount / categoryTotal) * 100 : 0
                const isActive = selectedCategory === cat.name
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(isActive ? null : cat.name)}
                    className={cn('w-full text-left rounded-lg p-2 transition-colors',
                      isActive ? 'bg-indigo-900/40 ring-1 ring-indigo-600' : 'hover:bg-gray-800/60')}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon || '📁'}</span>
                        <span className="text-xs text-gray-300 truncate max-w-[110px]">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                        <span className={cn('text-xs font-semibold', meta.color)}>{formatCurrency(cat.amount)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-500', meta.dot)}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-500">Total categorizado ({filteredCategories.length} categorías)</span>
              <span className={cn('text-xs font-bold', meta.color)}>{formatCurrency(categoryTotal)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
