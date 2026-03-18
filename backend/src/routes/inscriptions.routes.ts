import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

const generateNumeroInscription = async (schoolId?: number): Promise<string> => {
  const year = new Date().getFullYear().toString().slice(-2)
  const params: any[] = [`INS${year}%`]
  let sql = `SELECT COUNT(*) as count FROM inscriptions WHERE numero LIKE ?`
  if (schoolId) {
    sql += ` AND school_id = ?`
    params.push(schoolId)
  }
  const result = await query<any[]>(sql, params)
  const count = result[0].count + 1
  return `INS${year}${count.toString().padStart(5, '0')}`
}

// GET /api/inscriptions/derniere/numero - MUST be before /:id to avoid param capture
router.get('/derniere/numero', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const derniereParams: any[] = []
    let schoolFilter = ''
    if (schoolId) {
      schoolFilter = ' AND i.school_id = ?'
      derniereParams.push(schoolId)
    }

    const result = await query<any[]>(`
      SELECT i.*, e.nom, e.prenom, e.postnom
      FROM inscriptions i
      LEFT JOIN eleves e ON i.eleve_id = e.id
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id AND a.est_active = TRUE
      WHERE i.eleve_id IS NULL${schoolFilter}
      ORDER BY i.created_at DESC
      LIMIT 1
    `, derniereParams)

    if (result.length === 0) {
      return res.json({ success: true, data: null })
    }

    res.json({ success: true, data: result[0] })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/inscriptions
router.get('/', authenticate, checkPermission('inscriptions', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { search, classe_id, type, statut, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let whereClause = 'WHERE a.est_active = TRUE'
    const params: any[] = []

    // Multi-tenant filter
    if (req.tenant?.id) {
      whereClause += ' AND i.school_id = ?'
      params.push(req.tenant.id)
    }

    if (search) {
      whereClause += ` AND (e.nom LIKE ? OR e.prenom LIKE ? OR i.numero LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (classe_id) { whereClause += ` AND i.classe_id = ?`; params.push(classe_id) }
    if (type) { whereClause += ` AND i.type_inscription = ?`; params.push(type) }
    if (statut) { whereClause += ` AND i.statut = ?`; params.push(statut) }

    const countResult = await query<any[]>(`
      SELECT COUNT(*) as total FROM inscriptions i
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id
      LEFT JOIN eleves e ON i.eleve_id = e.id
      ${whereClause}
    `, params)

    const inscriptions = await query<any[]>(`
      SELECT i.*, e.nom, e.postnom, e.prenom, e.matricule, e.photo,
             c.libelle as classe, n.libelle as niveau
      FROM inscriptions i
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id
      LEFT JOIN eleves e ON i.eleve_id = e.id
      LEFT JOIN classes c ON i.classe_id = c.id
      LEFT JOIN niveaux n ON c.niveau_id = n.id
      ${whereClause}
      ORDER BY i.date_inscription DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset])

    res.json({
      success: true,
      data: inscriptions,
      pagination: { page: Number(page), limit: Number(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / Number(limit)) },
    })
  } catch (error) {
    console.error('Erreur liste inscriptions:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/inscriptions/:id
router.get('/:id', authenticate, checkPermission('inscriptions', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const getParams: any[] = [req.params.id]
    let schoolFilter = ''
    if (schoolId) {
      schoolFilter = ' AND i.school_id = ?'
      getParams.push(schoolId)
    }

    const inscriptions = await query<any[]>(`
      SELECT i.*, e.nom, e.postnom, e.prenom, e.matricule, e.sexe, e.date_naissance, e.photo,
             c.libelle as classe, n.libelle as niveau, a.libelle as annee_scolaire
      FROM inscriptions i
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id
      LEFT JOIN eleves e ON i.eleve_id = e.id
      LEFT JOIN classes c ON i.classe_id = c.id
      LEFT JOIN niveaux n ON c.niveau_id = n.id
      WHERE i.id = ?${schoolFilter}
    `, getParams)

    if (inscriptions.length === 0) {
      return res.status(404).json({ success: false, message: 'Inscription non trouvée' })
    }
    res.json({ success: true, data: inscriptions[0] })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/inscriptions
router.post('/', authenticate, checkPermission('inscriptions', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { classe_id, type_inscription, montant_inscription, observations, eleve_id, statut: reqStatut } = req.body

    if (!classe_id || !type_inscription) {
      return res.status(400).json({ success: false, message: 'Classe et type requis' })
    }

    // Récupérer l'année active
    const annees = await query<any[]>(`SELECT id FROM annees_scolaires WHERE est_active = TRUE LIMIT 1`)
    if (annees.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune année scolaire active' })
    }

    const school_id = (req as TenantRequest).tenant?.id || null
    const numero = await generateNumeroInscription(school_id ?? undefined)

    const inscriptionStatut = reqStatut && ['en_attente', 'validee', 'refusee'].includes(reqStatut) ? reqStatut : 'en_attente'

    const result = await query<any>(`
      INSERT INTO inscriptions (numero, eleve_id, classe_id, annee_scolaire_id, type_inscription, date_inscription, montant_inscription, statut, observations, school_id)
      VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)
    `, [numero, eleve_id || null, classe_id, annees[0].id, type_inscription, montant_inscription || 0, inscriptionStatut, observations || null, school_id])

    res.status(201).json({
      success: true,
      message: 'Inscription créée avec succès',
      data: { id: result.insertId, numero },
    })
  } catch (error) {
    console.error('Erreur création inscription:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/inscriptions/:id
router.put('/:id', authenticate, checkPermission('inscriptions', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const schoolId = req.tenant?.id
    const { classe_id, type_inscription, montant_inscription, statut, observations, eleve_id } = req.body

    const updates: string[] = []
    const params: any[] = []

    if (classe_id) { updates.push('classe_id = ?'); params.push(classe_id) }
    if (type_inscription) { updates.push('type_inscription = ?'); params.push(type_inscription) }
    if (montant_inscription) { updates.push('montant_inscription = ?'); params.push(montant_inscription) }
    if (statut) { updates.push('statut = ?'); params.push(statut) }
    if (observations !== undefined) { updates.push('observations = ?'); params.push(observations) }
    if (eleve_id) { updates.push('eleve_id = ?'); params.push(eleve_id) }

    if (updates.length > 0) {
      params.push(id)
      if (schoolId) { params.push(schoolId) }
      await query(`UPDATE inscriptions SET ${updates.join(', ')} WHERE id = ?${schoolId ? ' AND school_id = ?' : ''}`, params)
    }

    res.json({ success: true, message: 'Inscription modifiée avec succès' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/inscriptions/:id
router.delete('/:id', authenticate, checkPermission('inscriptions', 'delete'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const schoolId = req.tenant?.id

    const existParams: any[] = [id]
    let existFilter = ''
    if (schoolId) {
      existFilter = ' AND school_id = ?'
      existParams.push(schoolId)
    }
    const existing = await query<any[]>(`SELECT id FROM inscriptions WHERE id = ?${existFilter}`, existParams)
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Inscription non trouvée' })
    }

    await query(`UPDATE paiements SET inscription_id = NULL WHERE inscription_id = ?`, [id])
    const deleteParams: any[] = [id]
    if (schoolId) { deleteParams.push(schoolId) }
    await query(`DELETE FROM inscriptions WHERE id = ?${schoolId ? ' AND school_id = ?' : ''}`, deleteParams)

    res.json({ success: true, message: 'Inscription supprimée' })
  } catch (error) {
    console.error('Erreur suppression inscription:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router



