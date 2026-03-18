/**
 * ============================================
 * Schools Routes - API Multi-Tenant SGS
 * ============================================
 * Gestion des écoles (CRUD) - SuperAdmin uniquement
 */

import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { tenantMiddleware, TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// ============================================
// GET /api/schools - Liste toutes les écoles
// SuperAdmin only
// ============================================
router.get('/',
  authenticate,
  authorize('super_admin'),
  async (req: TenantRequest, res: Response) => {
    try {
      const schools = await query<any[]>(`
        SELECT 
          s.*,
          (SELECT COUNT(*) FROM utilisateurs u WHERE u.school_id = s.id) AS users_count,
          (SELECT COUNT(*) FROM eleves e WHERE e.school_id = s.id) AS students_count
        FROM schools s
        ORDER BY s.name ASC
      `)

      res.json({
        success: true,
        data: schools.map(s => ({
          id: s.id,
          code: s.code,
          name: s.name,
          currency: s.currency,
          whatsappNumber: s.whatsapp_number,
          isActive: s.is_active,
          usersCount: s.users_count,
          studentsCount: s.students_count,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        })),
      })
    } catch (error) {
      console.error('Erreur liste écoles:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des écoles',
      })
    }
  }
)

// ============================================
// GET /api/schools/:id - Détails d'une école
// SuperAdmin only
// ============================================
router.get('/:id',
  authenticate,
  authorize('super_admin'),
  async (req: TenantRequest, res: Response) => {
    try {
      const { id } = req.params

      const schools = await query<any[]>(`
        SELECT s.*,
          (SELECT COUNT(*) FROM utilisateurs u WHERE u.school_id = s.id) AS users_count,
          (SELECT COUNT(*) FROM eleves e WHERE e.school_id = s.id) AS students_count
        FROM schools s
        WHERE s.id = ?
      `, [id])

      if (schools.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'École non trouvée',
        })
      }

      const school = schools[0]

      res.json({
        success: true,
        data: {
          id: school.id,
          code: school.code,
          name: school.name,
          currency: school.currency,
          whatsappNumber: school.whatsapp_number,
          isActive: school.is_active,
          usersCount: school.users_count,
          studentsCount: school.students_count,
          createdAt: school.created_at,
          updatedAt: school.updated_at,
        },
      })
    } catch (error) {
      console.error('Erreur détails école:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'école',
      })
    }
  }
)

// ============================================
// POST /api/schools - Créer une école
// SuperAdmin only
// ============================================
router.post('/',
  authenticate,
  authorize('super_admin'),
  async (req: TenantRequest, res: Response) => {
    try {
      const { code, name, currency = 'FC', whatsappNumber } = req.body

      // Validation
      if (!code || !name) {
        return res.status(400).json({
          success: false,
          message: 'Le code et le nom sont requis',
        })
      }

      // Vérifier unicité du code
      const existing = await query<any[]>(
        'SELECT id FROM schools WHERE code = ?',
        [code]
      )
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Une école avec ce code existe déjà',
        })
      }

      // Créer l'école
      const result = await query<any>(`
        INSERT INTO schools (code, name, currency, whatsapp_number)
        VALUES (?, ?, ?, ?)
      `, [code, name, currency, whatsappNumber || null])

      const schoolId = result.insertId

      // Initialiser les modules par défaut
      await query(`
        INSERT INTO school_modules (school_id, module_key, enabled, enabled_at)
        SELECT ?, module_key, is_default_enabled, IF(is_default_enabled = 1, NOW(), NULL)
        FROM available_modules
      `, [schoolId])

      res.status(201).json({
        success: true,
        message: 'École créée avec succès',
        data: { id: schoolId, code, name },
      })
    } catch (error) {
      console.error('Erreur création école:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'école',
      })
    }
  }
)

// ============================================
// PUT /api/schools/:id - Modifier une école
// SuperAdmin only
// ============================================
router.put('/:id',
  authenticate,
  authorize('super_admin'),
  async (req: TenantRequest, res: Response) => {
    try {
      const { id } = req.params
      const { name, currency, whatsappNumber, isActive } = req.body

      // Vérifier que l'école existe
      const existing = await query<any[]>(
        'SELECT id FROM schools WHERE id = ?',
        [id]
      )
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'École non trouvée',
        })
      }

      // Construire la requête de mise à jour
      const updates: string[] = []
      const values: any[] = []

      if (name !== undefined) {
        updates.push('name = ?')
        values.push(name)
      }
      if (currency !== undefined) {
        updates.push('currency = ?')
        values.push(currency)
      }
      if (whatsappNumber !== undefined) {
        updates.push('whatsapp_number = ?')
        values.push(whatsappNumber)
      }
      if (isActive !== undefined) {
        updates.push('is_active = ?')
        values.push(isActive ? 1 : 0)
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Aucune donnée à mettre à jour',
        })
      }

      values.push(id)
      await query(`
        UPDATE schools SET ${updates.join(', ')} WHERE id = ?
      `, values)

      res.json({
        success: true,
        message: 'École mise à jour avec succès',
      })
    } catch (error) {
      console.error('Erreur mise à jour école:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'école',
      })
    }
  }
)

// ============================================
// DELETE /api/schools/:id - Supprimer une école
// SuperAdmin only - ATTENTION: Opération dangereuse
// ============================================
router.delete('/:id',
  authenticate,
  authorize('super_admin'),
  async (req: TenantRequest, res: Response) => {
    try {
      const { id } = req.params

      // Ne pas permettre de supprimer l'école par défaut
      if (id === '1') {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer l\'école par défaut',
        })
      }

      // Vérifier si l'école a des données
      const counts = await query<any[]>(`
        SELECT 
          (SELECT COUNT(*) FROM eleves WHERE school_id = ?) AS eleves,
          (SELECT COUNT(*) FROM utilisateurs WHERE school_id = ?) AS users
      `, [id, id])

      const { eleves, users } = counts[0]
      if (eleves > 0 || users > 0) {
        return res.status(400).json({
          success: false,
          message: `Impossible de supprimer: ${users} utilisateurs et ${eleves} élèves associés`,
        })
      }

      // Supprimer les modules d'abord
      await query('DELETE FROM school_modules WHERE school_id = ?', [id])

      // Supprimer l'école
      await query('DELETE FROM schools WHERE id = ?', [id])

      res.json({
        success: true,
        message: 'École supprimée avec succès',
      })
    } catch (error) {
      console.error('Erreur suppression école:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'école',
      })
    }
  }
)

export default router



