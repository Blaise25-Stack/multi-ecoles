import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// GET /api/matieres
router.get('/', authenticate, checkPermission('matieres', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    if (schoolId) { whereClause += ' AND m.school_id = ?'; params.push(schoolId) }

    const matieres = await query<any[]>(`
      SELECT m.*,
        (SELECT GROUP_CONCAT(c.libelle SEPARATOR ', ') 
         FROM classes c 
         JOIN classe_matieres cm ON c.id = cm.classe_id 
         JOIN annees_scolaires a ON c.annee_scolaire_id = a.id AND a.est_active = TRUE
         WHERE cm.matiere_id = m.id) as classes
      FROM matieres m
      ${whereClause}
      ORDER BY m.libelle
    `, params)
    res.json({ success: true, data: matieres })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/matieres/:id
router.get('/:id', authenticate, checkPermission('matieres', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const matiereParams: any[] = [req.params.id]
    let matiereWhere = 'WHERE id = ?'
    if (schoolId) { matiereWhere += ' AND school_id = ?'; matiereParams.push(schoolId) }

    const matieres = await query<any[]>(`SELECT * FROM matieres ${matiereWhere}`, matiereParams)
    if (matieres.length === 0) {
      return res.status(404).json({ success: false, message: 'Matière non trouvée' })
    }

    // Récupérer les classes associées
    const classes = await query<any[]>(`
      SELECT c.id, c.libelle, cm.heures_semaine
      FROM classes c
      JOIN classe_matieres cm ON c.id = cm.classe_id
      JOIN annees_scolaires a ON c.annee_scolaire_id = a.id AND a.est_active = TRUE
      WHERE cm.matiere_id = ?
    `, [req.params.id])

    res.json({ success: true, data: { ...matieres[0], classes } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/matieres
router.post('/', authenticate, checkPermission('matieres', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const { code, libelle, description, coefficient, classes } = req.body

    if (!code || !libelle) {
      return res.status(400).json({ success: false, message: 'Code et libellé requis' })
    }

    const result = await query<any>(`
      INSERT INTO matieres (code, libelle, description, coefficient, school_id)
      VALUES (?, ?, ?, ?, ?)
    `, [code, libelle, description || null, coefficient || 1.0, schoolId || null])

    // Associer aux classes si spécifiées
    if (classes && Array.isArray(classes)) {
      for (const classeId of classes) {
        await query(`
          INSERT INTO classe_matieres (classe_id, matiere_id, heures_semaine)
          VALUES (?, ?, 2)
        `, [classeId, result.insertId])
      }
    }

    res.status(201).json({ success: true, message: 'Matière créée', data: { id: result.insertId } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/matieres/:id
router.put('/:id', authenticate, checkPermission('matieres', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const { id } = req.params
    const { code, libelle, description, coefficient, classes } = req.body

    const updates: string[] = []
    const params: any[] = []

    if (code) { updates.push('code = ?'); params.push(code) }
    if (libelle) { updates.push('libelle = ?'); params.push(libelle) }
    if (description !== undefined) { updates.push('description = ?'); params.push(description) }
    if (coefficient) { updates.push('coefficient = ?'); params.push(coefficient) }

    if (updates.length > 0) {
      params.push(id)
      let updateWhere = 'WHERE id = ?'
      if (schoolId) { updateWhere += ' AND school_id = ?'; params.push(schoolId) }
      await query(`UPDATE matieres SET ${updates.join(', ')} ${updateWhere}`, params)
    }

    // Mettre à jour les associations de classes
    if (classes && Array.isArray(classes)) {
      await query(`DELETE FROM classe_matieres WHERE matiere_id = ?`, [id])
      for (const classeId of classes) {
        await query(`
          INSERT INTO classe_matieres (classe_id, matiere_id, heures_semaine)
          VALUES (?, ?, 2)
        `, [classeId, id])
      }
    }

    res.json({ success: true, message: 'Matière modifiée' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/matieres/:id
router.delete('/:id', authenticate, checkPermission('matieres', 'delete'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const deleteParams: any[] = [req.params.id]
    let deleteWhere = 'WHERE id = ?'
    if (schoolId) { deleteWhere += ' AND school_id = ?'; deleteParams.push(schoolId) }

    await query(`DELETE FROM matieres ${deleteWhere}`, deleteParams)
    res.json({ success: true, message: 'Matière supprimée' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router



