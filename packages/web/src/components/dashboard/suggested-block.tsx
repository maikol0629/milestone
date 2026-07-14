'use client'

import type { Event, TimeSession } from '@milestone/shared'

import { suggestNextBlock, formatTime, formatMinutes } from '@/lib/time-utils'

interface SuggestedBlockProps {
  events: Event[]
  sessions: TimeSession[]
}

export function SuggestedBlock({ events, sessions }: SuggestedBlockProps) {
  const suggestion = suggestNextBlock(events, sessions)

  if (!suggestion) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Siguiente bloque</h3>
        <p className="text-sm text-muted-foreground">No hay espacios disponibles hoy</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
        Siguiente bloque disponible
      </h3>
      <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {formatTime(suggestion.start)} - {formatTime(suggestion.end)}
            </p>
            <p className="text-xs text-muted-foreground">
              Duración: {formatMinutes(suggestion.durationMinutes)}
            </p>
          </div>
          <span className="text-lg">💡</span>
        </div>
      </div>
    </div>
  )
}
