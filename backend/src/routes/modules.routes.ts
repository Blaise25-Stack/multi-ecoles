/**
 * ============================================
 * Modules Routes - Feature Flags API SGS
 * ============================================
 * Gestion des modules par école
 */

import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { tenantMiddleware, TenantRequest } from '../middlewares/tenant.middleware'
import { invalidateModuleCache } from '../middlewares/moduleGuard.middleware'

const router = Router()

// ============================================
// GET /api/modules/available - Liste tous les modules disponibles
// Accessible à tous les utilisateurs authentifiés
// ============================================
router.get('/available',
  authenticate,
  async (req: TenantRequest, res: Response) => {
    try {
      const modules = await query<any[]>(`
        SELECT 
          id, module_key, module_name, description, category,
          is_default_enabled, requires_subscription, icon, sort_order, is_active
        FROM available_modules
        WHERE is_active = 1
        ORDER BY sort_order ASC
      `)

      // Grouper par catégorie
      const grouped: Record<string, any[]> = {}
      modules.forEach(m => {
        if (!grouped[m.category]) {
          grouped[m.category] = []
        }
        grouped[m.category].push({
          id: m.id,
          key: m.module_key,
          name: m.module_name,
          description: m.description,
          category: m.category,
          isDefaultEnabled: m.is_default_enabled === 1,
          requiresSubscription: m.requires_subscription,
          icon: m.icon,
          sortOrder: m.sort_order,
        })
      })

      res.json({
        success: true,
        data: {
          modules,
          grouped,
          categories: Object.keys(grouped),
        },
      })
    } catch (error) {
      console.error('Erreur liste modules:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des modules',
      })
    }
  }
)

// ============================================
// GET /api/modules/school/:schoolId - Modules d'une école spécifique
// SuperAdmin ou Admin de l'école
// ============================================
router.get('/school/:schoolId',
  authenticate,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const { schoolId } = req.params
      const parsedSchoolId = parseInt(schoolId)

      // Vérifier les droits
      if (!req.tenant?.isSuper && req.tenant?.id !== parsedSchoolId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette école',
        })
      }

      // Récupérer les modules avec leur état pour cette école
      const modules = await query<any[]>(`
        SELECT 
          am.id, am.module_key, am.module_name, am.description, am.category,
          am.is_default_enabled, am.requires_subscription, am.icon, am.sort_order,
          COALESCE(sm.enabled, am.is_default_enabled) AS enabled,
          sm.enabled_at, sm.disabled_at
        FROM available_modules am
        LEFT JOIN school_modules sm ON am.module_key = sm.module_key AND sm.school_id = ?
        WHERE am.is_active = 1
        ORDER BY am.sort_order ASC
      `, [parsedSchoolId])

      // Grouper par catégorie
      const grouped: Record<string, any[]> = {}
      modules.forEach(m => {
        if (!grouped[m.category]) {
          grouped[m.category] = []
        }
        grouped[m.category].push({
          id: m.id,
          key: m.module_key,
          name: m.module_name,
          description: m.description,
          category: m.category,
          requiresSubscription: m.requires_subscription,
          icon: m.icon,
          enabled: m.enabled === 1,
          enabledAt: m.enabled_at,
          disabledAt: m.disabled_at,
        })
      })

      // Stats
      const enabledCount = modules.filter(m => m.enabled === 1).length
      const totalCount = modules.length

      res.json({
        success: true,
        data: {
          schoolId: parsedSchoolId,
          modules: grouped,
          categories: Object.keys(grouped),
          stats: {
            enabled: enabledCount,
            total: totalCount,
            percentage: Math.round((enabledCount / totalCount) * 100),
          },
        },
      })
    } catch (error) {
      console.error('Erreur modules école:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des modules',
      })
    }
  }
)

// ============================================
// GET /api/modules/my - Modules de mon école
// Utilisateur authentifié avec école
// ============================================
router.get('/my',
  authenticate,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      // SuperAdmin = accès total, même avec contexte école
      if (req.tenant?.isSuper) {
        return res.json({
          success: true,
          data: {
            isSuperAdmin: true,
            allModulesEnabled: true,
            schoolId: req.tenant?.id || null,
            modules: [],
          },
        })
      }

      const schoolId = req.tenant?.id
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'Aucune école associée',
        })
      }

      // Récupérer uniquement les modules activés
      const modules = await query<any[]>(`
        SELECT 
          am.module_key, am.module_name, am.icon, am.category
        FROM available_modules am
        INNER JOIN school_modules sm ON am.module_key = sm.module_key
        WHERE sm.school_id = ? AND sm.enabled = 1 AND am.is_active = 1
        ORDER BY am.sort_order ASC
      `, [schoolId])

      res.json({
        success: true,
        data: {
          schoolId,
          enabledModules: modules.map(m => m.module_key),
          modules: modules.map(m => ({
            key: m.module_key,
            name: m.module_name,
            icon: m.icon,
            category: m.category,
          })),
        },
      })
    } catch (error) {
      console.error('Erreur mes modules:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des modules',
      })
    }
  }
)

