import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        work: 'bg-[var(--color-work-bg)] text-[var(--color-work)] border border-[var(--color-work)]/20',
        study:
          'bg-[var(--color-study-bg)] text-[var(--color-study)] border border-[var(--color-study)]/20',
        health:
          'bg-[var(--color-health-bg)] text-[var(--color-health)] border border-[var(--color-health)]/20',
        relationships:
          'bg-[var(--color-relationships-bg)] text-[var(--color-relationships)] border border-[var(--color-relationships)]/20',
        projects:
          'bg-[var(--color-projects-bg)] text-[var(--color-projects)] border border-[var(--color-projects)]/20',
        finance:
          'bg-[var(--color-finance-bg)] text-[var(--color-finance)] border border-[var(--color-finance)]/20',
        leisure:
          'bg-[var(--color-leisure-bg)] text-[var(--color-leisure)] border border-[var(--color-leisure)]/20',
        outline: 'border border-input bg-background text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
