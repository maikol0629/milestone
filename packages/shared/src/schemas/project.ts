import { z } from 'zod'

export const projectSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  goal_id: z.uuid(),
  user_id: z.uuid(),
  deleted_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  goal_id: z.uuid('Objetivo inválido'),
})

export const updateProjectSchema = createProjectSchema.partial()

export type Project = z.infer<typeof projectSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
