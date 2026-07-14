import type { Event, TimeSession } from '@milestone/shared'

interface TimeBlock {
  start: Date
  end: Date
  title: string
  type: string
  color?: string
}

interface FreeSlot {
  start: Date
  end: Date
  durationMinutes: number
}

function parseISOOrNull(value: string | Date | null): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function mergeOverlapping(blocks: TimeBlock[]): TimeBlock[] {
  const sorted = [...blocks].sort((a, b) => a.start.getTime() - b.start.getTime())
  const merged: TimeBlock[] = []
  for (const block of sorted) {
    const last = merged[merged.length - 1]
    if (last && block.start <= last.end) {
      if (block.end > last.end) {
        last.end = block.end
      }
    } else {
      merged.push({ ...block })
    }
  }
  return merged
}

export function calculateFreeTime(
  events: Event[],
  sessions: TimeSession[],
  date: Date = new Date(),
): { freeSlots: FreeSlot[]; totalFreeMinutes: number; busyBlocks: TimeBlock[] } {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const busyBlocks: TimeBlock[] = []

  for (const event of events) {
    const start = parseISOOrNull(event.start_at)
    const end = parseISOOrNull(event.end_at)
    if (!start || !end) continue
    if (end <= dayStart || start >= dayEnd) continue
    const clampedStart = start < dayStart ? dayStart : start
    const clampedEnd = end > dayEnd ? dayEnd : end
    busyBlocks.push({
      start: clampedStart,
      end: clampedEnd,
      title: event.title,
      type: event.type,
    })
  }

  for (const session of sessions) {
    const start = parseISOOrNull(session.start_at)
    const end = parseISOOrNull(session.end_at)
    if (!start || !end) continue
    if (end <= dayStart || start >= dayEnd) continue
    const clampedStart = start < dayStart ? dayStart : start
    const clampedEnd = end > dayEnd ? dayEnd : end
    busyBlocks.push({
      start: clampedStart,
      end: clampedEnd,
      title: 'Sesión de trabajo',
      type: 'work',
    })
  }

  const mergedBlocks = mergeOverlapping(busyBlocks)

  const freeSlots: FreeSlot[] = []
  let cursor = dayStart

  for (const block of mergedBlocks) {
    if (block.start > cursor) {
      const freeStart = cursor
      const freeEnd = block.start
      const durationMinutes = (freeEnd.getTime() - freeStart.getTime()) / 60000
      if (durationMinutes >= 15) {
        freeSlots.push({ start: freeStart, end: freeEnd, durationMinutes })
      }
    }
    cursor = block.end > cursor ? block.end : cursor
  }

  if (cursor < dayEnd) {
    const durationMinutes = (dayEnd.getTime() - cursor.getTime()) / 60000
    if (durationMinutes >= 15) {
      freeSlots.push({ start: cursor, end: dayEnd, durationMinutes })
    }
  }

  const totalFreeMinutes = freeSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0)

  return { freeSlots, totalFreeMinutes, busyBlocks: mergedBlocks }
}

export function suggestNextBlock(
  events: Event[],
  sessions: TimeSession[],
  _activityTitle?: string,
  preferredDurationMinutes = 120,
): FreeSlot | null {
  const { freeSlots } = calculateFreeTime(events, sessions)
  const now = new Date()

  const upcomingSlots = freeSlots.filter((slot) => slot.end > now)

  if (upcomingSlots.length === 0) return null

  const sorted = upcomingSlots.sort((a, b) => a.start.getTime() - b.start.getTime())

  for (const slot of sorted) {
    if (slot.durationMinutes >= preferredDurationMinutes) {
      return {
        start: slot.start < now ? now : slot.start,
        end: new Date(
          (slot.start < now ? now : slot.start).getTime() + preferredDurationMinutes * 60000,
        ),
        durationMinutes: preferredDurationMinutes,
      }
    }
  }

  return sorted[0] ?? null
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${String(m)}m`
  if (m === 0) return `${String(h)}h`
  return `${String(h)}h ${String(m)}m`
}

export function getLightEventColor(type: string): string {
  switch (type) {
    case 'meeting':
    case 'event':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
    case 'task':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
    case 'reminder':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
    case 'focus':
    case 'work_block':
      return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
  }
}

export function getEventDotColor(type: string): string {
  switch (type) {
    case 'meeting':
    case 'event':
      return 'bg-blue-500'
    case 'reminder':
      return 'bg-amber-500'
    case 'focus':
    case 'work_block':
      return 'bg-purple-500'
    default:
      return 'bg-gray-400'
  }
}

export function detectConflicts(
  events: { id: string; start_at: string | Date; end_at: string | Date | null; title?: string }[],
  newStart: Date,
  newEnd: Date,
  excludeId?: string,
): { hasConflict: boolean; conflicting: { id: string; title: string; start: Date; end: Date }[] } {
  const conflicting: { id: string; title: string; start: Date; end: Date }[] = []

  for (const event of events) {
    if (event.id === excludeId) continue
    if (!event.end_at) continue

    const eventStart = new Date(event.start_at)
    const eventEnd = new Date(event.end_at)

    if (newStart < eventEnd && newEnd > eventStart) {
      conflicting.push({
        id: event.id,
        title: event.title ?? 'Evento',
        start: eventStart,
        end: eventEnd,
      })
    }
  }

  return { hasConflict: conflicting.length > 0, conflicting }
}

export function snapToMinutes(date: Date, interval = 15): Date {
  const ms = interval * 60 * 1000
  return new Date(Math.floor(date.getTime() / ms) * ms)
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  event: 'Evento',
  reminder: 'Recordatorio',
  work_block: 'Bloque de trabajo',
}

export const EVENT_TYPE_ICONS: Record<string, string> = {
  event: '📅',
  reminder: '🔔',
  work_block: '⏰',
}
