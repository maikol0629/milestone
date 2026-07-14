import { z } from 'zod'

export const goalSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().nullable(),
  life_area_id: z.uuid(),
  user_id: z.uuid(),
  deleted_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const createGoalSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().nullable().optional(),
  life_area_id: z.uuid('Área de vida inválida'),
})

export const updateGoalSchema = createGoalSchema.partial()

export type Goal = z.infer<typeof goalSchema>
export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
