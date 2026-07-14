import { z } from 'zod'

export const activitySchema = z.object({
  id: z.uuid(),
  title: z.string().min(1, 'El título es requerido').max(200),
  project_id: z.uuid(),
  user_id: z.uuid(),
  deleted_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const createActivitySchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  project_id: z.uuid('Proyecto inválido'),
})

export const updateActivitySchema = createActivitySchema.partial()

export type Activity = z.infer<typeof activitySchema>
export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
