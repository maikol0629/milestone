import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarGrid } from '../calendar-grid'
import type { Event } from '@milestone/shared'

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

describe('CalendarGrid', () => {
  it('renders the month header', () => {
    const date = new Date('2025-01-15')
    render(<CalendarGrid events={[]} currentMonth={date} onMonthChange={jest.fn()} />)

    expect(screen.getByText(/enero/i)).toBeInTheDocument()
  })

  it('renders day headers', () => {
    const date = new Date('2025-01-15')
    render(<CalendarGrid events={[]} currentMonth={date} onMonthChange={jest.fn()} />)

    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Dom')).toBeInTheDocument()
  })

  it('calls onMonthChange when navigating to next month', () => {
    const onMonthChange = jest.fn()
    const date = new Date('2025-01-15')
    render(<CalendarGrid events={[]} currentMonth={date} onMonthChange={onMonthChange} />)

    fireEvent.click(screen.getByLabelText('Mes siguiente'))
    expect(onMonthChange).toHaveBeenCalled()
  })

  it('calls onMonthChange when navigating to previous month', () => {
    const onMonthChange = jest.fn()
    const date = new Date('2025-01-15')
    render(<CalendarGrid events={[]} currentMonth={date} onMonthChange={onMonthChange} />)

    fireEvent.click(screen.getByLabelText('Mes anterior'))
    expect(onMonthChange).toHaveBeenCalled()
  })

  it('renders event titles in day cells', () => {
    const date = new Date('2025-01-15')
    const start = new Date('2025-01-15T09:00:00')
    const end = new Date('2025-01-15T10:00:00')

    const events = [
      makeEvent({
        id: 'evt-1',
        title: 'Team Sync',
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      }),
    ]

    render(<CalendarGrid events={events} currentMonth={date} onMonthChange={jest.fn()} />)
    expect(screen.getByText('Team Sync')).toBeInTheDocument()
  })

  it('shows +N more when more than 3 events in a day', () => {
    const date = new Date('2025-01-15')
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({
        id: 'evt-' + String(i),
        title: 'Event ' + String(i),
        start_at: new Date('2025-01-15T09:00:00').toISOString(),
        end_at: new Date('2025-01-15T10:00:00').toISOString(),
      }),
    )

    render(<CalendarGrid events={events} currentMonth={date} onMonthChange={jest.fn()} />)
    expect(screen.getByText(/más/)).toBeInTheDocument()
  })
})
