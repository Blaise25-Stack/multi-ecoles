import type { Enseignant, Personnel, Presence, Conge, Salaire } from '@/types'
import { mockMatieres } from './config'

export const mockEnseignants: Enseignant[] = [
  {
    id: '1',
    matricule: 'ENS2020001',
    nom: 'Kabongo',
    prenom: 'Jean-Pierre',
    email: 'jp.kabongo@sgs-rdc.edu',
    telephone: '099100001',
    sexe: 'M',
    dateNaissance: '1985-03-15',
    adresse: 'Gombe, Kinshasa',
    specialite: 'Mathématiques',
    matieres: [mockMatieres[0]], // Maths
    diplome: 'Licence en Mathématiques (UNIKIN)',
    dateEmbauche: '2020-09-01',
    typeContrat: 'cdi',
    statut: 'actif',
    salaireBase: 250000,
    createdAt: '2020-09-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    matricule: 'ENS2019002',
    nom: 'Mwamba',
    prenom: 'Marie',
    email: 'm.mwamba@sgs-rdc.edu',
    telephone: '099100002',
    sexe: 'F',
    dateNaissance: '1988-07-22',
    adresse: 'Lemba, Kinshasa',
    specialite: 'Français',
    matieres: [mockMatieres[1]], // Français
    diplome: 'Licence en Lettres (ISP Gombe)',
    dateEmbauche: '2019-09-01',
    typeContrat: 'cdi',
    statut: 'actif',
    salaireBase: 220000,
    createdAt: '2019-09-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    matricule: 'ENS2021003',
    nom: 'Lukusa',
    prenom: 'David',
    email: 'd.lukusa@sgs-rdc.edu',
    telephone: '099100003',
    sexe: 'M',
    dateNaissance: '1990-11-08',
    adresse: 'Ngaliema, Kinshasa',
    specialite: 'Physique-Chimie',
    matieres: [mockMatieres[3]], // PC
    diplome: 'Licence en Chimie (UNIKIN)',
    dateEmbauche: '2021-09-01',
    typeContrat: 'cdi',
    statut: 'actif',
    salaireBase: 200000,
    createdAt: '2021-09-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    matricule: 'ENS2022004',
    nom: 'Nzuzi',
    prenom: 'Sarah',
    email: 's.nzuzi@sgs-rdc.edu',
    telephone: '099100004',
    sexe: 'F',
    dateNaissance: '1992-05-30',
    adresse: 'Lingwala, Kinshasa',
    specialite: 'Anglais',
    matieres: [mockMatieres[2]], // Anglais
    diplome: 'Licence en Anglais (ISP Gombe)',
    dateEmbauche: '2022-09-01',
    typeContrat: 'cdd',
    statut: 'actif',
    salaireBase: 180000,
    createdAt: '2022-09-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    matricule: 'ENS2023005',
    nom: 'Kasongo',
    prenom: 'Patrick',
    email: 'p.kasongo@sgs-rdc.edu',
    telephone: '099100005',
    sexe: 'M',
    dateNaissance: '1987-09-12',
    adresse: 'Matete, Kinshasa',
    specialite: 'SVT',
    matieres: [mockMatieres[4]], // SVT
    diplome: 'Licence en Biologie (UNIKIN)',
    dateEmbauche: '2023-09-01',
    typeContrat: 'cdi',
    statut: 'actif',
    salaireBase: 190000,
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    matricule: 'ENS2024006',
    nom: 'Mutombo',
    prenom: 'Grace',
    email: 'g.mutombo@sgs-rdc.edu',
    telephone: '099100006',
    sexe: 'F',
    dateNaissance: '1994-02-18',
    adresse: 'Kintambo, Kinshasa',
    specialite: 'Histoire-Géographie',
    matieres: [mockMatieres[5]], // Histoire-Géo
    diplome: 'Licence en Histoire (ISP Gombe)',
    dateEmbauche: '2024-09-01',
    typeContrat: 'cdd',
    statut: 'actif',
    salaireBase: 150000,
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
]

export const mockPersonnel: Personnel[] = [
  {
    id: '1',
    matricule: 'PER2018001',
    nom: 'Kalombo',
    prenom: 'Martine',
    email: 'm.kalombo@sgs-rdc.edu',
    telephone: '099200001',
    sexe: 'F',
    fonction: 'Secrétaire Principale',
    departement: 'Administration',
    dateEmbauche: '2018-01-15',
    typeContrat: 'cdi',
    statut: 'actif',
    salaireBase: 150000,
    createdAt: '2018-01-15T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    matricule: 'PER2019002',
    nom: 'Tshimanga',
    prenom: 'Samuel',
    email: 's.tshimanga@sgs-rdc.edu',
    telephone: '099200002',
    sexe: 'M',
    fonction: 'Agent de sécurité',
    departement: 'Services Généraux',
    dateEmbauche: '2019-03-01',
    typeContrat: 'cdi',
    statut: 'actif',
    salaireBase: 80000,
    createdAt: '2019-03-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    matricule: 'PER2020003',
    nom: 'Mbombo',
    prenom: 'Rose',
    email: 'r.mbombo@sgs-rdc.edu',
    telephone: '099200003',
    sexe: 'F',
    fonction: 'Cuisinière',
    departement: 'Cantine',
    dateEmbauche: '2020-09-01',
    typeContrat: 'cdi',
    statut: 'actif',
    salaireBase: 70000,
    createdAt: '2020-09-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    matricule: 'PER2021004',
    nom: 'Luzolo',
    prenom: 'Paul',
    email: 'p.luzolo@sgs-rdc.edu',
    telephone: '099200004',
    sexe: 'M',
    fonction: 'Technicien informatique',
    departement: 'IT',
    dateEmbauche: '2021-01-10',
    typeContrat: 'cdi',
    statut: 'actif',
    salaireBase: 120000,
    createdAt: '2021-01-10T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Générer des présences
export const mockPresences: Presence[] = []
const statuts = ['present', 'absent', 'retard'] as const
let presenceId = 1

// Présences pour novembre et décembre 2024
for (let day = 1; day <= 30; day++) {
  const date = `2024-11-${String(day).padStart(2, '0')}`
  const dayOfWeek = new Date(date).getDay()
  
  // Pas de présences le weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) continue
  
  // Pour chaque enseignant
  mockEnseignants.forEach((ens) => {
    const statut = Math.random() > 0.1 
      ? 'present' 
      : Math.random() > 0.5 
        ? 'retard' 
        : 'absent'
    
    mockPresences.push({
      id: String(presenceId++),
      employeId: ens.id,
      employeType: 'enseignant',
      date,
      heureArrivee: statut !== 'absent' 
        ? statut === 'retard' 
          ? '08:15' 
          : '07:25' 
        : undefined,
      heureDepart: statut !== 'absent' ? '16:30' : undefined,
      statut,
      motif: statut === 'absent' ? 'Maladie' : undefined,
      createdAt: `${date}T08:00:00Z`,
      updatedAt: `${date}T08:00:00Z`,
    })
  })
}

// Congés
export const mockConges: Conge[] = [
  {
    id: '1',
    employeId: '2',
    employeType: 'enseignant',
    type: 'maladie',
    dateDebut: '2024-11-15',
    dateFin: '2024-11-18',
    motif: 'Consultation médicale et repos prescrit',
    statut: 'approuve',
    approuvePar: '1',
    dateApprobation: '2024-11-14',
    createdAt: '2024-11-13T10:00:00Z',
    updatedAt: '2024-11-14T09:00:00Z',
  },
  {
    id: '2',
    employeId: '4',
    employeType: 'enseignant',
    type: 'exceptionnel',
    dateDebut: '2024-12-20',
    dateFin: '2024-12-23',
    motif: 'Mariage',
    statut: 'en_attente',
    createdAt: '2024-12-01T14:00:00Z',
    updatedAt: '2024-12-01T14:00:00Z',
  },
]

// Salaires
export const mockSalaires: Salaire[] = []
let salaireId = 1

// Salaires de septembre à novembre 2024
for (let mois = 9; mois <= 11; mois++) {
  mockEnseignants.forEach((ens) => {
    const primes = Math.floor(Math.random() * 30000)
    const deductions = Math.floor(Math.random() * 15000)
    
    mockSalaires.push({
      id: String(salaireId++),
      employeId: ens.id,
      employeType: 'enseignant',
      mois,
      annee: 2024,
      salaireBase: ens.salaireBase,
      primes,
      deductions,
      salaireNet: ens.salaireBase + primes - deductions,
      datePaiement: mois < 11 ? `2024-${String(mois).padStart(2, '0')}-28` : undefined,
      estPaye: mois < 11,
      modePaiement: mois < 11 ? 'virement' : undefined,
      createdAt: `2024-${String(mois).padStart(2, '0')}-25T00:00:00Z`,
      updatedAt: `2024-${String(mois).padStart(2, '0')}-28T00:00:00Z`,
    })
  })
  
  mockPersonnel.forEach((pers) => {
    const primes = Math.floor(Math.random() * 15000)
    const deductions = Math.floor(Math.random() * 8000)
    
    mockSalaires.push({
      id: String(salaireId++),
      employeId: pers.id,
      employeType: 'personnel',
      mois,
      annee: 2024,
      salaireBase: pers.salaireBase,
      primes,
      deductions,
      salaireNet: pers.salaireBase + primes - deductions,
      datePaiement: mois < 11 ? `2024-${String(mois).padStart(2, '0')}-28` : undefined,
      estPaye: mois < 11,
      modePaiement: mois < 11 ? 'virement' : undefined,
      createdAt: `2024-${String(mois).padStart(2, '0')}-25T00:00:00Z`,
      updatedAt: `2024-${String(mois).padStart(2, '0')}-28T00:00:00Z`,
    })
  })
}
