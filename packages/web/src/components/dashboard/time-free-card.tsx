'use client'

import { formatMinutes } from '@/lib/time-utils'

interface TimeFreeCardProps {
  totalFreeMinutes: number
}

export function TimeFreeCard({ totalFreeMinutes }: TimeFreeCardProps) {
  const hours = Math.floor(totalFreeMinutes / 60)
  const minutes = Math.round(totalFreeMinutes % 60)
  const percentage = Math.round((totalFreeMinutes / 1440) * 100)

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-1 text-sm font-semibold text-muted-foreground">Tiempo libre</h3>
      <p className="text-3xl font-bold">
        {hours > 0 && (
          <>
            {hours}
            <span className="text-lg font-normal text-muted-foreground">h </span>
          </>
        )}
        {minutes}
        <span className="text-lg font-normal text-muted-foreground">m</span>
      </p>
      <p className="text-xs text-muted-foreground">
        de {formatMinutes(totalFreeMinutes)} disponibles &bull; {percentage}% del día
      </p>
    </div>
  )
}
