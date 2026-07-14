import { render, screen, fireEvent, act } from '@testing-library/react'
import { WorkBlockForm } from '../work-block-form'

const mockProjects = [
  { value: 'proj-1', label: 'Proyecto Alpha' },
  { value: 'proj-2', label: 'Proyecto Beta' },
]

const mockActivities = [
  { value: 'proj-1-act-1', label: 'Research' },
  { value: 'proj-1-act-2', label: 'Development' },
  { value: 'proj-2-act-1', label: 'Testing' },
]

describe('WorkBlockForm', () => {
  it('renders all form fields', () => {
    render(
      <WorkBlockForm projects={mockProjects} activities={mockActivities} onSubmit={jest.fn()} />,
    )

    expect(screen.getByText('Proyecto')).toBeInTheDocument()
    expect(screen.getByText('Actividad')).toBeInTheDocument()
    expect(screen.getByText('Duración')).toBeInTheDocument()
    expect(screen.getByText('Prioridad')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn()
    render(
      <WorkBlockForm
        projects={mockProjects}
        activities={mockActivities}
        onSubmit={jest.fn()}
        onCancel={onCancel}
      />,
    )

    fireEvent.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows suggested slot when provided', () => {
    const suggestedSlot = {
      start: new Date('2025-01-15T09:00:00'),
      end: new Date('2025-01-15T11:00:00'),
    }
    render(
      <WorkBlockForm
        projects={mockProjects}
        activities={mockActivities}
        suggestedSlot={suggestedSlot}
        onSubmit={jest.fn()}
      />,
    )

    expect(screen.getByText(/09:00/)).toBeInTheDocument()
    expect(screen.getByText(/11:00/)).toBeInTheDocument()
  })

  it('does not show cancel button when onCancel is not provided', () => {
    render(
      <WorkBlockForm projects={mockProjects} activities={mockActivities} onSubmit={jest.fn()} />,
    )
    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument()
  })
})
