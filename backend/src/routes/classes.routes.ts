import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// Static routes MUST come before /:id to avoid param capture

// GET /api/classes/niveaux/list
router.get('/niveaux/list', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const niveaux = await query<any[]>(`
      SELECT n.*, c.libelle as cycle FROM niveaux n
      JOIN cycles c ON n.cycle_id = c.id
      ORDER BY c.ordre, n.ordre
    `)
    res.json({ success: true, data: niveaux })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/classes/filieres/list
router.get('/filieres/list', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const filieres = await query<any[]>(`SELECT * FROM filieres ORDER BY libelle`)
    res.json({ success: true, data: filieres })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/classes
router.get('/', authenticate, checkPermission('classes', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { niveau_id, filiere_id, search } = req.query

    let whereClause = 'WHERE a.est_active = TRUE'
    const params: any[] = []

    if (req.tenant?.id) {
      whereClause += ' AND c.school_id = ?'
      params.push(req.tenant.id)
    }

    if (search) {
      whereClause += ' AND (c.libelle LIKE ? OR c.code LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (niveau_id) { whereClause += ' AND c.niveau_id = ?'; params.push(niveau_id) }
    if (filiere_id) { whereClause += ' AND c.filiere_id = ?'; params.push(filiere_id) }

    const classes = await query<any[]>(`
      SELECT c.*, n.libelle as niveau, f.libelle as filiere,
             e.nom as titulaire_nom, e.prenom as titulaire_prenom,
             (SELECT COUNT(*) FROM inscriptions i WHERE i.classe_id = c.id AND i.statut = 'validee') as effectif
      FROM classes c
      JOIN annees_scolaires a ON c.annee_scolaire_id = a.id
      LEFT JOIN niveaux n ON c.niveau_id = n.id
      LEFT JOIN filieres f ON c.filiere_id = f.id
      LEFT JOIN enseignants e ON c.titulaire_id = e.id
      ${whereClause}
      ORDER BY n.ordre, c.code
    `, params)

    res.json({ success: true, data: classes })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/classes/:id
router.get('/:id', authenticate, checkPermission('classes', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const getParams: any[] = [req.params.id]
    let schoolFilter = ''
    if (schoolId) {
      schoolFilter = ' AND c.school_id = ?'
      getParams.push(schoolId)
    }

    const classes = await query<any[]>(`
      SELECT c.*, n.libelle as niveau, f.libelle as filiere,
             e.nom as titulaire_nom, e.prenom as titulaire_prenom, e.id as titulaire_id
      FROM classes c
      LEFT JOIN niveaux n ON c.niveau_id = n.id
      LEFT JOIN filieres f ON c.filiere_id = f.id
      LEFT JOIN enseignants e ON c.titulaire_id = e.id
      WHERE c.id = ?${schoolFilter}
    `, getParams)

    if (classes.length === 0) {
      return res.status(404).json({ success: false, message: 'Classe non trouvée' })
    }

    const matParams: any[] = [req.params.id]
    if (schoolId) matParams.push(schoolId)
    const matieres = await query<any[]>(`
      SELECT m.*, cm.heures_semaine
      FROM matieres m
      JOIN classe_matieres cm ON m.id = cm.matiere_id
      WHERE cm.classe_id = ?${schoolId ? ' AND cm.school_id = ?' : ''}
    `, matParams)

    const eleveParams: any[] = [req.params.id]
    if (schoolId) eleveParams.push(schoolId)
    const eleves = await query<any[]>(`
      SELECT e.*, i.numero as inscription_numero
      FROM eleves e
      JOIN inscriptions i ON e.id = i.eleve_id
      WHERE i.classe_id = ? AND i.statut = 'validee'${schoolId ? ' AND i.school_id = ?' : ''}
      ORDER BY e.nom, e.prenom
    `, eleveParams)

    res.json({ success: true, data: { ...classes[0], matieres, eleves } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/classes
router.post('/', authenticate, checkPermission('classes', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { code, libelle, niveau_id, filiere_id, capacite, titulaire_id, salle } = req.body

    if (!code || !libelle || !niveau_id) {
      return res.status(400).json({ success: false, message: 'Code, libellé et niveau requis' })
    }

    const schoolId = req.tenant?.id
    const sf = schoolId ? ' AND school_id = ?' : ''
    const sfp = schoolId ? [schoolId] : []
    const annees = await query<any[]>(`SELECT id FROM annees_scolaires WHERE est_active = TRUE${sf} LIMIT 1`, sfp)
    if (annees.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune année scolaire active' })
    }

    if (titulaire_id) {
      const titParams: any[] = [titulaire_id, annees[0].id]
      if (schoolId) titParams.push(schoolId)
      const existing = await query<any[]>(`
        SELECT id FROM classes WHERE titulaire_id = ? AND annee_scolaire_id = ?${sf}
      `, titParams)
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Cet enseignant est déjà titulaire d\'une autre classe' })
      }
    }

    const school_id = (req as TenantRequest).tenant?.id || null

    const result = await query<any>(`
      INSERT INTO classes (code, libelle, niveau_id, filiere_id, capacite, titulaire_id, salle, annee_scolaire_id, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [code, libelle, niveau_id, filiere_id || null, capacite || 50, titulaire_id || null, salle || null, annees[0].id, school_id])

    res.status(201).json({ success: true, message: 'Classe créée', data: { id: result.insertId } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/classes/:id
router.put('/:id', authenticate, checkPermission('classes', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const { code, libelle, niveau_id, filiere_id, capacite, titulaire_id, salle } = req.body

    const updates: string[] = []
    const params: any[] = []

    if (code) { updates.push('code = ?'); params.push(code) }
    if (libelle) { updates.push('libelle = ?'); params.push(libelle) }
    if (niveau_id) { updates.push('niveau_id = ?'); params.push(niveau_id) }
    if (filiere_id !== undefined) { updates.push('filiere_id = ?'); params.push(filiere_id || null) }
    if (capacite) { updates.push('capacite = ?'); params.push(capacite) }
    if (titulaire_id !== undefined) { updates.push('titulaire_id = ?'); params.push(titulaire_id || null) }
    if (salle !== undefined) { updates.push('salle = ?'); params.push(salle) }

    if (updates.length > 0) {
      const schoolId = req.tenant?.id
      params.push(id)
      if (schoolId) { params.push(schoolId) }
      await query(`UPDATE classes SET ${updates.join(', ')} WHERE id = ?${schoolId ? ' AND school_id = ?' : ''}`, params)
    }

    res.json({ success: true, message: 'Classe modifiée' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/classes/:id
router.delete('/:id', authenticate, checkPermission('classes', 'delete'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const schoolId = req.tenant?.id

    const existParams: any[] = [id]
    let existFilter = ''
    if (schoolId) {
      existFilter = ' AND school_id = ?'
      existParams.push(schoolId)
    }
    const existing = await query<any[]>(`SELECT id FROM classes WHERE id = ?${existFilter}`, existParams)
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Classe non trouvée' })
    }

    const inscriptions = await query<any[]>(`SELECT COUNT(*) as count FROM inscriptions WHERE classe_id = ? AND statut = 'validee'`, [id])
    if (inscriptions[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Impossible de supprimer: cette classe a des inscriptions validées' })
    }

    const sf = schoolId ? ' AND school_id = ?' : ''
    const cascadeParams = schoolId ? [id, schoolId] : [id]
    await query(`DELETE FROM classe_matieres WHERE classe_id = ?${sf}`, [...cascadeParams]).catch(() => {})
    await query(`DELETE FROM emploi_temps WHERE classe_id = ?${sf}`, [...cascadeParams]).catch(() => {})
    await query(`DELETE FROM notes WHERE classe_id = ?${sf}`, [...cascadeParams]).catch(() => {})
    await query(`DELETE FROM bulletins WHERE classe_id = ?${sf}`, [...cascadeParams]).catch(() => {})
    await query(`DELETE FROM deliberations WHERE classe_id = ?${sf}`, [...cascadeParams]).catch(() => {})
    await query(`UPDATE inscriptions SET classe_id = NULL WHERE classe_id = ?${sf}`, [...cascadeParams]).catch(() => {})
    const deleteParams: any[] = [id]
    if (schoolId) { deleteParams.push(schoolId) }
    await query(`DELETE FROM classes WHERE id = ?${schoolId ? ' AND school_id = ?' : ''}`, deleteParams)

    res.json({ success: true, message: 'Classe supprimée' })
  } catch (error) {
    console.error('Erreur suppression classe:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
