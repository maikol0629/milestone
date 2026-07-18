import { render, screen, fireEvent } from '@testing-library/react'
import { EventDialog } from '../event-dialog'
import type { Event } from '@milestone/shared'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = jest.fn()
  HTMLDialogElement.prototype.close = jest.fn()
})

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    title: 'Test Event',
    description: null,
    start_at: new Date('2025-01-15T09:00:00').toISOString(),
    end_at: new Date('2025-01-15T10:00:00').toISOString(),
    type: 'event',
    activity_id: null,
    duration_minutes: 60,
    priority: null,
    area_id: null,
    location: null,
    user_id: 'user-1',
    sync_version: 1,
    recurrence_rule: null,
    recurrence_interval: null,
    recurrence_days_of_week: null,
    recurrence_end_date: null,
    is_milestone: false,
    milestone_date: null,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('EventDialog', () => {
  it('renders event details when open', () => {
    render(
      <EventDialog
        event={makeEvent()}
        open={true}
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    )

    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('Inicio:')).toBeInTheDocument()
    expect(screen.getByText('Fin:')).toBeInTheDocument()
  })

  it('shows recurrence summary when event has recurrence_rule', () => {
    render(
      <EventDialog
        event={makeEvent({
          recurrence_rule: 'daily',
          recurrence_interval: 1,
        })}
        open={true}
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    )

    expect(screen.getByText('Repite:')).toBeInTheDocument()
    expect(screen.getByText(/Cada 1 día/)).toBeInTheDocument()
  })

  it('shows weekly recurrence with days', () => {
    render(
      <EventDialog
        event={makeEvent({
          recurrence_rule: 'weekly',
          recurrence_interval: 1,
          recurrence_days_of_week: '1,3,5',
        })}
        open={true}
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    )

    expect(screen.getByText(/Cada 1 semana/)).toBeInTheDocument()
    expect(screen.getByText(/Lun/)).toBeInTheDocument()
    expect(screen.getByText(/Mié/)).toBeInTheDocument()
    expect(screen.getByText(/Vie/)).toBeInTheDocument()
  })

  it('does not render when not open', () => {
    render(
      <EventDialog
        event={makeEvent()}
        open={false}
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    )

    expect(screen.queryByText('Test Event')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <EventDialog
        event={makeEvent()}
        open={true}
        onClose={onClose}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    )

    fireEvent.click(screen.getByLabelText('Cerrar'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn()
    render(
      <EventDialog
        event={makeEvent()}
        open={true}
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={onDelete}
      />,
    )

    fireEvent.click(screen.getByText('Eliminar'))
    expect(onDelete).toHaveBeenCalled()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    render(
      <EventDialog
        event={makeEvent()}
        open={true}
        onClose={jest.fn()}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />,
    )

    fireEvent.click(screen.getByText('Editar'))
    expect(onEdit).toHaveBeenCalled()
  })
})
