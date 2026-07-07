import { Sidebar } from '@/components/Sidebar'
import { AppProvider } from '@/components/AppProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        {/* pb-20 en móvil para dejar espacio a la bottom nav */}
        <main className="flex-1 overflow-y-auto bg-gray-950 pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </AppProvider>
  )
}
