'use client'

import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { useNetworkStatus } from '@/hooks/use-network-status'
import { useAuthStore } from '@/lib/auth-store'
import { clearQueue, getQueueLength, processSyncQueue, pullChanges } from '@/lib/sync-engine'

const SYNC_TIMESTAMP_KEY = 'milestone-sync-timestamp'
const PULL_INTERVAL = 5 * 60 * 1000
const FRESH_SYNC_WINDOW_MS = 60 * 1000

interface SyncState {
  isOnline: boolean
  isSyncing: boolean
  queueLength: number
  lastSyncAt: Date | null
}

const SyncContext = createContext<SyncState>({
  isOnline: true,
  isSyncing: false,
  queueLength: 0,
  lastSyncAt: null,
})

export function useSyncState() {
  return useContext(SyncContext)
}

type SyncProviderProps = Readonly<{ children: React.ReactNode }>

export function SyncProvider({ children }: SyncProviderProps) {
  const queryClient = useQueryClient()
  const { isOnline } = useNetworkStatus()
  const user = useAuthStore((s) => s.user)
  const [isSyncing, setIsSyncing] = useState(false)
  const [queueLength, setQueueLength] = useState(getQueueLength())
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const wasOffline = useRef(false)

  useEffect(() => {
    if (!user) return

    const lastTimestamp = localStorage.getItem(SYNC_TIMESTAMP_KEY)

    if (!lastTimestamp) return

    const lastSyncTime = new Date(lastTimestamp).getTime()
    if (Number.isFinite(lastSyncTime) && Date.now() - lastSyncTime < FRESH_SYNC_WINDOW_MS) {
      return
    }

    void (async () => {
      try {
        setIsSyncing(true)
        const result = await pullChanges(lastTimestamp)
        localStorage.setItem(SYNC_TIMESTAMP_KEY, result.server_timestamp)
        setLastSyncAt(new Date())
      } catch (err) {
        console.error('Pull inicial falló:', err)
      } finally {
        setIsSyncing(false)
      }
    })()
  }, [user, queryClient])

  useEffect(() => {
    if (isOnline && wasOffline.current) {
      void (async () => {
        setIsSyncing(true)
        try {
          await processSyncQueue()
          setQueueLength(getQueueLength())
          const lastTimestamp = localStorage.getItem(SYNC_TIMESTAMP_KEY)
          if (lastTimestamp) {
            const result = await pullChanges(lastTimestamp)
            localStorage.setItem(SYNC_TIMESTAMP_KEY, result.server_timestamp)
            setLastSyncAt(new Date())
            await queryClient.invalidateQueries({
              queryKey: ['events'],
            })
            await queryClient.invalidateQueries({
              queryKey: ['time-sessions'],
            })
          }
        } catch (err) {
          console.error('Sincronización al reconectar falló:', err)
        } finally {
          setIsSyncing(false)
        }
      })()
    }
    wasOffline.current = !isOnline
  }, [isOnline, queryClient])

  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void (async () => {
        try {
          const lastTimestamp = localStorage.getItem(SYNC_TIMESTAMP_KEY)
          if (lastTimestamp) {
            const result = await pullChanges(lastTimestamp)
            localStorage.setItem(SYNC_TIMESTAMP_KEY, result.server_timestamp)
            setLastSyncAt(new Date())
            await queryClient.invalidateQueries({
              queryKey: ['events'],
            })
            await queryClient.invalidateQueries({
              queryKey: ['time-sessions'],
            })
          }
        } catch (err) {
          console.error('Sincronización periódica falló:', err)
        }
      })()
    }, PULL_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [user, queryClient])

  useEffect(() => {
    if (!user) {
      clearQueue()
      localStorage.removeItem(SYNC_TIMESTAMP_KEY)
      setQueueLength(0)
    }
  }, [user])

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueLength(getQueueLength())
    }, 5000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const syncState = useMemo(
    () => ({ isOnline, isSyncing, queueLength, lastSyncAt }),
    [isOnline, isSyncing, queueLength, lastSyncAt],
  )

  return <SyncContext.Provider value={syncState}>{children}</SyncContext.Provider>
}
