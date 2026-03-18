import { http, HttpResponse, delay } from 'msw'
import {
  mockEtablissement,
  mockAnneesScolaires,
  mockCycles,
  mockNiveaux,
  mockClasses,
  mockMatieres,
  mockCreneaux,
} from '../data/config'

export const configHandlers = [
  // Établissement
  http.get('/api/config/etablissement', async () => {
    await delay(200)
    return HttpResponse.json({
      success: true,
      data: mockEtablissement,
    })
  }),

  // Années scolaires
  http.get('/api/config/annees-scolaires', async () => {
    await delay(200)
    return HttpResponse.json({
      success: true,
      data: mockAnneesScolaires,
    })
  }),

  http.get('/api/config/annee-scolaire-active', async () => {
    await delay(200)
    const active = mockAnneesScolaires.find((a) => a.estActive)
    return HttpResponse.json({
      success: true,
      data: active,
    })
  }),

  // Cycles
  http.get('/api/config/cycles', async () => {
    await delay(200)
    return HttpResponse.json({
      success: true,
      data: mockCycles,
    })
  }),

  // Niveaux
  http.get('/api/config/niveaux', async () => {
    await delay(200)
    
    // Enrichir avec les cycles
    const niveauxAvecCycles = mockNiveaux.map((n) => ({
      ...n,
      cycle: mockCycles.find((c) => c.id === n.cycleId),
    }))
    
    return HttpResponse.json({
      success: true,
      data: niveauxAvecCycles,
    })
  }),

  // Classes
  http.get('/api/config/classes', async ({ request }) => {
    await delay(300)
    
    const url = new URL(request.url)
    const niveauId = url.searchParams.get('niveau_id')
    const anneeScolaireId = url.searchParams.get('annee_scolaire_id')
    
    let filtered = [...mockClasses]
    
    if (niveauId) {
      filtered = filtered.filter((c) => c.niveauId === niveauId)
    }
    
    if (anneeScolaireId) {
      filtered = filtered.filter((c) => c.anneeScolaireId === anneeScolaireId)
    }
    
    // Enrichir avec les niveaux
    const classesEnrichies = filtered.map((c) => ({
      ...c,
      niveau: mockNiveaux.find((n) => n.id === c.niveauId),
    }))
    
    return HttpResponse.json({
      success: true,
      data: classesEnrichies,
    })
  }),

  http.get('/api/config/classes/:id', async ({ params }) => {
    await delay(200)
    
    const { id } = params
    const classe = mockClasses.find((c) => c.id === id)
    
    if (!classe) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Classe non trouvée' } },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        ...classe,
        niveau: mockNiveaux.find((n) => n.id === classe.niveauId),
      },
    })
  }),

  // Matières
  http.get('/api/config/matieres', async ({ request }) => {
    await delay(200)
    
    const url = new URL(request.url)
    const niveauId = url.searchParams.get('niveau_id')
    
    let filtered = [...mockMatieres]
    
    if (niveauId) {
      filtered = filtered.filter((m) => m.niveauIds.includes(niveauId))
    }
    
    return HttpResponse.json({
      success: true,
      data: filtered,
    })
  }),

  // Créneaux horaires
  http.get('/api/config/creneaux', async () => {
    await delay(200)
    return HttpResponse.json({
      success: true,
      data: mockCreneaux,
    })
  }),

  // Dashboard stats
  http.get('/api/dashboard/stats', async () => {
    await delay(400)
    
    return HttpResponse.json({
      success: true,
      data: {
        totalEleves: 383,
        totalEnseignants: 5,
        totalClasses: 11,
        tauxRecouvrement: 72.5,
        elevesParNiveau: [
          { niveau: '6ème', count: 73 },
          { niveau: '5ème', count: 82 },
          { niveau: '4ème', count: 36 },
          { niveau: '3ème', count: 33 },
          { niveau: '2nde', count: 44 },
          { niveau: '1ère', count: 60 },
          { niveau: 'Tle', count: 55 },
        ],
        recettesParMois: [
          { mois: 'Sept', montant: 6000000 },
          { mois: 'Oct', montant: 4000000 },
          { mois: 'Nov', montant: 3000000 },
          { mois: 'Déc', montant: 2000000 },
        ],
        alertes: [
          { type: 'warning', message: '45 élèves ont des paiements en retard' },
          { type: 'info', message: '3 demandes de congé en attente' },
          { type: 'success', message: 'Bulletins du 1er trimestre générés' },
        ],
      },
    })
  }),
]



