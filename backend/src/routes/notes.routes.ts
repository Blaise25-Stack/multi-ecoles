import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// GET /api/notes - Notes par classe/matière/période
router.get('/', authenticate, checkPermission('notes', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { classe_id, matiere_id, periode_id, eleve_id } = req.query

    let whereClause = 'WHERE a.est_active = TRUE'
    const params: any[] = []

    if (req.tenant?.id) { whereClause += ' AND n.school_id = ?'; params.push(req.tenant.id) }
    if (classe_id) { whereClause += ' AND n.classe_id = ?'; params.push(classe_id) }
    if (matiere_id) { whereClause += ' AND n.matiere_id = ?'; params.push(matiere_id) }
    if (periode_id) { whereClause += ' AND n.periode_id = ?'; params.push(periode_id) }
    if (eleve_id) { whereClause += ' AND n.eleve_id = ?'; params.push(eleve_id) }

    const notes = await query<any[]>(`
      SELECT n.*, e.nom, e.prenom, e.matricule, m.libelle as matiere,
             m.coefficient, p.libelle as periode, te.libelle as type_evaluation,
             c.libelle as classe
      FROM notes n
      JOIN eleves e ON n.eleve_id = e.id
      JOIN matieres m ON n.matiere_id = m.id
      JOIN periodes p ON n.periode_id = p.id
      JOIN types_evaluations te ON n.type_evaluation_id = te.id
      JOIN classes c ON n.classe_id = c.id
      JOIN annees_scolaires a ON p.annee_scolaire_id = a.id
      ${whereClause}
      ORDER BY e.nom, e.prenom, m.libelle, n.date_evaluation
    `, params)

    res.json({ success: true, data: notes })
  } catch (error) {
    console.error('Erreur notes:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/notes - Enregistrer des notes
router.post('/', authenticate, checkPermission('notes', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { notes } = req.body
    const school_id = req.tenant?.id || null

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ success: false, message: 'Notes requises' })
    }

    for (const n of notes) {
      if (!n.eleve_id || !n.matiere_id || !n.classe_id || !n.periode_id || !n.type_evaluation_id || n.note === undefined) {
        continue
      }

      const existParams: any[] = [n.eleve_id, n.matiere_id, n.periode_id, n.type_evaluation_id]
      const existSchoolFilter = school_id ? ' AND school_id = ?' : ''
      if (school_id) existParams.push(school_id)
      const existing = await query<any[]>(`
        SELECT id FROM notes WHERE eleve_id = ? AND matiere_id = ? AND periode_id = ? AND type_evaluation_id = ?${existSchoolFilter}
      `, existParams)

      if (existing.length > 0) {
        const updateNoteParams: any[] = [n.note, n.note_max || 20, n.date_evaluation || new Date(), n.commentaire || null, existing[0].id]
        if (school_id) updateNoteParams.push(school_id)
        await query(`UPDATE notes SET note = ?, note_max = ?, date_evaluation = ?, commentaire = ? WHERE id = ?${school_id ? ' AND school_id = ?' : ''}`,
          updateNoteParams)
      } else {
        await query(`
          INSERT INTO notes (eleve_id, matiere_id, classe_id, periode_id, type_evaluation_id, note, note_max, date_evaluation, commentaire, enseignant_id, school_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [n.eleve_id, n.matiere_id, n.classe_id, n.periode_id, n.type_evaluation_id, n.note, n.note_max || 20, n.date_evaluation || new Date(), n.commentaire || null, req.user!.id, school_id])
      }
    }

    res.status(201).json({ success: true, message: 'Notes enregistrées' })
  } catch (error) {
    console.error('Erreur sauvegarde notes:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/notes/bulletin/:eleve_id/:periode_id - Bulletin d'un élève
router.get('/bulletin/:eleve_id/:periode_id', authenticate, checkPermission('notes', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { eleve_id, periode_id } = req.params

    const schoolId = req.tenant?.id
    const schoolFilter = schoolId ? ' AND e.school_id = ?' : ''

    // Infos élève
    const eleveParams: any[] = [eleve_id]
    if (schoolId) eleveParams.push(schoolId)
    const eleves = await query<any[]>(`
      SELECT e.*, c.libelle as classe, n.libelle as niveau, i.numero as inscription_numero
      FROM eleves e
      JOIN inscriptions i ON e.id = i.eleve_id
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id AND a.est_active = TRUE
      JOIN classes c ON i.classe_id = c.id
      JOIN niveaux n ON c.niveau_id = n.id
      WHERE e.id = ?${schoolFilter}
    `, eleveParams)

    if (eleves.length === 0) {
      return res.status(404).json({ success: false, message: 'Élève non trouvé' })
    }

    // Notes par matière
    const noteSchoolFilter = schoolId ? ' AND n.school_id = ?' : ''
    const noteParams: any[] = [eleve_id, periode_id]
    if (schoolId) noteParams.push(schoolId)
    noteParams.push(eleve_id)
    const notes = await query<any[]>(`
      SELECT m.id as matiere_id, m.libelle as matiere, m.coefficient,
             AVG(n.note) as moyenne, COUNT(n.id) as nb_evaluations
      FROM matieres m
      LEFT JOIN notes n ON m.id = n.matiere_id AND n.eleve_id = ? AND n.periode_id = ?${noteSchoolFilter}
      JOIN classe_matieres cm ON m.id = cm.matiere_id
      JOIN inscriptions i ON cm.classe_id = i.classe_id AND i.eleve_id = ?
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id AND a.est_active = TRUE
      GROUP BY m.id, m.libelle, m.coefficient
      ORDER BY m.libelle
    `, noteParams)

    // Calculer moyenne générale
    let totalCoef = 0, totalPoints = 0
    for (const n of notes) {
      if (n.moyenne !== null) {
        totalCoef += n.coefficient
        totalPoints += n.moyenne * n.coefficient
      }
    }
    const moyenneGenerale = totalCoef > 0 ? totalPoints / totalCoef : 0

    res.json({
      success: true,
      data: {
        eleve: eleves[0],
        notes,
        moyenneGenerale: Math.round(moyenneGenerale * 100) / 100,
      },
    })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// POST /api/notes/deliberation - Valider la délibération
router.post('/deliberation', authenticate, checkPermission('notes', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { classe_id, periode_id, seuil_admis, seuil_exclusion, decisions } = req.body

    if (!classe_id || !periode_id || !decisions || !Array.isArray(decisions)) {
      return res.status(400).json({ success: false, message: 'classe_id, periode_id et decisions requis' })
    }

    const schoolId = req.tenant?.id
    const delibSchoolFilter = schoolId ? ' AND school_id = ?' : ''
    const delibParams: any[] = [classe_id, periode_id]
    if (schoolId) delibParams.push(schoolId)

    const existing = await query<any[]>(`
      SELECT id FROM deliberations WHERE classe_id = ? AND periode_id = ?${delibSchoolFilter}
    `, delibParams)

    let deliberationId: number
    if (existing.length > 0) {
      deliberationId = existing[0].id
      const updateDelibParams: any[] = [deliberationId]
      if (schoolId) updateDelibParams.push(schoolId)
      await query(`UPDATE deliberations SET statut = 'validee', date_deliberation = NOW() WHERE id = ?${delibSchoolFilter}`, updateDelibParams)
      await query(`DELETE FROM resultats_deliberation WHERE deliberation_id = ?`, [deliberationId])
    } else {
      const school_id = schoolId || null
      const result = await query<any>(`
        INSERT INTO deliberations (classe_id, periode_id, statut, created_by, school_id)
        VALUES (?, ?, 'validee', ?, ?)
      `, [classe_id, periode_id, req.user!.id, school_id])
      deliberationId = result.insertId
    }

    const decisionMap: Record<string, string> = {
      'Admis': 'admis',
      'Redouble': 'ajourne',
      'Exclu': 'exclu',
    }

    for (const d of decisions) {
      if (!d.eleve_id || !d.decision) continue
      const dbDecision = decisionMap[d.decision] || 'ajourne'
      const mention = d.decision === 'Admis'
        ? (d.moyenne >= 16 ? 'Très Bien' : d.moyenne >= 14 ? 'Bien' : d.moyenne >= 12 ? 'Assez Bien' : 'Passable')
        : null

      await query(`
        INSERT INTO resultats_deliberation (deliberation_id, eleve_id, moyenne, decision, mention, observations)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [deliberationId, d.eleve_id, d.moyenne || null, dbDecision, mention, null])
    }

    res.json({ success: true, message: 'Délibération validée avec succès' })
  } catch (error) {
    console.error('Erreur délibération:', error)
    res.status(500).json({ success: false, message: 'Erreur lors de la délibération' })
  }
})

