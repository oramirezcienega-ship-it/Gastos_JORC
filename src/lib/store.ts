'use client'
import { create } from 'zustand'
import { Transaction, Account, Business, Category } from '@/lib/supabase/types'

interface AppState {
  // Auth
  token: string | null
  userId: string | null

  // Data
  transactions: Transaction[]
  accounts: Account[]
  businesses: Business[]
  categories: Category[]
  dashboardData: DashboardData | null
  isLoading: boolean

  // Filters
  selectedYear: number
  selectedMonth: number | null

  // Actions
  initialize: () => Promise<void>
  fetchDashboard: () => Promise<void>
  fetchTransactions: (page?: number, type?: string, search?: string) => Promise<{ transactions: Transaction[]; total: number }>
  fetchAccounts: () => Promise<void>
  fetchBusinesses: () => Promise<void>
  fetchCategories: () => Promise<void>
  createTransaction: (data: Partial<Transaction>) => Promise<void>
  updateTransaction: (data: Partial<Transaction> & { id: string }) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  createCategory: (data: Partial<Category>) => Promise<void>
  updateCategory: (data: Partial<Category> & { id: string }) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  createAccount: (data: Partial<Account>) => Promise<void>
  createBusiness: (data: Partial<Business>) => Promise<void>
  uploadFile: (file: File, accountId?: string, month?: number, year?: number) => Promise<{ fileId: string }>
  setYear: (year: number) => void
  setMonth: (month: number | null) => void
}

export interface DashboardData {
  summary: {
    totalExpenses: number
    totalIncome: number
    totalInvestments: number
    totalCredits: number
    balance: number
    savingsRate: number
  }
  monthly: Array<{ month: string; expense: number; income: number; investment: number; credit: number }>
  byCategory: Array<{ name: string; color: string; icon: string; amount: number; type: string }>
  byBusiness: Array<{ name: string; color: string; amount: number }>
  recentTransactions: Transaction[]
}

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const useAppStore = create<AppState>((set, get) => ({
  token: null,
  userId: null,
  transactions: [],
  accounts: [],
  businesses: [],
  categories: [],
  dashboardData: null,
  isLoading: false,
  selectedYear: new Date().getFullYear(),
  selectedMonth: null,

  initialize: async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      set({ token: session.access_token, userId: session.user.id })
      await Promise.all([
        get().fetchDashboard(),
        get().fetchAccounts(),
        get().fetchBusinesses(),
        get().fetchCategories(),
      ])
    }
  },

  fetchDashboard: async () => {
    const { token, selectedYear, selectedMonth } = get()
    if (!token) return
    set({ isLoading: true })
    try {
      const params = new URLSearchParams({ year: selectedYear.toString() })
      if (selectedMonth) params.set('month', selectedMonth.toString())
      const data = await apiFetch(`/api/dashboard?${params}`, token)
      set({ dashboardData: data })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchTransactions: async (page = 1, type?: string, search?: string) => {
    const { token } = get()
    if (!token) return { transactions: [], total: 0 }
    const params = new URLSearchParams({ page: page.toString(), limit: '50' })
    if (type) params.set('type', type)
    if (search) params.set('search', search)
    const data = await apiFetch(`/api/transactions?${params}`, token)
    return data
  },

  fetchAccounts: async () => {
    const { token } = get()
    if (!token) return
    const data = await apiFetch('/api/accounts', token)
    set({ accounts: data.accounts })
  },

  fetchBusinesses: async () => {
    const { token } = get()
    if (!token) return
    const data = await apiFetch('/api/businesses', token)
    set({ businesses: data.businesses })
  },

  fetchCategories: async () => {
    const { token } = get()
    if (!token) return
    const data = await apiFetch('/api/categories', token)
    set({ categories: data.categories })
  },

  createTransaction: async (txData) => {
    const { token } = get()
    if (!token) return
    await apiFetch('/api/transactions', token, { method: 'POST', body: JSON.stringify(txData) })
    await get().fetchDashboard()
  },

  updateTransaction: async (txData) => {
    const { token } = get()
    if (!token) return
    await apiFetch('/api/transactions', token, { method: 'PATCH', body: JSON.stringify(txData) })
    await get().fetchDashboard()
  },

  deleteTransaction: async (id) => {
    const { token } = get()
    if (!token) return
    await apiFetch('/api/transactions', token, { method: 'DELETE', body: JSON.stringify({ id }) })
    await get().fetchDashboard()
  },

  createCategory: async (catData) => {
    const { token } = get()
    if (!token) return
    await apiFetch('/api/categories', token, { method: 'POST', body: JSON.stringify(catData) })
    await get().fetchCategories()
  },

  updateCategory: async (catData) => {
    const { token } = get()
    if (!token) return
    await apiFetch('/api/categories', token, { method: 'PATCH', body: JSON.stringify(catData) })
    await get().fetchCategories()
  },

  deleteCategory: async (id) => {
    const { token } = get()
    if (!token) return
    await apiFetch('/api/categories', token, { method: 'DELETE', body: JSON.stringify({ id }) })
    await get().fetchCategories()
  },

  createAccount: async (accountData) => {
    const { token } = get()
    if (!token) return
    await apiFetch('/api/accounts', token, { method: 'POST', body: JSON.stringify(accountData) })
    await get().fetchAccounts()
  },

  createBusiness: async (bizData) => {
    const { token } = get()
    if (!token) return
    await apiFetch('/api/businesses', token, { method: 'POST', body: JSON.stringify(bizData) })
    await get().fetchBusinesses()
  },

  uploadFile: async (file, accountId, month, year) => {
    const { token } = get()
    if (!token) throw new Error('No auth token')
    const formData = new FormData()
    formData.append('file', file)
    if (accountId) formData.append('account_id', accountId)
    if (month) formData.append('period_month', month.toString())
    if (year) formData.append('period_year', year.toString())
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) throw new Error(await res.text())
    const body = await res.json()
    if (body.parseError) throw new Error(`Parse error: ${body.parseError}`)
    return { fileId: body.file.id }
  },

  setYear: (year) => {
    set({ selectedYear: year })
    get().fetchDashboard()
  },

  setMonth: (month) => {
    set({ selectedMonth: month })
    get().fetchDashboard()
  },
}))
