import type { Eleve, Inscription } from '@/types'

const prenomsMasculins = ['Amadou', 'Moussa', 'Ibrahim', 'Paul', 'Jean', 'Pierre', 'Emmanuel', 'David', 'Samuel', 'Étienne']
const prenomsFeminins = ['Fatou', 'Aïcha', 'Marie', 'Jeanne', 'Sarah', 'Rachel', 'Esther', 'Ruth', 'Naomi', 'Léa']
const noms = ['Mbarga', 'Nkoulou', 'Owona', 'Atangana', 'Bella', 'Essomba', 'Mvondo', 'Ngo', 'Biya', 'Tchinda']

function generateEleve(id: number, classeId: string): Eleve {
  const isMale = Math.random() > 0.5
  const sexe = isMale ? 'M' : 'F' as const
  const prenoms = isMale ? prenomsMasculins : prenomsFeminins
  const prenom = prenoms[Math.floor(Math.random() * prenoms.length)]
  const nom = noms[Math.floor(Math.random() * noms.length)]
  
  const year = 2008 + Math.floor(Math.random() * 8) // Entre 2008 et 2015
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
  
  return {
    id: String(id),
    matricule: `ELV2024${String(id).padStart(5, '0')}`,
    nom,
    prenom,
    dateNaissance: `${year}-${month}-${day}`,
    lieuNaissance: ['Yaoundé', 'Douala', 'Bafoussam', 'Garoua', 'Bamenda'][Math.floor(Math.random() * 5)],
    sexe,
    nationalite: 'Camerounaise',
    adresse: `Quartier ${['Bastos', 'Mvan', 'Essos', 'Mvog-Ada', 'Nkoldongo'][Math.floor(Math.random() * 5)]}`,
    telephone: `6${['7', '9', '5', '6'][Math.floor(Math.random() * 4)]}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
    statut: 'inscrit',
    classeActuelleId: classeId,
    tuteurs: [
      {
        nom,
        prenom: isMale ? prenomsFeminins[Math.floor(Math.random() * prenomsFeminins.length)] : prenomsMasculins[Math.floor(Math.random() * prenomsMasculins.length)],
        telephone: `6${['7', '9', '5', '6'][Math.floor(Math.random() * 4)]}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
        lienParente: Math.random() > 0.5 ? 'pere' : 'mere',
        profession: ['Commerçant', 'Enseignant', 'Ingénieur', 'Médecin', 'Agriculteur'][Math.floor(Math.random() * 5)],
      },
    ],
    piecesJointes: [],
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  }
}

// Générer des élèves pour chaque classe
export const mockEleves: Eleve[] = []
let eleveId = 1

// Classes et leurs effectifs
const classesEffectifs: Record<string, number> = {
  '1': 35, '2': 38, '3': 42, '4': 40, '5': 36,
  '6': 33, '7': 44, '8': 32, '9': 28, '10': 30, '11': 25,
}

Object.entries(classesEffectifs).forEach(([classeId, effectif]) => {
  for (let i = 0; i < effectif; i++) {
    mockEleves.push(generateEleve(eleveId++, classeId))
  }
})

// Inscriptions
export const mockInscriptions: Inscription[] = mockEleves.map((eleve, index) => ({
  id: String(index + 1),
  eleveId: eleve.id,
  eleve,
  classeId: eleve.classeActuelleId!,
  anneeScolaireId: '2024-2025',
  dateInscription: '2024-09-01',
  statut: 'validee',
  montantInscription: 50000,
  montantPaye: Math.random() > 0.2 ? 50000 : 25000,
  estNouveau: Math.random() > 0.7,
  createdAt: '2024-09-01T00:00:00Z',
  updatedAt: '2024-09-01T00:00:00Z',
}))



