import {
  calculateFreeTime,
  suggestNextBlock,
  formatMinutes,
  formatTime,
  detectConflicts,
  snapToMinutes,
  getLightEventColor,
  getEventDotColor,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_ICONS,
} from '../time-utils'
import type { Event, TimeSession } from '@milestone/shared'

function makeEvent(overrides: Partial<Event>): Event {
  const now = new Date()
  return {
    id: '1',
    title: 'Test Event',
    description: null,
    start_at: now.toISOString(),
    end_at: new Date(now.getTime() + 3600000).toISOString(),
    type: 'event',
    activity_id: null,
    duration_minutes: null,
    priority: null,
    area_id: null,
    location: null,
    user_id: 'user-1',
    sync_version: 1,
    deleted_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  }
}

function makeSession(overrides: Partial<TimeSession>): TimeSession {
  const now = new Date()
  return {
    id: '1',
    start_at: now.toISOString(),
    end_at: new Date(now.getTime() + 7200000).toISOString(),
    activity_id: 'act-1',
    user_id: 'user-1',
    deleted_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  }
}

function setTime(date: Date, hours: number, minutes = 0): Date {
  const d = new Date(date)
  d.setHours(hours, minutes, 0, 0)
  return d
}

describe('calculateFreeTime', () => {
  it('returns 1440 minutes free with no events', () => {
    const result = calculateFreeTime([], [])
    expect(result.totalFreeMinutes).toBe(1440)
    expect(result.freeSlots.length).toBe(1)
  })

  it('accounts for a single event', () => {
    const today = new Date()
    const event = makeEvent({
      start_at: setTime(today, 9, 0).toISOString(),
      end_at: setTime(today, 11, 0).toISOString(),
    })
    const result = calculateFreeTime([event], [])
    expect(result.totalFreeMinutes).toBe(1320)
    expect(result.busyBlocks.length).toBe(1)
  })

  it('handles overlapping events by merging them', () => {
    const today = new Date()
    const event1 = makeEvent({
      id: '1',
      title: 'Morning meeting',
      start_at: setTime(today, 9, 0).toISOString(),
      end_at: setTime(today, 11, 0).toISOString(),
    })
    const event2 = makeEvent({
      id: '2',
      title: 'Workshop',
      start_at: setTime(today, 10, 0).toISOString(),
      end_at: setTime(today, 12, 0).toISOString(),
    })
    const result = calculateFreeTime([event1, event2], [])
    expect(result.busyBlocks.length).toBe(1)
    expect(result.totalFreeMinutes).toBe(1260)
  })

  it('handles non-overlapping events correctly', () => {
    const today = new Date()
    const event1 = makeEvent({
      id: '1',
      start_at: setTime(today, 9, 0).toISOString(),
      end_at: setTime(today, 10, 0).toISOString(),
    })
    const event2 = makeEvent({
      id: '2',
      start_at: setTime(today, 14, 0).toISOString(),
      end_at: setTime(today, 16, 0).toISOString(),
    })
    const result = calculateFreeTime([event1, event2], [])
    expect(result.busyBlocks.length).toBe(2)
    expect(result.totalFreeMinutes).toBe(1260)
  })

  it('counts sessions as busy time', () => {
    const today = new Date()
    const session = makeSession({
      start_at: setTime(today, 9, 0).toISOString(),
      end_at: setTime(today, 12, 0).toISOString(),
    })
    const result = calculateFreeTime([], [session])
    expect(result.totalFreeMinutes).toBe(1260)
  })

  it('returns 0 free time when fully booked', () => {
    const today = new Date()
    const event = makeEvent({
      start_at: setTime(today, 0, 0).toISOString(),
      end_at: setTime(today, 23, 59).toISOString(),
    })
    const result = calculateFreeTime([event], [])
    expect(result.totalFreeMinutes).toBe(0)
  })
})

describe('suggestNextBlock', () => {
  it('returns null when no free slots', () => {
    const today = new Date()
    const event = makeEvent({
      start_at: setTime(today, 0, 0).toISOString(),
      end_at: setTime(today, 23, 59).toISOString(),
    })
    const result = suggestNextBlock([event], [])
    expect(result).toBeNull()
  })

  it('returns the next available slot', () => {
    const today = new Date()
    const result = suggestNextBlock([], [])
    expect(result).not.toBeNull()
    if (result) {
      expect(result.durationMinutes).toBeGreaterThanOrEqual(15)
    }
  })

  it('suggests a slot after a busy block', () => {
    const today = new Date()
    const event = makeEvent({
      start_at: setTime(today, 0, 0).toISOString(),
      end_at: setTime(today, 12, 0).toISOString(),
    })
    const result = suggestNextBlock([event], [], undefined, 60)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.start.getHours()).toBeGreaterThanOrEqual(12)
    }
  })
})

describe('formatMinutes', () => {
  it('formats only hours', () => {
    expect(formatMinutes(120)).toBe('2h')
  })

  it('formats hours and minutes', () => {
    expect(formatMinutes(150)).toBe('2h 30m')
  })

  it('formats only minutes', () => {
    expect(formatMinutes(45)).toBe('45m')
  })

  it('handles zero', () => {
    expect(formatMinutes(0)).toBe('0m')
  })
})

