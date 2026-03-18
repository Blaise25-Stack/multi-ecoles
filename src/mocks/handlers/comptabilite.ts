import { http, HttpResponse, delay } from 'msw'
import { mockFraisScolaires, mockPaiements, mockDepenses, mockMouvementsCaisse } from '../data/comptabilite'
import { mockEleves } from '../data/eleves'
import type { Paiement, Depense } from '@/types'

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

export const comptabiliteHandlers = [
  // Frais scolaires
  http.get('/api/comptabilite/frais', async () => {
    await delay(300)
    
    return HttpResponse.json({
      success: true,
      data: mockFraisScolaires,
    })
  }),

  // Créer un frais
  http.post('/api/comptabilite/frais', async ({ request }) => {
    await delay(400)
    
    const body = await request.json() as Partial<typeof mockFraisScolaires[0]>
    
    const newFrais = {
      id: String(mockFraisScolaires.length + 1),
      libelle: body.libelle || '',
      type: body.type || 'autre',
      montant: body.montant || 0,
      anneeScolaireId: '2024-2025',
      obligatoire: body.obligatoire ?? true,
      echeances: body.echeances || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    mockFraisScolaires.push(newFrais)
    
    return HttpResponse.json({
      success: true,
      data: newFrais,
      message: 'Frais créé avec succès',
    })
  }),

  // Liste des paiements
  http.get('/api/comptabilite/paiements', async ({ request }) => {
    await delay(400)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    const eleveId = url.searchParams.get('eleve_id')
    const fraisId = url.searchParams.get('frais_id')
    
    let filtered = [...mockPaiements]
    
    if (eleveId) {
      filtered = filtered.filter((p) => p.eleveId === eleveId)
    }
    
    if (fraisId) {
      filtered = filtered.filter((p) => p.fraisId === fraisId)
    }
    
    // Ajouter les infos élève et frais
    filtered = filtered.map((p) => ({
      ...p,
      eleve: mockEleves.find((e) => e.id === p.eleveId),
      frais: mockFraisScolaires.find((f) => f.id === p.fraisId),
    }))
    
    const result = paginate(filtered, page, perPage)
    
    return HttpResponse.json({
      success: true,
      data: result,
    })
  }),

  // Créer un paiement
  http.post('/api/comptabilite/paiements', async ({ request }) => {
    await delay(500)
    
    const body = await request.json() as Partial<Paiement>
    
    const newPaiement: Paiement = {
      id: String(mockPaiements.length + 1),
      eleveId: body.eleveId || '',
      fraisId: body.fraisId || '',
      montant: body.montant || 0,
      modePaiement: body.modePaiement || 'especes',
      reference: body.reference,
      datePaiement: new Date().toISOString().split('T')[0],
      recuPar: '2',
      observations: body.observations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    mockPaiements.push(newPaiement)
    
    return HttpResponse.json({
      success: true,
      data: {
        ...newPaiement,
        eleve: mockEleves.find((e) => e.id === newPaiement.eleveId),
        frais: mockFraisScolaires.find((f) => f.id === newPaiement.fraisId),
      },
      message: 'Paiement enregistré avec succès',
    })
  }),

  // Facture élève
  http.get('/api/comptabilite/factures/eleve/:id', async ({ params }) => {
    await delay(400)
    
    const { id } = params
    const eleve = mockEleves.find((e) => e.id === id)
    
    if (!eleve) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Élève non trouvé' } },
        { status: 404 }
      )
    }
    
    const paiementsEleve = mockPaiements.filter((p) => p.eleveId === id)
    const totalPaye = paiementsEleve.reduce((sum, p) => sum + p.montant, 0)
    
    // Frais obligatoires
    const fraisObligatoires = mockFraisScolaires.filter((f) => f.obligatoire)
    const totalDu = fraisObligatoires.reduce((sum, f) => sum + f.montant, 0)
    
    return HttpResponse.json({
      success: true,
      data: {
        eleveId: id,
        eleve,
        anneeScolaireId: '2024-2025',
        totalDu,
        totalPaye,
        solde: totalDu - totalPaye,
        statut: totalPaye >= totalDu ? 'complete' : totalPaye > 0 ? 'partiel' : 'en_attente',
        detailsFrais: fraisObligatoires.map((frais) => {
          const montantPayeFrais = paiementsEleve
            .filter((p) => p.fraisId === frais.id)
            .reduce((sum, p) => sum + p.montant, 0)
          
          return {
            frais,
            montantDu: frais.montant,
            montantPaye: montantPayeFrais,
            prochainEcheance: frais.echeances?.[0],
          }
        }),
      },
    })
  }),

  // Élèves impayés
  http.get('/api/comptabilite/factures/impayes', async ({ request }) => {
    await delay(400)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    
    // Simuler des élèves avec soldes impayés
    const elevesImpayes = mockEleves.slice(0, 50).map((eleve) => {
      const totalDu = 350000
      const totalPaye = Math.floor(Math.random() * 300000)
      
      return {
        eleveId: eleve.id,
        eleve,
        anneeScolaireId: '2024-2025',
        totalDu,
        totalPaye,
        solde: totalDu - totalPaye,
        statut: totalPaye === 0 ? 'en_attente' as const : 'partiel' as const,
        detailsFrais: [],
      }
    }).filter((e) => e.solde > 0)
    
    const result = paginate(elevesImpayes, page, perPage)
    
    return HttpResponse.json({
      success: true,
      data: result,
    })
  }),

  // Dépenses
  http.get('/api/comptabilite/depenses', async ({ request }) => {
    await delay(400)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    const categorie = url.searchParams.get('categorie')
    
    let filtered = [...mockDepenses]
    
    if (categorie) {
      filtered = filtered.filter((d) => d.categorie === categorie)
    }
    
    const result = paginate(filtered, page, perPage)
    
    return HttpResponse.json({
      success: true,
      data: result,
    })
  }),

  // Créer une dépense
  http.post('/api/comptabilite/depenses', async ({ request }) => {
    await delay(500)
    
    const body = await request.json() as Partial<Depense>
    
    const newDepense: Depense = {
      id: String(mockDepenses.length + 1),
      libelle: body.libelle || '',
      categorie: body.categorie || 'autre',
      montant: body.montant || 0,
      dateDepense: body.dateDepense || new Date().toISOString().split('T')[0],
      beneficiaire: body.beneficiaire,
      modePaiement: body.modePaiement || 'especes',
      reference: body.reference,
      observations: body.observations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    mockDepenses.push(newDepense)
    
    return HttpResponse.json({
      success: true,
      data: newDepense,
      message: 'Dépense enregistrée avec succès',
    })
  }),

  // Mouvements de caisse
  http.get('/api/comptabilite/caisse/mouvements', async ({ request }) => {
    await delay(300)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    
    const result = paginate(mockMouvementsCaisse, page, perPage)
    
    return HttpResponse.json({
      success: true,
      data: result,
    })
  }),

  // Solde caisse
  http.get('/api/comptabilite/caisse/solde', async () => {
    await delay(200)
    
    const dernierMouvement = mockMouvementsCaisse[mockMouvementsCaisse.length - 1]
    
    return HttpResponse.json({
      success: true,
      data: {
        solde: dernierMouvement?.soldeApres || 0,
        dernierMouvement,
      },
    })
  }),

  // Rapport trésorerie
  http.get('/api/comptabilite/rapports/tresorerie', async () => {
    await delay(500)
    
    return HttpResponse.json({
      success: true,
      data: {
        periode: { debut: '2024-09-01', fin: '2024-12-31' },
        totalEntrees: 15000000,
        totalSorties: 3500000,
        solde: 11500000,
        entreeParType: {
          inscription: 4000000,
          scolarite: 10000000,
          cantine: 500000,
          transport: 300000,
          autre: 200000,
        },
        sortieParCategorie: {
          fournitures: 200000,
          equipement: 1000000,
          maintenance: 300000,
          services: 500000,
          salaires: 1500000,
        },
        evolutionMensuelle: [
          { mois: 'Sept', entrees: 6000000, sorties: 1200000, solde: 4800000 },
          { mois: 'Oct', entrees: 4000000, sorties: 800000, solde: 3200000 },
          { mois: 'Nov', entrees: 3000000, sorties: 900000, solde: 2100000 },
          { mois: 'Déc', entrees: 2000000, sorties: 600000, solde: 1400000 },
        ],
      },
    })
  }),

  // Statistiques
  http.get('/api/comptabilite/statistiques', async () => {
    await delay(400)
    
    return HttpResponse.json({
      success: true,
      data: {
        totalRecettes: 15000000,
        totalDepenses: 3500000,
        solde: 11500000,
        tauxRecouvrement: 72.5,
        recettesParMois: [
          { mois: 'Septembre', montant: 6000000 },
          { mois: 'Octobre', montant: 4000000 },
          { mois: 'Novembre', montant: 3000000 },
          { mois: 'Décembre', montant: 2000000 },
        ],
        depensesParCategorie: {
          Salaires: 1500000,
          Équipement: 1000000,
          Services: 500000,
          Maintenance: 300000,
          Fournitures: 200000,
        },
        elevesEnRegle: 280,
        elevesImpayes: 103,
      },
    })
  }),
]



