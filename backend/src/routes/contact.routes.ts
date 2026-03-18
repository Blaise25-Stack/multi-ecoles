import { Router, Request, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// POST /api/contact - Envoyer un message (public)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nom, email, telephone, sujet, message } = req.body

    if (!nom || !message) {
      return res.status(400).json({ success: false, message: 'Nom et message requis' })
    }

    const result = await query<any>(`
      INSERT INTO messages_contact (nom, email, telephone, sujet, message)
      VALUES (?, ?, ?, ?, ?)
    `, [nom, email || null, telephone || null, sujet || 'Message depuis le site vitrine', message])

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data: { id: result.insertId },
    })
  } catch (error) {
    console.error('Erreur envoi message contact:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/contact - Liste des messages (admin)
router.get('/', authenticate, authorize('super_admin', 'admin'), async (req: TenantRequest, res: Response) => {
  try {
    const { lu, page = 1, per_page = 50 } = req.query
    const offset = (Number(page) - 1) * Number(per_page)

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (lu !== undefined) {
      whereClause += ` AND mc.lu = ?`
      params.push(lu === 'true' ? 1 : 0)
    }

    const countResult = await query<any[]>(`SELECT COUNT(*) as total FROM messages_contact mc ${whereClause}`, params)
    const total = countResult[0]?.total || 0

    const messages = await query<any[]>(`
      SELECT mc.*, u.nom as repondu_par_nom, u.prenom as repondu_par_prenom
      FROM messages_contact mc
      LEFT JOIN utilisateurs u ON mc.repondu_par = u.id
      ${whereClause}
      ORDER BY mc.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(per_page), offset])

    res.json({
      success: true,
      data: messages,
      meta: { page: Number(page), perPage: Number(per_page), total, totalPages: Math.ceil(total / Number(per_page)) },
    })
  } catch (error) {
    console.error('Erreur liste messages:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/contact/:id/lu - Marquer comme lu
router.put('/:id/lu', authenticate, authorize('super_admin', 'admin'), async (req: TenantRequest, res: Response) => {
  try {
    await query(`UPDATE messages_contact SET lu = TRUE WHERE id = ?`, [req.params.id])
    res.json({ success: true, message: 'Message marqué comme lu' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/contact/:id - Supprimer un message
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), async (req: TenantRequest, res: Response) => {
  try {
    await query(`DELETE FROM messages_contact WHERE id = ?`, [req.params.id])
    res.json({ success: true, message: 'Message supprimé' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
