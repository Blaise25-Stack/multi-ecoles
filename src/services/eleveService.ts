import { api, buildPaginationParams } from './api'
import type {
  Eleve,
  Inscription,
  PaginatedResponse,
  EleveFilters,
  ID,
  Bulletin,
  PieceJointe,
} from '@/types'

export const eleveService = {
  /**
   * Liste des élèves avec pagination et filtres
   */
  async getEleves(filters?: EleveFilters) {
    const params: Record<string, any> = {}
    
    if (filters?.page) params.page = filters.page
    if (filters?.perPage) params.limit = filters.perPage
    if (filters?.search) params.search = filters.search
    if (filters?.classeId) params.classe_id = filters.classeId
    if (filters?.niveauId) params.niveau_id = filters.niveauId
    if (filters?.sexe) params.sexe = filters.sexe
    if (filters?.isActive !== undefined) params.is_active = filters.isActive
    
    const response = await api.get('/eleves', { params })
    return response.data
  },

  /**
   * Récupérer un élève par ID
   */
  async getEleve(id: ID) {
    const response = await api.get(`/eleves/${id}`)
    return response.data
  },

  /**
   * Créer un nouvel élève
   */
  async createEleve(data: Omit<Eleve, 'id' | 'createdAt' | 'updatedAt' | 'matricule'>) {
    return api.post<Eleve>('/eleves', data)
  },

  /**
   * Mettre à jour un élève
   */
  async updateEleve(id: ID, data: Partial<Eleve>) {
    return api.put<Eleve>(`/eleves/${id}`, data)
  },

  /**
   * Supprimer un élève
   */
  async deleteEleve(id: ID) {
    const response = await api.delete(`/eleves/${id}`)
    return response.data
  },

  /**
   * Rechercher des élèves
   */
  async searchEleves(query: string, limit = 10) {
    return api.get<Eleve[]>('/eleves/search', { params: { q: query, limit } })
  },

  // ===== INSCRIPTIONS =====

  /**
   * Inscrire un élève
   */
  async inscrireEleve(data: {
    eleveId?: ID
    eleveData?: Omit<Eleve, 'id' | 'createdAt' | 'updatedAt' | 'matricule'>
    classeId: ID
    anneeScolaireId: ID
    estNouveau: boolean
    observations?: string
  }) {
    return api.post<Inscription>('/inscriptions', data)
  },

  /**
   * Liste des inscriptions
   */
  async getInscriptions(filters?: {
    anneeScolaireId?: ID
    classeId?: ID
    statut?: string
    page?: number
    perPage?: number
  }) {
    return api.get<PaginatedResponse<Inscription>>('/inscriptions', { params: filters })
  },

  /**
   * Valider une inscription
   */
  async validerInscription(id: ID) {
    return api.patch<Inscription>(`/inscriptions/${id}/valider`)
  },

  /**
   * Refuser une inscription
   */
  async refuserInscription(id: ID, motif: string) {
    return api.patch<Inscription>(`/inscriptions/${id}/refuser`, { motif })
  },

  // ===== PIÈCES JOINTES =====

  /**
   * Upload une pièce jointe pour un élève
   */
  async uploadPieceJointe(eleveId: ID, file: File, type: PieceJointe['type']) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    return api.upload<PieceJointe>(`/eleves/${eleveId}/documents`, formData)
  },

  /**
   * Supprimer une pièce jointe
   */
  async deletePieceJointe(eleveId: ID, documentId: ID) {
    return api.delete(`/eleves/${eleveId}/documents/${documentId}`)
  },

  // ===== BULLETINS =====

  /**
   * Récupérer le bulletin d'un élève
   */
  async getBulletin(eleveId: ID, periode: string, anneeScolaireId?: ID) {
    return api.get<Bulletin>(`/eleves/${eleveId}/bulletin`, {
      params: { periode, annee_scolaire_id: anneeScolaireId },
    })
  },

  /**
   * Télécharger le bulletin en PDF
   */
  async downloadBulletin(eleveId: ID, periode: string) {
    return api.download(`/eleves/${eleveId}/bulletin/pdf?periode=${periode}`, `bulletin_${periode}.pdf`)
  },

  // ===== STATISTIQUES =====

  /**
   * Statistiques globales des élèves
   */
  async getStatistiques(anneeScolaireId?: ID) {
    return api.get<{
      totalEleves: number
      nouveauxInscrits: number
      reinscrits: number
      parSexe: { M: number; F: number }
      parNiveau: Record<string, number>
      parStatut: Record<string, number>
    }>('/eleves/statistiques', { params: { annee_scolaire_id: anneeScolaireId } })
  },
}



