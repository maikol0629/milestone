import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">📡</div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Sin conexión</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">
        No tienes conexión a internet. Algunas funciones pueden no estar disponibles.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Intentar de nuevo
      </Link>
    </div>
  )
}
