import { http, HttpResponse, delay } from 'msw'
import { mockEleves, mockInscriptions } from '../data/eleves'
import { mockClasses } from '../data/config'
import type { Eleve } from '@/types'

// Helper pour pagination
function paginate<T>(items: T[], page: number, perPage: number) {
  const start = (page - 1) * perPage
  const end = start + perPage
  const paginatedItems = items.slice(start, end)
  
  return {
    data: paginatedItems,
    meta: {
      page,
      perPage,
      total: items.length,
      totalPages: Math.ceil(items.length / perPage),
    },
  }
}

export const eleveHandlers = [
  // Liste des élèves
  http.get('/api/eleves', async ({ request }) => {
    await delay(400)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    const search = url.searchParams.get('search') || ''
    const classeId = url.searchParams.get('classe_id')
    const niveauId = url.searchParams.get('niveau_id')
    const statut = url.searchParams.get('statut')
    const sexe = url.searchParams.get('sexe')
    
    let filtered = [...mockEleves]
    
    // Filtres
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.nom.toLowerCase().includes(searchLower) ||
          e.prenom.toLowerCase().includes(searchLower) ||
          e.matricule.toLowerCase().includes(searchLower)
      )
    }
    
    if (classeId) {
      filtered = filtered.filter((e) => e.classeActuelleId === classeId)
    }
    
    if (niveauId) {
      const classesInNiveau = mockClasses
        .filter((c) => c.niveauId === niveauId)
        .map((c) => c.id)
      filtered = filtered.filter((e) => e.classeActuelleId && classesInNiveau.includes(e.classeActuelleId))
    }
    
    if (statut) {
      filtered = filtered.filter((e) => e.statut === statut)
    }
    
    if (sexe) {
      filtered = filtered.filter((e) => e.sexe === sexe)
    }
    
    // Ajouter les infos de classe
    filtered = filtered.map((e) => ({
      ...e,
      classeActuelle: mockClasses.find((c) => c.id === e.classeActuelleId),
    }))
    
    const result = paginate(filtered, page, perPage)
    
    return HttpResponse.json({
      success: true,
      data: result,
    })
  }),

  // Récupérer un élève
  http.get('/api/eleves/:id', async ({ params }) => {
    await delay(300)
    
    const { id } = params
    const eleve = mockEleves.find((e) => e.id === id)
    
    if (!eleve) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Élève non trouvé',
          },
        },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        ...eleve,
        classeActuelle: mockClasses.find((c) => c.id === eleve.classeActuelleId),
      },
    })
  }),

  // Créer un élève
  http.post('/api/eleves', async ({ request }) => {
    await delay(500)
    
    const body = await request.json() as Partial<Eleve>
    
    const newEleve: Eleve = {
      id: String(mockEleves.length + 1),
      matricule: `ELV2024${String(mockEleves.length + 1).padStart(5, '0')}`,
      nom: body.nom || '',
      prenom: body.prenom || '',
      dateNaissance: body.dateNaissance || '',
      lieuNaissance: body.lieuNaissance || '',
      sexe: body.sexe || 'M',
      nationalite: body.nationalite || 'Camerounaise',
      adresse: body.adresse,
      telephone: body.telephone,
      email: body.email,
      statut: 'inscrit',
      tuteurs: body.tuteurs || [],
      piecesJointes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    mockEleves.push(newEleve)
    
    return HttpResponse.json({
      success: true,
      data: newEleve,
      message: 'Élève créé avec succès',
    })
  }),

  // Mettre à jour un élève
  http.put('/api/eleves/:id', async ({ params, request }) => {
    await delay(400)
    
    const { id } = params
    const body = await request.json() as Partial<Eleve>
    
    const index = mockEleves.findIndex((e) => e.id === id)
    
    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Élève non trouvé',
          },
        },
        { status: 404 }
      )
    }
    
    mockEleves[index] = {
      ...mockEleves[index],
      ...body,
      updatedAt: new Date().toISOString(),
    }
    
    return HttpResponse.json({
      success: true,
      data: mockEleves[index],
      message: 'Élève mis à jour avec succès',
    })
  }),

  // Recherche d'élèves
  http.get('/api/eleves/search', async ({ request }) => {
    await delay(200)
    
    const url = new URL(request.url)
    const query = (url.searchParams.get('q') || '').toLowerCase()
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    const results = mockEleves
      .filter(
        (e) =>
          e.nom.toLowerCase().includes(query) ||
          e.prenom.toLowerCase().includes(query) ||
          e.matricule.toLowerCase().includes(query)
      )
      .slice(0, limit)
      .map((e) => ({
        ...e,
        classeActuelle: mockClasses.find((c) => c.id === e.classeActuelleId),
      }))
    
    return HttpResponse.json({
      success: true,
      data: results,
    })
  }),

  // Statistiques élèves
  http.get('/api/eleves/statistiques', async () => {
    await delay(300)
    
    const totalEleves = mockEleves.length
    const nouveauxInscrits = mockInscriptions.filter((i) => i.estNouveau).length
    const reinscrits = totalEleves - nouveauxInscrits
    
    const parSexe = {
      M: mockEleves.filter((e) => e.sexe === 'M').length,
      F: mockEleves.filter((e) => e.sexe === 'F').length,
    }
    
    const parStatut = mockEleves.reduce(
      (acc, e) => {
        acc[e.statut] = (acc[e.statut] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    
    return HttpResponse.json({
      success: true,
      data: {
        totalEleves,
        nouveauxInscrits,
        reinscrits,
        parSexe,
        parNiveau: {
          '6ème': 73,
          '5ème': 82,
          '4ème': 36,
          '3ème': 33,
          '2nde': 44,
          '1ère': 60,
          'Terminale': 55,
        },
        parStatut,
      },
    })
  }),

  // Inscriptions
  http.get('/api/inscriptions', async ({ request }) => {
    await delay(400)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    
    const result = paginate(mockInscriptions, page, perPage)
    
    return HttpResponse.json({
      success: true,
      data: result,
    })
  }),

  // Créer une inscription
  http.post('/api/inscriptions', async ({ request }) => {
    await delay(500)
    
    const body = await request.json() as {
      eleveId?: string
      classeId: string
      anneeScolaireId: string
      estNouveau: boolean
    }
    
    const newInscription = {
      id: String(mockInscriptions.length + 1),
      eleveId: body.eleveId || String(mockEleves.length),
      classeId: body.classeId,
      anneeScolaireId: body.anneeScolaireId,
      dateInscription: new Date().toISOString().split('T')[0],
      statut: 'en_attente' as const,
      montantInscription: 50000,
      montantPaye: 0,
      estNouveau: body.estNouveau,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    mockInscriptions.push(newInscription)
    
    return HttpResponse.json({
      success: true,
      data: newInscription,
      message: 'Inscription enregistrée avec succès',
    })
  }),

  // Upload document
  http.post('/api/eleves/:id/documents', async ({ params }) => {
    await delay(800)
    
    const { id } = params
    
    const newDocument = {
      id: String(Date.now()),
      nom: 'document_upload.pdf',
      type: 'autre' as const,
      url: `/uploads/eleves/${id}/document_${Date.now()}.pdf`,
      taille: 1024 * 500,
      dateUpload: new Date().toISOString(),
    }
    
    return HttpResponse.json({
      success: true,
      data: newDocument,
      message: 'Document téléchargé avec succès',
    })
  }),

  // Bulletin
  http.get('/api/eleves/:id/bulletin', async ({ params }) => {
    await delay(500)
    
    const { id } = params
    const eleve = mockEleves.find((e) => e.id === id)
    
    if (!eleve) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Élève non trouvé' },
        },
        { status: 404 }
      )
    }
    
    // Générer un bulletin fictif
    const bulletin = {
      eleveId: eleve.id,
      eleve,
      classeId: eleve.classeActuelleId,
      classe: mockClasses.find((c) => c.id === eleve.classeActuelleId),
      periode: 'trimestre1',
      moyennesParMatiere: [
        { matiereId: '1', matiere: { id: '1', nom: 'Mathématiques', code: 'MATH', coefficient: 5 }, moyenne: 14.5, rang: 5 },
        { matiereId: '2', matiere: { id: '2', nom: 'Français', code: 'FRA', coefficient: 5 }, moyenne: 12.0, rang: 12 },
        { matiereId: '3', matiere: { id: '3', nom: 'Anglais', code: 'ANG', coefficient: 3 }, moyenne: 15.5, rang: 3 },
        { matiereId: '4', matiere: { id: '4', nom: 'Physique-Chimie', code: 'PC', coefficient: 4 }, moyenne: 13.0, rang: 8 },
        { matiereId: '5', matiere: { id: '5', nom: 'SVT', code: 'SVT', coefficient: 3 }, moyenne: 16.0, rang: 2 },
      ],
      moyenneGenerale: 14.2,
      rang: 6,
      effectifClasse: 35,
      appreciationGenerale: 'Bon travail. Continuez ainsi.',
      decision: 'en_attente',
    }
    
    return HttpResponse.json({
      success: true,
      data: bulletin,
    })
  }),
]



