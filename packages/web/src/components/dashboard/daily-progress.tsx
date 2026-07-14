'use client'

import { cn } from '@/lib/utils'

interface DailyProgressProps {
  completed: number
  total: number
  label?: string
}

export function DailyProgress({
  completed,
  total,
  label = 'Progreso del día',
}: DailyProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground">
          {completed}/{total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            percentage >= 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-primary' : 'bg-amber-500',
          )}
          style={{ width: String(percentage) + '%' }}
        />
      </div>
      <p className="mt-1 text-right text-xs text-muted-foreground">{percentage}%</p>
    </div>
  )
}
