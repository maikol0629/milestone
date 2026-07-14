'use client'

import type { Project, CreateProjectInput, UpdateProjectInput } from '@milestone/shared'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { apiRequest } from '@/lib/api-client'

export function useProjects(params?: { goal_id?: string }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const res = await apiRequest<Project[]>('/projects', {
        params: params as Record<string, string | undefined>,
      })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const res = await apiRequest<Project>(`/projects/${id}`)
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation<Project, Error, CreateProjectInput>({
    mutationFn: async (data) => {
      const res = await apiRequest<Project>('/projects', { method: 'POST', body: data })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation<
    Project,
    Error,
    UpdateProjectInput & { id: string },
    { previous: Project[] | undefined }
  >({
    mutationFn: async ({ id, ...data }) => {
      const res = await apiRequest<Project>(`/projects/${id}`, { method: 'PATCH', body: data })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const previous = queryClient.getQueryData<Project[]>(['projects'])
      queryClient.setQueryData<Project[]>(['projects'], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...data } : item)),
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['projects'], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation<Project, Error, string, { previous: Project[] | undefined }>({
    mutationFn: async (id) => {
      const res = await apiRequest<Project>(`/projects/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const previous = queryClient.getQueryData<Project[]>(['projects'])
      queryClient.setQueryData<Project[]>(['projects'], (old) =>
        old?.filter((item) => item.id !== id),
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['projects'], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
