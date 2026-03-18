/**
 * ============================================
 * Modules Service - Feature Flags API Client
 * ============================================
 */

import api from './api'

export interface AvailableModule {
  id: number
  key: string
  name: string
  description: string
  category: string
  isDefaultEnabled: boolean
  requiresSubscription: 'free' | 'basic' | 'premium' | 'enterprise'
  icon: string
  sortOrder: number
}

export interface SchoolModule extends AvailableModule {
  enabled: boolean
  enabledAt?: string
  disabledAt?: string
  config?: Record<string, any>
}

export interface ModulesResponse {
  schoolId: number
  modules: Record<string, SchoolModule[]>
  categories: string[]
  stats: {
    enabled: number
    total: number
    percentage: number
  }
}

export interface MyModulesResponse {
  schoolId?: number
  isSuperAdmin?: boolean
  allModulesEnabled?: boolean
  enabledModules: string[]
  modules: Array<{
    key: string
    name: string
    icon: string
    category: string
  }>
}

export const modulesService = {
  /**
   * Récupère tous les modules disponibles sur la plateforme
   */
  async getAvailable(): Promise<{
    modules: AvailableModule[]
    grouped: Record<string, AvailableModule[]>
    categories: string[]
  }> {
    const response = await api.get('/modules/available')
    return response.data.data
  },

  /**
   * Récupère les modules d'une école spécifique
   */
  async getSchoolModules(schoolId: number | string): Promise<ModulesResponse> {
    const response = await api.get(`/modules/school/${schoolId}`)
    return response.data.data
  },

  /**
   * Récupère les modules activés pour l'utilisateur courant
   */
  async getMyModules(): Promise<MyModulesResponse> {
    const response = await api.get('/modules/my')
    return response.data.data
  },

  /**
   * Active/désactive un module pour une école
   */
  async toggleModule(
    schoolId: number | string,
    moduleKey: string,
    enabled: boolean
  ): Promise<{ schoolId: number; moduleKey: string; enabled: boolean }> {
    const response = await api.put(`/modules/school/${schoolId}/${moduleKey}`, { enabled })
    return response.data.data
  },

  /**
   * Met à jour plusieurs modules en une fois
   */
  async bulkUpdate(
    schoolId: number | string,
    modules: Record<string, boolean>
  ): Promise<{ schoolId: number; updates: string[] }> {
    const response = await api.put(`/modules/school/${schoolId}/bulk`, { modules })
    return response.data.data
  },

  /**
   * Réinitialise les modules aux valeurs par défaut
   */
  async resetToDefaults(schoolId: number | string): Promise<void> {
    await api.post(`/modules/school/${schoolId}/reset`)
  },

  /**
   * Vérifie si un module est activé (helper côté client)
   */
  isModuleEnabled(enabledModules: string[], moduleKey: string): boolean {
    return enabledModules.includes(moduleKey)
  },
}

export default modulesService



