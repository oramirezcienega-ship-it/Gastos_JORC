'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAppStore(s => s.initialize)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        initialize()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') router.push('/login')
      if (event === 'SIGNED_IN' && session) initialize()
    })

    return () => subscription.unsubscribe()
  }, [initialize, router])

  return <>{children}</>
}
