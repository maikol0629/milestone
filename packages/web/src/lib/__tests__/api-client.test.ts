import { apiRequest, setTokens, clearTokens, setOnLogout, getAccessToken } from '../api-client'

const mockFetch = jest.fn()
global.fetch = mockFetch

const BASE_URL = 'http://localhost:3001/api'

beforeEach(() => {
  mockFetch.mockReset()
  clearTokens()
})

describe('apiRequest', () => {
  it('makes a GET request', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })

    const result = await apiRequest('/test')
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/test`,
      expect.objectContaining({ method: 'GET' }),
    )
    expect(result.success).toBe(true)
  })

  it('makes a POST request with body', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })

    const result = await apiRequest('/test', {
      method: 'POST',
      body: { name: 'test' },
    })
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/test`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      }),
    )
    expect(result.success).toBe(true)
  })

  it('appends query params', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    await apiRequest('/test', { params: { page: '1', limit: '10' } })
    const calledUrl = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('page=1')
    expect(calledUrl).toContain('limit=10')
  })

  it('skips undefined params', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    await apiRequest('/test', { params: { page: '1', limit: undefined } })
    const calledUrl = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('page=1')
    expect(calledUrl).not.toContain('limit')
  })

  it('includes auth token when set', async () => {
    setTokens('my-token', 'refresh')
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: { id: 1 } }),
    })

    await apiRequest('/test')
    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers.get('Authorization')).toBe('Bearer my-token')
  })

  it('auto-refreshes on 401 and retries', async () => {
    setTokens('expired-token', 'valid-refresh')
    setOnLogout(jest.fn())

    mockFetch
      .mockResolvedValueOnce({
        status: 401,
        json: () =>
          Promise.resolve({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Token expired' },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { access_token: 'new-token', refresh_token: 'new-refresh' },
          }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { id: 1 } }),
      })

    const result = await apiRequest('/test')
    expect(result.success).toBe(true)
    expect(getAccessToken()).toBe('new-token')
  })

  it('calls onLogout when refresh fails', async () => {
    const onLogout = jest.fn()
    setTokens('expired-token', 'invalid-refresh')
    setOnLogout(onLogout)

    mockFetch
      .mockResolvedValueOnce({
        status: 401,
        json: () =>
          Promise.resolve({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Token expired' },
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Invalid refresh' },
          }),
      })

    const result = await apiRequest('/test')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(onLogout).toHaveBeenCalled()
  })

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await apiRequest('/test')
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('NETWORK_ERROR')
  })
})
