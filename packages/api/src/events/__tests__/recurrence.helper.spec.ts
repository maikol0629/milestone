import {
  generateRecurrenceDates,
  isValidRecurrenceConfig,
  getNextOccurrence,
  formatRecurrenceDays,
} from '../recurrence.helper'

describe('Recurrence Helper', () => {
  describe('generateRecurrenceDates', () => {
    it('should generate daily recurrence dates', () => {
      const startDate = new Date('2026-07-14T10:00:00Z')
      const config = {
        recurrence_rule: 'daily' as const,
        recurrence_interval: 1,
        recurrence_days_of_week: null,
        recurrence_end_date: new Date('2026-07-18T23:59:59Z'),
      }

      const dates = generateRecurrenceDates(startDate, config)

      expect(dates).toHaveLength(5) // 14, 15, 16, 17, 18
      expect(dates[0]?.getDate()).toBe(14)
      expect(dates[4]?.getDate()).toBe(18)
    })

    it('should generate daily recurrence with interval', () => {
      const startDate = new Date('2026-07-14T10:00:00Z')
      const config = {
        recurrence_rule: 'daily' as const,
        recurrence_interval: 2,
        recurrence_days_of_week: null,
        recurrence_end_date: new Date('2026-07-20T23:59:59Z'),
      }

      const dates = generateRecurrenceDates(startDate, config)

      expect(dates).toHaveLength(4) // 14, 16, 18, 20
      expect(dates.map((d) => d.getDate())).toEqual([14, 16, 18, 20])
    })

    it('should generate weekly recurrence on specific days', () => {
      const startDate = new Date('2026-07-13T10:00:00Z') // Monday
      const config = {
        recurrence_rule: 'weekly' as const,
        recurrence_interval: 1,
        recurrence_days_of_week: '1,3,5', // Mon, Wed, Fri
        recurrence_end_date: new Date('2026-07-31T23:59:59Z'),
      }

      const dates = generateRecurrenceDates(startDate, config)

      // Should have 3 occurrences per week * 2.7 weeks ≈ 8 dates
      expect(dates.length).toBeGreaterThan(0)
      expect(dates[0]?.getDay()).toBe(1) // Monday
    })

    it('should return empty array for non-recurring event', () => {
      const startDate = new Date('2026-07-14T10:00:00Z')
      const config = {
        recurrence_rule: null,
        recurrence_interval: null,
        recurrence_days_of_week: null,
        recurrence_end_date: null,
      }

      const dates = generateRecurrenceDates(startDate, config)

      expect(dates).toHaveLength(0)
    })
  })

  describe('isValidRecurrenceConfig', () => {
    it('should accept valid daily config', () => {
      const config = {
        recurrence_rule: 'daily' as const,
        recurrence_interval: 1,
        recurrence_days_of_week: null,
        recurrence_end_date: null,
      }

      expect(isValidRecurrenceConfig(config)).toBe(true)
    })

    it('should accept valid weekly config', () => {
      const config = {
        recurrence_rule: 'weekly' as const,
        recurrence_interval: 1,
        recurrence_days_of_week: '1,3,5',
        recurrence_end_date: null,
      }

      expect(isValidRecurrenceConfig(config)).toBe(true)
    })

    it('should reject invalid interval', () => {
      const config = {
        recurrence_rule: 'daily' as const,
        recurrence_interval: -1,
        recurrence_days_of_week: null,
        recurrence_end_date: null,
      }

      expect(isValidRecurrenceConfig(config)).toBe(false)
    })

    it('should reject invalid days of week', () => {
      const config = {
        recurrence_rule: 'weekly' as const,
        recurrence_interval: 1,
        recurrence_days_of_week: '1,3,8', // 8 is invalid
        recurrence_end_date: null,
      }

      expect(isValidRecurrenceConfig(config)).toBe(false)
    })

    it('should accept null recurrence rule', () => {
      const config = {
        recurrence_rule: null,
        recurrence_interval: null,
        recurrence_days_of_week: null,
        recurrence_end_date: null,
      }

      expect(isValidRecurrenceConfig(config)).toBe(true)
    })
  })

  describe('getNextOccurrence', () => {
    it('should return null for non-recurring event', () => {
      const startDate = new Date('2026-07-14T10:00:00Z')
      const config = {
        recurrence_rule: null,
        recurrence_interval: null,
        recurrence_days_of_week: null,
        recurrence_end_date: null,
      }

      const result = getNextOccurrence(startDate, config)

      expect(result).toBeNull()
    })

    it('should return next occurrence for daily recurring event', () => {
      const startDate = new Date('2026-07-14T10:00:00Z')
      const config = {
        recurrence_rule: 'daily' as const,
        recurrence_interval: 1,
        recurrence_days_of_week: null,
        recurrence_end_date: new Date('2026-12-31T23:59:59Z'),
      }

      const result = getNextOccurrence(startDate, config)

      expect(result).not.toBeNull()
      expect(result?.getTime()).toBeGreaterThan(new Date().getTime())
    })
  })

  describe('formatRecurrenceDays', () => {
    it('should format day numbers to names', () => {
      const result = formatRecurrenceDays('1,3,5')
      expect(result).toEqual(['Monday', 'Wednesday', 'Friday'])
    })

    it('should return empty array for null', () => {
      const result = formatRecurrenceDays(null)
      expect(result).toEqual([])
    })

    it('should include all days correctly', () => {
      const result = formatRecurrenceDays('0,1,2,3,4,5,6')
      expect(result).toHaveLength(7)
      expect(result[0]).toBe('Sunday')
      expect(result[6]).toBe('Saturday')
    })
  })
})
