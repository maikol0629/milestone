import { useAuthStore } from '../auth-store'

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: false }),
    ok: true,
  })

  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
  })
})

it('starts unauthenticated', () => {
  const state = useAuthStore.getState()
  expect(state.isAuthenticated).toBe(false)
  expect(state.user).toBeNull()
})

it('resets state on logout', () => {
  useAuthStore.setState({
    user: { id: '1', email: 'test@test.com', name: 'Test' },
    accessToken: 'token',
    refreshToken: 'refresh',
    isAuthenticated: true,
    isLoading: false,
  })

  const { logout } = useAuthStore.getState()
  logout()

  const state = useAuthStore.getState()
  expect(state.isAuthenticated).toBe(false)
  expect(state.user).toBeNull()
})
