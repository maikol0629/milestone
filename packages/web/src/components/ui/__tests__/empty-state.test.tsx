import { render, screen } from '@testing-library/react'
import { EmptyState } from '../empty-state'

describe('EmptyState', () => {
  it('renders icon', () => {
    render(<EmptyState icon="📋" title="Sin proyectos" description="No hay proyectos aún" />)
    expect(screen.getByText('📋')).toBeInTheDocument()
  })

  it('renders title', () => {
    render(<EmptyState icon="📋" title="Sin proyectos" description="No hay proyectos aún" />)
    expect(screen.getByText('Sin proyectos')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<EmptyState icon="📋" title="Sin proyectos" description="No hay proyectos aún" />)
    expect(screen.getByText('No hay proyectos aún')).toBeInTheDocument()
  })
})
