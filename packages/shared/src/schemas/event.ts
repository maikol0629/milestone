import { z } from 'zod'

export const eventTypeSchema = z.enum(['event', 'reminder', 'work_block'])

export const prioritySchema = z.enum(['low', 'medium', 'high'])

export const recurrenceRuleSchema = z.enum(['daily', 'weekly'])

export const eventSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().nullable(),
  start_at: z.coerce.date(),
  end_at: z.coerce.date(),
  type: eventTypeSchema,
  activity_id: z.uuid().nullable(),
  duration_minutes: z.number().int().positive().nullable(),
  priority: prioritySchema.nullable(),
  area_id: z.uuid().nullable(),
  location: z.string().nullable(),
  user_id: z.uuid(),
  sync_version: z.number().int(),

  recurrence_rule: recurrenceRuleSchema.nullable(),
  recurrence_interval: z.number().int().positive().nullable(),
  recurrence_days_of_week: z.string().nullable(),
  recurrence_end_date: z.coerce.date().nullable(),
  is_milestone: z.boolean(),
  milestone_date: z.coerce.date().nullable(),

  deleted_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export const createEventSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().nullable().optional(),
  start_at: z.iso.datetime(),
  end_at: z.iso.datetime(),
  type: eventTypeSchema.optional(),
  activity_id: z.uuid().nullable().optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  priority: prioritySchema.nullable().optional(),
  area_id: z.uuid().nullable().optional(),
  location: z.string().nullable().optional(),

  // Recurrence fields
  recurrence_rule: recurrenceRuleSchema.nullable().optional(),
  recurrence_interval: z.number().int().positive().nullable().optional(),
  recurrence_days_of_week: z.string().nullable().optional(),
  recurrence_end_date: z.iso.datetime().nullable().optional(),

  // Milestone fields
  is_milestone: z.boolean().optional(),
  milestone_date: z.iso.datetime().nullable().optional(),
})

export const updateEventSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200).optional(),
  description: z.string().nullable().optional(),
  start_at: z.iso.datetime().optional(),
  end_at: z.iso.datetime().optional(),
  type: eventTypeSchema.optional(),
  activity_id: z.uuid().nullable().optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  priority: prioritySchema.nullable().optional(),
  area_id: z.uuid().nullable().optional(),
  location: z.string().nullable().optional(),
  recurrence_rule: recurrenceRuleSchema.nullable().optional(),
  recurrence_interval: z.number().int().positive().nullable().optional(),
  recurrence_days_of_week: z.string().nullable().optional(),
  recurrence_end_date: z.iso.datetime().nullable().optional(),
  is_milestone: z.boolean().optional(),
  milestone_date: z.iso.datetime().nullable().optional(),
})

export const eventQuerySchema = z.object({
  start: z.iso.datetime().optional(),
  end: z.iso.datetime().optional(),
  type: eventTypeSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
})

export type Event = z.infer<typeof eventSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type EventType = z.infer<typeof eventTypeSchema>
export type Priority = z.infer<typeof prioritySchema>
export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>
export type EventQuery = z.infer<typeof eventQuerySchema>
