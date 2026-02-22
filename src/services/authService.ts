import api from './api'
import { useAuthStore } from '@/stores/authStore'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<void> {
    const { data } = await api.post<{ message: string; data: AuthResponse }>(
      '/auth/login',
      credentials,
    )

    const authStore = useAuthStore()
    authStore.setAuth(data.data.accessToken, data.data.user)
    localStorage.setItem('refreshToken', data.data.refreshToken)
  },

  async logout(): Promise<void> {
    const authStore = useAuthStore()
    try {
      // Tell backend to invalidate the refresh token in Redis
      await api.post('/auth/logout')
    } catch {
      // Even if backend call fails, clear local state
    } finally {
      authStore.clearAuth()
    }
  },

  async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) throw new Error('No refresh token available')

    const { data } = await api.post<{ message: string; data: AuthResponse }>('/auth/refresh', {
      refreshToken,
    })

    const authStore = useAuthStore()
    authStore.setAccessToken(data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken ?? refreshToken)

    return data.data.accessToken
  },

  // Called on app boot, restores session if refresh token exists
  async tryRestoreSession(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return false

    try {
      await authService.refreshAccessToken()
      return true
    } catch {
      // Refresh token expired or invalid, clear it
      localStorage.removeItem('refreshToken')
      return false
    }
  },
}
