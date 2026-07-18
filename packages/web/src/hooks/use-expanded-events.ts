'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { apiRequest } from '@/lib/api-client'

export interface ExpandedEventData {
  id: string
  title: string
  description: string | null
  start_at: string
  end_at: string
  type: 'event' | 'reminder' | 'work_block'
  activity_id: string | null
  duration_minutes: number | null
  priority: string | null
  area_id: string | null
  location: string | null
  user_id: string
  sync_version: number
  occurrence_date?: string
  is_recurring_instance?: boolean
  recurrence_rule?: string | null
  recurrence_interval?: number | null
  recurrence_days_of_week?: string | null
  recurrence_end_date?: string | null
  is_milestone: boolean
  milestone_date: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export function useExpandedEvents(params: { start: string; end: string }, enabled = true) {
  return useQuery({
    queryKey: ['events', 'expanded', params],
    queryFn: async () => {
      const res = await apiRequest<ExpandedEventData[]>('/events/expanded', {
        params: params,
      })
      if (!res.success) throw new Error(res.error.message)
      return { items: res.data, meta: res.meta ?? { total: res.data.length } }
    },
    placeholderData: keepPreviousData,
    retry: false,
    enabled,
  })
}
