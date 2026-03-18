/**
 * ============================================
 * Routes Comptabilité - Paiements, Frais, Dépenses
 * ============================================
 */

import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// ============================================
// FRAIS SCOLAIRES
// ============================================

// GET /api/comptabilite/frais - Liste des frais scolaires
router.get('/frais', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id

    let whereClause = 'WHERE a.est_active = TRUE'
    const params: any[] = []

    if (schoolId) {
      whereClause += ' AND fs.school_id = ?'
      params.push(schoolId)
    }

    const frais = await query<any[]>(`
      SELECT fs.*, tf.libelle as type_frais_libelle
      FROM frais_scolaires fs
      JOIN types_frais tf ON fs.type_frais_id = tf.id
      JOIN annees_scolaires a ON fs.annee_scolaire_id = a.id
      ${whereClause}
      ORDER BY fs.date_limite ASC
    `, params)
    res.json({ success: true, data: frais })
  } catch (error) {
    console.error('Erreur liste frais:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/comptabilite/frais - Créer un frais
router.post('/frais', authenticate, checkPermission('comptabilite', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { type_frais_id, montant, date_limite, description, obligatoire, niveau_ids, classe_id, niveau_id } = req.body
    const schoolId = req.tenant?.id

    const annees = await query<any[]>(`SELECT id FROM annees_scolaires WHERE est_active = TRUE LIMIT 1`)
    if (annees.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune année scolaire active' })
    }

    const result = await query<any>(`
      INSERT INTO frais_scolaires (type_frais_id, annee_scolaire_id, classe_id, niveau_id, montant, date_limite, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [type_frais_id, annees[0].id, classe_id || null, niveau_id || null, montant, date_limite || null, schoolId || null])

    res.status(201).json({ success: true, message: 'Frais créé', data: { id: result.insertId } })
  } catch (error) {
    console.error('Erreur création frais:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/comptabilite/frais/:id - Modifier un frais
router.put('/frais/:id', authenticate, checkPermission('comptabilite', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const { type_frais_id, montant, date_limite } = req.body
    const schoolId = req.tenant?.id
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const schoolParams = schoolId ? [schoolId] : []

    await query(`
      UPDATE frais_scolaires SET type_frais_id = COALESCE(?, type_frais_id), montant = COALESCE(?, montant), date_limite = ?
      WHERE id = ?${schoolFilter}
    `, [type_frais_id || null, montant || null, date_limite || null, req.params.id, ...schoolParams])
    res.json({ success: true, message: 'Frais modifié' })
  } catch (error) {
    console.error('Erreur modification frais:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/comptabilite/frais/:id - Supprimer un frais
router.delete('/frais/:id', authenticate, checkPermission('comptabilite', 'delete'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const schoolParams = schoolId ? [schoolId] : []

    await query(`DELETE FROM frais_scolaires WHERE id = ?${schoolFilter}`, [req.params.id, ...schoolParams])
    res.json({ success: true, message: 'Frais supprimé' })
  } catch (error) {
    console.error('Erreur suppression frais:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// ============================================
// PAIEMENTS
// ============================================

// GET /api/comptabilite/paiements - Liste des paiements
router.get('/paiements', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const { search, eleve_id, mode_paiement, date_debut, date_fin, page = 1, per_page = 20 } = req.query
    const offset = (Number(page) - 1) * Number(per_page)
    const schoolId = req.tenant?.id

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (schoolId) {
      whereClause += ' AND p.school_id = ?'
      params.push(schoolId)
    }

    if (search) {
      whereClause += ` AND (e.nom LIKE ? OR e.prenom LIKE ? OR p.numero_recu LIKE ?)`
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (eleve_id) {
      whereClause += ` AND p.eleve_id = ?`
      params.push(eleve_id)
    }

    if (mode_paiement) {
      whereClause += ` AND p.mode_paiement = ?`
      params.push(mode_paiement)
    }

    if (date_debut) {
      whereClause += ` AND DATE(p.date_paiement) >= ?`
      params.push(date_debut)
    }

    if (date_fin) {
      whereClause += ` AND DATE(p.date_paiement) <= ?`
      params.push(date_fin)
    }

    // Compter le total
    const countResult = await query<any[]>(`
      SELECT COUNT(*) as total
      FROM paiements p
      LEFT JOIN eleves e ON p.eleve_id = e.id
      ${whereClause}
    `, params)

    const total = countResult[0]?.total || 0

    // Récupérer les paiements
    const paiements = await query<any[]>(`
      SELECT 
        p.id,
        p.numero_recu as reference,
        p.montant,
        p.devise,
        p.mode_paiement as modePaiement,
        p.date_paiement as datePaiement,
        p.statut,
        p.observations,
        e.id as eleve_id,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule as eleve_matricule,
        tf.libelle as type_frais
      FROM paiements p
      LEFT JOIN eleves e ON p.eleve_id = e.id
      LEFT JOIN types_frais tf ON p.type_frais_id = tf.id
      ${whereClause}
      ORDER BY p.date_paiement DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(per_page), offset])

    // Formater les données pour le frontend
    const formattedPaiements = paiements.map(p => ({
      id: p.id,
      reference: p.reference,
      montant: p.montant,
      devise: p.devise || 'FC',
      modePaiement: p.modePaiement || 'especes',
      datePaiement: p.datePaiement,
      statut: p.statut,
      observations: p.observations,
      eleve: p.eleve_id ? {
        id: p.eleve_id,
        nom: p.eleve_nom,
        prenom: p.eleve_prenom,
        matricule: p.eleve_matricule,
      } : null,
      frais: p.type_frais ? { libelle: p.type_frais } : null,
    }))

    res.json({
      success: true,
      data: formattedPaiements,
      meta: {
        page: Number(page),
        perPage: Number(per_page),
        total,
        totalPages: Math.ceil(total / Number(per_page)),
      },
    })
  } catch (error) {
    console.error('Erreur liste paiements:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/comptabilite/paiements - Créer un paiement
router.post('/paiements', authenticate, checkPermission('comptabilite', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { eleveId, fraisId, montant, modePaiement, reference, observations } = req.body
    const schoolId = req.tenant?.id

    if (!eleveId || !montant) {
      return res.status(400).json({ success: false, message: 'Élève et montant requis' })
    }

    // Obtenir l'année scolaire active
    const annees = await query<any[]>(`SELECT id FROM annees_scolaires WHERE est_active = TRUE LIMIT 1`)
    if (annees.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune année scolaire active' })
    }

    // Générer le numéro de reçu
    const year = new Date().getFullYear().toString().slice(-2)
    const countResult = await query<any[]>(`SELECT COUNT(*) as count FROM paiements WHERE numero_recu LIKE ?`, [`REC${year}%`])
    const numero_recu = `REC${year}${(countResult[0].count + 1).toString().padStart(6, '0')}`

    const result = await query<any>(`
      INSERT INTO paiements (
        numero_recu, eleve_id, type_frais_id, annee_scolaire_id, 
        montant, devise, mode_paiement, reference_paiement, 
        observations, statut, recu_par, date_paiement, school_id
      )
      VALUES (?, ?, ?, ?, ?, 'FC', ?, ?, ?, 'valide', ?, NOW(), ?)
    `, [
      numero_recu, 
      eleveId, 
      fraisId || null, 
      annees[0].id, 
      montant, 
      modePaiement || 'especes', 
      reference || null, 
      observations || null, 
      req.user!.id,
      schoolId || null
    ])

    res.status(201).json({
      success: true,
      message: 'Paiement enregistré',
      data: { id: result.insertId, reference: numero_recu },
    })
  } catch (error) {
    console.error('Erreur création paiement:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PATCH /api/comptabilite/paiements/:id/annuler - Annuler un paiement
router.patch('/paiements/:id/annuler', authenticate, checkPermission('comptabilite', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const { motif } = req.body
    const schoolId = req.tenant?.id
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const schoolParams = schoolId ? [schoolId] : []

    await query(`
      UPDATE paiements 
      SET statut = 'annule', observations = CONCAT(COALESCE(observations, ''), '\nAnnulé: ', ?)
      WHERE id = ?${schoolFilter}
    `, [motif || 'Annulation demandée', id, ...schoolParams])

    res.json({ success: true, message: 'Paiement annulé' })
  } catch (error) {
    console.error('Erreur annulation paiement:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// ============================================
// DÉPENSES
// ============================================

// GET /api/comptabilite/depenses - Liste des dépenses
router.get('/depenses', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const { categorie_id, date_debut, date_fin, page = 1, per_page = 20 } = req.query
    const offset = (Number(page) - 1) * Number(per_page)
    const schoolId = req.tenant?.id

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (schoolId) {
      whereClause += ' AND d.school_id = ?'
      params.push(schoolId)
    }

    if (categorie_id) {
      whereClause += ` AND d.categorie_id = ?`
      params.push(categorie_id)
    }

    if (date_debut) {
      whereClause += ` AND DATE(d.date_depense) >= ?`
      params.push(date_debut)
    }

    if (date_fin) {
      whereClause += ` AND DATE(d.date_depense) <= ?`
      params.push(date_fin)
    }

    const countResult = await query<any[]>(`SELECT COUNT(*) as total FROM depenses d ${whereClause}`, params)
    const total = countResult[0]?.total || 0

    const depenses = await query<any[]>(`
      SELECT d.*, cd.libelle as categorie, cd.code as categorie_code,
             u.nom as createur_nom, u.prenom as createur_prenom
      FROM depenses d
      LEFT JOIN categories_depenses cd ON d.categorie_id = cd.id
      LEFT JOIN utilisateurs u ON d.created_by = u.id
      ${whereClause}
      ORDER BY d.date_depense DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(per_page), offset])

    res.json({
      success: true,
      data: depenses,
      meta: {
        page: Number(page),
        perPage: Number(per_page),
        total,
        totalPages: Math.ceil(total / Number(per_page)),
      },
    })
  } catch (error) {
    console.error('Erreur liste dépenses:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/comptabilite/depenses - Créer une dépense
router.post('/depenses', authenticate, checkPermission('comptabilite', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { libelle, categorie_id, montant, date_depense, description, beneficiaire, mode_paiement, reference } = req.body
    const schoolId = req.tenant?.id

    if (!libelle || !montant || !categorie_id) {
      return res.status(400).json({ success: false, message: 'Libellé, catégorie et montant requis' })
    }

    const numero = `DEP${new Date().getFullYear().toString().slice(-2)}${Date.now().toString().slice(-6)}`

    const result = await query<any>(`
      INSERT INTO depenses (numero, categorie_id, libelle, montant, devise, date_depense, description, beneficiaire, mode_paiement, reference, created_by, school_id)
      VALUES (?, ?, ?, ?, 'FC', ?, ?, ?, ?, ?, ?, ?)
    `, [numero, categorie_id, libelle, montant, date_depense || new Date(), description || null, beneficiaire || null, mode_paiement || 'especes', reference || null, req.user!.id, schoolId || null])

    res.status(201).json({ success: true, message: 'Dépense enregistrée', data: { id: result.insertId, numero } })
  } catch (error) {
    console.error('Erreur création dépense:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/comptabilite/depenses/:id - Modifier une dépense
router.put('/depenses/:id', authenticate, checkPermission('comptabilite', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const { libelle, categorie_id, montant, date_depense, description, beneficiaire, mode_paiement } = req.body
    const schoolId = req.tenant?.id
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const schoolParams = schoolId ? [schoolId] : []

    await query(`
      UPDATE depenses SET libelle = COALESCE(?, libelle), categorie_id = COALESCE(?, categorie_id),
        montant = COALESCE(?, montant), date_depense = COALESCE(?, date_depense),
        description = ?, beneficiaire = ?, mode_paiement = COALESCE(?, mode_paiement)
      WHERE id = ?${schoolFilter}
    `, [libelle, categorie_id, montant, date_depense, description || null, beneficiaire || null, mode_paiement, req.params.id, ...schoolParams])
    res.json({ success: true, message: 'Dépense modifiée' })
  } catch (error) {
    console.error('Erreur modification dépense:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/comptabilite/depenses/:id - Supprimer une dépense
router.delete('/depenses/:id', authenticate, checkPermission('comptabilite', 'delete'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const schoolParams = schoolId ? [schoolId] : []

    await query(`DELETE FROM depenses WHERE id = ?${schoolFilter}`, [req.params.id, ...schoolParams])
    res.json({ success: true, message: 'Dépense supprimée' })
  } catch (error) {
    console.error('Erreur suppression dépense:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/comptabilite/paiements/:id - Supprimer un paiement
router.delete('/paiements/:id', authenticate, checkPermission('comptabilite', 'delete'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const schoolParams = schoolId ? [schoolId] : []

    await query(`DELETE FROM paiements WHERE id = ?${schoolFilter}`, [req.params.id, ...schoolParams])
    res.json({ success: true, message: 'Paiement supprimé' })
  } catch (error) {
    console.error('Erreur suppression paiement:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// ============================================
// CAISSE
// ============================================

// GET /api/comptabilite/caisse/mouvements - Liste des mouvements de caisse
router.get('/caisse/mouvements', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const { type, date_debut, date_fin, page = 1, per_page = 50 } = req.query
    const offset = (Number(page) - 1) * Number(per_page)
    const schoolId = req.tenant?.id

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (schoolId) {
      whereClause += ' AND mc.school_id = ?'
      params.push(schoolId)
    }

    if (type) {
      whereClause += ` AND mc.type = ?`
      params.push(type)
    }
    if (date_debut) {
      whereClause += ` AND DATE(mc.date_mouvement) >= ?`
      params.push(date_debut)
    }
    if (date_fin) {
      whereClause += ` AND DATE(mc.date_mouvement) <= ?`
      params.push(date_fin)
    }

    const countResult = await query<any[]>(`SELECT COUNT(*) as total FROM mouvements_caisse mc ${whereClause}`, params)
    const total = countResult[0]?.total || 0

    const mouvements = await query<any[]>(`
      SELECT mc.*, u.nom as createur_nom, u.prenom as createur_prenom
      FROM mouvements_caisse mc
      LEFT JOIN utilisateurs u ON mc.created_by = u.id
      ${whereClause}
      ORDER BY mc.date_mouvement DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(per_page), offset])

    res.json({
      success: true,
      data: mouvements,
      meta: {
        page: Number(page),
        perPage: Number(per_page),
        total,
        totalPages: Math.ceil(total / Number(per_page)),
      },
    })
  } catch (error) {
    console.error('Erreur liste mouvements caisse:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/comptabilite/caisse/solde - Solde actuel de la caisse
router.get('/caisse/solde', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const schoolParams = schoolId ? [schoolId] : []

    const entreesResult = await query<any[]>(`SELECT COALESCE(SUM(montant), 0) as total FROM mouvements_caisse WHERE type = 'entree'${schoolFilter}`, [...schoolParams])
    const sortiesResult = await query<any[]>(`SELECT COALESCE(SUM(montant), 0) as total FROM mouvements_caisse WHERE type = 'sortie'${schoolFilter}`, [...schoolParams])
    const solde = (parseFloat(entreesResult[0]?.total) || 0) - (parseFloat(sortiesResult[0]?.total) || 0)

    const dernierMouvement = await query<any[]>(`SELECT * FROM mouvements_caisse WHERE 1=1${schoolFilter} ORDER BY date_mouvement DESC LIMIT 1`, [...schoolParams])

    res.json({
      success: true,
      data: {
        solde,
        totalEntrees: parseFloat(entreesResult[0]?.total) || 0,
        totalSorties: parseFloat(sortiesResult[0]?.total) || 0,
        dernierMouvement: dernierMouvement[0] || null,
      },
    })
  } catch (error) {
    console.error('Erreur solde caisse:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/comptabilite/caisse/mouvements - Créer un mouvement de caisse
router.post('/caisse/mouvements', authenticate, checkPermission('comptabilite', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { type, montant, libelle, reference, source, motif } = req.body
    const schoolId = req.tenant?.id

    if (!type || !montant || !libelle) {
      return res.status(400).json({ success: false, message: 'Type, montant et libellé requis' })
    }

    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const schoolParams = schoolId ? [schoolId] : []

    const entreesResult = await query<any[]>(`SELECT COALESCE(SUM(montant), 0) as total FROM mouvements_caisse WHERE type = 'entree'${schoolFilter}`, [...schoolParams])
    const sortiesResult = await query<any[]>(`SELECT COALESCE(SUM(montant), 0) as total FROM mouvements_caisse WHERE type = 'sortie'${schoolFilter}`, [...schoolParams])
    const soldePrecedent = (parseFloat(entreesResult[0]?.total) || 0) - (parseFloat(sortiesResult[0]?.total) || 0)

    const soldeApres = type === 'entree'
      ? soldePrecedent + parseFloat(montant)
      : soldePrecedent - parseFloat(montant)

    const result = await query<any>(`
      INSERT INTO mouvements_caisse (type, montant, devise, libelle, reference_type, solde_apres, created_by, date_mouvement, school_id)
      VALUES (?, ?, 'FC', ?, ?, ?, ?, NOW(), ?)
    `, [type, montant, libelle, source || motif || reference || null, soldeApres, req.user!.id, schoolId || null])

    res.status(201).json({
      success: true,
      message: `${type === 'entree' ? 'Entrée' : 'Sortie'} enregistrée`,
      data: { id: result.insertId, soldeApres },
    })
  } catch (error) {
    console.error('Erreur création mouvement caisse:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// ============================================
// STATISTIQUES
// ============================================

// GET /api/comptabilite/statistiques - Statistiques comptables
router.get('/statistiques', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const schoolFilterP = schoolId ? ' AND p.school_id = ?' : ''
    const schoolFilterE = schoolId ? ' AND e.school_id = ?' : ''
    const schoolParams = schoolId ? [schoolId] : []

    // Total des recettes (paiements valides)
    const recettesResult = await query<any[]>(`
      SELECT COALESCE(SUM(montant), 0) as total
      FROM paiements
      WHERE statut = 'valide'${schoolFilter}
    `, [...schoolParams])
    const totalRecettes = recettesResult[0]?.total || 0

    // Total des dépenses
    const depensesResult = await query<any[]>(`
      SELECT COALESCE(SUM(montant), 0) as total
      FROM depenses
      WHERE 1=1${schoolFilter}
    `, [...schoolParams])
    const totalDepenses = depensesResult[0]?.total || 0

    // Élèves en règle (au moins un paiement cette année)
    const enRegleResult = await query<any[]>(`
      SELECT COUNT(DISTINCT e.id) as count
      FROM eleves e
      JOIN paiements p ON e.id = p.eleve_id
      JOIN annees_scolaires a ON p.annee_scolaire_id = a.id
      WHERE a.est_active = TRUE AND p.statut = 'valide'${schoolFilterE}
    `, [...schoolParams])
    const elevesEnRegle = enRegleResult[0]?.count || 0

    // Élèves impayés (inscrits sans paiement)
    const impayesResult = await query<any[]>(`
      SELECT COUNT(DISTINCT e.id) as count
      FROM eleves e
      JOIN inscriptions i ON e.id = i.eleve_id
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id AND a.est_active = TRUE
      WHERE i.statut = 'validee'${schoolFilterE}
        AND e.id NOT IN (
          SELECT DISTINCT eleve_id FROM paiements p2
          JOIN annees_scolaires a2 ON p2.annee_scolaire_id = a2.id
          WHERE a2.est_active = TRUE AND p2.statut = 'valide'${schoolId ? ' AND p2.school_id = ?' : ''}
        )
    `, [...schoolParams, ...schoolParams])
    const elevesImpayes = impayesResult[0]?.count || 0

    // Taux de recouvrement
    const totalEleves = elevesEnRegle + elevesImpayes
    const tauxRecouvrement = totalEleves > 0 ? (elevesEnRegle / totalEleves) * 100 : 0

    // Recettes par mois (6 derniers mois)
    const recettesParMois = await query<any[]>(`
      SELECT 
        DATE_FORMAT(date_paiement, '%b') as mois,
        SUM(montant) as montant
      FROM paiements
      WHERE statut = 'valide'
        AND date_paiement >= DATE_SUB(NOW(), INTERVAL 6 MONTH)${schoolFilter}
      GROUP BY DATE_FORMAT(date_paiement, '%Y-%m'), DATE_FORMAT(date_paiement, '%b')
      ORDER BY DATE_FORMAT(date_paiement, '%Y-%m') ASC
    `, [...schoolParams])

    const depensesParCategorie = await query<any[]>(`
      SELECT cd.libelle as categorie, SUM(d.montant) as total
      FROM depenses d
      LEFT JOIN categories_depenses cd ON d.categorie_id = cd.id
      WHERE 1=1${schoolId ? ' AND d.school_id = ?' : ''}
      GROUP BY d.categorie_id, cd.libelle
    `, [...schoolParams])

    const depensesObj: Record<string, number> = {}
    depensesParCategorie.forEach(d => {
      depensesObj[d.categorie || 'autres'] = d.total
    })

    res.json({
      success: true,
      data: {
        totalRecettes: parseFloat(totalRecettes) || 0,
        totalDepenses: parseFloat(totalDepenses) || 0,
        solde: (parseFloat(totalRecettes) || 0) - (parseFloat(totalDepenses) || 0),
        tauxRecouvrement: Math.round(tauxRecouvrement * 10) / 10,
        elevesEnRegle,
        elevesImpayes,
        recettesParMois: recettesParMois.map(r => ({
          mois: r.mois,
          montant: parseFloat(r.montant) || 0,
        })),
        depensesParCategorie: depensesObj,
      },
    })
  } catch (error) {
    console.error('Erreur statistiques comptabilité:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
