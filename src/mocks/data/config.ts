import type { AnneeScolaire, Etablissement, Niveau, Cycle, Classe, Matiere, CreneauHoraire } from '@/types'

export const mockEtablissement: Etablissement = {
  id: '1',
  nom: 'Collège & Lycée Excellence',
  adresse: 'BP 1234, Rue de l\'Éducation, Yaoundé',
  telephone: '+237 222 00 00 00',
  email: 'contact@excellence.edu',
  devise: 'XAF',
  anneeScolaireActive: {
    id: '2024-2025',
    libelle: '2024-2025',
    dateDebut: '2024-09-02',
    dateFin: '2025-06-30',
    estActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
}

export const mockAnneesScolaires: AnneeScolaire[] = [
  {
    id: '2024-2025',
    libelle: '2024-2025',
    dateDebut: '2024-09-02',
    dateFin: '2025-06-30',
    estActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2023-2024',
    libelle: '2023-2024',
    dateDebut: '2023-09-04',
    dateFin: '2024-06-28',
    estActive: false,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
]

export const mockCycles: Cycle[] = [
  { id: '1', nom: 'Primaire', ordre: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '2', nom: 'Collège', ordre: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '3', nom: 'Lycée', ordre: 3, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

export const mockNiveaux: Niveau[] = [
  { id: '1', nom: '6ème', cycleId: '2', ordre: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '2', nom: '5ème', cycleId: '2', ordre: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '3', nom: '4ème', cycleId: '2', ordre: 3, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '4', nom: '3ème', cycleId: '2', ordre: 4, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '5', nom: '2nde', cycleId: '3', ordre: 5, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '6', nom: '1ère', cycleId: '3', ordre: 6, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '7', nom: 'Terminale', cycleId: '3', ordre: 7, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

export const mockClasses: Classe[] = [
  { id: '1', nom: '6ème A', niveauId: '1', anneeScolaireId: '2024-2025', capacite: 40, effectif: 35, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '2', nom: '6ème B', niveauId: '1', anneeScolaireId: '2024-2025', capacite: 40, effectif: 38, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '3', nom: '5ème A', niveauId: '2', anneeScolaireId: '2024-2025', capacite: 40, effectif: 42, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '4', nom: '5ème B', niveauId: '2', anneeScolaireId: '2024-2025', capacite: 40, effectif: 40, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '5', nom: '4ème A', niveauId: '3', anneeScolaireId: '2024-2025', capacite: 40, effectif: 36, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '6', nom: '3ème A', niveauId: '4', anneeScolaireId: '2024-2025', capacite: 40, effectif: 33, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '7', nom: '2nde A', niveauId: '5', anneeScolaireId: '2024-2025', capacite: 45, effectif: 44, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '8', nom: '1ère S', niveauId: '6', filiereId: '1', anneeScolaireId: '2024-2025', capacite: 35, effectif: 32, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '9', nom: '1ère L', niveauId: '6', filiereId: '2', anneeScolaireId: '2024-2025', capacite: 35, effectif: 28, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '10', nom: 'Terminale S', niveauId: '7', filiereId: '1', anneeScolaireId: '2024-2025', capacite: 35, effectif: 30, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '11', nom: 'Terminale L', niveauId: '7', filiereId: '2', anneeScolaireId: '2024-2025', capacite: 35, effectif: 25, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

export const mockMatieres: Matiere[] = [
  { id: '1', nom: 'Mathématiques', code: 'MATH', coefficient: 5, niveauIds: ['1', '2', '3', '4', '5', '6', '7'], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '2', nom: 'Français', code: 'FRA', coefficient: 5, niveauIds: ['1', '2', '3', '4', '5', '6', '7'], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '3', nom: 'Anglais', code: 'ANG', coefficient: 3, niveauIds: ['1', '2', '3', '4', '5', '6', '7'], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '4', nom: 'Physique-Chimie', code: 'PC', coefficient: 4, niveauIds: ['3', '4', '5', '6', '7'], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '5', nom: 'Sciences de la Vie et de la Terre', code: 'SVT', coefficient: 3, niveauIds: ['1', '2', '3', '4', '5', '6', '7'], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '6', nom: 'Histoire-Géographie', code: 'HG', coefficient: 3, niveauIds: ['1', '2', '3', '4', '5', '6', '7'], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '7', nom: 'Éducation Civique', code: 'ECM', coefficient: 2, niveauIds: ['1', '2', '3', '4', '5', '6', '7'], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '8', nom: 'Informatique', code: 'INFO', coefficient: 2, niveauIds: ['3', '4', '5', '6', '7'], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '9', nom: 'Éducation Physique', code: 'EPS', coefficient: 2, niveauIds: ['1', '2', '3', '4', '5', '6', '7'], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '10', nom: 'Philosophie', code: 'PHILO', coefficient: 4, niveauIds: ['7'], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

export const mockCreneaux: CreneauHoraire[] = [
  { id: '1', heureDebut: '07:30', heureFin: '08:30', ordre: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '2', heureDebut: '08:30', heureFin: '09:30', ordre: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '3', heureDebut: '09:45', heureFin: '10:45', ordre: 3, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '4', heureDebut: '10:45', heureFin: '11:45', ordre: 4, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '5', heureDebut: '12:30', heureFin: '13:30', ordre: 5, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '6', heureDebut: '13:30', heureFin: '14:30', ordre: 6, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '7', heureDebut: '14:45', heureFin: '15:45', ordre: 7, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '8', heureDebut: '15:45', heureFin: '16:45', ordre: 8, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]



