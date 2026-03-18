import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// GET /api/conges
router.get('/', authenticate, checkPermission('conges', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { statut, employe_type, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const schoolId = req.tenant?.id
    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (schoolId) { whereClause += ' AND c.school_id = ?'; params.push(schoolId) }
    if (statut) { whereClause += ' AND c.statut = ?'; params.push(statut) }
    if (employe_type) { whereClause += ' AND c.employe_type = ?'; params.push(employe_type) }

    // Si enseignant, ne voir que ses propres congés
    if (req.user!.role_code === 'enseignant') {
      const enseignant = await query<any[]>(`SELECT id FROM enseignants WHERE utilisateur_id = ?`, [req.user!.id])
      if (enseignant.length > 0) {
        whereClause += ` AND c.employe_type = 'enseignant' AND c.employe_id = ?`
        params.push(enseignant[0].id)
      }
    }

    const countResult = await query<any[]>(`SELECT COUNT(*) as total FROM conges c ${whereClause}`, params)

    const conges = await query<any[]>(`
      SELECT c.*, tc.libelle as type_conge,
        CASE 
          WHEN c.employe_type = 'enseignant' THEN (SELECT CONCAT(nom, ' ', prenom) FROM enseignants WHERE id = c.employe_id)
          ELSE (SELECT CONCAT(nom, ' ', prenom) FROM personnel WHERE id = c.employe_id)
        END as employe_nom,
        u.nom as approuve_par_nom, u.prenom as approuve_par_prenom
      FROM conges c
      JOIN types_conges tc ON c.type_conge_id = tc.id
      LEFT JOIN utilisateurs u ON c.approuve_par = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset])

    res.json({ success: true, data: conges, pagination: { page: Number(page), limit: Number(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / Number(limit)) } })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// POST /api/conges
router.post('/', authenticate, checkPermission('conges', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const { employe_type, employe_id, type_conge_id, date_debut, date_fin, motif } = req.body
    if (!employe_type || !employe_id || !type_conge_id || !date_debut || !date_fin) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' })
    }

    const result = await query<any>(`
      INSERT INTO conges (employe_type, employe_id, type_conge_id, date_debut, date_fin, motif, statut, school_id)
      VALUES (?, ?, ?, ?, ?, ?, 'en_attente', ?)
    `, [employe_type, employe_id, type_conge_id, date_debut, date_fin, motif || null, schoolId || null])

    res.status(201).json({ success: true, message: 'Demande de congé créée', data: { id: result.insertId } })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// PUT /api/conges/:id/traiter
router.put('/:id/traiter', authenticate, checkPermission('conges', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const { statut, commentaire } = req.body // 'approuve' ou 'rejete'
    if (!['approuve', 'rejete'].includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' })
    }

    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const updateParams: any[] = [statut, req.user!.id, commentaire || null, req.params.id]
    if (schoolId) updateParams.push(schoolId)

    await query(`
      UPDATE conges SET statut = ?, approuve_par = ?, date_approbation = NOW(), commentaire_approbation = ?
      WHERE id = ?${schoolFilter}
    `, updateParams)

    res.json({ success: true, message: `Demande ${statut === 'approuve' ? 'approuvée' : 'rejetée'}` })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// GET /api/conges/types/list
router.get('/types/list', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const types = await query<any[]>(`SELECT * FROM types_conges ORDER BY libelle`)
    res.json({ success: true, data: types })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

export default router



