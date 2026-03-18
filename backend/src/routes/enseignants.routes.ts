import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const storage = multer.diskStorage({
  destination: 'uploads/enseignants/',
  filename: (req, file, cb) => cb(null, `ens-${uuidv4()}${path.extname(file.originalname)}`),
})
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } })

const generateMatricule = async (schoolId?: number): Promise<string> => {
  const year = new Date().getFullYear().toString().slice(-2)
  const params: any[] = [`ENS${year}%`]
  let sql = `SELECT COUNT(*) as count FROM enseignants WHERE matricule LIKE ?`
  if (schoolId) {
    sql += ` AND school_id = ?`
    params.push(schoolId)
  }
  const result = await query<any[]>(sql, params)
  return `ENS${year}${(result[0].count + 1).toString().padStart(4, '0')}`
}

// GET /api/enseignants
router.get('/', authenticate, checkPermission('enseignants', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { search, is_active, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    // Multi-tenant filter
    if (req.tenant?.id) {
      whereClause += ' AND e.school_id = ?'
      params.push(req.tenant.id)
    }

    if (search) {
      whereClause += ` AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (is_active !== undefined) {
      whereClause += ` AND e.is_active = ?`
      params.push(is_active === 'true')
    }

    const countResult = await query<any[]>(`SELECT COUNT(*) as total FROM enseignants e ${whereClause}`, params)

    const enseignants = await query<any[]>(`
      SELECT e.*, c.libelle as classe_titulaire
      FROM enseignants e
      LEFT JOIN classes c ON c.titulaire_id = e.id
      LEFT JOIN annees_scolaires a ON c.annee_scolaire_id = a.id AND a.est_active = TRUE
      ${whereClause}
      ORDER BY e.nom, e.prenom
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset])

    res.json({
      success: true,
      data: enseignants,
      pagination: { page: Number(page), limit: Number(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / Number(limit)) },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/enseignants/:id
router.get('/:id', authenticate, checkPermission('enseignants', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const getParams: any[] = [req.params.id]
    let schoolFilter = ''
    if (schoolId) {
      schoolFilter = ' AND school_id = ?'
      getParams.push(schoolId)
    }

    const enseignants = await query<any[]>(`SELECT * FROM enseignants WHERE id = ?${schoolFilter}`, getParams)
    if (enseignants.length === 0) {
      return res.status(404).json({ success: false, message: 'Enseignant non trouvé' })
    }

    // Récupérer les affectations
    const affectations = await query<any[]>(`
      SELECT ea.*, c.libelle as classe, m.libelle as matiere
      FROM enseignant_affectations ea
      JOIN classes c ON ea.classe_id = c.id
      JOIN matieres m ON ea.matiere_id = m.id
      JOIN annees_scolaires a ON ea.annee_scolaire_id = a.id AND a.est_active = TRUE
      WHERE ea.enseignant_id = ?
    `, [req.params.id])

    res.json({ success: true, data: { ...enseignants[0], affectations } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/enseignants
router.post('/', authenticate, checkPermission('enseignants', 'create'), upload.single('photo'), async (req: TenantRequest, res: Response) => {
  try {
    const { nom, postnom, prenom, sexe, date_naissance, lieu_naissance, nationalite, adresse, telephone, email, specialite, diplome, date_embauche, type_contrat, salaire_base } = req.body

    if (!nom || !prenom || !sexe) {
      return res.status(400).json({ success: false, message: 'Nom, prénom et sexe requis' })
    }

    const school_id = (req as TenantRequest).tenant?.id || null
    const matricule = await generateMatricule(school_id ?? undefined)
    const photo = req.file ? `/uploads/enseignants/${req.file.filename}` : null

    const result = await query<any>(`
      INSERT INTO enseignants (matricule, nom, postnom, prenom, sexe, date_naissance, lieu_naissance, nationalite, adresse, telephone, email, photo, specialite, diplome, date_embauche, type_contrat, salaire_base, is_active, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)
    `, [matricule, nom, postnom || null, prenom, sexe, date_naissance || null, lieu_naissance || null, nationalite || 'Congolaise', adresse || null, telephone || null, email || null, photo, specialite || null, diplome || null, date_embauche || null, type_contrat || 'CDI', salaire_base || null, school_id])

    res.status(201).json({ success: true, message: 'Enseignant créé', data: { id: result.insertId, matricule } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/enseignants/:id
router.put('/:id', authenticate, checkPermission('enseignants', 'update'), upload.single('photo'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const allowedFields = ['nom', 'postnom', 'prenom', 'sexe', 'date_naissance', 'lieu_naissance', 'nationalite', 'adresse', 'telephone', 'email', 'specialite', 'diplome', 'date_embauche', 'type_contrat', 'salaire_base', 'is_active']
    
    const updates: string[] = []
    const params: any[] = []

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`)
        params.push(req.body[field])
      }
    }

    if (req.file) {
      updates.push('photo = ?')
      params.push(`/uploads/enseignants/${req.file.filename}`)
    }

    if (updates.length > 0) {
      const schoolId = req.tenant?.id
      params.push(id)
      if (schoolId) { params.push(schoolId) }
      await query(`UPDATE enseignants SET ${updates.join(', ')} WHERE id = ?${schoolId ? ' AND school_id = ?' : ''}`, params)
    }

    res.json({ success: true, message: 'Enseignant modifié' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/enseignants/:id
router.delete('/:id', authenticate, checkPermission('enseignants', 'delete'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const deleteParams: any[] = [req.params.id]
    if (schoolId) { deleteParams.push(schoolId) }
    await query(`DELETE FROM enseignants WHERE id = ?${schoolId ? ' AND school_id = ?' : ''}`, deleteParams)
    res.json({ success: true, message: 'Enseignant supprimé' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router



