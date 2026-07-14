import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: ReactNode
}

function Card({ className, children }: CardProps) {
  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  className?: string
  children: ReactNode
}

function CardHeader({ className, children }: CardHeaderProps) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)}>{children}</div>
}

interface CardTitleProps {
  className?: string
  children: ReactNode
}

function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  className?: string
  children: ReactNode
}

function CardContent({ className, children }: CardContentProps) {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>
}

interface CardFooterProps {
  className?: string
  children: ReactNode
}

function CardFooter({ className, children }: CardFooterProps) {
  return <div className={cn('flex items-center p-6 pt-0', className)}>{children}</div>
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter }
