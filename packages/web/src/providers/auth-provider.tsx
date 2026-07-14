'use client'

import { useEffect, type ReactNode } from 'react'

import { useAuthStore } from '@/lib/auth-store'
import { clearQueue } from '@/lib/sync-engine'

export function AuthProvider({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    void (async () => {
      try {
        await checkAuth()
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    })()
  }, [checkAuth])

  useEffect(() => {
    if (!user) {
      clearQueue()
      localStorage.removeItem('milestone-sync-timestamp')
    }
  }, [user])

  return <>{children}</>
}
