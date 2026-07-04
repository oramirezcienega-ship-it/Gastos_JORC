-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (linked to auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  created_at timestamptz default now()
);

-- Businesses / entities to categorize against
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  color text default '#6366f1',
  created_at timestamptz default now()
);

-- Accounts (bank accounts, credit cards)
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type text check (type in ('bank','credit_card','investment','cash')) default 'bank',
  currency text default 'MXN',
  created_at timestamptz default now()
);

-- Uploaded statement files
create table statement_files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete set null,
  file_name text not null,
  file_type text check (file_type in ('pdf','excel')) not null,
  storage_path text not null,
  period_month integer,
  period_year integer,
  status text check (status in ('pending','processing','done','error')) default 'pending',
  created_at timestamptz default now()
);

-- Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  type text check (type in ('expense','income','investment')) default 'expense',
  icon text,
  color text default '#64748b',
  is_default boolean default false
);

-- Insert default categories
insert into categories (id, name, type, icon, color, is_default) values
  (uuid_generate_v4(), 'Alimentación', 'expense', '🍔', '#f97316', true),
  (uuid_generate_v4(), 'Transporte', 'expense', '🚗', '#3b82f6', true),
  (uuid_generate_v4(), 'Servicios', 'expense', '💡', '#eab308', true),
  (uuid_generate_v4(), 'Entretenimiento', 'expense', '🎬', '#a855f7', true),
  (uuid_generate_v4(), 'Salud', 'expense', '🏥', '#22c55e', true),
  (uuid_generate_v4(), 'Ropa', 'expense', '👕', '#ec4899', true),
  (uuid_generate_v4(), 'Educación', 'expense', '📚', '#06b6d4', true),
  (uuid_generate_v4(), 'Sueldo', 'income', '💼', '#10b981', true),
  (uuid_generate_v4(), 'Freelance', 'income', '💻', '#6366f1', true),
  (uuid_generate_v4(), 'Dividendos', 'investment', '📈', '#f59e0b', true),
  (uuid_generate_v4(), 'Inversión', 'investment', '💰', '#8b5cf6', true),
  (uuid_generate_v4(), 'Otros', 'expense', '📦', '#94a3b8', true);

-- Transactions
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete set null,
  business_id uuid references businesses(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  statement_file_id uuid references statement_files(id) on delete set null,
  date date not null,
  description text not null,
  amount numeric(14,2) not null,
  type text check (type in ('expense','income','investment')) not null,
  currency text default 'MXN',
  notes text,
  is_manual boolean default false,
  created_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table businesses enable row level security;
alter table accounts enable row level security;
alter table statement_files enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;

create policy "Users manage own profile" on profiles for all using (auth.uid() = id);
create policy "Users manage own businesses" on businesses for all using (auth.uid() = user_id);
create policy "Users manage own accounts" on accounts for all using (auth.uid() = user_id);
create policy "Users manage own files" on statement_files for all using (auth.uid() = user_id);
create policy "Users see own + default categories" on categories for select using (auth.uid() = user_id or is_default = true);
create policy "Users manage own categories" on categories for insert with check (auth.uid() = user_id);
create policy "Users manage own transactions" on transactions for all using (auth.uid() = user_id);

-- Trigger: auto-create profile on signup
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure handle_new_user();
