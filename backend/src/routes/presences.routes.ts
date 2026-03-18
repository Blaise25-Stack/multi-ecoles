import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// GET /api/rh/presences
router.get('/', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const { employe_id, employe_type, date, date_debut, date_fin, statut, page = 1, per_page = 20 } = req.query
    const offset = (Number(page) - 1) * Number(per_page)

    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    const schoolId = req.tenant?.id
    if (schoolId) { whereClause += ' AND p.school_id = ?'; params.push(schoolId) }

    if (employe_id) { whereClause += ' AND p.employe_id = ?'; params.push(employe_id) }
    if (employe_type) { whereClause += ' AND p.employe_type = ?'; params.push(employe_type) }
    if (date) { whereClause += ' AND p.date_presence = ?'; params.push(date) }
    if (date_debut) { whereClause += ' AND p.date_presence >= ?'; params.push(date_debut) }
    if (date_fin) { whereClause += ' AND p.date_presence <= ?'; params.push(date_fin) }
    if (statut) { whereClause += ' AND p.statut = ?'; params.push(statut) }

    const countResult = await query<any[]>(`SELECT COUNT(*) as total FROM presences p ${whereClause}`, params)
    const total = countResult[0]?.total || 0

    const presences = await query<any[]>(`
      SELECT p.*
      FROM presences p
      ${whereClause}
      ORDER BY p.date_presence DESC, p.heure_arrivee DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(per_page), offset])

    res.json({
      success: true,
      data: presences,
      meta: { page: Number(page), perPage: Number(per_page), total, totalPages: Math.ceil(total / Number(per_page)) },
    })
  } catch (error) {
    console.error('Erreur liste présences:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/rh/presences
router.post('/', authenticate, checkPermission('presences', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { employe_id, employe_type, date, heure_arrivee, heure_depart, statut, observations } = req.body

    if (!employe_id || !employe_type || !date || !statut) {
      return res.status(400).json({ success: false, message: 'Employé, type, date et statut requis' })
    }

    const schoolId = req.tenant?.id
    const result = await query<any>(`
      INSERT INTO presences (employe_id, employe_type, date_presence, heure_arrivee, heure_depart, statut, observations, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [employe_id, employe_type, date, heure_arrivee || null, heure_depart || null, statut, observations || null, schoolId || null])

    res.status(201).json({ success: true, message: 'Présence enregistrée', data: { id: result.insertId } })
  } catch (error) {
    console.error('Erreur enregistrement présence:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/rh/presences/pointer
router.post('/pointer', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const { employe_id, employe_type, type } = req.body
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toTimeString().split(' ')[0]

    const schoolId = req.tenant?.id
    const sf = schoolId ? ' AND school_id = ?' : ''
    const sfp = schoolId ? [schoolId] : []
    const existing = await query<any[]>(
      `SELECT id FROM presences WHERE employe_id = ? AND employe_type = ? AND date_presence = ?${sf}`,
      [employe_id, employe_type, today, ...sfp]
    )

    if (type === 'arrivee') {
      if (existing.length > 0) {
        await query('UPDATE presences SET heure_arrivee = ?, statut = ? WHERE id = ?', [now, 'present', existing[0].id])
      } else {
        await query(
          'INSERT INTO presences (employe_id, employe_type, date_presence, heure_arrivee, statut, school_id) VALUES (?, ?, ?, ?, ?, ?)',
          [employe_id, employe_type, today, now, 'present', schoolId || null]
        )
      }
    } else {
      if (existing.length > 0) {
        await query('UPDATE presences SET heure_depart = ? WHERE id = ?', [now, existing[0].id])
      }
    }

    res.json({ success: true, message: `Pointage ${type} enregistré` })
  } catch (error) {
    console.error('Erreur pointage:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/rh/presences/rapport
router.get('/rapport', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const { date_debut, date_fin, employe_type } = req.query

    if (!date_debut || !date_fin) {
      return res.status(400).json({ success: false, message: 'Dates requises' })
    }

    let typeFilter = ''
    const params: any[] = [date_debut, date_fin]
    const schoolId = req.tenant?.id
    if (schoolId) { typeFilter += ' AND p.school_id = ?'; params.push(schoolId) }
    if (employe_type) {
      typeFilter += ' AND p.employe_type = ?'
      params.push(employe_type)
    }

    const rapport = await query<any[]>(`
      SELECT 
        p.employe_id,
        p.employe_type,
        SUM(CASE WHEN p.statut = 'present' THEN 1 ELSE 0 END) as presences,
        SUM(CASE WHEN p.statut = 'absent' THEN 1 ELSE 0 END) as absences,
        SUM(CASE WHEN p.statut = 'retard' THEN 1 ELSE 0 END) as retards,
        COUNT(*) as total_jours
      FROM presences p
      WHERE p.date_presence BETWEEN ? AND ? ${typeFilter}
      GROUP BY p.employe_id, p.employe_type
    `, params)

    const totalJours = rapport.length > 0 ? rapport[0].total_jours : 0
    const totalPresences = rapport.reduce((s, r) => s + r.presences, 0)
    const totalAbsences = rapport.reduce((s, r) => s + r.absences, 0)
    const totalRetards = rapport.reduce((s, r) => s + r.retards, 0)

    res.json({
      success: true,
      data: {
        totalJours,
        presences: totalPresences,
        absences: totalAbsences,
        retards: totalRetards,
        tauxPresence: totalJours > 0 ? Math.round((totalPresences / (totalPresences + totalAbsences)) * 100) : 0,
        detailParEmploye: rapport,
      },
    })
  } catch (error) {
    console.error('Erreur rapport présences:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
