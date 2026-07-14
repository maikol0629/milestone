import { renderHook } from '@testing-library/react'
import { useAuth, useRequireAuth, useRedirectIfAuthenticated } from '../use-auth'
import { useAuthStore } from '@/lib/auth-store'

const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

beforeEach(() => {
  mockReplace.mockClear()
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
  })
})

describe('useAuth', () => {
  it('returns the auth store', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})

describe('useRequireAuth', () => {
  it('redirects to login when not authenticated', () => {
    renderHook(() => useRequireAuth())
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('does not redirect when loading', () => {
    useAuthStore.setState({ isLoading: true })
    renderHook(() => useRequireAuth())
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('does not redirect when authenticated', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'test@test.com', name: 'Test' },
      isAuthenticated: true,
      isLoading: false,
    })
    renderHook(() => useRequireAuth())
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('returns isAuthenticated and isLoading', () => {
    const { result } = renderHook(() => useRequireAuth())
    expect(result.current).toEqual({ isAuthenticated: false, isLoading: false })
  })
})

describe('useRedirectIfAuthenticated', () => {
  it('redirects to dashboard when authenticated', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'test@test.com', name: 'Test' },
      isAuthenticated: true,
      isLoading: false,
    })
    renderHook(() => useRedirectIfAuthenticated())
    expect(mockReplace).toHaveBeenCalledWith('/dashboard')
  })

  it('does not redirect when not authenticated', () => {
    renderHook(() => useRedirectIfAuthenticated())
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('does not redirect when loading', () => {
    useAuthStore.setState({ isLoading: true })
    renderHook(() => useRedirectIfAuthenticated())
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
