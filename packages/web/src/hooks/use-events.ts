'use client'

import type { Event, CreateEventInput, UpdateEventInput } from '@milestone/shared'
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '@/lib/api-client'

interface EventsData {
  items: Event[]
  meta: { page: number; limit: number; total: number }
}

export function useEvents(params?: {
  start?: string
  end?: string
  type?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: async () => {
      const res = await apiRequest<Event[]>('/events', {
        params: params as Record<string, string | number | undefined>,
      })
      if (!res.success) throw new Error(res.error.message)
      return { items: res.data, meta: res.meta ?? { page: 1, limit: 50, total: res.data.length } }
    },
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const res = await apiRequest<Event>(`/events/${id}`)
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation<Event, Error, CreateEventInput>({
    mutationFn: async (data) => {
      const res = await apiRequest<Event>('/events', { method: 'POST', body: data })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] }).catch(() => undefined)
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation<
    Event,
    Error,
    UpdateEventInput & { id: string },
    { previous: [readonly unknown[], EventsData | undefined][] }
  >({
    mutationFn: async ({ id, ...data }) => {
      const res = await apiRequest<Event>(`/events/${id}`, { method: 'PATCH', body: data })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['events'] })
      const previous = queryClient.getQueriesData<EventsData>({ queryKey: ['events'] })
      queryClient.setQueriesData<EventsData>({ queryKey: ['events'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((item) => {
            if (item.id !== id) return item

            let recurrenceEndDate = item.recurrence_end_date
            if (data.recurrence_end_date !== undefined) {
              recurrenceEndDate =
                data.recurrence_end_date === null ? null : new Date(data.recurrence_end_date)
            }

            let milestoneDate = item.milestone_date
            if (data.milestone_date !== undefined) {
              milestoneDate = data.milestone_date === null ? null : new Date(data.milestone_date)
            }

            return {
              ...item,
              ...data,
              start_at: data.start_at !== undefined ? new Date(data.start_at) : item.start_at,
              end_at: data.end_at !== undefined ? new Date(data.end_at) : item.end_at,
              recurrence_end_date: recurrenceEndDate,
              milestone_date: milestoneDate,
            }
          }),
        }
      })
      return { previous }
    },
    onError: (_err, _data, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] }).catch(() => undefined)
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation<
    Event,
    Error,
    string,
    { previous: [readonly unknown[], EventsData | undefined][] }
  >({
    mutationFn: async (id) => {
      const res = await apiRequest<Event>(`/events/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['events'] })
      const previous = queryClient.getQueriesData<EventsData>({ queryKey: ['events'] })
      queryClient.setQueriesData<EventsData>({ queryKey: ['events'] }, (old) => {
        if (!old) return old
        return { ...old, items: old.items.filter((item) => item.id !== id) }
      })
      return { previous }
    },
    onError: (_err, _data, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] }).catch(() => undefined)
    },
  })
}
