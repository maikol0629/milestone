import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

function renderSidebar() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <Sidebar />
    </QueryClientProvider>,
  )
}

describe('Sidebar', () => {
  it.each([
    ['first', ['Inicio', 'Calendario', 'Tiempo']],
    ['second', ['Áreas', 'Objetivos', 'Proyectos', 'Actividades']],
    ['third', ['Estadísticas', 'Configuración']],
  ])('renders %s group navigation items', (_groupName, items) => {
    renderSidebar()
    for (const item of items) {
      expect(screen.getByText(item)).toBeInTheDocument()
    }
  })

  it.each([
    ['brand link', () => expect(screen.getByText('Milestone')).toBeInTheDocument()],
    [
      'current route highlight',
      () => expect(screen.getByText('Áreas').closest('a')).toHaveClass('bg-primary'),
    ],
    [
      'user info',
      () => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText('test@test.com')).toBeInTheDocument()
      },
    ],
    ['logout button', () => expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()],
    ['theme toggle button', () => expect(screen.getByText('Modo oscuro')).toBeInTheDocument()],
    [
      'mobile toggle button',
      () => expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument(),
    ],
  ])('renders %s', (_label, assertion) => {
    renderSidebar()
    assertion()
  })
})
