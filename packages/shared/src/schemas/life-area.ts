import { z } from 'zod'

export const lifeAreaSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  color: z.string().nullable(),
  user_id: z.uuid(),
  deleted_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const createLifeAreaSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  color: z.string().nullable().optional(),
})

export const updateLifeAreaSchema = createLifeAreaSchema.partial()

export type LifeArea = z.infer<typeof lifeAreaSchema>
export type CreateLifeAreaInput = z.infer<typeof createLifeAreaSchema>
export type UpdateLifeAreaInput = z.infer<typeof updateLifeAreaSchema>
