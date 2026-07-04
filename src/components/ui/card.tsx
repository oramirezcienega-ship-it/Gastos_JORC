import { cn } from '@/lib/utils'

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('bg-gray-900 border border-gray-800 rounded-xl', className)}>
      {children}
    </div>
  )
}