// ============================================
// PUT /api/modules/school/:schoolId/bulk - Toggle plusieurs modules
// SuperAdmin only
// IMPORTANT: doit être AVANT /:moduleKey pour éviter que "bulk" soit capturé comme moduleKey
// ============================================
router.put('/school/:schoolId/bulk',
  authenticate,
  authorize('super_admin'),
  async (req: TenantRequest, res: Response) => {
    try {
      const { schoolId } = req.params
      const { modules } = req.body // { moduleKey: boolean }
      const parsedSchoolId = parseInt(schoolId)

      if (!modules || typeof modules !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Format invalide: modules doit être un objet { moduleKey: boolean }',
        })
      }

      // Vérifier que l'école existe
      const schoolExists = await query<any[]>(
        'SELECT id FROM schools WHERE id = ?',
        [parsedSchoolId]
      )
      if (schoolExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'École non trouvée',
        })
      }

      // Mettre à jour chaque module
      const updates: string[] = []
      for (const [moduleKey, enabled] of Object.entries(modules)) {
        const isEnabled = enabled ? 1 : 0
        await query(`
          INSERT INTO school_modules (school_id, module_key, enabled, enabled_at, disabled_at, updated_by)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            enabled = VALUES(enabled),
            enabled_at = IF(VALUES(enabled) = 1 AND enabled = 0, NOW(), enabled_at),
            disabled_at = IF(VALUES(enabled) = 0 AND enabled = 1, NOW(), disabled_at),
            updated_by = VALUES(updated_by)
        `, [
          parsedSchoolId,
          moduleKey,
          isEnabled,
          isEnabled ? new Date() : null,
          isEnabled ? null : new Date(),
          req.user?.id || null,
        ])
        updates.push(`${moduleKey}: ${enabled ? 'on' : 'off'}`)
      }

      // Invalider le cache
      invalidateModuleCache(parsedSchoolId)

      res.json({
        success: true,
        message: `${updates.length} modules mis à jour`,
        data: {
          schoolId: parsedSchoolId,
          updates,
        },
      })
    } catch (error) {
      console.error('Erreur bulk update modules:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour des modules',
      })
    }
  }
)

// ============================================
// POST /api/modules/school/:schoolId/reset - Reset aux valeurs par défaut
// SuperAdmin only
// IMPORTANT: doit être AVANT /:moduleKey pour la même raison
// ============================================
router.post('/school/:schoolId/reset',
  authenticate,
  authorize('super_admin'),
  async (req: TenantRequest, res: Response) => {
    try {
      const { schoolId } = req.params
      const parsedSchoolId = parseInt(schoolId)

      // Supprimer les modules personnalisés
      await query('DELETE FROM school_modules WHERE school_id = ?', [parsedSchoolId])

      // Réinsérer les modules par défaut
      await query(`
        INSERT INTO school_modules (school_id, module_key, enabled, enabled_at)
        SELECT ?, module_key, is_default_enabled, IF(is_default_enabled = 1, NOW(), NULL)
        FROM available_modules
        WHERE is_active = 1
      `, [parsedSchoolId])

      // Invalider le cache
      invalidateModuleCache(parsedSchoolId)

      res.json({
        success: true,
        message: 'Modules réinitialisés aux valeurs par défaut',
      })
    } catch (error) {
      console.error('Erreur reset modules:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la réinitialisation des modules',
      })
    }
  }
)

// ============================================
// PUT /api/modules/school/:schoolId/:moduleKey - Toggle un module
// SuperAdmin ou Admin de l'école
// IMPORTANT: doit être APRÈS /bulk et /reset (routes avec segments littéraux)
// ============================================
router.put('/school/:schoolId/:moduleKey',
  authenticate,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const { schoolId, moduleKey } = req.params
      const { enabled } = req.body
      const parsedSchoolId = parseInt(schoolId)

      // Vérifier les droits
      const isSuperAdmin = req.tenant?.isSuper
      const isSchoolAdmin = req.user?.role_code === 'admin' && req.tenant?.id === parsedSchoolId

      if (!isSuperAdmin && !isSchoolAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        })
      }

      // Vérifier que le module existe
      const moduleExists = await query<any[]>(
        'SELECT id FROM available_modules WHERE module_key = ? AND is_active = 1',
        [moduleKey]
      )
      if (moduleExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Module non trouvé',
        })
      }

      // Vérifier que l'école existe
      const schoolExists = await query<any[]>(
        'SELECT id FROM schools WHERE id = ?',
        [parsedSchoolId]
      )
      if (schoolExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'École non trouvée',
        })
      }

      // Upsert le module
      const isEnabled = enabled ? 1 : 0
      await query(`
        INSERT INTO school_modules (school_id, module_key, enabled, enabled_at, disabled_at, updated_by)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          enabled = VALUES(enabled),
          enabled_at = IF(VALUES(enabled) = 1 AND enabled = 0, NOW(), enabled_at),
          disabled_at = IF(VALUES(enabled) = 0 AND enabled = 1, NOW(), disabled_at),
          updated_by = VALUES(updated_by)
      `, [
        parsedSchoolId,
        moduleKey,
        isEnabled,
        isEnabled ? new Date() : null,
        isEnabled ? null : new Date(),
        req.user?.id || null,
      ])

      // Invalider le cache
      invalidateModuleCache(parsedSchoolId)

      res.json({
        success: true,
        message: `Module ${moduleKey} ${enabled ? 'activé' : 'désactivé'} pour l'école ${parsedSchoolId}`,
        data: {
          schoolId: parsedSchoolId,
          moduleKey,
          enabled: isEnabled === 1,
        },
      })
    } catch (error) {
      console.error('Erreur toggle module:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la modification du module',
      })
    }
  }
)

export default router



