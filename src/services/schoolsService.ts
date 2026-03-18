/**
 * ============================================
 * Schools Service - API Client Multi-Tenant
 * ============================================
 */

import api from './api'
import type { School } from '@/types'

export interface SchoolWithStats extends School {
  usersCount: number
  studentsCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateSchoolData {
  code: string
  name: string
  currency?: string
  whatsappNumber?: string
}

export interface UpdateSchoolData {
  name?: string
  currency?: string
  whatsappNumber?: string
  isActive?: boolean
}

export const schoolsService = {
  /**
   * Liste toutes les écoles (SuperAdmin)
   */
  async getAll(): Promise<SchoolWithStats[]> {
    const response = await api.get('/schools')
    return response.data.data
  },

  /**
   * Récupère une école par ID
   */
  async getById(id: number | string): Promise<SchoolWithStats> {
    const response = await api.get(`/schools/${id}`)
    return response.data.data
  },

  /**
   * Crée une nouvelle école
   */
  async create(data: CreateSchoolData): Promise<{ id: number; code: string; name: string }> {
    const response = await api.post('/schools', data)
    return response.data.data
  },

  /**
   * Met à jour une école
   */
  async update(id: number | string, data: UpdateSchoolData): Promise<void> {
    await api.put(`/schools/${id}`, data)
  },

  /**
   * Supprime une école (attention: opération dangereuse)
   */
  async delete(id: number | string): Promise<void> {
    await api.delete(`/schools/${id}`)
  },

  /**
   * Active/désactive une école
   */
  async toggleActive(id: number | string, isActive: boolean): Promise<void> {
    await api.put(`/schools/${id}`, { isActive })
  },
}

export default schoolsService