// GET /api/notes/bulletins/generate - Générer les bulletins d'une classe entière (JSON)
router.get('/bulletins/generate', authenticate, checkPermission('notes', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { classe_id, periode_id } = req.query
    if (!classe_id || !periode_id) {
      return res.status(400).json({ success: false, message: 'classe_id et periode_id requis' })
    }

    const inscrits = await query<any[]>(`
      SELECT e.id, e.nom, e.prenom, e.postnom, e.matricule, e.sexe,
             c.libelle as classe, n2.libelle as niveau
      FROM eleves e
      JOIN inscriptions i ON e.id = i.eleve_id
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id AND a.est_active = TRUE
      JOIN classes c ON i.classe_id = c.id
      JOIN niveaux n2 ON c.niveau_id = n2.id
      WHERE i.classe_id = ? AND i.statut = 'validee'
      ${req.tenant?.id ? 'AND e.school_id = ?' : ''}
      ORDER BY e.nom, e.prenom
    `, req.tenant?.id ? [classe_id, req.tenant.id] : [classe_id])

    const bulletins = []
    for (const eleve of inscrits) {
      const notes = await query<any[]>(`
        SELECT m.id as matiere_id, m.libelle as matiere, m.coefficient,
               AVG(n.note) as moyenne, COUNT(n.id) as nb_evaluations
        FROM matieres m
        LEFT JOIN notes n ON m.id = n.matiere_id AND n.eleve_id = ? AND n.periode_id = ?
        JOIN classe_matieres cm ON m.id = cm.matiere_id AND cm.classe_id = ?
        GROUP BY m.id, m.libelle, m.coefficient
        ORDER BY m.libelle
      `, [eleve.id, periode_id, classe_id])

      let totalCoef = 0, totalPoints = 0
      for (const n of notes) {
        if (n.moyenne !== null) {
          const coef = parseFloat(String(n.coefficient)) || 1
          const moy = parseFloat(String(n.moyenne)) || 0
          totalCoef += coef
          totalPoints += moy * coef
        }
      }
      const moyenneGenerale = totalCoef > 0 ? Math.round((totalPoints / totalCoef) * 100) / 100 : 0

      bulletins.push({ eleve, notes, moyenneGenerale })
    }

    bulletins.sort((a, b) => b.moyenneGenerale - a.moyenneGenerale)
    bulletins.forEach((b, i) => {
      (b as any).rang = i + 1;
      (b as any).totalEleves = bulletins.length
    })

    const classeInfoParams: any[] = [classe_id]
    if (req.tenant?.id) classeInfoParams.push(req.tenant.id)
    const classeInfo = await query<any[]>(`SELECT libelle FROM classes WHERE id = ?${req.tenant?.id ? ' AND school_id = ?' : ''}`, classeInfoParams)

    res.json({
      success: true,
      data: {
        classe: classeInfo[0]?.libelle || '',
        bulletins,
      },
    })
  } catch (error) {
    console.error('Erreur génération bulletins:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/notes/periodes/list
router.get('/periodes/list', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const periodes = await query<any[]>(`
      SELECT p.* FROM periodes p
      JOIN annees_scolaires a ON p.annee_scolaire_id = a.id AND a.est_active = TRUE
      ORDER BY p.ordre
    `)
    res.json({ success: true, data: periodes })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// GET /api/notes/types-evaluations/list
router.get('/types-evaluations/list', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const types = await query<any[]>(`SELECT * FROM types_evaluations ORDER BY libelle`)
    res.json({ success: true, data: types })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

export default router



