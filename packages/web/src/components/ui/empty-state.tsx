interface EmptyStateProps {
  icon: string
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className="rounded-lg border border-dashed bg-card p-12 text-center"
    >
      <div className="text-4xl">{icon}</div>
      <p className="mt-3 text-lg font-medium text-card-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
