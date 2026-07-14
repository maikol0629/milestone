'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  if (totalPages <= 1) return null

  return (
    <div
      role="navigation"
      aria-label="Navegación de páginas"
      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
    >
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages} ({total} resultados)
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onPageChange(page - 1)
          }}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          Anterior
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Button
            key={p}
            variant={p === page ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              onPageChange(p)
            }}
            aria-label={`Página ${String(p)}`}
            aria-current={p === page ? 'page' : undefined}
            className={cn(p !== page && 'border border-input')}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onPageChange(page + 1)
          }}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
