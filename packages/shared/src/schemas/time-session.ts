import { z } from 'zod'

export const timeSessionSchema = z.object({
  id: z.uuid(),
  start_at: z.iso.datetime(),
  end_at: z.iso.datetime().nullable(),
  activity_id: z.uuid(),
  user_id: z.uuid(),
  deleted_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const createTimeSessionSchema = z.object({
  start_at: z.iso.datetime('Fecha de inicio inválida'),
  end_at: z.iso.datetime().nullable().optional(),
  activity_id: z.uuid('Actividad inválida'),
})

export const updateTimeSessionSchema = z.object({
  start_at: z.iso.datetime().optional(),
  end_at: z.iso.datetime().nullable().optional(),
})

export type TimeSession = z.infer<typeof timeSessionSchema>
export type CreateTimeSessionInput = z.infer<typeof createTimeSessionSchema>
export type UpdateTimeSessionInput = z.infer<typeof updateTimeSessionSchema>
