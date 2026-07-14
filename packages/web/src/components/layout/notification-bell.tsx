'use client'

import { Bell } from 'lucide-react'

import { useNotifications } from '@/hooks/use-notifications'

export function NotificationBell() {
  const { upcomingCount } = useNotifications()

  return (
    <div className="relative inline-flex items-center">
      <Bell className="h-5 w-5" aria-hidden="true" />
      {upcomingCount > 0 && (
        <span
          role="status"
          className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
        >
          {upcomingCount > 9 ? '9+' : upcomingCount}
        </span>
      )}
    </div>
  )
}
