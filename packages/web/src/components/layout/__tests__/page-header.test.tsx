import { render, screen } from '@testing-library/react'
import { PageHeader } from '../page-header'

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Dashboard" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<PageHeader title="Dashboard" description="Bienvenido" />)
    expect(screen.getByText('Bienvenido')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<PageHeader title="Dashboard" />)
    expect(screen.queryByText('Bienvenido')).not.toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(<PageHeader title="Dashboard" action={<button>Action</button>} />)
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  it('does not render action when not provided', () => {
    render(<PageHeader title="Dashboard" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
