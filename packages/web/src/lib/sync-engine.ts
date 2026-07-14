'use client'

import type { SyncChange } from '@milestone/shared'

import { apiRequest } from './api-client'

interface PendingChange {
  id: string
  entity: string
  action: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
  timestamp: string
}

const STORAGE_KEY = 'milestone-sync-queue'
const MAX_BATCH_SIZE = 100
const MAX_QUEUE_SIZE = 500

function getQueue(): PendingChange[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PendingChange[]) : []
  } catch {
    return []
  }
}

function saveQueue(queue: PendingChange[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

function deduplicate(queue: PendingChange[]): PendingChange[] {
  const seen = new Map<string, PendingChange>()
  for (const change of queue) {
    if (change.action === 'delete') {
      seen.set(change.data.id as string, change)
    } else {
      seen.set(change.data.id as string, change)
    }
  }
  return Array.from(seen.values())
}

export function enqueueChange(change: Omit<PendingChange, 'id' | 'timestamp'>) {
  const queue = getQueue()
  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn('Sync queue llena — eliminando cambios antiguos')
    queue.splice(0, queue.length - MAX_QUEUE_SIZE + 1)
  }
  queue.push({
    ...change,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  })
  saveQueue(deduplicate(queue))
}

export function clearQueue() {
  saveQueue([])
}

export function getPendingEntityIds(): string[] {
  return getQueue().map((c) => c.data.id as string)
}

export async function processSyncQueue(): Promise<{ processed: number; failed: number }> {
  let queue = getQueue()
  if (queue.length === 0) return { processed: 0, failed: 0 }

  queue = deduplicate(queue)
  let processed = 0
  let failed = 0

  // Process in batches
  while (queue.length > 0) {
    const batch = queue.splice(0, MAX_BATCH_SIZE)
    const res = await apiRequest('/sync/push', {
      method: 'POST',
      body: {
        changes: batch.map((change) => ({
          entity: change.entity,
          action: change.action,
          data: change.data,
          client_timestamp: change.timestamp,
        })),
      },
    })

    if (res.success) {
      processed += batch.length
    } else {
      failed += batch.length
    }
  }

  saveQueue([])
  return { processed, failed }
}

export async function pullChanges(lastSyncTimestamp: string) {
  const res = await apiRequest<{
    changes: SyncChange[]
    server_timestamp: string
  }>('/sync/pull', {
    method: 'POST',
    body: { last_sync_timestamp: lastSyncTimestamp },
  })

  if (!res.success) {
    throw new Error(res.error.message)
  }

  return res.data
}

export function getQueueLength(): number {
  return getQueue().length
}
