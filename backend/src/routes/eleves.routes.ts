import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const uploadDir = path.join(__dirname, '../../uploads/eleves')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `eleve-${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  },
})

// Générer un matricule unique
const generateMatricule = async (schoolId?: number): Promise<string> => {
  const year = new Date().getFullYear().toString().slice(-2)
  const params: any[] = [`ELV${year}%`]
  let sql = `SELECT COUNT(*) as count FROM eleves WHERE matricule LIKE ?`
  if (schoolId) {
    sql += ` AND school_id = ?`
    params.push(schoolId)
  }
  const result = await query<any[]>(sql, params)
  const count = result[0].count + 1
  return `ELV${year}${count.toString().padStart(4, '0')}`
}

// GET /api/eleves - Liste des élèves
router.get('/', authenticate, checkPermission('eleves', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { search, classe_id, niveau_id, is_active, page = 1, limit = 20 } = req.query
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
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (classe_id) {
      whereClause += ` AND i.classe_id = ?`
      params.push(classe_id)
    }

    if (niveau_id) {
      whereClause += ` AND c.niveau_id = ?`
      params.push(niveau_id)
    }

    if (is_active !== undefined) {
      whereClause += ` AND e.is_active = ?`
      params.push(is_active === 'true')
    }

    const countResult = await query<any[]>(`
      SELECT COUNT(DISTINCT e.id) as total
      FROM eleves e
      LEFT JOIN inscriptions i ON e.id = i.eleve_id
        AND i.annee_scolaire_id IN (SELECT id FROM annees_scolaires WHERE est_active = TRUE)
        AND i.statut = 'validee'
      LEFT JOIN classes c ON i.classe_id = c.id
      ${whereClause}
    `, params)

    const total = countResult[0].total

    const eleves = await query<any[]>(`
      SELECT e.*, c.libelle as classe, n.libelle as niveau, i.numero as inscription_numero
      FROM eleves e
      LEFT JOIN inscriptions i ON e.id = i.eleve_id
        AND i.annee_scolaire_id IN (SELECT id FROM annees_scolaires WHERE est_active = TRUE)
        AND i.statut = 'validee'
      LEFT JOIN classes c ON i.classe_id = c.id
      LEFT JOIN niveaux n ON c.niveau_id = n.id
      ${whereClause}
      ORDER BY e.nom, e.prenom
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset])

    res.json({
      success: true,
      data: eleves,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    console.error('Erreur liste élèves:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/eleves/:id - Détails d'un élève
router.get('/:id', authenticate, checkPermission('eleves', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params

    const schoolId = req.tenant?.id
    const getParams: any[] = [id]
    let schoolFilter = ''
    if (schoolId) {
      schoolFilter = ' AND e.school_id = ?'
      getParams.push(schoolId)
    }

    const eleves = await query<any[]>(`
      SELECT e.*, c.libelle as classe, c.id as classe_id, 
             n.libelle as niveau, n.id as niveau_id,
             i.numero as inscription_numero, i.id as inscription_id,
             i.type_inscription, i.date_inscription, i.statut as inscription_statut
      FROM eleves e
      LEFT JOIN inscriptions i ON e.id = i.eleve_id
        AND i.annee_scolaire_id IN (SELECT id FROM annees_scolaires WHERE est_active = TRUE)
        AND i.statut = 'validee'
      LEFT JOIN classes c ON i.classe_id = c.id
      LEFT JOIN niveaux n ON c.niveau_id = n.id
      WHERE e.id = ?${schoolFilter}
    `, getParams)

    if (eleves.length === 0) {
      return res.status(404).json({ success: false, message: 'Élève non trouvé' })
    }

    res.json({ success: true, data: eleves[0] })
  } catch (error) {
    console.error('Erreur détails élève:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/eleves - Créer un élève
router.post('/', authenticate, checkPermission('eleves', 'create'), upload.single('photo'), async (req: TenantRequest, res: Response) => {
  try {
    const {
      nom, postnom, prenom, sexe, date_naissance, lieu_naissance,
      nationalite, adresse, telephone, email,
      nom_pere, telephone_pere, profession_pere,
      nom_mere, telephone_mere, profession_mere,
      nom_tuteur, telephone_tuteur, adresse_tuteur,
    } = req.body

    if (!nom || !prenom || !sexe || !date_naissance) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prénom, sexe et date de naissance requis',
      })
    }

    const school_id = (req as TenantRequest).tenant?.id || null
    const matricule = await generateMatricule(school_id ?? undefined)
    const photo = req.file ? `/uploads/eleves/${req.file.filename}` : null

    const result = await query<any>(`
      INSERT INTO eleves (
        matricule, nom, postnom, prenom, sexe, date_naissance, lieu_naissance,
        nationalite, adresse, telephone, email, photo,
        nom_pere, telephone_pere, profession_pere,
        nom_mere, telephone_mere, profession_mere,
        nom_tuteur, telephone_tuteur, adresse_tuteur,
        is_active, school_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)
    `, [
      matricule, nom, postnom || null, prenom, sexe, date_naissance, lieu_naissance || null,
      nationalite || 'Congolaise', adresse || null, telephone || null, email || null, photo,
      nom_pere || null, telephone_pere || null, profession_pere || null,
      nom_mere || null, telephone_mere || null, profession_mere || null,
      nom_tuteur || null, telephone_tuteur || null, adresse_tuteur || null,
      school_id
    ])

    res.status(201).json({
      success: true,
      message: 'Élève créé avec succès',
      data: { id: result.insertId, matricule },
    })
  } catch (error) {
    console.error('Erreur création élève:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/eleves/:id - Modifier un élève
router.put('/:id', authenticate, checkPermission('eleves', 'update'), upload.single('photo'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    const schoolId = req.tenant?.id

    // Vérifier que l'élève existe
    const existParams: any[] = [id]
    let existFilter = ''
    if (schoolId) {
      existFilter = ' AND school_id = ?'
      existParams.push(schoolId)
    }
    const existing = await query<any[]>(`SELECT id FROM eleves WHERE id = ?${existFilter}`, existParams)
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Élève non trouvé' })
    }

    // Construire la requête de mise à jour
    const allowedFields = [
      'nom', 'postnom', 'prenom', 'sexe', 'date_naissance', 'lieu_naissance',
      'nationalite', 'adresse', 'telephone', 'email',
      'nom_pere', 'telephone_pere', 'profession_pere',
      'nom_mere', 'telephone_mere', 'profession_mere',
      'nom_tuteur', 'telephone_tuteur', 'adresse_tuteur',
      'groupe_sanguin', 'allergies', 'is_active'
    ]

    const updateParts: string[] = []
    const params: any[] = []

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateParts.push(`${field} = ?`)
        params.push(updates[field])
      }
    }

    if (req.file) {
      updateParts.push('photo = ?')
      params.push(`/uploads/eleves/${req.file.filename}`)
    }

    if (updateParts.length > 0) {
      params.push(id)
      if (schoolId) {
        params.push(schoolId)
      }
      await query(`UPDATE eleves SET ${updateParts.join(', ')} WHERE id = ?${schoolId ? ' AND school_id = ?' : ''}`, params)
    }

    res.json({ success: true, message: 'Élève modifié avec succès' })
  } catch (error) {
    console.error('Erreur modification élève:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/eleves/:id - Supprimer un élève
router.delete('/:id', authenticate, checkPermission('eleves', 'delete'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const schoolId = req.tenant?.id

    const existParams: any[] = [id]
    let existFilter = ''
    if (schoolId) {
      existFilter = ' AND school_id = ?'
      existParams.push(schoolId)
    }
    const existing = await query<any[]>(`SELECT id FROM eleves WHERE id = ?${existFilter}`, existParams)
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Élève non trouvé' })
    }

    const safeDelete = async (sql: string, params: any[]) => {
      try { await query(sql, params) } catch (_) { /* table may not exist */ }
    }

    await safeDelete(`DELETE FROM notes WHERE eleve_id = ?`, [id])
    await safeDelete(`DELETE FROM resultats_deliberation WHERE eleve_id = ?`, [id])
    await safeDelete(`DELETE FROM bulletins WHERE eleve_id = ?`, [id])
    await safeDelete(`DELETE FROM attestations WHERE eleve_id = ?`, [id])
    await safeDelete(`DELETE FROM paiements WHERE eleve_id = ?`, [id])
    await safeDelete(`UPDATE inscriptions SET eleve_id = NULL WHERE eleve_id = ?`, [id])
    const deleteParams: any[] = [id]
    if (schoolId) { deleteParams.push(schoolId) }
    await query(`DELETE FROM eleves WHERE id = ?${schoolId ? ' AND school_id = ?' : ''}`, deleteParams)

    res.json({ success: true, message: 'Élève supprimé avec succès' })
  } catch (error) {
    console.error('Erreur suppression élève:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router



