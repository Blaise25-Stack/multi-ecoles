import { http, HttpResponse, delay } from 'msw'
import { mockEnseignants, mockPersonnel, mockPresences, mockConges, mockSalaires } from '../data/rh'
import type { Enseignant, Personnel, Conge } from '@/types'

function paginate<T>(items: T[], page: number, perPage: number) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return {
    data: items.slice(start, end),
    meta: {
      page,
      perPage,
      total: items.length,
      totalPages: Math.ceil(items.length / perPage),
    },
  }
}

export const rhHandlers = [
  // ===== ENSEIGNANTS =====
  
  http.get('/api/rh/enseignants', async ({ request }) => {
    await delay(400)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    const search = url.searchParams.get('search') || ''
    const statut = url.searchParams.get('statut')
    
    let filtered = [...mockEnseignants]
    
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.nom.toLowerCase().includes(searchLower) ||
          e.prenom.toLowerCase().includes(searchLower) ||
          e.matricule.toLowerCase().includes(searchLower)
      )
    }
    
    if (statut) {
      filtered = filtered.filter((e) => e.statut === statut)
    }
    
    const result = paginate(filtered, page, perPage)
    
    return HttpResponse.json({
      success: true,
      data: result,
    })
  }),

  http.get('/api/rh/enseignants/:id', async ({ params }) => {
    await delay(300)
    
    const { id } = params
    const enseignant = mockEnseignants.find((e) => e.id === id)
    
    if (!enseignant) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Enseignant non trouvé' } },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: enseignant,
    })
  }),

  http.post('/api/rh/enseignants', async ({ request }) => {
    await delay(500)
    
    const body = await request.json() as Partial<Enseignant>
    
    const newEnseignant: Enseignant = {
      id: String(mockEnseignants.length + 1),
      matricule: `ENS2024${String(mockEnseignants.length + 1).padStart(3, '0')}`,
      nom: body.nom || '',
      prenom: body.prenom || '',
      email: body.email || '',
      telephone: body.telephone || '',
      sexe: body.sexe || 'M',
      dateNaissance: body.dateNaissance,
      adresse: body.adresse,
      specialite: body.specialite || '',
      matieres: body.matieres || [],
      diplome: body.diplome,
      dateEmbauche: body.dateEmbauche || new Date().toISOString().split('T')[0],
      typeContrat: body.typeContrat || 'cdd',
      statut: 'actif',
      salaireBase: body.salaireBase || 250000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    mockEnseignants.push(newEnseignant)
    
    return HttpResponse.json({
      success: true,
      data: newEnseignant,
      message: 'Enseignant créé avec succès',
    })
  }),

  http.put('/api/rh/enseignants/:id', async ({ params, request }) => {
    await delay(400)
    
    const { id } = params
    const body = await request.json() as Partial<Enseignant>
    
    const index = mockEnseignants.findIndex((e) => e.id === id)
    
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Enseignant non trouvé' } },
        { status: 404 }
      )
    }
    
    mockEnseignants[index] = {
      ...mockEnseignants[index],
      ...body,
      updatedAt: new Date().toISOString(),
    }
    
    return HttpResponse.json({
      success: true,
      data: mockEnseignants[index],
      message: 'Enseignant mis à jour avec succès',
    })
  }),

  // ===== PERSONNEL =====

  http.get('/api/rh/personnel', async ({ request }) => {
    await delay(400)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    
    const result = paginate(mockPersonnel, page, perPage)
    
    return HttpResponse.json({
      success: true,
      data: result,
    })
  }),

  http.get('/api/rh/personnel/:id', async ({ params }) => {
    await delay(300)
    
    const { id } = params
    const personnel = mockPersonnel.find((p) => p.id === id)
    
    if (!personnel) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Personnel non trouvé' } },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: personnel,
    })
  }),

  http.post('/api/rh/personnel', async ({ request }) => {
    await delay(500)
    
    const body = await request.json() as Partial<Personnel>
    
    const newPersonnel: Personnel = {
      id: String(mockPersonnel.length + 1),
      matricule: `PER2024${String(mockPersonnel.length + 1).padStart(3, '0')}`,
      nom: body.nom || '',
      prenom: body.prenom || '',
      email: body.email || '',
      telephone: body.telephone || '',
      sexe: body.sexe || 'M',
      fonction: body.fonction || '',
      departement: body.departement || '',
      dateEmbauche: body.dateEmbauche || new Date().toISOString().split('T')[0],
      typeContrat: body.typeContrat || 'cdd',
      statut: 'actif',
      salaireBase: body.salaireBase || 150000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    mockPersonnel.push(newPersonnel)
    
    return HttpResponse.json({
      success: true,
      data: newPersonnel,
      message: 'Personnel créé avec succès',
    })
  }),

  // ===== PRÉSENCES =====

  http.get('/api/rh/presences', async ({ request }) => {
    await delay(400)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '50')
    const date = url.searchParams.get('date')
    const employeId = url.searchParams.get('employe_id')
    
    let filtered = [...mockPresences]
    
    if (date) {
      filtered = filtered.filter((p) => p.date === date)
    }
    
    if (employeId) {
      filtered = filtered.filter((p) => p.employeId === employeId)
    }
    
    const result = paginate(filtered, page, perPage)
    
    return HttpResponse.json({
      success: true,
      data: result,
    })
  }),

  http.post('/api/rh/presences', async ({ request }) => {
    await delay(300)
    
    const body = await request.json() as Partial<typeof mockPresences[0]>
    
    const newPresence = {
      id: String(mockPresences.length + 1),
      employeId: body.employeId || '',
      employeType: body.employeType || 'enseignant',
      date: body.date || new Date().toISOString().split('T')[0],
      heureArrivee: body.heureArrivee,
      heureDepart: body.heureDepart,
      statut: body.statut || 'present',
      motif: body.motif,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as typeof mockPresences[0]
    
    mockPresences.push(newPresence)
    
    return HttpResponse.json({
      success: true,
      data: newPresence,
    })
  }),

  // ===== CONGÉS =====

  http.get('/api/rh/conges', async ({ request }) => {
    await delay(400)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    const statut = url.searchParams.get('statut')
    
    let filtered = [...mockConges]
    
    if (statut) {
      filtered = filtered.filter((c) => c.statut === statut)
    }
    
    const result = paginate(filtered, page, perPage)
    
    return HttpResponse.json({
      success: true,
      data: result,
    })
  }),

  http.post('/api/rh/conges', async ({ request }) => {
    await delay(500)
    
    const body = await request.json() as Partial<Conge>
    
    const newConge: Conge = {
      id: String(mockConges.length + 1),
      employeId: '1', // Current user
      employeType: 'enseignant',
      type: body.type || 'annuel',
      dateDebut: body.dateDebut || '',
      dateFin: body.dateFin || '',
      motif: body.motif || '',
      statut: 'en_attente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    mockConges.push(newConge)
    
    return HttpResponse.json({
      success: true,
      data: newConge,
      message: 'Demande de congé soumise avec succès',
    })
  }),

  http.patch('/api/rh/conges/:id/approuver', async ({ params }) => {
    await delay(400)
    
    const { id } = params
    const index = mockConges.findIndex((c) => c.id === id)
    
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Congé non trouvé' } },
        { status: 404 }
      )
    }
    
    mockConges[index] = {
      ...mockConges[index],
      statut: 'approuve',
      approuvePar: '1',
      dateApprobation: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    }
    
    return HttpResponse.json({
      success: true,
      data: mockConges[index],
      message: 'Congé approuvé',
    })
  }),

  http.patch('/api/rh/conges/:id/refuser', async ({ params, request }) => {
    await delay(400)
    
    const { id } = params
    const { motif } = await request.json() as { motif: string }
    
    const index = mockConges.findIndex((c) => c.id === id)
    
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Congé non trouvé' } },
        { status: 404 }
      )
    }
    
    mockConges[index] = {
      ...mockConges[index],
      statut: 'refuse',
      motif: mockConges[index].motif + ` [Refusé: ${motif}]`,
      updatedAt: new Date().toISOString(),
    }
    
    return HttpResponse.json({
      success: true,
      data: mockConges[index],
      message: 'Congé refusé',
    })
  }),

  // ===== SALAIRES =====

  http.get('/api/rh/salaires', async ({ request }) => {
    await delay(400)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    const mois = url.searchParams.get('mois')
    const annee = url.searchParams.get('annee')
    const estPaye = url.searchParams.get('est_paye')
    
    let filtered = [...mockSalaires]
    
    if (mois) {
      filtered = filtered.filter((s) => s.mois === parseInt(mois))
    }
    
    if (annee) {
      filtered = filtered.filter((s) => s.annee === parseInt(annee))
    }
    
    if (estPaye !== null && estPaye !== undefined) {
      filtered = filtered.filter((s) => s.estPaye === (estPaye === 'true'))
    }
    
    // Ajouter les infos employé
    filtered = filtered.map((s) => ({
      ...s,
      employe: s.employeType === 'enseignant'
        ? mockEnseignants.find((e) => e.id === s.employeId)
        : mockPersonnel.find((p) => p.id === s.employeId),
    }))
    
    const result = paginate(filtered, page, perPage)
    
    return HttpResponse.json({
      success: true,
      data: result,
    })
  }),

  http.patch('/api/rh/salaires/:id/payer', async ({ params, request }) => {
    await delay(500)
    
    const { id } = params
    const { mode_paiement, reference } = await request.json() as { mode_paiement: string; reference?: string }
    
    const index = mockSalaires.findIndex((s) => s.id === id)
    
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Salaire non trouvé' } },
        { status: 404 }
      )
    }
    
    mockSalaires[index] = {
      ...mockSalaires[index],
      estPaye: true,
      datePaiement: new Date().toISOString().split('T')[0],
      modePaiement: mode_paiement as typeof mockSalaires[0]['modePaiement'],
      updatedAt: new Date().toISOString(),
    }
    
    if (reference) {
      // Store reference somewhere if needed
    }
    
    return HttpResponse.json({
      success: true,
      data: mockSalaires[index],
      message: 'Salaire payé avec succès',
    })
  }),

  // ===== STATISTIQUES =====

  http.get('/api/rh/statistiques', async () => {
    await delay(400)
    
    return HttpResponse.json({
      success: true,
      data: {
        totalEnseignants: mockEnseignants.length,
        totalPersonnel: mockPersonnel.length,
        enseignantsActifs: mockEnseignants.filter((e) => e.statut === 'actif').length,
        personnelActif: mockPersonnel.filter((p) => p.statut === 'actif').length,
        enConge: mockConges.filter((c) => c.statut === 'approuve').length,
        masseSalarialeMensuelle: [...mockEnseignants, ...mockPersonnel].reduce(
          (sum, e) => sum + e.salaireBase,
          0
        ),
        repartitionParContrat: {
          CDI: 7,
          CDD: 2,
        },
      },
    })
  }),
]



