import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Mock users for Keycloak simulation
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@servicio.com',
    password: 'admin123',
    name: 'Carlos Administrador',
    role: 'admin',
    avatar: 'CA'
  },
  {
    id: '2',
    email: 'tecnico@servicio.com',
    password: 'tecnico123',
    name: 'Juan Técnico',
    role: 'tecnico',
    avatar: 'JT'
  },
  {
    id: '3',
    email: 'supervisor@servicio.com',
    password: 'super123',
    name: 'María Supervisora',
    role: 'supervisor',
    avatar: 'MS'
  }
]

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  const login = async (email, password) => {
    // Simulate Keycloak authentication
    const foundUser = MOCK_USERS.find(
      u => u.email === email && u.password === password
    )

    if (foundUser) {
      const { password: _, ...userData } = foundUser
      user.value = userData
      token.value = `mock-token-${Date.now()}`
      console.log('Login exitoso:', userData)
      return { success: true, user: userData }
    }

    console.log('Login fallido:', { email })
    return { success: false, error: 'Credenciales inválidas' }
  }

  const logout = () => {
    console.log('Logout:', user.value)
    user.value = null
    token.value = null
  }

  const hasRole = (roles) => {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    hasRole,
    MOCK_USERS
  }
}, {
  persist: true
})
