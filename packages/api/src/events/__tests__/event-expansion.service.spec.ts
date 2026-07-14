import { Test, type TestingModule } from '@nestjs/testing'
import { EventExpansionService } from '../event-expansion.service'
import type { Event } from '@milestone/shared'

describe('EventExpansionService', () => {
  let service: EventExpansionService

  const mockRecurringEvent: Event = {
    id: 'event-1',
    title: 'Daily Meeting',
    description: null,
    start_at: new Date('2026-07-14T10:00:00Z'),
    end_at: new Date('2026-07-14T10:30:00Z'),
    type: 'event',
    activity_id: null,
    user_id: 'user-1',
    sync_version: 1,
    recurrence_rule: 'daily',
    recurrence_interval: 1,
    recurrence_days_of_week: null,
    recurrence_end_date: new Date('2026-07-20T23:59:59Z'),
    is_milestone: false,
    milestone_date: null,
    duration_minutes: null,
    priority: null,
    area_id: null,
    location: null,
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  }

  const mockMilestone: Event = {
    id: 'event-2',
    title: 'Project Launch',
    description: null,
    start_at: new Date('2026-08-01T00:00:00Z'),
    end_at: new Date('2026-08-01T23:59:59Z'),
    type: 'event',
    activity_id: null,
    user_id: 'user-1',
    sync_version: 1,
    recurrence_rule: null,
    recurrence_interval: null,
    recurrence_days_of_week: null,
    recurrence_end_date: null,
    is_milestone: true,
    milestone_date: new Date('2026-08-01T00:00:00Z'),
    duration_minutes: null,
    priority: null,
    area_id: null,
    location: null,
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventExpansionService],
    }).compile()

    service = module.get<EventExpansionService>(EventExpansionService)
  })

  describe('expandEventsByDateRange', () => {
    it('should expand recurring events within date range', () => {
      const startDate = new Date('2026-07-14T00:00:00Z')
      const endDate = new Date('2026-07-20T23:59:59Z')

      const result = service.expandEventsByDateRange([mockRecurringEvent], startDate, endDate)

      expect(result.length).toBe(7) // 7 days of events
      expect(result[0]?.is_recurring_instance).toBe(true)
      expect(result[0]?.start_at).toEqual(mockRecurringEvent.start_at)
    })

    it('should include non-recurring events if within range', () => {
      const startDate = new Date('2026-07-01T00:00:00Z')
      const endDate = new Date('2026-08-31T23:59:59Z')

      const result = service.expandEventsByDateRange(
        [mockRecurringEvent, mockMilestone],
        startDate,
        endDate,
      )

      expect(result.some((e) => e.id === 'event-1')).toBe(true) // Recurring event
      expect(result.some((e) => e.id === 'event-2')).toBe(true) // Milestone
    })

    it('should exclude events outside date range', () => {
      const startDate = new Date('2026-08-01T00:00:00Z')
      const endDate = new Date('2026-08-31T23:59:59Z')

      const result = service.expandEventsByDateRange([mockRecurringEvent], startDate, endDate)

      expect(result.length).toBe(0) // Recurring event ends before this range
    })

    it('should maintain sort order by date', () => {
      const startDate = new Date('2026-07-14T00:00:00Z')
      const endDate = new Date('2026-07-20T23:59:59Z')

      const result = service.expandEventsByDateRange([mockRecurringEvent], startDate, endDate)

      for (let i = 1; i < result.length; i++) {
        const current = result[i]
        const previous = result[i - 1]
        if (current && previous) {
          expect(new Date(current.start_at).getTime()).toBeGreaterThanOrEqual(
            new Date(previous.start_at).getTime(),
          )
        }
      }
    })
  })

  describe('getNextOccurrences', () => {
    it('should return next N occurrences of recurring event', () => {
      const result = service.getNextOccurrences(mockRecurringEvent, 3)

      expect(result.length).toBeLessThanOrEqual(3)
      expect(result[0]?.is_recurring_instance).toBe(true)
    })

    it('should return original event for non-recurring event', () => {
      const result = service.getNextOccurrences(mockMilestone, 5)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: mockMilestone.id,
        title: mockMilestone.title,
        start_at: mockMilestone.start_at,
        end_at: mockMilestone.end_at,
        recurrence_rule: null,
      })
    })
  })

  describe('getRecurrenceSummary', () => {
    it('should format daily recurrence summary', () => {
      const summary = service.getRecurrenceSummary(mockRecurringEvent)

      expect(summary).toContain('Cada 1 día')
      expect(summary).toContain('hasta')
    })

    it('should format non-recurring as single event', () => {
      const summary = service.getRecurrenceSummary(mockMilestone)

      expect(summary).toBe('Una sola vez')
    })

    it('should format weekly recurrence with days', () => {
      const weeklyEvent: Event = {
        ...mockRecurringEvent,
        recurrence_rule: 'weekly',
        recurrence_days_of_week: '1,3,5',
      }

      const summary = service.getRecurrenceSummary(weeklyEvent)

      expect(summary).toContain('Cada 1 semana')
      expect(summary).toContain('Lun')
      expect(summary).toContain('Mié')
      expect(summary).toContain('Vie')
    })
  })
})
