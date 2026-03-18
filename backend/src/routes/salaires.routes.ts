import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// GET /api/salaires
router.get('/', authenticate, checkPermission('salaires', 'read'), async (req: TenantRequest, res: Response) => {
  try {
    const { mois, annee, employe_type, statut, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const schoolId = req.tenant?.id

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (mois) { whereClause += ' AND s.mois = ?'; params.push(mois) }
    if (annee) { whereClause += ' AND s.annee = ?'; params.push(annee) }
    if (employe_type) { whereClause += ' AND s.employe_type = ?'; params.push(employe_type) }
    if (statut) { whereClause += ' AND s.statut = ?'; params.push(statut) }

    if (schoolId) {
      whereClause += ` AND (
        (s.employe_type = 'enseignant' AND s.employe_id IN (SELECT id FROM enseignants WHERE school_id = ?))
        OR
        (s.employe_type = 'personnel' AND s.employe_id IN (SELECT id FROM personnel WHERE school_id = ?))
      )`
      params.push(schoolId, schoolId)
    }

    const countResult = await query<any[]>(`SELECT COUNT(*) as total FROM salaires s ${whereClause}`, params)

    const salaires = await query<any[]>(`
      SELECT s.*,
        CASE 
          WHEN s.employe_type = 'enseignant' THEN (SELECT CONCAT(nom, ' ', prenom) FROM enseignants WHERE id = s.employe_id)
          ELSE (SELECT CONCAT(nom, ' ', prenom) FROM personnel WHERE id = s.employe_id)
        END as employe_nom,
        CASE 
          WHEN s.employe_type = 'enseignant' THEN (SELECT matricule FROM enseignants WHERE id = s.employe_id)
          ELSE (SELECT matricule FROM personnel WHERE id = s.employe_id)
        END as employe_matricule
      FROM salaires s
      ${whereClause}
      ORDER BY s.annee DESC, s.mois DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset])

    const totalResult = await query<any[]>(`SELECT SUM(net_a_payer) as total FROM salaires s ${whereClause}`, params)

    res.json({
      success: true,
      data: salaires,
      totalNetAPayer: totalResult[0].total || 0,
      pagination: { page: Number(page), limit: Number(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / Number(limit)) },
    })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// POST /api/salaires/generer
router.post('/generer', authenticate, checkPermission('salaires', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { mois, annee, employe_type } = req.body
    if (!mois || !annee) return res.status(400).json({ success: false, message: 'Mois et année requis' })

    const schoolId = req.tenant?.id
    const table = employe_type === 'personnel' ? 'personnel' : 'enseignants'
    const schoolFilter = schoolId ? ` AND school_id = ${Number(schoolId)}` : ''
    const employes = await query<any[]>(`SELECT id, salaire_base FROM ${table} WHERE is_active = TRUE AND salaire_base IS NOT NULL${schoolFilter}`)

    let count = 0
    for (const emp of employes) {
      const existing = await query<any[]>(`
        SELECT id FROM salaires WHERE employe_type = ? AND employe_id = ? AND mois = ? AND annee = ?
      `, [employe_type || 'enseignant', emp.id, mois, annee])

      if (existing.length === 0) {
        const salaireBase = emp.salaire_base || 0
        await query(`
          INSERT INTO salaires (employe_type, employe_id, mois, annee, salaire_base, primes, deductions, avance, dette_anterieure, net_a_payer, devise, statut, school_id)
          VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?, 'FC', 'en_attente', ?)
        `, [employe_type || 'enseignant', emp.id, mois, annee, salaireBase, salaireBase, schoolId || null])
        count++
      }
    }

    res.status(201).json({ success: true, message: `${count} salaires générés` })
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

// PUT /api/salaires/:id
router.put('/:id', authenticate, checkPermission('salaires', 'update'), async (req: TenantRequest, res: Response) => {
  try {
    const { primes, deductions, avance, dette_anterieure, observations, statut, date_paiement, mode_paiement } = req.body
    const schoolId = req.tenant?.id
    const sf = schoolId ? ' AND school_id = ?' : ''
    const sfParams = schoolId ? [schoolId] : []

    const salaires = await query<any[]>(`SELECT * FROM salaires WHERE id = ?${sf}`, [req.params.id, ...sfParams])
    if (salaires.length === 0) return res.status(404).json({ success: false, message: 'Salaire non trouvé' })

    const salaire = salaires[0]
    const newPrimes = primes !== undefined ? parseFloat(primes) : salaire.primes
    const newDeductions = deductions !== undefined ? parseFloat(deductions) : salaire.deductions
    const newAvance = avance !== undefined ? parseFloat(avance) : salaire.avance
    const newDette = dette_anterieure !== undefined ? parseFloat(dette_anterieure) : salaire.dette_anterieure
    const netAPayer = parseFloat(salaire.salaire_base) + newPrimes - newDeductions - newAvance - newDette

    await query(`
      UPDATE salaires SET primes = ?, deductions = ?, avance = ?, dette_anterieure = ?, net_a_payer = ?, observations = ?, statut = ?, date_paiement = ?, mode_paiement = ?
      WHERE id = ?${sf}
    `, [newPrimes, newDeductions, newAvance, newDette, netAPayer, observations || salaire.observations, statut || salaire.statut, date_paiement || salaire.date_paiement, mode_paiement || salaire.mode_paiement, req.params.id, ...sfParams])

    if (statut === 'paye' && salaire.statut !== 'paye') {
      await query(`
        INSERT INTO mouvements_caisse (type, montant, devise, libelle, reference_id, reference_type, created_by, school_id)
        VALUES ('sortie', ?, 'FC', ?, ?, 'salaire', ?, ?)
      `, [netAPayer, `Salaire ${salaire.mois}/${salaire.annee}`, req.params.id, req.user!.id, schoolId || null])
    }

    res.json({ success: true, message: 'Salaire modifié' })
  } catch (error) { res.status(500).json({ success: false, message: 'Erreur serveur' }) }
})

export default router
