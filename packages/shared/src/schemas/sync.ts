import { z } from 'zod'

export const syncEntitySchema = z.enum([
  'life_area',
  'goal',
  'project',
  'activity',
  'event',
  'time_session',
])

export const syncActionSchema = z.enum(['create', 'update', 'delete'])

export const syncChangeSchema = z.object({
  entity: syncEntitySchema,
  action: syncActionSchema,
  data: z.record(z.string(), z.unknown()),
  client_timestamp: z.iso.datetime(),
})

export const syncPushSchema = z.object({
  changes: z.array(syncChangeSchema).max(100, 'Máximo 100 cambios por lote'),
})

export const syncPullSchema = z.object({
  last_sync_timestamp: z.iso.datetime(),
})

export const syncConflictSchema = z.object({
  entity: syncEntitySchema,
  entity_id: z.string(),
  local_version: z.number().int(),
  server_version: z.number().int(),
  local_data: z.record(z.string(), z.unknown()),
  server_data: z.record(z.string(), z.unknown()),
})

export const syncPushResponseSchema = z.object({
  accepted: z.array(z.string()),
  conflicts: z.array(syncConflictSchema),
})

export const syncPullResponseSchema = z.object({
  changes: z.array(syncChangeSchema),
  server_timestamp: z.iso.datetime(),
})

export type SyncEntity = z.infer<typeof syncEntitySchema>
export type SyncAction = z.infer<typeof syncActionSchema>
export type SyncChange = z.infer<typeof syncChangeSchema>
export type SyncPushInput = z.infer<typeof syncPushSchema>
export type SyncPullInput = z.infer<typeof syncPullSchema>
export type SyncConflict = z.infer<typeof syncConflictSchema>
export type SyncPushResponse = z.infer<typeof syncPushResponseSchema>
export type SyncPullResponse = z.infer<typeof syncPullResponseSchema>
