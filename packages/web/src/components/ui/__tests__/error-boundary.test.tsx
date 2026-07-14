import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../error-boundary'

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test error')
  return <div>Normal</div>
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(jest.fn())
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children normally', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('catches rendering error and shows error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  it('shows generic message when error has no message', () => {
    const ThrowingWithoutMessage = () => {
      throw new Error()
    }
    render(
      <ErrorBoundary>
        <ThrowingWithoutMessage />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Error inesperado')).toBeInTheDocument()
  })

  it('retry button resets error state', () => {
    let shouldThrow = true
    function ControlledThrowingComponent() {
      if (shouldThrow) throw new Error('Controlled')
      return <div>Normal</div>
    }
    const { rerender } = render(
      <ErrorBoundary>
        <ControlledThrowingComponent />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()

    shouldThrow = false
    fireEvent.click(screen.getByText('Reintentar'))

    rerender(
      <ErrorBoundary>
        <ControlledThrowingComponent />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Normal')).toBeInTheDocument()
  })

  it('renders custom fallback instead of default UI', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Custom error')).toBeInTheDocument()
    expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument()
  })
})
