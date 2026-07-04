'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAppStore(s => s.initialize)
  const router = useRouter()

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null

    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase: SupabaseClient = createClient()

      supabase.auth.getSession().then(result => {
        const session = result.data.session
        if (!session) {
          router.push('/login')
        } else {
          initialize()
        }
      })

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') router.push('/login')
        if (event === 'SIGNED_IN' && session) initialize()
      })
      subscription = data.subscription
    })

    return () => subscription?.unsubscribe()
  }, [initialize, router])

  return <>{children}</>
}
