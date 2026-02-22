import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  email: string
}

export const useAuthStore = defineStore('auth', () => {
  // Access token lives in memory only, never localStorage
  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)

  function setAuth(token: string, userData: User) {
    accessToken.value = token
    user.value = userData
  }

  function setAccessToken(token: string) {
    accessToken.value = token
  }

  function clearAuth() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('refreshToken')
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    setAuth,
    setAccessToken,
    clearAuth,
  }
})
