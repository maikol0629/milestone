'use client'

import type { LifeArea, CreateLifeAreaInput, UpdateLifeAreaInput } from '@milestone/shared'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '@/lib/api-client'

export function useLifeAreas() {
  return useQuery({
    queryKey: ['life-areas'],
    queryFn: async () => {
      const res = await apiRequest<LifeArea[]>('/life-areas')
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
  })
}

export function useLifeArea(id: string) {
  return useQuery({
    queryKey: ['life-areas', id],
    queryFn: async () => {
      const res = await apiRequest<LifeArea>(`/life-areas/${id}`)
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateLifeArea() {
  const queryClient = useQueryClient()
  return useMutation<LifeArea, Error, CreateLifeAreaInput>({
    mutationFn: async (data) => {
      const res = await apiRequest<LifeArea>('/life-areas', { method: 'POST', body: data })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
  })
}

export function useUpdateLifeArea() {
  const queryClient = useQueryClient()
  return useMutation<
    LifeArea,
    Error,
    UpdateLifeAreaInput & { id: string },
    { previous: LifeArea[] | undefined }
  >({
    mutationFn: async ({ id, ...data }) => {
      const res = await apiRequest<LifeArea>(`/life-areas/${id}`, { method: 'PATCH', body: data })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['life-areas'] })
      const previous = queryClient.getQueryData<LifeArea[]>(['life-areas'])
      queryClient.setQueryData<LifeArea[]>(['life-areas'], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item)),
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['life-areas'], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
  })
}

export function useDeleteLifeArea() {
  const queryClient = useQueryClient()
  return useMutation<LifeArea, Error, string, { previous: LifeArea[] | undefined }>({
    mutationFn: async (id) => {
      const res = await apiRequest<LifeArea>(`/life-areas/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['life-areas'] })
      const previous = queryClient.getQueryData<LifeArea[]>(['life-areas'])
      queryClient.setQueryData<LifeArea[]>(['life-areas'], (old) =>
        old?.filter((item) => item.id !== id),
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['life-areas'], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['life-areas'] })
    },
  })
}
