import type { SyncChange, SyncEntity } from '@milestone/shared'
import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service.js'

const ENTITY_MAP: Record<SyncEntity, string> = {
  life_area: 'lifeArea',
  goal: 'goal',
  project: 'project',
  activity: 'activity',
  event: 'event',
  time_session: 'timeSession',
}

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async push(userId: string, changes: SyncChange[]) {
    const accepted: string[] = []
    const conflicts: {
      entity: string
      entity_id: string
      local_version: number
      server_version: number
    }[] = []

    for (const change of changes) {
      try {
        const model = ENTITY_MAP[change.entity]
        if (!model) continue

        const entityId = change.data.id as string | undefined
        if (!entityId) continue

        if (change.action === 'delete') {
          await this.prisma.softDelete(model, entityId)
          accepted.push(entityId)
          continue
        }

        const delegate = (this.prisma as unknown as Record<string, unknown>)[model] as {
          findUnique: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null>
          upsert: (args: {
            where: { id: string }
            create: Record<string, unknown>
            update: Record<string, unknown>
          }) => Promise<unknown>
        }
        const existing = await delegate.findUnique({ where: { id: entityId } })

        if (existing && existing.user_id !== userId) {
          continue
        }

        if (existing && change.action === 'update') {
          const incomingVersion = change.data.sync_version as number | undefined
          if (
            incomingVersion !== undefined &&
            incomingVersion < ((existing.sync_version as number) ?? 0)
          ) {
            conflicts.push({
              entity: change.entity,
              entity_id: entityId,
              local_version: incomingVersion,
              server_version: (existing.sync_version as number) ?? 0,
            })
            continue
          }
        }

        const currentVersion = (existing?.sync_version as number) ?? 0
        const upsertData: Record<string, unknown> = {
          ...change.data,
          user_id: userId,
          sync_version: currentVersion + 1,
        }

        if (typeof upsertData.start_at === 'string')
          upsertData.start_at = new Date(upsertData.start_at)
        if (typeof upsertData.end_at === 'string') upsertData.end_at = new Date(upsertData.end_at)
        delete upsertData.created_at
        delete upsertData.updated_at

        await delegate.upsert({
          where: { id: entityId },
          create: { id: entityId, ...upsertData },
          update: upsertData,
        })

        accepted.push(entityId)
      } catch {
        continue
      }
    }

    return { accepted, conflicts }
  }

  async pull(userId: string, lastSyncTimestamp: string) {
    const since = new Date(lastSyncTimestamp)
    const changes: SyncChange[] = []

    for (const [entityName, modelName] of Object.entries(ENTITY_MAP)) {
      const delegate = (this.prisma as unknown as Record<string, unknown>)[modelName] as {
        findMany: (args: {
          where: { user_id: string; updated_at: { gte: Date } }
        }) => Promise<Record<string, unknown>[]>
      }
      const records = await delegate.findMany({
        where: {
          user_id: userId,
          updated_at: { gte: since },
        },
      })

      for (const record of records) {
        const action = record.deleted_at ? 'delete' : 'update'
        changes.push({
          entity: entityName as SyncEntity,
          action: action as 'create' | 'update' | 'delete',
          data: record as Record<string, unknown>,
          client_timestamp: String(record.updated_at),
        })
      }
    }

    return {
      changes,
      server_timestamp: new Date().toISOString(),
    }
  }
}
