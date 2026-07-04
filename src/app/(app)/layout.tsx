import { Sidebar } from '@/components/Sidebar'
import { AppProvider } from '@/components/AppProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-950">
          {children}
        </main>
      </div>
    </AppProvider>
  )
}
