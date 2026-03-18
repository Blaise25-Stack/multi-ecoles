import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// GET /api/depenses
router.get('/', authenticate, checkPermission('depenses', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { search, categorie_id, statut, date_debut, date_fin, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const schoolId = req.tenant?.id

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (schoolId) { whereClause += ' AND d.school_id = ?'; params.push(schoolId) }
    if (search) { whereClause += ` AND (d.libelle LIKE ? OR d.numero LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
    if (categorie_id) { whereClause += ` AND d.categorie_id = ?`; params.push(categorie_id) }
    if (statut) { whereClause += ` AND d.statut = ?`; params.push(statut) }
    if (date_debut) { whereClause += ` AND d.date_depense >= ?`; params.push(date_debut) }
    if (date_fin) { whereClause += ` AND d.date_depense <= ?`; params.push(date_fin) }

    const countResult = await query<any[]>(`SELECT COUNT(*) as total FROM depenses d ${whereClause}`, params)

    const depenses = await query<any[]>(`
      SELECT d.*, c.libelle as categorie, u.nom as created_by_nom, u.prenom as created_by_prenom
      FROM depenses d
      JOIN categories_depenses c ON d.categorie_id = c.id
      LEFT JOIN utilisateurs u ON d.created_by = u.id
      ${whereClause}
      ORDER BY d.date_depense DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset])

    const totalResult = await query<any[]>(`SELECT SUM(montant) as total FROM depenses d ${whereClause} AND d.statut = 'approuvee'`, params)

    res.json({
      success: true,
      data: depenses,
      totalMontant: totalResult[0].total || 0,
      pagination: { page: Number(page), limit: Number(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / Number(limit)) },
    })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// POST /api/depenses
router.post('/', authenticate, checkPermission('depenses', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { categorie_id, libelle, description, montant, date_depense, beneficiaire, mode_paiement, reference } = req.body
    if (!categorie_id || !libelle || !montant || !date_depense) return res.status(400).json({ success: false, message: 'Champs requis manquants' })
    const schoolId = req.tenant?.id

    const year = new Date().getFullYear().toString().slice(-2)
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const countParams: any[] = [`DEP${year}%`]
    if (schoolId) countParams.push(schoolId)
    const countResult = await query<any[]>(`SELECT COUNT(*) as count FROM depenses WHERE numero LIKE ?${schoolFilter}`, countParams)
    const numero = `DEP${year}${(countResult[0].count + 1).toString().padStart(5, '0')}`

    const result = await query<any>(`
      INSERT INTO depenses (numero, categorie_id, libelle, description, montant, devise, date_depense, beneficiaire, mode_paiement, reference, statut, created_by, school_id)
      VALUES (?, ?, ?, ?, ?, 'FC', ?, ?, ?, ?, 'en_attente', ?, ?)
    `, [numero, categorie_id, libelle, description || null, montant, date_depense, beneficiaire || null, mode_paiement || 'especes', reference || null, req.user!.id, schoolId || null])

    res.status(201).json({ success: true, message: 'Dépense créée', data: { id: result.insertId, numero } })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// PUT /api/depenses/:id/approuver
router.put('/:id/approuver', authenticate, checkPermission('depenses', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const { statut } = req.body
    const schoolId = req.tenant?.id
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const idParams: any[] = [statut, req.user!.id, id]
    if (schoolId) idParams.push(schoolId)

    await query(`UPDATE depenses SET statut = ?, approuve_par = ? WHERE id = ?${schoolFilter}`, idParams)

    if (statut === 'approuvee') {
      const depense = await query<any[]>(`SELECT * FROM depenses WHERE id = ?`, [id])
      if (depense.length > 0) {
        await query(`
          INSERT INTO mouvements_caisse (type, montant, devise, libelle, reference_id, reference_type, created_by, school_id)
          VALUES ('sortie', ?, 'FC', ?, ?, 'depense', ?, ?)
        `, [depense[0].montant, `Dépense ${depense[0].numero}`, id, req.user!.id, schoolId || null])
      }
    }

    res.json({ success: true, message: `Dépense ${statut === 'approuvee' ? 'approuvée' : 'rejetée'}` })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// GET /api/depenses/categories/list
router.get('/categories/list', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const categories = await query<any[]>(`SELECT * FROM categories_depenses ORDER BY libelle`)
    res.json({ success: true, data: categories })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

export default router
