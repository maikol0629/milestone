import { render, screen, fireEvent } from '@testing-library/react'
import { DayView } from '../day-view'
import type { Event } from '@milestone/shared'

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({
    isOver: false,
    setNodeRef: jest.fn(),
  }),
  PointerSensor: jest.fn(),
  useSensor: () => ({}),
  useSensors: () => [],
}))

function makeEvent(overrides: Partial<Event>): Event {
  const now = new Date()
  return {
    id: '1',
    title: 'Test Event',
    description: null,
    start_at: now.toISOString(),
    end_at: new Date(now.getTime() + 3600000).toISOString(),
    type: 'event',
    activity_id: null,
    duration_minutes: null,
    priority: null,
    area_id: null,
    location: null,
    user_id: 'user-1',
    sync_version: 1,
    deleted_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  }
}

describe('DayView', () => {
  it('renders the current date', () => {
    render(
      <DayView
        events={[]}
        currentDate={new Date(2025, 0, 15, 12, 0, 0)}
        onDateChange={jest.fn()}
      />,
    )
    expect(screen.getByText(/enero/i)).toBeInTheDocument()
  })

  it('shows today badge when current date is today', () => {
    render(<DayView events={[]} currentDate={new Date()} onDateChange={jest.fn()} />)
    expect(screen.getByText('Hoy')).toBeInTheDocument()
  })

  it('renders event titles', () => {
    const date = new Date(2025, 0, 15, 12, 0, 0)
    const events = [
      makeEvent({
        id: 'evt-1',
        title: 'Morning Standup',
        start_at: new Date(2025, 0, 15, 9, 0, 0).toISOString(),
        end_at: new Date(2025, 0, 15, 10, 0, 0).toISOString(),
      }),
    ]

    render(<DayView events={events} currentDate={date} onDateChange={jest.fn()} />)
    expect(screen.getByText('Morning Standup')).toBeInTheDocument()
  })

  it('calls onDateChange when navigating to next day', () => {
    const onDateChange = jest.fn()
    render(<DayView events={[]} currentDate={new Date(2025, 0, 15)} onDateChange={onDateChange} />)
    fireEvent.click(screen.getByLabelText('Día siguiente'))
    expect(onDateChange).toHaveBeenCalled()
  })

  it('calls onDateChange when navigating to previous day', () => {
    const onDateChange = jest.fn()
    render(<DayView events={[]} currentDate={new Date(2025, 0, 15)} onDateChange={onDateChange} />)
    fireEvent.click(screen.getByLabelText('Día anterior'))
    expect(onDateChange).toHaveBeenCalled()
  })
})
