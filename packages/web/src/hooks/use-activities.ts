'use client'

import type { Activity, CreateActivityInput, UpdateActivityInput } from '@milestone/shared'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '@/lib/api-client'

export function useActivities(params?: { project_id?: string }) {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: async () => {
      const res = await apiRequest<Activity[]>('/activities', {
        params: params as Record<string, string | undefined>,
      })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
  })
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ['activities', id],
    queryFn: async () => {
      const res = await apiRequest<Activity>(`/activities/${id}`)
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation<Activity, Error, CreateActivityInput>({
    mutationFn: async (data) => {
      const res = await apiRequest<Activity>('/activities', { method: 'POST', body: data })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  return useMutation<
    Activity,
    Error,
    UpdateActivityInput & { id: string },
    { previous: Activity[] | undefined }
  >({
    mutationFn: async ({ id, ...data }) => {
      const res = await apiRequest<Activity>(`/activities/${id}`, { method: 'PATCH', body: data })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['activities'] })
      const previous = queryClient.getQueryData<Activity[]>(['activities'])
      queryClient.setQueryData<Activity[]>(['activities'], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item)),
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['activities'], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  return useMutation<Activity, Error, string, { previous: Activity[] | undefined }>({
    mutationFn: async (id) => {
      const res = await apiRequest<Activity>(`/activities/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['activities'] })
      const previous = queryClient.getQueryData<Activity[]>(['activities'])
      queryClient.setQueryData<Activity[]>(['activities'], (old) =>
        old?.filter((item) => item.id !== id),
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['activities'], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
