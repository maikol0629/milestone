import { render, screen } from '@testing-library/react'
import { DayTimeline } from '../day-timeline'
import type { Event, TimeSession } from '@milestone/shared'

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

function makeSession(overrides: Partial<TimeSession>): TimeSession {
  const now = new Date()
  return {
    id: '1',
    start_at: now.toISOString(),
    end_at: new Date(now.getTime() + 7200000).toISOString(),
    activity_id: 'act-1',
    user_id: 'user-1',
    deleted_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  }
}

describe('DayTimeline', () => {
  it('shows empty state when no events', () => {
    render(<DayTimeline events={[]} sessions={[]} />)
    expect(screen.getByText(/no hay eventos programados/i)).toBeInTheDocument()
  })

  it('shows timeline header when there are events', () => {
    const today = new Date()
    const start = new Date(today)
    start.setHours(9, 0, 0, 0)
    const end = new Date(today)
    end.setHours(10, 0, 0, 0)

    const events = [
      makeEvent({
        title: 'Morning Standup',
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      }),
    ]

    render(<DayTimeline events={events} sessions={[]} />)
    expect(screen.getByText('Línea de tiempo del día')).toBeInTheDocument()
  })

  it('renders event blocks', () => {
    const today = new Date()
    const start = new Date(today)
    start.setHours(9, 0, 0, 0)
    const end = new Date(today)
    end.setHours(10, 0, 0, 0)

    const events = [
      makeEvent({
        title: 'Morning Standup',
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      }),
    ]

    render(<DayTimeline events={events} sessions={[]} />)
    expect(screen.getByText('Morning Standup')).toBeInTheDocument()
  })

  it('renders session blocks', () => {
    const today = new Date()
    const start = new Date(today)
    start.setHours(14, 0, 0, 0)
    const end = new Date(today)
    end.setHours(16, 0, 0, 0)

    const sessions = [
      makeSession({
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      }),
    ]

    render(<DayTimeline events={[]} sessions={sessions} />)
    expect(screen.getByText('Sesión de trabajo')).toBeInTheDocument()
  })
})
