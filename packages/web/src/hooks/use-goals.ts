'use client'

import type { Goal, CreateGoalInput, UpdateGoalInput } from '@milestone/shared'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '@/lib/api-client'

export function useGoals(params?: { life_area_id?: string }) {
  return useQuery({
    queryKey: ['goals', params],
    queryFn: async () => {
      const res = await apiRequest<Goal[]>('/goals', {
        params: params as Record<string, string | undefined>,
      })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
  })
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goals', id],
    queryFn: async () => {
      const res = await apiRequest<Goal>(`/goals/${id}`)
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation<Goal, Error, CreateGoalInput>({
    mutationFn: async (data) => {
      const res = await apiRequest<Goal>('/goals', { method: 'POST', body: data })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  return useMutation<
    Goal,
    Error,
    UpdateGoalInput & { id: string },
    { previous: Goal[] | undefined }
  >({
    mutationFn: async ({ id, ...data }) => {
      const res = await apiRequest<Goal>(`/goals/${id}`, { method: 'PATCH', body: data })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      const previous = queryClient.getQueryData<Goal[]>(['goals'])
      queryClient.setQueryData<Goal[]>(['goals'], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item)),
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['goals'], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation<Goal, Error, string, { previous: Goal[] | undefined }>({
    mutationFn: async (id) => {
      const res = await apiRequest<Goal>(`/goals/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      const previous = queryClient.getQueryData<Goal[]>(['goals'])
      queryClient.setQueryData<Goal[]>(['goals'], (old) => old?.filter((item) => item.id !== id))
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['goals'], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}
