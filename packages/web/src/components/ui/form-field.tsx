'use client'

import React, { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  error?: string
  children: ReactNode
  className?: string
  id?: string
}

export function FormField({
  label,
  error,
  children,
  className,
  id = label.toLowerCase().replace(/\s+/g, '-'),
}: FormFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
            id,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': error ? errorId : undefined,
          })
        }
        return child
      })}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        hasError ? 'border-destructive' : 'border-input',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, options, placeholder, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        hasError ? 'border-destructive' : 'border-input',
        className,
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
)
Select.displayName = 'Select'
