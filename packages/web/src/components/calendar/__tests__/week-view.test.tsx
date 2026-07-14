import { render, screen, fireEvent } from '@testing-library/react'
import { WeekView } from '../week-view'
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

describe('WeekView', () => {
  it('renders the week header', () => {
    const date = new Date('2025-01-15')
    render(<WeekView events={[]} currentDate={date} onDateChange={jest.fn()} />)

    expect(screen.getByText(/enero/i)).toBeInTheDocument()
  })

  it('calls onDateChange when navigating to next week', () => {
    const onDateChange = jest.fn()
    const date = new Date('2025-01-15')
    render(<WeekView events={[]} currentDate={date} onDateChange={onDateChange} />)

    fireEvent.click(screen.getByLabelText('Semana siguiente'))
    expect(onDateChange).toHaveBeenCalled()
  })

  it('calls onDateChange when navigating to previous week', () => {
    const onDateChange = jest.fn()
    const date = new Date('2025-01-15')
    render(<WeekView events={[]} currentDate={date} onDateChange={onDateChange} />)

    fireEvent.click(screen.getByLabelText('Semana anterior'))
    expect(onDateChange).toHaveBeenCalled()
  })

  it('renders event titles', () => {
    const date = new Date('2025-01-15')
    const start = new Date('2025-01-15T09:00:00')
    const end = new Date('2025-01-15T10:00:00')

    const events = [
      makeEvent({
        id: 'evt-1',
        title: 'Sprint Review',
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      }),
    ]

    render(<WeekView events={events} currentDate={date} onDateChange={jest.fn()} />)
    expect(screen.getByText('Sprint Review')).toBeInTheDocument()
  })
})
