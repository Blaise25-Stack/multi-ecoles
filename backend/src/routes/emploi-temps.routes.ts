import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

router.get('/', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const { classe_id } = req.query
    let whereClause = 'WHERE a.est_active = TRUE'
    const params: any[] = []

    if (schoolId) { whereClause += ' AND et.school_id = ?'; params.push(schoolId) }
    if (classe_id) { whereClause += ' AND et.classe_id = ?'; params.push(classe_id) }

    const seances = await query<any[]>(`
      SELECT et.id, et.jour, et.creneau_id as creneauId,
             m.libelle as matiere, m.id as matiereId,
             CONCAT(ens.prenom, ' ', ens.nom) as enseignant, ens.id as enseignantId,
             COALESCE(s.libelle, '') as salle, s.id as salleId
      FROM emploi_temps et
      JOIN matieres m ON et.matiere_id = m.id
      JOIN annees_scolaires a ON et.annee_scolaire_id = a.id
      LEFT JOIN enseignants ens ON et.enseignant_id = ens.id
      LEFT JOIN salles s ON et.salle_id = s.id
      ${whereClause}
      ORDER BY FIELD(et.jour, 'lundi','mardi','mercredi','jeudi','vendredi','samedi'), et.creneau_id
    `, params)

    const mapped = seances.map(s => ({
      ...s,
      jour: s.jour.charAt(0).toUpperCase() + s.jour.slice(1),
    }))

    res.json({ success: true, data: mapped })
  } catch (error) {
    console.error('Erreur emploi du temps:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.post('/', authenticate, checkPermission('emploi_temps', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const { classeId, jour, creneauId, matiereId, enseignantId, salleId } = req.body
    if (!classeId || !jour || !creneauId || !matiereId) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' })
    }

    const annees = await query<any[]>('SELECT id FROM annees_scolaires WHERE est_active = TRUE LIMIT 1')
    if (annees.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune année scolaire active' })
    }

    const jourLower = jour.toLowerCase()

    const result = await query<any>(`
      INSERT INTO emploi_temps (classe_id, matiere_id, enseignant_id, salle_id, creneau_id, jour, annee_scolaire_id, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [classeId, matiereId, enseignantId || null, salleId || null, creneauId, jourLower, annees[0].id, schoolId || null])

    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Séance ajoutée' })
  } catch (error) {
    console.error('Erreur création séance:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.put('/:id', authenticate, checkPermission('emploi_temps', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const { id } = req.params
    const { matiereId, enseignantId, salleId } = req.body

    const updateParams: any[] = [matiereId || null, enseignantId || null, salleId || null, id]
    let updateWhere = 'WHERE id = ?'
    if (schoolId) { updateWhere += ' AND school_id = ?'; updateParams.push(schoolId) }

    await query(`
      UPDATE emploi_temps SET matiere_id = ?, enseignant_id = ?, salle_id = ? ${updateWhere}
    `, updateParams)

    res.json({ success: true, message: 'Séance modifiée' })
  } catch (error) {
    console.error('Erreur modification séance:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.delete('/:id', authenticate, checkPermission('emploi_temps', 'delete'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const { id } = req.params
    const deleteParams: any[] = [id]
    let deleteWhere = 'WHERE id = ?'
    if (schoolId) { deleteWhere += ' AND school_id = ?'; deleteParams.push(schoolId) }

    await query(`DELETE FROM emploi_temps ${deleteWhere}`, deleteParams)
    res.json({ success: true, message: 'Séance supprimée' })
  } catch (error) {
    console.error('Erreur suppression séance:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
