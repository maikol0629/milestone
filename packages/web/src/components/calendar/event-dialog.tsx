'use client'

import type { Event } from '@milestone/shared'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '@/lib/time-utils'
import { cn } from '@/lib/utils'

interface EventDialogProps {
  event: Event | null
  open: boolean
  onClose: () => void
  onEdit: (event: Event) => void
  onDelete: (id: string) => void
}

const TYPE_COLORS: Record<string, string> = {
  event: 'bg-blue-500',
  reminder: 'bg-amber-500',
  work_block: 'bg-purple-500',
}

export function EventDialog({ event, open, onClose, onEdit, onDelete }: EventDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  if (!open || !event) return null

  const typeLabel = EVENT_TYPE_LABELS[event.type] ?? event.type
  const typeIcon = EVENT_TYPE_ICONS[event.type] ?? '📌'
  const typeColor = TYPE_COLORS[event.type] ?? 'bg-gray-500'

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/50 max-w-md w-full"
      onClose={onClose}
      aria-labelledby="event-dialog-title"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('rounded-full p-1.5', typeColor)}>
              <span className="flex h-4 w-4 items-center justify-center text-xs text-white">
                {typeIcon}
              </span>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {typeLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 id="event-dialog-title" className="mt-4 text-lg font-semibold">
          {event.title}
        </h3>

        {event.description && (
          <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
        )}

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Inicio:</span>
            <span>
              {new Date(event.start_at).toLocaleDateString('es', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Fin:</span>
            <span>
              {new Date(event.end_at).toLocaleDateString('es', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {event.duration_minutes && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Duración:</span>
              <span>{event.duration_minutes} min</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Ubicación:</span>
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              onDelete(event.id)
              onClose()
            }}
          >
            Eliminar
          </Button>
          <Button
            onClick={() => {
              onEdit(event)
              onClose()
            }}
          >
            Editar
          </Button>
        </div>
      </div>
    </dialog>
  )
}
