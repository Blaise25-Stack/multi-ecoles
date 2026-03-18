import { api, buildPaginationParams } from './api'
import type {
  ID,
  Paiement,
  Depense,
  FraisScolaire,
  FactureEleve,
  MouvementCaisse,
  RapportTresorerie,
  PaginatedResponse,
  PaginationParams,
} from '@/types'

export const comptabiliteService = {
  // ===== FRAIS SCOLAIRES =====

  /**
   * Liste des frais scolaires
   */
  async getFraisScolaires(anneeScolaireId?: ID) {
    return api.get<FraisScolaire[]>('/comptabilite/frais', {
      params: { annee_scolaire_id: anneeScolaireId },
    })
  },

  /**
   * Créer un frais scolaire
   */
  async createFrais(data: Omit<FraisScolaire, 'id' | 'createdAt' | 'updatedAt'>) {
    return api.post<FraisScolaire>('/comptabilite/frais', data)
  },

  /**
   * Mettre à jour un frais
   */
  async updateFrais(id: ID, data: Partial<FraisScolaire>) {
    return api.put<FraisScolaire>(`/comptabilite/frais/${id}`, data)
  },

  /**
   * Supprimer un frais
   */
  async deleteFrais(id: ID) {
    return api.delete(`/comptabilite/frais/${id}`)
  },

  // ===== PAIEMENTS =====

  /**
   * Liste des paiements
   */
  async getPaiements(params?: PaginationParams & {
    eleveId?: ID
    fraisId?: ID
    dateDebut?: string
    dateFin?: string
    modePaiement?: string
  }) {
    const queryParams = params ? buildPaginationParams(params) : {}
    if (params?.eleveId) queryParams.eleve_id = params.eleveId
    if (params?.fraisId) queryParams.frais_id = params.fraisId
    if (params?.dateDebut) queryParams.date_debut = params.dateDebut
    if (params?.dateFin) queryParams.date_fin = params.dateFin
    if (params?.modePaiement) queryParams.mode_paiement = params.modePaiement
    
    return api.get<PaginatedResponse<Paiement>>('/comptabilite/paiements', { params: queryParams })
  },

  /**
   * Enregistrer un paiement
   */
  async createPaiement(data: {
    eleveId: ID
    fraisId: ID
    montant: number
    modePaiement: string
    reference?: string
    observations?: string
  }) {
    return api.post<Paiement>('/comptabilite/paiements', data)
  },

  /**
   * Annuler un paiement
   */
  async annulerPaiement(id: ID, motif: string) {
    return api.patch<Paiement>(`/comptabilite/paiements/${id}/annuler`, { motif })
  },

  /**
   * Télécharger le reçu de paiement
   */
  async downloadRecu(paiementId: ID) {
    return api.download(`/comptabilite/paiements/${paiementId}/recu`, `recu_${paiementId}.pdf`)
  },

  // ===== FACTURES ÉLÈVES =====

  /**
   * Récupérer la situation financière d'un élève
   */
  async getFactureEleve(eleveId: ID, anneeScolaireId?: ID) {
    return api.get<FactureEleve>(`/comptabilite/factures/eleve/${eleveId}`, {
      params: { annee_scolaire_id: anneeScolaireId },
    })
  },

  /**
   * Liste des élèves avec soldes impayés
   */
  async getElevesImpayes(params?: PaginationParams & {
    classeId?: ID
    niveauId?: ID
    montantMin?: number
  }) {
    const queryParams = params ? buildPaginationParams(params) : {}
    if (params?.classeId) queryParams.classe_id = params.classeId
    if (params?.niveauId) queryParams.niveau_id = params.niveauId
    if (params?.montantMin) queryParams.montant_min = params.montantMin
    
    return api.get<PaginatedResponse<FactureEleve>>('/comptabilite/factures/impayes', { params: queryParams })
  },

  // ===== DÉPENSES =====

  /**
   * Liste des dépenses
   */
  async getDepenses(params?: PaginationParams & {
    categorieId?: ID
    dateDebut?: string
    dateFin?: string
  }) {
    const queryParams = params ? buildPaginationParams(params) : {}
    if (params?.categorieId) queryParams.categorie_id = params.categorieId
    if (params?.dateDebut) queryParams.date_debut = params.dateDebut
    if (params?.dateFin) queryParams.date_fin = params.dateFin
    
    return api.get<PaginatedResponse<Depense>>('/comptabilite/depenses', { params: queryParams })
  },

  /**
   * Créer une dépense
   */
  async createDepense(data: Omit<Depense, 'id' | 'createdAt' | 'updatedAt'>) {
    return api.post<Depense>('/comptabilite/depenses', data)
  },

  /**
   * Mettre à jour une dépense
   */
  async updateDepense(id: ID, data: Partial<Depense>) {
    return api.put<Depense>(`/comptabilite/depenses/${id}`, data)
  },

  /**
   * Supprimer une dépense
   */
  async deleteDepense(id: ID) {
    return api.delete(`/comptabilite/depenses/${id}`)
  },

  // ===== CAISSE =====

  /**
   * Mouvements de caisse
   */
  async getMouvementsCaisse(params?: PaginationParams & {
    type?: 'entree' | 'sortie'
    dateDebut?: string
    dateFin?: string
  }) {
    const queryParams = params ? buildPaginationParams(params) : {}
    if (params?.type) queryParams.type = params.type
    if (params?.dateDebut) queryParams.date_debut = params.dateDebut
    if (params?.dateFin) queryParams.date_fin = params.dateFin
    
    return api.get<PaginatedResponse<MouvementCaisse>>('/comptabilite/caisse/mouvements', { params: queryParams })
  },

  /**
   * Solde actuel de la caisse
   */
  async getSoldeCaisse() {
    return api.get<{ solde: number; dernierMouvement: MouvementCaisse | null }>('/comptabilite/caisse/solde')
  },

  // ===== RAPPORTS =====

  /**
   * Rapport de trésorerie
   */
  async getRapportTresorerie(dateDebut: string, dateFin: string) {
    return api.get<RapportTresorerie>('/comptabilite/rapports/tresorerie', {
      params: { date_debut: dateDebut, date_fin: dateFin },
    })
  },

  /**
   * Exporter le rapport en Excel
   */
  async exportRapportExcel(dateDebut: string, dateFin: string) {
    return api.download(
      `/comptabilite/rapports/tresorerie/excel?date_debut=${dateDebut}&date_fin=${dateFin}`,
      `rapport_tresorerie_${dateDebut}_${dateFin}.xlsx`
    )
  },

  /**
   * Exporter le rapport en PDF
   */
  async exportRapportPDF(dateDebut: string, dateFin: string) {
    return api.download(
      `/comptabilite/rapports/tresorerie/pdf?date_debut=${dateDebut}&date_fin=${dateFin}`,
      `rapport_tresorerie_${dateDebut}_${dateFin}.pdf`
    )
  },

  // ===== STATISTIQUES =====

  /**
   * Statistiques comptables
   */
  async getStatistiques(anneeScolaireId?: ID) {
    return api.get<{
      totalRecettes: number
      totalDepenses: number
      solde: number
      tauxRecouvrement: number
      recettesParMois: { mois: string; montant: number }[]
      depensesParCategorie: Record<string, number>
      elevesEnRegle: number
      elevesImpayes: number
    }>('/comptabilite/statistiques', { params: { annee_scolaire_id: anneeScolaireId } })
  },
}



