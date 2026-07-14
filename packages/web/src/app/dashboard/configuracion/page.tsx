'use client'

import { PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/spinner'
import { useRequireAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/lib/auth-store'

export default function ConfiguracionPage() {
  const { isLoading } = useRequireAuth()
  const { user } = useAuthStore()

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Gestiona tu cuenta y preferencias" />

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Perfil</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-4">
            <span className="w-24 text-sm text-muted-foreground">Nombre</span>
            <span className="text-sm font-medium">{user?.name ?? '—'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-24 text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.email ?? '—'}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Preferencias</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Más opciones de configuración próximamente.
        </p>
      </div>
    </div>
  )
}
