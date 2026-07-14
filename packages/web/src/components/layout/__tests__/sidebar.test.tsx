import { render, screen } from '@testing-library/react'
import { Sidebar } from '../sidebar'
import { useAuthStore } from '@/lib/auth-store'

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/areas-vitales',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/providers/theme-provider', () => ({
  useTheme: () => ({ theme: 'light', toggle: jest.fn() }),
}))

jest.mock('@/providers/sync-provider', () => ({
  useSyncState: () => ({ isOnline: true, isSyncing: false, queueLength: 0 }),
}))

jest.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({ upcomingCount: 0 }),
}))

beforeEach(() => {
  useAuthStore.setState({
    user: { id: '1', email: 'test@test.com', name: 'Test User' },
    accessToken: 'token',
    refreshToken: 'refresh',
    isAuthenticated: true,
    isLoading: false,
  })
})

describe('Sidebar', () => {
  it('renders brand link', () => {
    render(<Sidebar />)
    expect(screen.getByText('Milestone')).toBeInTheDocument()
  })

  it('renders first group navigation items', () => {
    render(<Sidebar />)
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Calendario')).toBeInTheDocument()
    expect(screen.getByText('Tiempo')).toBeInTheDocument()
  })

  it('renders second group navigation items', () => {
    render(<Sidebar />)
    expect(screen.getByText('Áreas')).toBeInTheDocument()
    expect(screen.getByText('Objetivos')).toBeInTheDocument()
    expect(screen.getByText('Proyectos')).toBeInTheDocument()
    expect(screen.getByText('Actividades')).toBeInTheDocument()
  })

  it('renders third group navigation items', () => {
    render(<Sidebar />)
    expect(screen.getByText('Estadísticas')).toBeInTheDocument()
    expect(screen.getByText('Configuración')).toBeInTheDocument()
  })

  it('highlights current route', () => {
    render(<Sidebar />)
    const link = screen.getByText('Áreas').closest('a')
    expect(link).toHaveClass('bg-primary')
  })

  it('shows user info', () => {
    render(<Sidebar />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@test.com')).toBeInTheDocument()
  })

  it('shows logout button', () => {
    render(<Sidebar />)
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
  })

  it('shows theme toggle button', () => {
    render(<Sidebar />)
    expect(screen.getByText('Modo oscuro')).toBeInTheDocument()
  })

  it('renders mobile toggle button', () => {
    render(<Sidebar />)
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument()
  })
})
