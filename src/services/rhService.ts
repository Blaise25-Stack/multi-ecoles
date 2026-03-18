import { api, buildPaginationParams } from './api'
import type {
  ID,
  Enseignant,
  Personnel,
  Presence,
  Conge,
  Salaire,
  PaginatedResponse,
  PaginationParams,
} from '@/types'

export const rhService = {
  // ===== ENSEIGNANTS =====

  /**
   * Liste des enseignants
   */
  async getEnseignants(params?: PaginationParams & {
    statut?: string
    specialite?: string
  }) {
    const queryParams = params ? buildPaginationParams(params) : {}
    if (params?.statut) queryParams.statut = params.statut
    if (params?.specialite) queryParams.specialite = params.specialite
    
    return api.get<PaginatedResponse<Enseignant>>('/rh/enseignants', { params: queryParams })
  },

  /**
   * Récupérer un enseignant
   */
  async getEnseignant(id: ID) {
    return api.get<Enseignant>(`/rh/enseignants/${id}`)
  },

  /**
   * Créer un enseignant
   */
  async createEnseignant(data: Omit<Enseignant, 'id' | 'createdAt' | 'updatedAt' | 'matricule'>) {
    return api.post<Enseignant>('/rh/enseignants', data)
  },

  /**
   * Mettre à jour un enseignant
   */
  async updateEnseignant(id: ID, data: Partial<Enseignant>) {
    return api.put<Enseignant>(`/rh/enseignants/${id}`, data)
  },

  /**
   * Supprimer un enseignant
   */
  async deleteEnseignant(id: ID) {
    return api.delete(`/rh/enseignants/${id}`)
  },

  /**
   * Affecter des matières à un enseignant
   */
  async affecterMatieres(enseignantId: ID, matiereIds: ID[]) {
    return api.patch<Enseignant>(`/rh/enseignants/${enseignantId}/matieres`, {
      matiere_ids: matiereIds,
    })
  },

  // ===== PERSONNEL =====

  /**
   * Liste du personnel
   */
  async getPersonnel(params?: PaginationParams & {
    statut?: string
    departement?: string
  }) {
    const queryParams = params ? buildPaginationParams(params) : {}
    if (params?.statut) queryParams.statut = params.statut
    if (params?.departement) queryParams.departement = params.departement
    
    return api.get<PaginatedResponse<Personnel>>('/rh/personnel', { params: queryParams })
  },

  /**
   * Récupérer un membre du personnel
   */
  async getPersonnelById(id: ID) {
    return api.get<Personnel>(`/rh/personnel/${id}`)
  },

  /**
   * Créer un membre du personnel
   */
  async createPersonnel(data: Omit<Personnel, 'id' | 'createdAt' | 'updatedAt' | 'matricule'>) {
    return api.post<Personnel>('/rh/personnel', data)
  },

  /**
   * Mettre à jour un membre du personnel
   */
  async updatePersonnel(id: ID, data: Partial<Personnel>) {
    return api.put<Personnel>(`/rh/personnel/${id}`, data)
  },

  /**
   * Supprimer un membre du personnel
   */
  async deletePersonnel(id: ID) {
    return api.delete(`/rh/personnel/${id}`)
  },

  // ===== PRÉSENCES =====

  /**
   * Liste des présences
   */
  async getPresences(params?: PaginationParams & {
    employeId?: ID
    employeType?: 'enseignant' | 'personnel'
    date?: string
    dateDebut?: string
    dateFin?: string
    statut?: string
  }) {
    const queryParams = params ? buildPaginationParams(params) : {}
    if (params?.employeId) queryParams.employe_id = params.employeId
    if (params?.employeType) queryParams.employe_type = params.employeType
    if (params?.date) queryParams.date = params.date
    if (params?.dateDebut) queryParams.date_debut = params.dateDebut
    if (params?.dateFin) queryParams.date_fin = params.dateFin
    if (params?.statut) queryParams.statut = params.statut
    
    return api.get<PaginatedResponse<Presence>>('/rh/presences', { params: queryParams })
  },

  /**
   * Enregistrer une présence
   */
  async enregistrerPresence(data: {
    employeId: ID
    employeType: 'enseignant' | 'personnel'
    date: string
    heureArrivee?: string
    heureDepart?: string
    statut: string
    motif?: string
  }) {
    return api.post<Presence>('/rh/presences', data)
  },

  /**
   * Pointer (arrivée/départ)
   */
  async pointer(employeId: ID, employeType: 'enseignant' | 'personnel', type: 'arrivee' | 'depart') {
    return api.post<Presence>('/rh/presences/pointer', {
      employe_id: employeId,
      employe_type: employeType,
      type,
    })
  },

  /**
   * Rapport de présences
   */
  async getRapportPresences(params: {
    dateDebut: string
    dateFin: string
    employeType?: 'enseignant' | 'personnel'
  }) {
    return api.get<{
      totalJours: number
      presences: number
      absences: number
      retards: number
      tauxPresence: number
      detailParEmploye: {
        employeId: ID
        nom: string
        prenom: string
        presences: number
        absences: number
        retards: number
      }[]
    }>('/rh/presences/rapport', { params })
  },

  // ===== CONGÉS =====

  /**
   * Liste des congés
   */
  async getConges(params?: PaginationParams & {
    employeId?: ID
    employeType?: 'enseignant' | 'personnel'
    statut?: string
    type?: string
  }) {
    const queryParams = params ? buildPaginationParams(params) : {}
    if (params?.employeId) queryParams.employe_id = params.employeId
    if (params?.employeType) queryParams.employe_type = params.employeType
    if (params?.statut) queryParams.statut = params.statut
    if (params?.type) queryParams.type = params.type
    
    return api.get<PaginatedResponse<Conge>>('/rh/conges', { params: queryParams })
  },

  /**
   * Demander un congé
   */
  async demanderConge(data: {
    type: string
    dateDebut: string
    dateFin: string
    motif: string
  }) {
    return api.post<Conge>('/rh/conges', data)
  },

  /**
   * Approuver un congé
   */
  async approuverConge(id: ID) {
    return api.patch<Conge>(`/rh/conges/${id}/approuver`)
  },

  /**
   * Refuser un congé
   */
  async refuserConge(id: ID, motif: string) {
    return api.patch<Conge>(`/rh/conges/${id}/refuser`, { motif })
  },

  // ===== SALAIRES =====

  /**
   * Liste des salaires
   */
  async getSalaires(params?: PaginationParams & {
    employeId?: ID
    employeType?: 'enseignant' | 'personnel'
    mois?: number
    annee?: number
    estPaye?: boolean
  }) {
    const queryParams = params ? buildPaginationParams(params) : {}
    if (params?.employeId) queryParams.employe_id = params.employeId
    if (params?.employeType) queryParams.employe_type = params.employeType
    if (params?.mois) queryParams.mois = params.mois
    if (params?.annee) queryParams.annee = params.annee
    if (params?.estPaye !== undefined) queryParams.est_paye = params.estPaye
    
    return api.get<PaginatedResponse<Salaire>>('/rh/salaires', { params: queryParams })
  },

  /**
   * Générer les fiches de paie du mois
   */
  async genererFichesPaie(mois: number, annee: number) {
    return api.post<{ count: number }>('/rh/salaires/generer', { mois, annee })
  },

  /**
   * Payer un salaire
   */
  async payerSalaire(id: ID, modePaiement: string, reference?: string) {
    return api.patch<Salaire>(`/rh/salaires/${id}/payer`, {
      mode_paiement: modePaiement,
      reference,
    })
  },

  /**
   * Télécharger la fiche de paie
   */
  async downloadFichePaie(salaireId: ID) {
    return api.download(`/rh/salaires/${salaireId}/fiche`, `fiche_paie_${salaireId}.pdf`)
  },

  // ===== STATISTIQUES =====

  /**
   * Statistiques RH
   */
  async getStatistiques() {
    return api.get<{
      totalEnseignants: number
      totalPersonnel: number
      enseignantsActifs: number
      personnelActif: number
      enConge: number
      masseSalarialeMensuelle: number
      repartitionParContrat: Record<string, number>
    }>('/rh/statistiques')
  },
}



