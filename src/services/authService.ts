import { api } from './api'
import type { User, Permission } from '@/types'

interface LoginCredentials {
  email: string
  password: string
}

interface LoginApiResponse {
  user: {
    id: number
    email: string
    nom: string
    prenom: string
    telephone?: string
    avatar?: string
    role: string
    roleLibelle: string
    permissions: Permission[]
    isActive: boolean
    lastLogin?: string
    createdAt: string
  }
  token: string
  refreshToken: string
}

interface ApiResult<T> {
  success: boolean
  message?: string
  data: T
}

export const authService = {
  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<ApiResult<LoginApiResponse>> {
    const response = await api.post<ApiResult<LoginApiResponse>>('/auth/login', credentials)
    return response.data
  },

  /**
   * Déconnexion
   */
  async logout() {
    return api.post('/auth/logout')
  },

  /**
   * Récupérer le profil utilisateur courant
   */
  async getProfile() {
    const response = await api.get<ApiResult<LoginApiResponse['user']>>('/auth/me')
    return response.data
  },

  /**
   * Rafraîchir le token
   */
  async refreshToken(refreshToken: string) {
    const response = await api.post<ApiResult<{ token: string }>>('/auth/refresh', {
      refreshToken,
    })
    return response.data
  },

  /**
   * Changer le mot de passe
   */
  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }) {
    const response = await api.put<ApiResult<void>>('/auth/password', data)
    return response.data
  },
}
