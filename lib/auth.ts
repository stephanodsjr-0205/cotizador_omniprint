// Sistema de autenticación simple usando localStorage
// En producción, deberías usar un sistema más robusto

export interface User {
  id_usuario: string
  usuario: string
}

const AUTH_KEY = 'cotizador_auth_user'

export const auth = {
  // Guardar usuario en sesión
  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    }
  },

  // Obtener usuario de sesión
  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(AUTH_KEY)
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch {
          return null
        }
      }
    }
    return null
  },

  // Verificar si hay sesión activa
  isAuthenticated: (): boolean => {
    return auth.getUser() !== null
  },

  // Cerrar sesión
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_KEY)
    }
  },
}
