import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn('flex items-center justify-center py-16', className)}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <span className="sr-only">Cargando...</span>
    </div>
  )
}
