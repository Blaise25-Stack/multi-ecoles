/**
 * ============================================
 * Stats Service - API Client Statistiques
 * ============================================
 */

import api from './api'

export interface PlatformStats {
  totalSchools: number
  activeSchools: number
  totalUsers: number
  totalStudents: number
  monthlyRevenue: number
  revenueGrowth: number
}

export interface SchoolSummary {
  id: number
  code: string
  name: string
  currency: string
  isActive: boolean
  usersCount: number
  studentsCount: number
  lastActivity?: string
  monthlyRevenue: number
  subscription: 'free' | 'basic' | 'premium' | 'enterprise'
  createdAt: string
}

export interface SchoolStats {
  users: number
  students: number
  classes: number
  teachers: number
  monthlyRevenue: number
  pendingPayments: number
}

export interface DashboardStats {
  totalStudents: number
  activeStudents: number
  classes: number
  teachers: number
  todayRevenue: number
  monthlyRevenue: number
}

export const statsService = {
  /**
   * Statistiques globales de la plateforme (SuperAdmin)
   */
  async getPlatformStats(): Promise<PlatformStats> {
    const response = await api.get('/stats/platform')
    return response.data.data
  },

  /**
   * Liste des écoles avec statistiques (SuperAdmin)
   */
  async getSchoolsWithStats(): Promise<SchoolSummary[]> {
    const response = await api.get('/stats/schools')
    return response.data.data
  },

  /**
   * Statistiques d'une école spécifique
   */
  async getSchoolStats(schoolId: number | string): Promise<{
    school: any
    stats: SchoolStats
  }> {
    const response = await api.get(`/stats/school/${schoolId}`)
    return response.data.data
  },

  /**
   * Statistiques pour le dashboard utilisateur
   */
  async getDashboardStats(): Promise<{
    schoolId?: number
    stats: DashboardStats
    isSuperAdmin?: boolean
  }> {
    const response = await api.get('/stats/dashboard')
    return response.data.data
  },
}

export default statsService



