import type { ApiResponse } from '@milestone/shared'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

let accessToken: string | null = null
let refreshTokenValue: string | null = null
let onLogout: (() => void) | null = null

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshTokenValue = refresh
}

export function clearTokens() {
  accessToken = null
  refreshTokenValue = null
}

export function getAccessToken() {
  return accessToken
}

export function getRefreshToken() {
  return refreshTokenValue
}

export function setOnLogout(fn: () => void) {
  onLogout = fn
}

export interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  params?: Record<string, string | number | undefined>
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  let url = `${BASE_URL}${path}`
  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) searchParams.set(key, String(value))
    }
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }
  return url
}

function buildHeaders(extraHeaders?: Record<string, string>): Headers {
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      headers.set(key, value)
    }
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return headers
}

function buildFetchOptions(
  method: string,
  body?: unknown,
  headers?: Record<string, string>,
): RequestInit {
  const fetchOptions: RequestInit = { method, headers: buildHeaders(headers) }
  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body)
  }
  return fetchOptions
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshTokenValue) return null
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshTokenValue }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as ApiResponse<{ access_token: string; refresh_token: string }>
    if (!json.success) return null
    accessToken = json.data.access_token
    refreshTokenValue = json.data.refresh_token
    return accessToken
  } catch {
    return null
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers, params } = options
  const url = buildUrl(path, params)
  const fetchOptions = buildFetchOptions(method, body, headers)

  let res: Response
  try {
    res = await fetch(url, fetchOptions)
  } catch {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Error de red al conectar con el servidor',
      },
    }
  }

  if (res.status === 401 && refreshTokenValue) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      res = await fetch(url, {
        ...fetchOptions,
        headers: buildHeaders(headers),
      })
    } else {
      onLogout?.()
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Sesión expirada' } }
    }
  }

  let json: unknown
  try {
    json = await res.json()
  } catch {
    return {
      success: false,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'Respuesta inválida del servidor',
      },
    }
  }

  return json as ApiResponse<T>
}
