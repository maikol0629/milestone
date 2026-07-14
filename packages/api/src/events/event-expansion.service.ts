import type { RecurrenceRule } from '@milestone/shared'
import { Injectable } from '@nestjs/common'

import { generateRecurrenceDates } from './recurrence.helper.js'

export interface ExpandedEvent {
  id: string
  title: string
  start_at: Date
  end_at: Date
  occurrence_date?: Date
  is_recurring_instance?: boolean
  recurrence_rule?: string | null
  recurrence_interval?: number | null
  recurrence_days_of_week?: string | null
  recurrence_end_date?: Date | null
}

/** Minimal event shape required to expand recurrence. */
export interface ExpandableEvent {
  id: string
  title: string
  start_at: Date
  end_at: Date
  /** Prisma stores this as string; shared types narrow to RecurrenceRule. */
  recurrence_rule: string | null
  recurrence_interval: number | null
  recurrence_days_of_week: string | null
  recurrence_end_date: Date | null
}

/**
 * Service to expand recurring events into individual occurrences
 * Useful for calendar views and UI display
 */
@Injectable()
export class EventExpansionService {
  /**
   * Expands recurring events within a date range
   * Returns all event occurrences within the range
   */
  expandEventsByDateRange(
    events: ExpandableEvent[],
    startDate: Date,
    endDate: Date,
  ): ExpandedEvent[] {
    const expanded: ExpandedEvent[] = []

    for (const event of events) {
      if (!event.recurrence_rule) {
        if (event.start_at >= startDate && event.start_at <= endDate) {
          expanded.push({
            id: event.id,
            title: event.title,
            start_at: event.start_at,
            end_at: event.end_at,
            recurrence_rule: event.recurrence_rule,
            recurrence_interval: event.recurrence_interval,
            recurrence_days_of_week: event.recurrence_days_of_week,
            recurrence_end_date: event.recurrence_end_date,
          })
        }
      } else {
        const occurrences = this.expandRecurringEvent(event, startDate, endDate)
        expanded.push(...occurrences)
      }
    }

    return expanded.sort((a, b) => a.start_at.getTime() - b.start_at.getTime())
  }

  /**
   * Expands a single recurring event within a date range
   */
  private expandRecurringEvent(
    event: ExpandableEvent,
    startDate: Date,
    endDate: Date,
  ): ExpandedEvent[] {
    const occurrences: ExpandedEvent[] = []

    const recurrenceDates = generateRecurrenceDates(
      new Date(event.start_at),
      {
        recurrence_rule: event.recurrence_rule as RecurrenceRule | null,
        recurrence_interval: event.recurrence_interval,
        recurrence_days_of_week: event.recurrence_days_of_week,
        recurrence_end_date: event.recurrence_end_date ? new Date(event.recurrence_end_date) : null,
      },
      endDate,
    )

    const duration = new Date(event.end_at).getTime() - new Date(event.start_at).getTime()

    for (const occurrenceDate of recurrenceDates) {
      if (occurrenceDate >= startDate && occurrenceDate <= endDate) {
        occurrences.push({
          id: event.id,
          title: event.title,
          start_at: occurrenceDate,
          end_at: new Date(occurrenceDate.getTime() + duration),
          occurrence_date: occurrenceDate,
          is_recurring_instance: true,
          recurrence_rule: event.recurrence_rule,
          recurrence_interval: event.recurrence_interval,
          recurrence_days_of_week: event.recurrence_days_of_week,
          recurrence_end_date: event.recurrence_end_date,
        })
      }
    }

    return occurrences
  }

  /**
   * Gets the next N occurrences of a recurring event
   */
  getNextOccurrences(event: ExpandableEvent, count = 5): ExpandedEvent[] {
    if (!event.recurrence_rule) {
      return [
        {
          id: event.id,
          title: event.title,
          start_at: event.start_at,
          end_at: event.end_at,
          recurrence_rule: event.recurrence_rule,
          recurrence_interval: event.recurrence_interval,
          recurrence_days_of_week: event.recurrence_days_of_week,
          recurrence_end_date: event.recurrence_end_date,
        },
      ]
    }

    const now = new Date()
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

    return this.expandRecurringEvent(event, now, oneYearFromNow).slice(0, count)
  }

  /**
   * Gets summary of a recurring event
   */
  getRecurrenceSummary(event: ExpandableEvent): string {
    if (!event.recurrence_rule) {
      return 'Una sola vez'
    }

    const interval = event.recurrence_interval ?? 1
    let summary = `Cada ${String(interval)}`

    if (event.recurrence_rule === 'daily') {
      summary += interval === 1 ? ' día' : ' días'
    } else {
      summary += interval === 1 ? ' semana' : ' semanas'

      if (event.recurrence_days_of_week) {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        const days = event.recurrence_days_of_week
          .split(',')
          .map((d) => dayNames[parseInt(d, 10)] ?? d)
        summary += ` (${days.join(', ')})`
      }
    }

    if (event.recurrence_end_date) {
      summary += ` hasta ${new Date(event.recurrence_end_date).toLocaleDateString('es-ES')}`
    }

    return summary
  }
}
