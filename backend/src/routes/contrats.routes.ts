import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// GET /api/contrats
router.get('/', authenticate, checkPermission('contrats', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { employe_type, type_contrat, statut, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const schoolId = req.tenant?.id
    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (schoolId) { whereClause += ' AND c.school_id = ?'; params.push(schoolId) }
    if (employe_type) { whereClause += ' AND c.employe_type = ?'; params.push(employe_type) }
    if (type_contrat) { whereClause += ' AND c.type_contrat = ?'; params.push(type_contrat) }
    if (statut) { whereClause += ' AND c.statut = ?'; params.push(statut) }

    const countResult = await query<any[]>(`SELECT COUNT(*) as total FROM contrats c ${whereClause}`, params)

    const contrats = await query<any[]>(`
      SELECT c.*,
        CASE 
          WHEN c.employe_type = 'enseignant' THEN (SELECT CONCAT(nom, ' ', prenom) FROM enseignants WHERE id = c.employe_id)
          ELSE (SELECT CONCAT(nom, ' ', prenom) FROM personnel WHERE id = c.employe_id)
        END as employe_nom,
        CASE 
          WHEN c.employe_type = 'enseignant' THEN (SELECT matricule FROM enseignants WHERE id = c.employe_id)
          ELSE (SELECT matricule FROM personnel WHERE id = c.employe_id)
        END as employe_matricule
      FROM contrats c
      ${whereClause}
      ORDER BY c.date_debut DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset])

    res.json({ success: true, data: contrats, pagination: { page: Number(page), limit: Number(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / Number(limit)) } })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// POST /api/contrats
router.post('/', authenticate, checkPermission('contrats', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const { employe_type, employe_id, type_contrat, date_debut, date_fin, salaire, poste, departement } = req.body
    if (!employe_type || !employe_id || !type_contrat || !date_debut) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' })
    }

    const year = new Date().getFullYear().toString().slice(-2)
    let countQuery = `SELECT COUNT(*) as count FROM contrats WHERE numero LIKE ?`
    const countParams: any[] = [`CTR${year}%`]
    if (schoolId) { countQuery += ' AND school_id = ?'; countParams.push(schoolId) }
    const countResult = await query<any[]>(countQuery, countParams)
    const numero = `CTR${year}${(countResult[0].count + 1).toString().padStart(4, '0')}`

    const result = await query<any>(`
      INSERT INTO contrats (numero, employe_type, employe_id, type_contrat, date_debut, date_fin, salaire, devise, poste, departement, statut, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'FC', ?, ?, 'actif', ?)
    `, [numero, employe_type, employe_id, type_contrat, date_debut, date_fin || null, salaire || null, poste || null, departement || null, schoolId || null])

    // Mettre à jour le salaire de l'employé
    if (salaire) {
      const table = employe_type === 'personnel' ? 'personnel' : 'enseignants'
      await query(`UPDATE ${table} SET salaire_base = ?, type_contrat = ? WHERE id = ?`, [salaire, type_contrat, employe_id])
    }

    res.status(201).json({ success: true, message: 'Contrat créé', data: { id: result.insertId, numero } })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// PUT /api/contrats/:id
router.put('/:id', authenticate, checkPermission('contrats', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const { type_contrat, date_fin, salaire, poste, departement, statut } = req.body
    const updates: string[] = []; const params: any[] = []

    if (type_contrat) { updates.push('type_contrat = ?'); params.push(type_contrat) }
    if (date_fin !== undefined) { updates.push('date_fin = ?'); params.push(date_fin) }
    if (salaire !== undefined) { updates.push('salaire = ?'); params.push(salaire) }
    if (poste) { updates.push('poste = ?'); params.push(poste) }
    if (departement) { updates.push('departement = ?'); params.push(departement) }
    if (statut) { updates.push('statut = ?'); params.push(statut) }

    if (updates.length > 0) {
      const schoolFilter = schoolId ? ' AND school_id = ?' : ''
      params.push(req.params.id)
      if (schoolId) params.push(schoolId)
      await query(`UPDATE contrats SET ${updates.join(', ')} WHERE id = ?${schoolFilter}`, params)
    }

    res.json({ success: true, message: 'Contrat modifié' })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// PUT /api/contrats/:id/renouveler
router.put('/:id/renouveler', authenticate, checkPermission('contrats', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const { nouvelle_date_fin, nouveau_salaire } = req.body

    // Récupérer le contrat actuel
    const schoolFilter = schoolId ? ' AND school_id = ?' : ''
    const selectParams: any[] = [req.params.id]
    if (schoolId) selectParams.push(schoolId)
    const contrats = await query<any[]>(`SELECT * FROM contrats WHERE id = ?${schoolFilter}`, selectParams)
    if (contrats.length === 0) return res.status(404).json({ success: false, message: 'Contrat non trouvé' })

    const contrat = contrats[0]

    // Marquer l'ancien comme renouvelé
    const updateParams: any[] = [req.params.id]
    if (schoolId) updateParams.push(schoolId)
    await query(`UPDATE contrats SET statut = 'renouvele' WHERE id = ?${schoolFilter}`, updateParams)

    // Créer le nouveau contrat
    const year = new Date().getFullYear().toString().slice(-2)
    let countQuery = `SELECT COUNT(*) as count FROM contrats WHERE numero LIKE ?`
    const countParams: any[] = [`CTR${year}%`]
    if (schoolId) { countQuery += ' AND school_id = ?'; countParams.push(schoolId) }
    const countResult = await query<any[]>(countQuery, countParams)
    const numero = `CTR${year}${(countResult[0].count + 1).toString().padStart(4, '0')}`

    await query(`
      INSERT INTO contrats (numero, employe_type, employe_id, type_contrat, date_debut, date_fin, salaire, devise, poste, departement, statut, school_id)
      VALUES (?, ?, ?, ?, CURDATE(), ?, ?, 'FC', ?, ?, 'actif', ?)
    `, [numero, contrat.employe_type, contrat.employe_id, contrat.type_contrat, nouvelle_date_fin || null, nouveau_salaire || contrat.salaire, contrat.poste, contrat.departement, schoolId || null])

    res.json({ success: true, message: 'Contrat renouvelé' })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

export default router



