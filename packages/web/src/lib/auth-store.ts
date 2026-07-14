'use client'

import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { apiRequest, setTokens, clearTokens, setOnLogout, getAccessToken } from './api-client'

function setAuthCookie() {
  if (typeof document === 'undefined') return
  document.cookie = 'milestone-auth=1; path=/; sameSite=lax'
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return
  document.cookie = 'milestone-auth=; max-age=0; path=/; sameSite=lax'
}

const persistedAuthSchema = z.object({
  state: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
})

function syncTokensFromStorage() {
  if (typeof window === 'undefined') return

  const raw = localStorage.getItem('milestone-auth')
  if (!raw) {
    clearAuthCookie()
    return
  }

  try {
    const parsed = persistedAuthSchema.parse(JSON.parse(raw))
    if (parsed.state.accessToken || parsed.state.refreshToken) {
      setTokens(parsed.state.accessToken, parsed.state.refreshToken)
      setAuthCookie()
      return
    }
  } catch {
    // ignore
  }

  clearAuthCookie()
}

syncTokensFromStorage()

export interface User {
  id: string
  email: string
  name: string | null
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      setOnLogout(() => {
        get().logout()
      })

      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: true,

        login: async (email, password) => {
          set({ isLoading: true })
          const res = await apiRequest<{
            access_token: string
            refresh_token: string
            user: User
          }>('/auth/login', {
            method: 'POST',
            body: { email, password },
          })

          if (!res.success) {
            set({ isLoading: false })
            return { success: false, error: res.error.message }
          }

          setTokens(res.data.access_token, res.data.refresh_token)
          setAuthCookie()

          set({
            user: res.data.user,
            accessToken: res.data.access_token,
            refreshToken: res.data.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          })

          return { success: true }
        },

        register: async (email, password, name) => {
          set({ isLoading: true })
          const res = await apiRequest<{
            access_token: string
            refresh_token: string
            user: User
          }>('/auth/register', {
            method: 'POST',
            body: { email, password, name },
          })

          if (!res.success) {
            set({ isLoading: false })
            return { success: false, error: res.error.message }
          }

          setTokens(res.data.access_token, res.data.refresh_token)
          setAuthCookie()

          set({
            user: res.data.user,
            accessToken: res.data.access_token,
            refreshToken: res.data.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          })

          return { success: true }
        },

        logout: () => {
          const { refreshToken } = get()
          if (refreshToken) {
            void apiRequest('/auth/logout', {
              method: 'POST',
              body: { refresh_token: refreshToken },
            })
          }

          clearTokens()
          clearAuthCookie()

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          })
        },

        checkAuth: async () => {
          const token = getAccessToken()
          if (!token) {
            set({ isLoading: false })
            return
          }

          const res = await apiRequest<User>('/me')
          if (res.success) {
            setAuthCookie()
            set({ user: res.data, isAuthenticated: true, isLoading: false })
          } else {
            get().logout()
            set({ isLoading: false })
          }
        },
      }
    },
    {
      name: 'milestone-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
)
