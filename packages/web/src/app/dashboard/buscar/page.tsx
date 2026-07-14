'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Calendar,
  Clock,
  Layers,
  Target,
  CheckSquare,
  FileText,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Spinner } from '@/components/ui/spinner'
import { apiRequest } from '@/lib/api-client'

interface SearchResult {
  id: string
  name?: string
  title?: string
  life_area?: { name: string }
  goal?: { title: string }
  project?: { name: string }
  activity?: { title: string }
  start_at?: string
}

interface SearchResponse {
  life_areas: SearchResult[]
  goals: SearchResult[]
  projects: SearchResult[]
  activities: SearchResult[]
  events: SearchResult[]
  time_sessions: SearchResult[]
}

const typeConfig: Record<
  string,
  {
    label: string
    icon: React.ReactNode
    href: (id: string) => string
    titleKey: string
    parentLabel: string
    parentRender: (item: SearchResult) => string | null
  }
> = {
  life_areas: {
    label: 'Áreas Vitales',
    icon: <Layers className="h-4 w-4" />,
    href: (id) => `/dashboard/areas-vitales/${id}`,
    titleKey: 'name',
    parentLabel: '',
    parentRender: () => null,
  },
  goals: {
    label: 'Objetivos',
    icon: <Target className="h-4 w-4" />,
    href: (id) => `/dashboard/objetivos/${id}`,
    titleKey: 'title',
    parentLabel: 'Área',
    parentRender: (item) => item.life_area?.name ?? null,
  },
  projects: {
    label: 'Proyectos',
    icon: <FileText className="h-4 w-4" />,
    href: (id) => `/dashboard/proyectos/${id}`,
    titleKey: 'name',
    parentLabel: 'Objetivo',
    parentRender: (item) => item.goal?.title ?? null,
  },
  activities: {
    label: 'Actividades',
    icon: <CheckSquare className="h-4 w-4" />,
    href: (id) => `/dashboard/actividades/${id}`,
    titleKey: 'title',
    parentLabel: 'Proyecto',
    parentRender: (item) => item.project?.name ?? null,
  },
  events: {
    label: 'Eventos',
    icon: <Calendar className="h-4 w-4" />,
    href: (id) => `/dashboard/calendario?event=${id}`,
    titleKey: 'title',
    parentLabel: 'Actividad',
    parentRender: (item) => item.activity?.title ?? null,
  },
  time_sessions: {
    label: 'Sesiones de Tiempo',
    icon: <Clock className="h-4 w-4" />,
    href: (id) => `/dashboard/tiempo/${id}`,
    titleKey: 'id',
    parentLabel: 'Actividad',
    parentRender: (item) => item.activity?.title ?? null,
  },
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''

  const { data, isLoading, isError, error } = useQuery<SearchResponse>({
    queryKey: ['search', q],
    queryFn: async () => {
      const res = await apiRequest<SearchResponse>('/search', { params: { q } })
      if (!res.success) throw new Error(res.error.message)
      return res.data
    },
    enabled: q.length > 0,
  })

  const totalResults = data
    ? (Object.values(data) as SearchResult[][]).reduce((sum, arr) => sum + arr.length, 0)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buscar</h1>
        <p className="mt-1 text-muted-foreground">
          {q ? `Resultados para "${q}"` : 'Escribe algo para buscar'}
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error instanceof Error ? error.message : 'Error al buscar'}</span>
        </div>
      )}

      {data && totalResults === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Search className="mx-auto h-8 w-8" />
          <p className="mt-2 text-lg">No se encontraron resultados</p>
          <p className="mt-1 text-sm">Intenta con otros términos de búsqueda</p>
        </div>
      )}

      {data && totalResults > 0 && (
        <div className="space-y-8">
          {Object.entries(typeConfig).map(([key, config]) => {
            const items = data[key as keyof SearchResponse]
            if (items.length === 0) return null

            return (
              <div key={key}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  {config.icon}
                  {config.label}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({items.length})
                  </span>
                </h2>
                <div className="space-y-2">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={config.href(item.id)}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {config.titleKey === 'name'
                            ? item.name
                            : config.titleKey === 'title'
                              ? item.title
                              : item.id.slice(0, 8)}
                        </p>
                        {config.parentRender(item) && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {config.parentLabel}: {config.parentRender(item)}
                          </p>
                        )}
                        {item.start_at && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(item.start_at).toLocaleString('es')}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Search(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
