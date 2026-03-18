import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// GET /api/personnel
router.get('/', authenticate, checkPermission('personnel', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { search, departement, is_active, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    // Multi-tenant filter
    if (req.tenant?.id) {
      whereClause += ' AND p.school_id = ?'
      params.push(req.tenant.id)
    }

    if (search) { whereClause += ` AND (p.nom LIKE ? OR p.prenom LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
    if (departement) { whereClause += ` AND p.departement = ?`; params.push(departement) }
    if (is_active !== undefined) { whereClause += ` AND p.is_active = ?`; params.push(is_active === 'true') }

    const countResult = await query<any[]>(`SELECT COUNT(*) as total FROM personnel p ${whereClause}`, params)
    const personnel = await query<any[]>(`SELECT * FROM personnel p ${whereClause} ORDER BY p.nom LIMIT ? OFFSET ?`, [...params, Number(limit), offset])

    res.json({ success: true, data: personnel, pagination: { page: Number(page), limit: Number(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / Number(limit)) } })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// POST /api/personnel
router.post('/', authenticate, checkPermission('personnel', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { nom, postnom, prenom, sexe, fonction, departement, date_embauche, type_contrat, salaire_base, telephone, email, adresse } = req.body
    if (!nom || !prenom || !sexe || !fonction) return res.status(400).json({ success: false, message: 'Champs requis manquants' })

    const year = new Date().getFullYear().toString().slice(-2)
    const school_id = (req as TenantRequest).tenant?.id || null
    const countParams: any[] = [`PER${year}%`]
    let countWhere = 'WHERE matricule LIKE ?'
    if (school_id) { countWhere += ' AND school_id = ?'; countParams.push(school_id) }
    const countResult = await query<any[]>(`SELECT COUNT(*) as count FROM personnel ${countWhere}`, countParams)
    const matricule = `PER${year}${(countResult[0].count + 1).toString().padStart(4, '0')}`

    const result = await query<any>(`
      INSERT INTO personnel (matricule, nom, postnom, prenom, sexe, fonction, departement, date_embauche, type_contrat, salaire_base, telephone, email, adresse, is_active, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)
    `, [matricule, nom, postnom || null, prenom, sexe, fonction, departement || null, date_embauche || null, type_contrat || 'CDI', salaire_base || null, telephone || null, email || null, adresse || null, school_id])

    res.status(201).json({ success: true, message: 'Personnel créé', data: { id: result.insertId, matricule } })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// PUT /api/personnel/:id
router.put('/:id', authenticate, checkPermission('personnel', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const fields = ['nom', 'postnom', 'prenom', 'sexe', 'fonction', 'departement', 'date_embauche', 'type_contrat', 'salaire_base', 'telephone', 'email', 'adresse', 'is_active']
    const updates: string[] = []; const params: any[] = []
    for (const f of fields) { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]) } }
    if (updates.length > 0) {
      params.push(id)
      const schoolId = req.tenant?.id
      const schoolFilter = schoolId ? ' AND school_id = ?' : ''
      if (schoolId) params.push(schoolId)
      await query(`UPDATE personnel SET ${updates.join(', ')} WHERE id = ?${schoolFilter}`, params)
    }
    res.json({ success: true, message: 'Personnel modifié' })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// DELETE /api/personnel/:id
router.delete('/:id', authenticate, checkPermission('personnel', 'delete'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const params: any[] = [req.params.id]
    if (schoolId) params.push(schoolId)
    await query(`DELETE FROM personnel WHERE id = ?${schoolFilter}`, params)
    res.json({ success: true, message: 'Personnel supprimé' })
  }
  catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

export default router



