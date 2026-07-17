'use client'

import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns'

export function getEventsRangeParams(options: {
  viewMode: 'day' | 'week' | 'month'
  currentDate: Date
  currentMonth?: Date
}) {
  const { viewMode, currentDate, currentMonth = currentDate } = options

  if (viewMode === 'day') {
    return {
      start: new Date(currentDate).toISOString(),
      end: new Date(currentDate.getTime() + 86400000).toISOString(),
    }
  }

  if (viewMode === 'week') {
    return {
      start: startOfWeek(currentDate, { weekStartsOn: 1 }).toISOString(),
      end: endOfWeek(currentDate, { weekStartsOn: 1 }).toISOString(),
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  return {
    start: startOfWeek(monthStart, { weekStartsOn: 1 }).toISOString(),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }).toISOString(),
  }
}

export function getCalendarDefaultEventsParams() {
  return getEventsRangeParams({ viewMode: 'day', currentDate: new Date() })
}
