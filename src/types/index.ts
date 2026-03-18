// ===== TYPES GÉNÉRAUX =====
export type ID = string | number

export interface BaseEntity {
  id: ID
  createdAt: string
  updatedAt: string
}

// ===== AUTHENTIFICATION & RBAC =====
export type UserRole = 'super_admin' | 'admin' | 'comptable' | 'rh' | 'enseignant' | 'parent' | 'eleve'

export interface Permission {
  module: string
  actions: ('create' | 'read' | 'update' | 'delete')[]
}

export interface User extends BaseEntity {
  email: string
  nom: string
  prenom: string
  role: UserRole
  avatar?: string
  telephone?: string
  permissions: Permission[]
  isActive: boolean
  lastLogin?: string
  schoolId?: ID // ID de l'école (null pour SuperAdmin)
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

// ===== MULTI-TENANT: ÉCOLE =====
export interface School {
  id: ID
  code: string
  name: string
  currency: string
  whatsappNumber?: string
  isActive?: boolean
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
  school?: School // École de l'utilisateur (null pour SuperAdmin)
}

// ===== ÉTABLISSEMENT & CONFIGURATION =====
export interface Etablissement {
  id: ID
  nom: string
  adresse: string
  telephone: string
  email: string
  logo?: string
  devise: string
  anneeScolaireActive: AnneeScolaire
}

export interface AnneeScolaire extends BaseEntity {
  libelle: string // ex: "2024-2025"
  dateDebut: string
  dateFin: string
  estActive: boolean
}

// ===== ORGANISATION SCOLAIRE =====
export interface Cycle extends BaseEntity {
  nom: string // ex: "Primaire", "Secondaire"
  ordre: number
}

export interface Niveau extends BaseEntity {
  nom: string // ex: "6ème", "5ème", "Terminale"
  cycleId: ID
  cycle?: Cycle
  ordre: number
}

export interface Filiere extends BaseEntity {
  nom: string // ex: "Scientifique", "Littéraire"
  code: string // ex: "S", "L"
  niveauIds: ID[]
}

export interface Classe extends BaseEntity {
  nom: string // ex: "6ème A", "Terminale S1"
  niveauId: ID
  niveau?: Niveau
  filiereId?: ID
  filiere?: Filiere
  anneeScolaireId: ID
  capacite: number
  effectif: number
  professeurPrincipalId?: ID
  professeurPrincipal?: Enseignant
}

// ===== ÉTUDIANTS/ÉLÈVES =====
export type Sexe = 'M' | 'F'
export type StatutEleve = 'inscrit' | 'reinscrit' | 'transfere' | 'abandonne' | 'diplome'
export type StatutInscription = 'en_attente' | 'validee' | 'refusee' | 'annulee'

export interface Tuteur {
  nom: string
  prenom: string
  telephone: string
  email?: string
  profession?: string
  lienParente: 'pere' | 'mere' | 'tuteur' | 'autre'
  adresse?: string
}

export interface PieceJointe {
  id: ID
  nom: string
  type: 'photo' | 'acte_naissance' | 'certificat_scolarite' | 'bulletin' | 'autre'
  url: string
  taille: number
  dateUpload: string
}

export interface Eleve extends BaseEntity {
  matricule: string
  nom: string
  prenom: string
  dateNaissance: string
  lieuNaissance: string
  sexe: Sexe
  nationalite: string
  adresse?: string
  telephone?: string
  email?: string
  photo?: string
  tuteurs: Tuteur[]
  piecesJointes: PieceJointe[]
  statut: StatutEleve
  classeActuelle?: Classe
  classeActuelleId?: ID
  groupeSanguin?: string
  allergies?: string
  observations?: string
}

export interface Inscription extends BaseEntity {
  eleveId: ID
  eleve?: Eleve
  classeId: ID
  classe?: Classe
  anneeScolaireId: ID
  anneeScolaire?: AnneeScolaire
  dateInscription: string
  statut: StatutInscription
  montantInscription: number
  montantPaye: number
  estNouveau: boolean
  observations?: string
}

// ===== NOTES & BULLETINS =====
export interface Matiere extends BaseEntity {
  nom: string
  code: string
  coefficient: number
  niveauIds: ID[]
}

export interface Note extends BaseEntity {
  eleveId: ID
  eleve?: Eleve
  matiereId: ID
  matiere?: Matiere
  enseignantId: ID
  enseignant?: Enseignant
  type: 'devoir' | 'examen' | 'tp' | 'oral' | 'participation'
  note: number
  noteMax: number
  coefficient: number
  periode: 'trimestre1' | 'trimestre2' | 'trimestre3' | 'semestre1' | 'semestre2'
  dateEvaluation: string
  observations?: string
}

export interface MoyenneMatiere {
  matiereId: ID
  matiere: Matiere
  moyenne: number
  rang?: number
  appreciation?: string
}

export interface Bulletin {
  eleveId: ID
  eleve: Eleve
  classeId: ID
  classe: Classe
  periode: string
  moyennesParMatiere: MoyenneMatiere[]
  moyenneGenerale: number
  rang: number
  effectifClasse: number
  appreciationGenerale?: string
  decision?: 'admis' | 'redouble' | 'exclu' | 'en_attente'
}

// ===== EMPLOI DU TEMPS =====
export type JourSemaine = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi'

export interface CreneauHoraire extends BaseEntity {
  heureDebut: string // "08:00"
  heureFin: string   // "09:00"
  ordre: number
}

export interface SeanceEmploiTemps extends BaseEntity {
  classeId: ID
  classe?: Classe
  matiereId: ID
  matiere?: Matiere
  enseignantId: ID
  enseignant?: Enseignant
  salleId?: ID
  salle?: Salle
  jour: JourSemaine
  creneauId: ID
  creneau?: CreneauHoraire
  anneeScolaireId: ID
}

export interface Salle extends BaseEntity {
  nom: string
  capacite: number
  type: 'classe' | 'labo' | 'informatique' | 'sport' | 'reunion'
  batiment?: string
}

// ===== RESSOURCES HUMAINES =====
export type TypeContrat = 'cdi' | 'cdd' | 'vacation' | 'stage'
export type StatutEmploye = 'actif' | 'conge' | 'suspendu' | 'demission' | 'licencie'

export interface Enseignant extends BaseEntity {
  matricule: string
  nom: string
  prenom: string
  email: string
  telephone: string
  sexe: Sexe
  dateNaissance?: string
  adresse?: string
  photo?: string
  specialite: string
  matieres: Matiere[]
  diplome?: string
  dateEmbauche: string
  typeContrat: TypeContrat
  statut: StatutEmploye
  salaireBase: number
  userId?: ID
}

export interface Personnel extends BaseEntity {
  matricule: string
  nom: string
  prenom: string
  email: string
  telephone: string
  sexe: Sexe
  fonction: string
  departement: string
  dateEmbauche: string
  typeContrat: TypeContrat
  statut: StatutEmploye
  salaireBase: number
  photo?: string
  userId?: ID
}

export interface Presence extends BaseEntity {
  employeId: ID
  employeType: 'enseignant' | 'personnel'
  date: string
  heureArrivee?: string
  heureDepart?: string
  statut: 'present' | 'absent' | 'retard' | 'conge' | 'mission'
  motif?: string
}

export interface Conge extends BaseEntity {
  employeId: ID
  employeType: 'enseignant' | 'personnel'
  type: 'annuel' | 'maladie' | 'maternite' | 'sans_solde' | 'exceptionnel'
  dateDebut: string
  dateFin: string
  motif: string
  statut: 'en_attente' | 'approuve' | 'refuse'
  approuvePar?: ID
  dateApprobation?: string
}

export interface Salaire extends BaseEntity {
  employeId: ID
  employeType: 'enseignant' | 'personnel'
  mois: number
  annee: number
  salaireBase: number
  primes: number
  deductions: number
  salaireNet: number
  datePaiement?: string
  estPaye: boolean
  modePaiement?: 'virement' | 'cheque' | 'especes'
}

// ===== COMPTABILITÉ =====
export type TypePaiement = 'inscription' | 'scolarite' | 'cantine' | 'transport' | 'uniforme' | 'autre'
export type StatutPaiement = 'en_attente' | 'partiel' | 'complete' | 'en_retard'
export type ModePaiement = 'especes' | 'cheque' | 'virement' | 'mobile_money' | 'carte'

export interface FraisScolaire extends BaseEntity {
  libelle: string
  type: TypePaiement
  montant: number
  niveauId?: ID
  classeId?: ID
  anneeScolaireId: ID
  echeances: Echeance[]
  obligatoire: boolean
}

export interface Echeance {
  numero: number
  montant: number
  dateLimite: string
}

export interface Paiement extends BaseEntity {
  eleveId: ID
  eleve?: Eleve
  fraisId: ID
  frais?: FraisScolaire
  montant: number
  modePaiement: ModePaiement
  reference?: string
  datePaiement: string
  recuPar: ID
  recuParUser?: User
  observations?: string
}

export interface FactureEleve {
  eleveId: ID
  eleve: Eleve
  anneeScolaireId: ID
  totalDu: number
  totalPaye: number
  solde: number
  statut: StatutPaiement
  detailsFrais: {
    frais: FraisScolaire
    montantDu: number
    montantPaye: number
    prochainEcheance?: Echeance
  }[]
}

export interface Depense extends BaseEntity {
  libelle: string
  categorie: 'fournitures' | 'equipement' | 'maintenance' | 'salaires' | 'services' | 'autre'
  montant: number
  dateDepense: string
  beneficiaire?: string
  modePaiement: ModePaiement
  reference?: string
  justificatif?: string
  approuvePar?: ID
  observations?: string
}

export interface MouvementCaisse extends BaseEntity {
  type: 'entree' | 'sortie'
  montant: number
  libelle: string
  reference?: string
  date: string
  soldePrecedent: number
  soldeApres: number
}

// ===== RAPPORTS =====
export interface RapportTresorerie {
  periode: { debut: string; fin: string }
  totalEntrees: number
  totalSorties: number
  solde: number
  entreeParType: Record<string, number>
  sortieParCategorie: Record<string, number>
  evolutionMensuelle: {
    mois: string
    entrees: number
    sorties: number
    solde: number
  }[]
}

// ===== PAGINATION & FILTRES =====
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface EleveFilters extends PaginationParams {
  classeId?: ID
  niveauId?: ID
  statut?: StatutEleve
  sexe?: Sexe
  anneeScolaireId?: ID
}

// ===== NOTIFICATIONS =====
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification extends BaseEntity {
  titre: string
  message: string
  type: NotificationType
  lu: boolean
  userId: ID
  lien?: string
}

// ===== API RESPONSES =====
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}



