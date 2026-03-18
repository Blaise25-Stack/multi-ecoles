import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// GET /api/paiements
router.get('/', authenticate, checkPermission('paiements', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { search, eleve_id, type_frais_id, statut, date_debut, date_fin, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let whereClause = 'WHERE a.est_active = TRUE'
    const params: any[] = []

    // Multi-tenant filter (via eleves join)
    if (req.tenant?.id) {
      whereClause += ' AND e.school_id = ?'
      params.push(req.tenant.id)
    }

    if (search) { whereClause += ` AND (e.nom LIKE ? OR e.prenom LIKE ? OR p.numero_recu LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`) }
    if (eleve_id) { whereClause += ` AND p.eleve_id = ?`; params.push(eleve_id) }
    if (type_frais_id) { whereClause += ` AND p.type_frais_id = ?`; params.push(type_frais_id) }
    if (statut) { whereClause += ` AND p.statut = ?`; params.push(statut) }
    if (date_debut) { whereClause += ` AND DATE(p.date_paiement) >= ?`; params.push(date_debut) }
    if (date_fin) { whereClause += ` AND DATE(p.date_paiement) <= ?`; params.push(date_fin) }

    const countResult = await query<any[]>(`
      SELECT COUNT(*) as total FROM paiements p
      JOIN annees_scolaires a ON p.annee_scolaire_id = a.id
      JOIN eleves e ON p.eleve_id = e.id
      ${whereClause}
    `, params)

    const paiements = await query<any[]>(`
      SELECT p.*, e.nom, e.prenom, e.matricule, tf.libelle as type_frais,
             u.nom as recu_par_nom, u.prenom as recu_par_prenom
      FROM paiements p
      JOIN annees_scolaires a ON p.annee_scolaire_id = a.id
      JOIN eleves e ON p.eleve_id = e.id
      JOIN types_frais tf ON p.type_frais_id = tf.id
      LEFT JOIN utilisateurs u ON p.recu_par = u.id
      ${whereClause}
      ORDER BY p.date_paiement DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset])

    // Calculer le total des montants
    const totalResult = await query<any[]>(`
      SELECT SUM(p.montant) as total_montant FROM paiements p
      JOIN annees_scolaires a ON p.annee_scolaire_id = a.id
      JOIN eleves e ON p.eleve_id = e.id
      ${whereClause} AND p.statut = 'valide'
    `, params)

    res.json({
      success: true,
      data: paiements,
      totalMontant: totalResult[0].total_montant || 0,
      pagination: { page: Number(page), limit: Number(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / Number(limit)) },
    })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// POST /api/paiements
router.post('/', authenticate, checkPermission('paiements', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { eleve_id, type_frais_id, montant, mode_paiement, reference_paiement, observations, inscription_id } = req.body
    if (!eleve_id || !type_frais_id || !montant) return res.status(400).json({ success: false, message: 'Élève, type de frais et montant requis' })

    const annees = await query<any[]>(`SELECT id FROM annees_scolaires WHERE est_active = TRUE LIMIT 1`)
    if (annees.length === 0) return res.status(400).json({ success: false, message: 'Aucune année scolaire active' })

    // Générer le numéro de reçu
    const school_id = (req as TenantRequest).tenant?.id || null
    const year = new Date().getFullYear().toString().slice(-2)
    const recuCountParams: any[] = [`REC${year}%`]
    let recuCountWhere = 'WHERE numero_recu LIKE ?'
    if (school_id) { recuCountWhere += ' AND school_id = ?'; recuCountParams.push(school_id) }
    const countResult = await query<any[]>(`SELECT COUNT(*) as count FROM paiements ${recuCountWhere}`, recuCountParams)
    const numero_recu = `REC${year}${(countResult[0].count + 1).toString().padStart(6, '0')}`

    const result = await query<any>(`
      INSERT INTO paiements (numero_recu, eleve_id, inscription_id, type_frais_id, annee_scolaire_id, montant, devise, mode_paiement, reference_paiement, observations, statut, recu_par, school_id)
      VALUES (?, ?, ?, ?, ?, ?, 'FC', ?, ?, ?, 'valide', ?, ?)
    `, [numero_recu, eleve_id, inscription_id || null, type_frais_id, annees[0].id, montant, mode_paiement || 'especes', reference_paiement || null, observations || null, req.user!.id, school_id])

    // Enregistrer dans les mouvements de caisse
    await query(`
      INSERT INTO mouvements_caisse (type, montant, devise, libelle, reference_id, reference_type, created_by, school_id)
      VALUES ('entree', ?, 'FC', ?, ?, 'paiement', ?, ?)
    `, [montant, `Paiement ${numero_recu}`, result.insertId, req.user!.id, school_id])

    res.status(201).json({ success: true, message: 'Paiement enregistré', data: { id: result.insertId, numero_recu } })
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// GET /api/paiements/types-frais/list
router.get('/types-frais/list', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const types = await query<any[]>(`SELECT * FROM types_frais ORDER BY libelle`)
    res.json({ success: true, data: types })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// PUT /api/paiements/:id
router.put('/:id', authenticate, checkPermission('paiements', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const { statut, observations } = req.body
    const updates: string[] = []; const params: any[] = []
    if (statut) { updates.push('statut = ?'); params.push(statut) }
    if (observations !== undefined) { updates.push('observations = ?'); params.push(observations) }
    if (updates.length > 0) {
      params.push(req.params.id)
      const schoolId = req.tenant?.id
      const schoolFilter = schoolId ? ' AND school_id = ?' : ''
      if (schoolId) params.push(schoolId)
      await query(`UPDATE paiements SET ${updates.join(', ')} WHERE id = ?${schoolFilter}`, params)
    }
    res.json({ success: true, message: 'Paiement modifié' })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

export default router



