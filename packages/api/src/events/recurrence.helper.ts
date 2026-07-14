import type { RecurrenceRule } from '@milestone/shared'

export interface RecurrenceConfig {
  recurrence_rule: RecurrenceRule | null
  recurrence_interval: number | null | undefined
  recurrence_days_of_week: string | null | undefined
  recurrence_end_date: Date | null
}

/**
 * Generates an array of dates for recurring events
 * @param startDate The first occurrence
 * @param config Recurrence configuration
 * @param endDateLimit Optional upper bound for generated dates
 * @returns Array of dates when the event occurs
 */
export function generateRecurrenceDates(
  startDate: Date,
  config: RecurrenceConfig,
  endDateLimit?: Date,
): Date[] {
  if (!config.recurrence_rule) return []

  const dates: Date[] = []
  const maxDate =
    config.recurrence_end_date ??
    endDateLimit ??
    new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000)
  const interval = config.recurrence_interval ?? 1

  let currentDate = new Date(startDate)

  if (config.recurrence_rule === 'daily') {
    while (currentDate <= maxDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + interval)
    }
  } else {
    // weekly
    const daysOfWeek = config.recurrence_days_of_week
      ? config.recurrence_days_of_week.split(',').map((d) => parseInt(d, 10))
      : [startDate.getDay()]

    const firstValidDate = findFirstValidWeeklyDate(startDate, daysOfWeek)
    currentDate = new Date(firstValidDate)

    while (currentDate <= maxDate) {
      const dayOfWeek = currentDate.getDay()
      if (daysOfWeek.includes(dayOfWeek)) {
        dates.push(new Date(currentDate))
      }

      currentDate.setDate(currentDate.getDate() + 1)

      if (daysOfWeek.includes(currentDate.getDay()) && dates.length > 0) {
        const lastDate = dates[dates.length - 1]
        if (lastDate) {
          const daysDiff = Math.floor(
            (currentDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000),
          )
          if (daysDiff >= 7) {
            const weeksToSkip = Math.floor(daysDiff / 7) * interval - 1
            currentDate.setDate(currentDate.getDate() + weeksToSkip * 7)
          }
        }
      }
    }
  }

  return dates
}

/**
 * Finds the first date that matches the weekly recurrence pattern
 */
function findFirstValidWeeklyDate(startDate: Date, daysOfWeek: number[]): Date {
  const date = new Date(startDate)
  const maxAttempts = 7

  for (let i = 0; i < maxAttempts; i++) {
    if (daysOfWeek.includes(date.getDay())) {
      return date
    }
    date.setDate(date.getDate() + 1)
  }

  return startDate
}

/**
 * Formats recurrence days for display
 */
export function formatRecurrenceDays(daysOfWeek: string | null): string[] {
  if (!daysOfWeek) return []

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return daysOfWeek
    .split(',')
    .map((d) => {
      const idx = parseInt(d, 10)
      return dayNames[idx]
    })
    .filter((d): d is string => Boolean(d))
}

/**
 * Validates recurrence configuration
 */
export function isValidRecurrenceConfig(config: RecurrenceConfig): boolean {
  if (!config.recurrence_rule) return true

  const interval = config.recurrence_interval ?? 1
  if (interval <= 0) return false

  if (config.recurrence_rule === 'weekly' && config.recurrence_days_of_week) {
    const days = config.recurrence_days_of_week.split(',').map((d) => parseInt(d, 10))
    return days.every((d) => d >= 0 && d <= 6)
  }

  return true
}

/**
 * Calculates the next occurrence of a recurring event
 */
export function getNextOccurrence(startDate: Date, config: RecurrenceConfig): Date | null {
  if (!config.recurrence_rule) return null

  const now = new Date()
  const dates = generateRecurrenceDates(startDate, config)

  return dates.find((d) => d > now) ?? null
}
