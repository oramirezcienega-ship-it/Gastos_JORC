'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { MonthlyChart } from '@/components/dashboard/MonthlyChart'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { BusinessBreakdown } from '@/components/dashboard/BusinessBreakdown'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { SectionView } from '@/components/dashboard/SectionView'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { UploadZone } from '@/components/upload/UploadZone'
import { Transaction } from '@/lib/supabase/types'
import { getMonthName } from '@/lib/utils'
import { Plus, Upload, RefreshCw, LayoutDashboard, TrendingUp, TrendingDown, CreditCard, PiggyBank, Wallet, Building2, User } from 'lucide-react'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

type ActiveSection = null | 'income' | 'expense' | 'credit' | 'investment' | 'balance'

const SECTION_TABS: Array<{
  id: ActiveSection
  label: string
  icon: React.ElementType
  color: string
}> = [
  { id: null, label: 'General', icon: LayoutDashboard, color: 'text-indigo-400' },
  { id: 'income', label: 'Ingresos', icon: TrendingUp, color: 'text-emerald-400' },
  { id: 'expense', label: 'Gastos', icon: TrendingDown, color: 'text-red-400' },
  { id: 'credit', label: 'Créditos', icon: CreditCard, color: 'text-amber-400' },
  { id: 'investment', label: 'Inversiones', icon: PiggyBank, color: 'text-violet-400' },
  { id: 'balance', label: 'Balance', icon: Wallet, color: 'text-sky-400' },
]

export default function DashboardPage() {
  const { dashboardData, isLoading, selectedYear, selectedMonth, setYear, setMonth, fetchDashboard, businesses, selectedBusiness, setBusiness } = useAppStore()
  const [editingTx, setEditingTx] = useState<Transaction | null | undefined>(undefined)
  const [showUpload, setShowUpload] = useState(false)
  const [activeSection, setActiveSection] = useState<ActiveSection>(null)

  const handleSectionClick = (section: 'income' | 'expense' | 'credit' | 'investment' | 'balance') => {
    setActiveSection(prev => prev === section ? null : section)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
            {selectedMonth ? `${getMonthName(selectedMonth)} ${selectedYear}` : `Año ${selectedYear}`}
            {selectedBusiness && (
              <>
                <span className="text-gray-700">·</span>
                <span className="text-indigo-400 font-medium">
                  {selectedBusiness === 'personal'
                    ? 'Personal'
                    : businesses.find(b => b.id === selectedBusiness)?.name ?? 'Negocio'}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period filters */}
          <select
            value={selectedMonth ?? ''}
            onChange={e => setMonth(e.target.value ? parseInt(e.target.value) : null)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Todo el año</option>
            {MONTHS.map(m => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setYear(parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <button
            onClick={fetchDashboard}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Subir
          </button>
          <button
            onClick={() => setEditingTx(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva
          </button>
        </div>
      </div>

      {/* Filtro por negocio */}
      {businesses.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs text-gray-500 font-medium mr-1">Vista:</span>
          {[
            { id: null, label: 'Todos', icon: null },
            { id: 'personal', label: 'Personal', icon: 'personal' },
            ...businesses.map(b => ({ id: b.id, label: b.name, icon: 'business', color: b.color }))
          ].map(opt => {
            const isActive = selectedBusiness === opt.id
            const dotColor = 'color' in opt && opt.color ? opt.color : '#6366f1'
            return (
              <button
                key={String(opt.id)}
                onClick={() => setBusiness(opt.id)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-300'
                    : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600',
                ].join(' ')}
              >
                {opt.icon === 'personal' ? (
                  <User className="w-3 h-3" />
                ) : opt.icon === 'business' ? (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                ) : (
                  <Building2 className="w-3 h-3" />
                )}
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {isLoading && !dashboardData ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : dashboardData ? (
        <div className="space-y-5">
          {/* Tarjetas de resumen — clicables para filtrar sección */}
          <SummaryCards
            data={dashboardData.summary}
            onSectionClick={handleSectionClick}
            activeSection={activeSection}
          />

          {/* Tabs de navegación por sección */}
          <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
            {SECTION_TABS.map(tab => {
              const isActive = activeSection === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={String(tab.id)}
                  onClick={() => setActiveSection(tab.id)}
                  className={[
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0',
                    isActive
                      ? `bg-gray-800 ${tab.color}`
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Vista General */}
          {activeSection === null && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2">
                  <MonthlyChart data={dashboardData.monthly} />
                </div>
                <CategoryBreakdown data={dashboardData.byCategory} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <RecentTransactions
                    transactions={dashboardData.recentTransactions}
                    onEdit={tx => setEditingTx(tx)}
                  />
                </div>
                <BusinessBreakdown data={dashboardData.byBusiness} />
              </div>
            </div>
          )}

          {/* Vista por sección */}
          {activeSection !== null && (
            <SectionView
              section={activeSection}
              summary={dashboardData.summary}
              transactions={dashboardData.recentTransactions}
              byCategory={dashboardData.byCategory}
              onEdit={tx => setEditingTx(tx)}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-gray-400 text-lg font-medium">Bienvenido a Gastos JORC</p>
          <p className="text-gray-500 text-sm mt-2">Sube tu primer estado de cuenta para comenzar</p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Subir estado de cuenta
          </button>
        </div>
      )}

      {/* Modals */}
      {editingTx !== undefined && (
        <TransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(undefined)}
        />
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="font-semibold text-gray-100">Subir estado de cuenta</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>
            <div className="p-5">
              <UploadZone onClose={() => setShowUpload(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
