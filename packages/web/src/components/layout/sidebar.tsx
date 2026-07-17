'use client'

import type { Event } from '@milestone/shared'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Search, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { NotificationBell } from '@/components/layout/notification-bell'
import { Badge } from '@/components/ui/badge'
import { apiRequest } from '@/lib/api-client'
import { useAuthStore } from '@/lib/auth-store'
import { getCalendarDefaultEventsParams } from '@/lib/events-query'
import { cn } from '@/lib/utils'
import { useSyncState } from '@/providers/sync-provider'
import { useTheme } from '@/providers/theme-provider'

function formatConnectionStatus(isOnline: boolean, isSyncing: boolean) {
  if (isSyncing) {
    return {
      icon: <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />,
      label: 'Sincronizando...',
    }
  }

  if (isOnline) {
    return {
      icon: <span className="flex h-2 w-2 rounded-full bg-green-500" />,
      label: 'En línea',
    }
  }

  return {
    icon: <WifiOff className="h-3.5 w-3.5 text-destructive" />,
    label: 'Sin conexión',
  }
}

async function prefetchCalendarEvents(queryClient: QueryClient) {
  const params = getCalendarDefaultEventsParams()
  await queryClient.prefetchQuery({
    queryKey: ['events', params],
    queryFn: async () => {
      const res = await apiRequest<{
        items: Event[]
        meta: { page: number; limit: number; total: number }
      }>('/events', { params })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
  })
}

const navGroups = [
  {
    items: [
      { href: '/dashboard', label: 'Inicio', icon: '◇' },
      { href: '/dashboard/calendario', label: 'Calendario', icon: '📅' },
      { href: '/dashboard/tiempo', label: 'Tiempo', icon: '⏱' },
    ],
  },
  {
    items: [
      { href: '/dashboard/areas-vitales', label: 'Áreas', icon: '🌿' },
      { href: '/dashboard/objetivos', label: 'Objetivos', icon: '🎯' },
      { href: '/dashboard/proyectos', label: 'Proyectos', icon: '📋' },
      { href: '/dashboard/actividades', label: 'Actividades', icon: '✅' },
    ],
  },
  {
    items: [
      { href: '/dashboard/estadisticas', label: 'Estadísticas', icon: '📊' },
      { href: '/dashboard/configuracion', label: 'Configuración', icon: '⚙️' },
    ],
  },
]

type NavItem = (typeof navGroups)[number]['items'][number]

function NavLinkItem({
  item,
  pathname,
  onNavigate,
  queryClient,
}: Readonly<{
  item: NavItem
  pathname: string
  onNavigate: () => void
  queryClient: ReturnType<typeof useQueryClient>
}>) {
  const handleMouseEnter = () => {
    if (item.href !== '/dashboard/calendario') return

    prefetchCalendarEvents(queryClient).catch(() => undefined)
  }

  return (
    <Link
      href={item.href}
      onMouseEnter={handleMouseEnter}
      onClick={onNavigate}
      aria-current={pathname === item.href ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        pathname === item.href
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <span className="text-base" aria-hidden="true">
        {item.icon}
      </span>
      {item.label}
    </Link>
  )
}

export function Sidebar() {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { theme, toggle: toggleTheme } = useTheme()
  const { isOnline, isSyncing, queueLength } = useSyncState()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/dashboard/buscar?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          Milestone
        </Link>
      </div>

      <div className="px-4 pt-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              handleSearch(e.target.value)
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar..."
            aria-label="Buscar"
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <nav
        role="navigation"
        aria-label="Navegación principal"
        className="flex-1 overflow-y-auto p-4"
      >
        {navGroups.map((group) => (
          <div
            key={group.items[0]?.href ?? 'group'}
            className={group !== navGroups[0] ? 'mt-2 border-t pt-2' : ''}
          >
            {group.items.map((item) => (
              <NavLinkItem
                key={item.href}
                item={item}
                pathname={pathname}
                queryClient={queryClient}
                onNavigate={() => {
                  setMobileOpen(false)
                }}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t p-4 space-y-2">
        <button
          aria-label="Notificaciones"
          onClick={() => {
            router.push('/dashboard/calendario')
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <NotificationBell />
          <span>Notificaciones</span>
        </button>

        <button
          aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <span className="text-base" aria-hidden="true">
            {theme === 'light' ? '🌙' : '☀️'}
          </span>
          {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        </button>

        <div className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground">
          {(() => {
            const status = formatConnectionStatus(isOnline, isSyncing)
            return (
              <>
                {status.icon}
                <span>{status.label}</span>
              </>
            )
          })()}
          {queueLength > 0 && (
            <Badge variant="outline" className="ml-auto text-[10px] leading-none">
              {queueLength}
            </Badge>
          )}
        </div>

        <div className="text-sm">
          <p className="font-medium">{user?.name ?? 'Usuario'}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <button
          aria-label="Cerrar sesión"
          onClick={logout}
          className="w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <>
      <button
        className="fixed left-4 top-3 z-50 block rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden"
        onClick={() => {
          setMobileOpen(!mobileOpen)
        }}
        aria-label="Toggle sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => {
            setMobileOpen(false)
          }}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card transition-transform',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
