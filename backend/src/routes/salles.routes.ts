import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

router.get('/', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (req.tenant?.id) { whereClause += ' AND school_id = ?'; params.push(req.tenant.id) }

    const salles = await query<any[]>(`
      SELECT id, code, libelle, capacite, equipements FROM salles ${whereClause} ORDER BY libelle
    `, params)

    res.json({ success: true, data: salles })
  } catch (error) {
    console.error('Erreur salles:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.post('/', authenticate, checkPermission('parametres', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { code, libelle, capacite, equipements } = req.body
    if (!libelle) {
      return res.status(400).json({ success: false, message: 'Le libellé est requis' })
    }

    const salleCode = code || `SALLE-${Date.now()}`

    const result = await query<any>(`
      INSERT INTO salles (code, libelle, capacite, equipements, school_id)
      VALUES (?, ?, ?, ?, ?)
    `, [salleCode, libelle, capacite || 50, equipements || null, req.tenant?.id || null])

    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Salle créée' })
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Cette salle existe déjà' })
    }
    console.error('Erreur création salle:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.delete('/:id', authenticate, checkPermission('parametres', 'delete'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const schoolId = req.tenant?.id
    const sf = schoolId ? ' AND school_id = ?' : ''
    const sfParams = schoolId ? [schoolId] : []
    await query(`DELETE FROM salles WHERE id = ?${sf}`, [id, ...sfParams])
    res.json({ success: true, message: 'Salle supprimée' })
  } catch (error) {
    console.error('Erreur suppression salle:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