describe('formatTime', () => {
  it('formats time in HH:MM format', () => {
    const date = new Date('2025-01-15T09:05:00')
    const result = formatTime(date)
    expect(result).toBe('09:05')
  })

  it('pads single-digit hours and minutes', () => {
    const date = new Date('2025-01-15T03:05:00')
    const result = formatTime(date)
    expect(result).toBe('03:05')
  })
})

describe('snapToMinutes', () => {
  it('snaps to nearest 15-minute interval', () => {
    const date = new Date('2025-01-15T09:07:00')
    const result = snapToMinutes(date, 15)
    expect(result.getMinutes()).toBe(0)
  })

  it('snaps down to previous interval when using floor', () => {
    const date = new Date('2025-01-15T09:10:00')
    const result = snapToMinutes(date, 15)
    expect(result.getMinutes()).toBe(0)
  })

  it('keeps same time when already aligned', () => {
    const date = new Date('2025-01-15T09:15:00')
    const result = snapToMinutes(date, 15)
    expect(result.getMinutes()).toBe(15)
  })

  it('snaps to nearest hour by default (60 min)', () => {
    const date = new Date('2025-01-15T09:25:00')
    const result = snapToMinutes(date, 60)
    expect(result.getMinutes()).toBe(0)
  })

  it('snaps to nearest 30-minute interval', () => {
    const date = new Date('2025-01-15T09:42:00')
    const result = snapToMinutes(date, 30)
    expect(result.getMinutes()).toBe(30)
  })
})

describe('getLightEventColor', () => {
  it('returns blue for events', () => {
    expect(getLightEventColor('event')).toContain('bg-blue-100')
  })

  it('returns amber for reminders', () => {
    expect(getLightEventColor('reminder')).toContain('bg-amber-100')
  })

  it('returns purple for work blocks', () => {
    expect(getLightEventColor('work_block')).toContain('bg-purple-100')
  })

  it('returns gray for unknown types', () => {
    expect(getLightEventColor('unknown')).toContain('bg-gray-100')
  })
})

describe('getEventDotColor', () => {
  it('returns blue for events', () => {
    expect(getEventDotColor('event')).toBe('bg-blue-500')
  })

  it('returns amber for reminders', () => {
    expect(getEventDotColor('reminder')).toBe('bg-amber-500')
  })

  it('returns purple for work blocks', () => {
    expect(getEventDotColor('work_block')).toBe('bg-purple-500')
  })

  it('returns gray for unknown types', () => {
    expect(getEventDotColor('unknown')).toBe('bg-gray-400')
  })
})

describe('EVENT_TYPE_LABELS', () => {
  it('has label for every event type', () => {
    expect(EVENT_TYPE_LABELS.event).toBe('Evento')
    expect(EVENT_TYPE_LABELS.reminder).toBe('Recordatorio')
    expect(EVENT_TYPE_LABELS.work_block).toBe('Bloque de trabajo')
  })
})

describe('EVENT_TYPE_ICONS', () => {
  it('has icon for every event type', () => {
    expect(EVENT_TYPE_ICONS.event).toBe('📅')
    expect(EVENT_TYPE_ICONS.reminder).toBe('🔔')
    expect(EVENT_TYPE_ICONS.work_block).toBe('⏰')
  })
})

describe('detectConflicts', () => {
  const baseEvents = [
    { id: '1', title: 'Meeting', start_at: '2025-01-15T09:00:00Z', end_at: '2025-01-15T11:00:00Z' },
    {
      id: '2',
      title: 'Workshop',
      start_at: '2025-01-15T14:00:00Z',
      end_at: '2025-01-15T16:00:00Z',
    },
  ]

  it('detects no conflict when slot is free', () => {
    const result = detectConflicts(
      baseEvents,
      new Date('2025-01-15T11:00:00Z'),
      new Date('2025-01-15T13:00:00Z'),
    )
    expect(result.hasConflict).toBe(false)
    expect(result.conflicting).toHaveLength(0)
  })

  it('detects conflict when slot overlaps', () => {
    const result = detectConflicts(
      baseEvents,
      new Date('2025-01-15T10:00:00Z'),
      new Date('2025-01-15T12:00:00Z'),
    )
    expect(result.hasConflict).toBe(true)
    expect(result.conflicting).toHaveLength(1)
    expect(result.conflicting[0]!.id).toBe('1')
  })

  it('excludes event by id', () => {
    const result = detectConflicts(
      baseEvents,
      new Date('2025-01-15T09:00:00Z'),
      new Date('2025-01-15T11:00:00Z'),
      '1',
    )
    expect(result.hasConflict).toBe(false)
  })

  it('detects multiple conflicts', () => {
    const events = [
      ...baseEvents,
      { id: '3', title: 'Lunch', start_at: '2025-01-15T12:00:00Z', end_at: '2025-01-15T13:00:00Z' },
    ]
    const result = detectConflicts(
      events,
      new Date('2025-01-15T10:00:00Z'),
      new Date('2025-01-15T15:00:00Z'),
    )
    expect(result.hasConflict).toBe(true)
    expect(result.conflicting.length).toBeGreaterThanOrEqual(2)
  })
})
