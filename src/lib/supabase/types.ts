export type TransactionType = 'expense' | 'income' | 'investment' | 'credit'
export type AccountType = 'bank' | 'credit_card' | 'investment' | 'cash'
export type FileStatus = 'pending' | 'processing' | 'done' | 'error'

export interface Profile {
  id: string
  full_name: string | null
  created_at: string
}

export interface Business {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  currency: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  type: TransactionType
  icon: string | null
  color: string
  is_default: boolean
}

export interface StatementFile {
  id: string
  user_id: string
  account_id: string | null
  file_name: string
  file_type: 'pdf' | 'excel'
  storage_path: string
  period_month: number | null
  period_year: number | null
  status: FileStatus
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string | null
  business_id: string | null
  category_id: string | null
  statement_file_id: string | null
  date: string
  description: string
  amount: number
  type: TransactionType
  currency: string
  notes: string | null
  is_manual: boolean
  created_at: string
  // Joined
  category?: Category
  account?: Account
  business?: Business
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      businesses: { Row: Business; Insert: Omit<Business, 'id' | 'created_at'>; Update: Partial<Business> }
      accounts: { Row: Account; Insert: Omit<Account, 'id' | 'created_at'>; Update: Partial<Account> }
      categories: { Row: Category; Insert: Omit<Category, 'id'>; Update: Partial<Category> }
      statement_files: { Row: StatementFile; Insert: Omit<StatementFile, 'id' | 'created_at'>; Update: Partial<StatementFile> }
      transactions: { Row: Transaction; Insert: Omit<Transaction, 'id' | 'created_at'>; Update: Partial<Transaction> }
    }
  }
}
