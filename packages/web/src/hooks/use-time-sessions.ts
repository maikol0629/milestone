'use client'

import type { TimeSession, CreateTimeSessionInput, UpdateTimeSessionInput } from '@milestone/shared'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '@/lib/api-client'

export function useTimeSessions(params?: { activity_id?: string }) {
  return useQuery({
    queryKey: ['time-sessions', params],
    queryFn: async () => {
      const res = await apiRequest<TimeSession[]>('/time-sessions', {
        params: params as Record<string, string | undefined>,
      })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
  })
}

export function useTimeSession(id: string) {
  return useQuery({
    queryKey: ['time-sessions', id],
    queryFn: async () => {
      const res = await apiRequest<TimeSession>(`/time-sessions/${id}`)
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateTimeSession() {
  const queryClient = useQueryClient()
  return useMutation<TimeSession, Error, CreateTimeSessionInput>({
    mutationFn: async (data) => {
      const res = await apiRequest<TimeSession>('/time-sessions', { method: 'POST', body: data })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['time-sessions'] })
    },
  })
}

export function useUpdateTimeSession() {
  const queryClient = useQueryClient()
  return useMutation<
    TimeSession,
    Error,
    UpdateTimeSessionInput & { id: string },
    { previous: TimeSession[] | undefined }
  >({
    mutationFn: async ({ id, ...data }) => {
      const res = await apiRequest<TimeSession>(`/time-sessions/${id}`, {
        method: 'PATCH',
        body: data,
      })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['time-sessions'] })
      const previous = queryClient.getQueryData<TimeSession[]>(['time-sessions'])
      queryClient.setQueryData<TimeSession[]>(['time-sessions'], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item)),
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['time-sessions'], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['time-sessions'] })
    },
  })
}

export function useDeleteTimeSession() {
  const queryClient = useQueryClient()
  return useMutation<TimeSession, Error, string, { previous: TimeSession[] | undefined }>({
    mutationFn: async (id) => {
      const res = await apiRequest<TimeSession>(`/time-sessions/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['time-sessions'] })
      const previous = queryClient.getQueryData<TimeSession[]>(['time-sessions'])
      queryClient.setQueryData<TimeSession[]>(['time-sessions'], (old) =>
        old?.filter((item) => item.id !== id),
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['time-sessions'], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['time-sessions'] })
    },
  })
}
