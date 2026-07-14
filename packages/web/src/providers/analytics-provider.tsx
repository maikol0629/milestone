'use client'

import { useEffect, type ReactNode } from 'react'

import { captureEvent, identifyUser, initAnalytics } from '@/lib/analytics'
import { useAuthStore } from '@/lib/auth-store'
import { initSentry } from '@/lib/sentry'

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    initAnalytics()
    initSentry()
  }, [])

  useEffect(() => {
    if (user) {
      identifyUser(user.id, { email: user.email, name: user.name ?? undefined })
      captureEvent('user_login', { email: user.email })
    }
  }, [user])

  return <>{children}</>
}
