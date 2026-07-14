'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { apiRequest } from '@/lib/api-client'

interface EventItem {
  id: string
  title: string
  start_at: string
}

export function useNotifications() {
  const [upcomingCount, setUpcomingCount] = useState(0)
  const notifiedRef = useRef(new Set<string>())

  const now = new Date()
  const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000)

  const { data } = useQuery({
    queryKey: ['notifications-upcoming', now.getTime()],
    queryFn: async () => {
      const res = await apiRequest<EventItem[]>('/events', {
        params: {
          start: now.toISOString(),
          end: fifteenMinutesLater.toISOString(),
          limit: 50,
        },
      })
      if (!res.success) throw new Error(res.error.message)
      return { items: res.data }
    },
    refetchInterval: 60_000,
  })

  useEffect(() => {
    const events = data?.items ?? []
    setUpcomingCount(events.length)

    for (const event of events) {
      if (!notifiedRef.current.has(event.id)) {
        notifiedRef.current.add(event.id)
        const startTime = new Date(event.start_at).toLocaleTimeString('es', {
          hour: '2-digit',
          minute: '2-digit',
        })
        toast(`🔔 ${event.title}`, {
          description: `Comienza a las ${startTime}`,
          duration: 5000,
        })
      }
    }
  }, [data])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        notifiedRef.current.clear()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { upcomingCount }
}
