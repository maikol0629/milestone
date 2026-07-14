import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold tracking-tight">Milestone</h1>
      <p className="mt-4 text-lg text-muted-foreground">Gestión de objetivos, proyectos y tiempo</p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/register"
          className="rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          Crear cuenta
        </Link>
      </div>
    </main>
  )
}
