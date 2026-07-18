import { render, screen, fireEvent } from '@testing-library/react'
import { EventForm } from '../event-form'

const mockAreas = [
  { value: 'area-1', label: 'Trabajo' },
  { value: 'area-2', label: 'Personal' },
]

const mockProjects = [
  { value: 'proj-1', label: 'Proyecto Alpha' },
  { value: 'proj-2', label: 'Proyecto Beta' },
]

describe('EventForm', () => {
  it('renders all form fields', () => {
    render(<EventForm areas={mockAreas} projects={mockProjects} onSubmit={jest.fn()} />)

    expect(screen.getByText('Título')).toBeInTheDocument()
    expect(screen.getByText('Fecha')).toBeInTheDocument()
    expect(screen.getByText('Hora inicio')).toBeInTheDocument()
    expect(screen.getByText('Duración (minutos)')).toBeInTheDocument()
    expect(screen.getByText('Área de vida')).toBeInTheDocument()
    expect(screen.getByText('Proyecto (opcional)')).toBeInTheDocument()
    expect(screen.getByText('Descripción')).toBeInTheDocument()
    expect(screen.getByText('Ubicación')).toBeInTheDocument()
    expect(screen.getByText('Repetir')).toBeInTheDocument()
  })

  it('shows daily recurrence fields when "Diariamente" is selected', () => {
    render(<EventForm areas={mockAreas} projects={mockProjects} onSubmit={jest.fn()} />)

    fireEvent.change(screen.getByDisplayValue('No repetir'), {
      target: { value: 'daily' },
    })

    expect(screen.getByText('Cada cuántos días')).toBeInTheDocument()
    expect(screen.getByText('Fecha de fin (opcional)')).toBeInTheDocument()
  })

  it('shows weekly recurrence fields when "Semanalmente" is selected', () => {
    render(<EventForm areas={mockAreas} projects={mockProjects} onSubmit={jest.fn()} />)

    fireEvent.change(screen.getByDisplayValue('No repetir'), {
      target: { value: 'weekly' },
    })

    expect(screen.getByText('Cada cuántas semanas')).toBeInTheDocument()
    expect(screen.getByText('Días de la semana')).toBeInTheDocument()
    expect(screen.getByText('Fecha de fin (opcional)')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn()
    render(
      <EventForm
        areas={mockAreas}
        projects={mockProjects}
        onSubmit={jest.fn()}
        onCancel={onCancel}
      />,
    )

    fireEvent.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('does not show cancel button when onCancel is not provided', () => {
    render(<EventForm areas={mockAreas} projects={mockProjects} onSubmit={jest.fn()} />)
    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument()
  })
})
