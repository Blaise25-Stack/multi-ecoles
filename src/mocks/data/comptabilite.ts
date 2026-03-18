import type { FraisScolaire, Paiement, Depense, MouvementCaisse } from '@/types'

export const mockFraisScolaires: FraisScolaire[] = [
  {
    id: '1',
    libelle: 'Frais d\'inscription',
    type: 'inscription',
    montant: 50000,
    anneeScolaireId: '2024-2025',
    obligatoire: true,
    echeances: [{ numero: 1, montant: 50000, dateLimite: '2024-09-15' }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    libelle: 'Frais de scolarité - 1ère tranche',
    type: 'scolarite',
    montant: 150000,
    anneeScolaireId: '2024-2025',
    obligatoire: true,
    echeances: [
      { numero: 1, montant: 75000, dateLimite: '2024-10-15' },
      { numero: 2, montant: 75000, dateLimite: '2024-12-15' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    libelle: 'Frais de scolarité - 2ème tranche',
    type: 'scolarite',
    montant: 150000,
    anneeScolaireId: '2024-2025',
    obligatoire: true,
    echeances: [
      { numero: 1, montant: 75000, dateLimite: '2025-02-15' },
      { numero: 2, montant: 75000, dateLimite: '2025-04-15' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    libelle: 'Cantine - Mensuel',
    type: 'cantine',
    montant: 25000,
    anneeScolaireId: '2024-2025',
    obligatoire: false,
    echeances: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    libelle: 'Transport scolaire - Mensuel',
    type: 'transport',
    montant: 20000,
    anneeScolaireId: '2024-2025',
    obligatoire: false,
    echeances: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    libelle: 'Uniforme complet',
    type: 'uniforme',
    montant: 35000,
    anneeScolaireId: '2024-2025',
    obligatoire: false,
    echeances: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Générer des paiements fictifs
export const mockPaiements: Paiement[] = []
let paiementId = 1

for (let i = 1; i <= 50; i++) {
  const eleveId = String(Math.floor(Math.random() * 100) + 1)
  const fraisId = String(Math.floor(Math.random() * 6) + 1)
  const frais = mockFraisScolaires.find(f => f.id === fraisId)!
  
  const modesPaiement = ['especes', 'mobile_money', 'virement', 'cheque'] as const
  const mode = modesPaiement[Math.floor(Math.random() * modesPaiement.length)]
  
  const month = Math.floor(Math.random() * 4) + 9 // Sept à Déc
  const day = Math.floor(Math.random() * 28) + 1
  
  mockPaiements.push({
    id: String(paiementId++),
    eleveId,
    fraisId,
    montant: frais.montant,
    modePaiement: mode,
    reference: mode !== 'especes' ? `REF${String(paiementId).padStart(6, '0')}` : undefined,
    datePaiement: `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    recuPar: '2', // Comptable
    createdAt: `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00:00Z`,
    updatedAt: `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00:00Z`,
  })
}

// Dépenses
export const mockDepenses: Depense[] = [
  {
    id: '1',
    libelle: 'Fournitures de bureau',
    categorie: 'fournitures',
    montant: 150000,
    dateDepense: '2024-09-05',
    beneficiaire: 'Librairie Centrale',
    modePaiement: 'especes',
    createdAt: '2024-09-05T10:00:00Z',
    updatedAt: '2024-09-05T10:00:00Z',
  },
  {
    id: '2',
    libelle: 'Réparation climatiseurs',
    categorie: 'maintenance',
    montant: 250000,
    dateDepense: '2024-09-10',
    beneficiaire: 'Froid Services SARL',
    modePaiement: 'virement',
    reference: 'VIR20240910001',
    createdAt: '2024-09-10T14:00:00Z',
    updatedAt: '2024-09-10T14:00:00Z',
  },
  {
    id: '3',
    libelle: 'Achat projecteurs',
    categorie: 'equipement',
    montant: 800000,
    dateDepense: '2024-09-15',
    beneficiaire: 'Tech Store',
    modePaiement: 'cheque',
    reference: 'CHQ000123',
    createdAt: '2024-09-15T11:00:00Z',
    updatedAt: '2024-09-15T11:00:00Z',
  },
  {
    id: '4',
    libelle: 'Facture électricité - Septembre',
    categorie: 'services',
    montant: 180000,
    dateDepense: '2024-09-25',
    beneficiaire: 'ENEO',
    modePaiement: 'virement',
    reference: 'VIR20240925001',
    createdAt: '2024-09-25T09:00:00Z',
    updatedAt: '2024-09-25T09:00:00Z',
  },
  {
    id: '5',
    libelle: 'Facture eau - Septembre',
    categorie: 'services',
    montant: 45000,
    dateDepense: '2024-09-25',
    beneficiaire: 'CAMWATER',
    modePaiement: 'virement',
    reference: 'VIR20240925002',
    createdAt: '2024-09-25T09:30:00Z',
    updatedAt: '2024-09-25T09:30:00Z',
  },
]

// Mouvements de caisse
export const mockMouvementsCaisse: MouvementCaisse[] = [
  {
    id: '1',
    type: 'entree',
    montant: 1000000,
    libelle: 'Ouverture caisse année 2024-2025',
    date: '2024-09-01',
    soldePrecedent: 0,
    soldeApres: 1000000,
    createdAt: '2024-09-01T08:00:00Z',
    updatedAt: '2024-09-01T08:00:00Z',
  },
  {
    id: '2',
    type: 'entree',
    montant: 2500000,
    libelle: 'Encaissements inscriptions',
    date: '2024-09-05',
    soldePrecedent: 1000000,
    soldeApres: 3500000,
    createdAt: '2024-09-05T17:00:00Z',
    updatedAt: '2024-09-05T17:00:00Z',
  },
  {
    id: '3',
    type: 'sortie',
    montant: 150000,
    libelle: 'Fournitures de bureau',
    reference: 'DEP001',
    date: '2024-09-05',
    soldePrecedent: 3500000,
    soldeApres: 3350000,
    createdAt: '2024-09-05T18:00:00Z',
    updatedAt: '2024-09-05T18:00:00Z',
  },
]



