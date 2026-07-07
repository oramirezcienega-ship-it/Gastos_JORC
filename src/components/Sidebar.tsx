'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Receipt, Building2, CreditCard, Upload, LogOut, TrendingUp, History, Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transacciones', icon: Receipt },
  { href: '/upload', label: 'Subir Estado', icon: Upload },
  { href: '/imports', label: 'Importaciones', icon: History },
  { href: '/categories', label: 'Categorías', icon: Tag },
  { href: '/accounts', label: 'Cuentas', icon: CreditCard },
  { href: '/businesses', label: 'Negocios', icon: Building2 },
  { href: '/analytics', label: 'Análisis', icon: TrendingUp },
]

// Items que se muestran en la bottom nav móvil (los más usados)
const mobileNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transacciones', icon: Receipt },
  { href: '/upload', label: 'Subir', icon: Upload },
  { href: '/analytics', label: 'Análisis', icon: TrendingUp },
  { href: '/businesses', label: 'Negocios', icon: Building2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* ── SIDEBAR DESKTOP (hidden on mobile) ── */}
      <aside className="hidden md:flex w-60 bg-gray-900 border-r border-gray-800 flex-col h-screen sticky top-0 flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💰</span>
            <div>
              <p className="font-bold text-gray-100 leading-tight">Gastos JORC</p>
              <p className="text-xs text-gray-500">Control financiero</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── BOTTOM NAV MÓVIL (hidden on desktop) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 flex items-center justify-around px-2 py-1 safe-area-pb">
        {mobileNav.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0',
                isActive ? 'text-indigo-400' : 'text-gray-500'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]')} />
              <span className="text-[10px] font-medium leading-tight truncate">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
