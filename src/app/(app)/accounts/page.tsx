'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Account, AccountType } from '@/lib/supabase/types'
import { Plus, CreditCard, Building2, Wallet, PiggyBank, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TYPE_ICONS: Record<AccountType, React.ReactNode> = {
  bank: <Building2 className="w-5 h-5" />,
  credit_card: <CreditCard className="w-5 h-5" />,
  investment: <PiggyBank className="w-5 h-5" />,
  cash: <Wallet className="w-5 h-5" />,
}

const TYPE_LABELS: Record<AccountType, string> = {
  bank: 'Cuenta bancaria',
  credit_card: 'Tarjeta de crédito',
  investment: 'Cuenta de inversión',
  cash: 'Efectivo',
}

export default function AccountsPage() {
  const { accounts, createAccount, fetchAccounts, token } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'bank' as AccountType, currency: 'MXN' })
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await createAccount(form)
    setForm({ name: '', type: 'bank', currency: 'MXN' })
    setShowForm(false)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cuenta?') || !token) return
    await fetch('/api/accounts', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchAccounts()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Cuentas</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva cuenta
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5 space-y-4">
          <h3 className="font-medium text-gray-200">Agregar cuenta</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Nombre de la cuenta</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Ej: BBVA Débito, Amex Platino..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as AccountType }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Moneda</label>
              <select
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="MXN">MXN — Peso mexicano</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {accounts.map(account => (
          <div key={account.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
              {TYPE_ICONS[account.type]}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-200">{account.name}</p>
              <p className="text-xs text-gray-500">{TYPE_LABELS[account.type]} · {account.currency}</p>
            </div>
            <button onClick={() => handleDelete(account.id)} className="text-gray-600 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CreditCard className="w-10 h-10 mx-auto mb-3 text-gray-700" />
            <p>No tienes cuentas registradas</p>
          </div>
        )}
      </div>
    </div>
  )
}
