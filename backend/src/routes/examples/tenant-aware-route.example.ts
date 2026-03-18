/**
 * ============================================
 * Exemple de Route Tenant-Aware avec Module Guard
 * ============================================
 * Ce fichier montre comment adapter une route existante
 * pour être multi-tenant avec feature flags
 */

import { Router, Response } from 'express'
import { query } from '../../database/connection'
import { authenticate, checkPermission, AuthRequest } from '../../middlewares/auth.middleware'
import { tenantMiddleware, TenantRequest, buildTenantFilter } from '../../middlewares/tenant.middleware'
import { moduleGuard } from '../../middlewares/moduleGuard.middleware'

const router = Router()

/**
 * AVANT (route single-tenant)
 * ============================
 * 
 * router.get('/', 
 *   authenticate, 
 *   checkPermission('paiements', 'read'), 
 *   async (req: AuthRequest, res: Response) => {
 *     const paiements = await query('SELECT * FROM paiements')
 *     res.json({ success: true, data: paiements })
 *   }
 * )
 */

/**
 * APRÈS (route multi-tenant avec module guard)
 * =============================================
 * 
 * Changements:
 * 1. Ajouter tenantMiddleware après authenticate
 * 2. Ajouter moduleGuard('payments') pour vérifier le feature flag
 * 3. Utiliser TenantRequest au lieu de AuthRequest
 * 4. Filtrer par school_id dans les requêtes SQL
 */

router.get('/',
  authenticate,                              // 1. Vérifie JWT
  tenantMiddleware,                          // 2. Résout le tenant (école)
  moduleGuard('payments'),                   // 3. Vérifie si le module est activé
  checkPermission('paiements', 'read'),      // 4. Vérifie les permissions RBAC
  async (req: TenantRequest, res: Response) => {
    try {
      // Construire le filtre tenant
      const [tenantFilter, tenantParams] = buildTenantFilter(req.tenant!, 'p')

      // Requête avec filtre school_id
      const paiements = await query<any[]>(`
        SELECT p.*, e.nom, e.prenom, e.matricule
        FROM paiements p
        JOIN eleves e ON p.eleve_id = e.id
        WHERE ${tenantFilter}
        ORDER BY p.date_paiement DESC
        LIMIT 100
      `, tenantParams)

      res.json({
        success: true,
        data: paiements,
        tenant: {
          schoolId: req.tenant?.id,
          isSuperAdmin: req.tenant?.isSuper,
        },
      })
    } catch (error) {
      console.error('Erreur paiements:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  }
)

/**
 * Exemple POST avec insertion tenant-aware
 */
router.post('/',
  authenticate,
  tenantMiddleware,
  moduleGuard('payments'),
  checkPermission('paiements', 'create'),
  async (req: TenantRequest, res: Response) => {
    try {
      const { eleveId, montant, modePaiement } = req.body

      // Vérifier que l'élève appartient à la même école
      const [tenantFilter, tenantParams] = buildTenantFilter(req.tenant!)
      const eleves = await query<any[]>(
        `SELECT id FROM eleves WHERE id = ? AND ${tenantFilter}`,
        [eleveId, ...tenantParams]
      )

      if (eleves.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Élève non trouvé ou n\'appartient pas à cette école',
        })
      }

      // Insérer avec school_id automatique
      const schoolId = req.tenant?.id
      if (!schoolId && !req.tenant?.isSuper) {
        return res.status(400).json({
          success: false,
          message: 'Contexte école requis pour cette opération',
        })
      }

      const result = await query<any>(`
        INSERT INTO paiements (eleve_id, montant, mode_paiement, school_id, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [eleveId, montant, modePaiement, schoolId, req.user?.id])

      res.status(201).json({
        success: true,
        data: { id: result.insertId },
      })
    } catch (error) {
      console.error('Erreur création paiement:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  }
)

/**
 * Exemple avec plusieurs modules requis
 */
router.get('/with-invoices',
  authenticate,
  tenantMiddleware,
  moduleGuard('payments'),
  moduleGuard('invoicing'),  // Requiert aussi le module facturation
  async (req: TenantRequest, res: Response) => {
    // ...
    res.json({ success: true, message: 'Les deux modules sont activés' })
  }
)

export default router

/**
 * ============================================
 * CHECKLIST MIGRATION ROUTE EXISTANTE
 * ============================================
 * 
 * [ ] Import des middlewares tenant et moduleGuard
 * [ ] Ajouter tenantMiddleware après authenticate
 * [ ] Ajouter moduleGuard('module_key') approprié
 * [ ] Changer AuthRequest -> TenantRequest
 * [ ] Ajouter WHERE school_id = ? dans les SELECT
 * [ ] Ajouter school_id dans les INSERT
 * [ ] Vérifier appartenance école avant UPDATE/DELETE
 * [ ] Tester avec différents rôles (admin, user, superadmin)
 * 
 * ============================================
 * MAPPING ROUTES -> MODULES
 * ============================================
 * 
 * /api/eleves          -> moduleGuard('students')
 * /api/inscriptions    -> moduleGuard('students')
 * /api/classes         -> moduleGuard('classes')
 * /api/matieres        -> moduleGuard('subjects')
 * /api/notes           -> moduleGuard('grades')
 * /api/paiements       -> moduleGuard('payments')
 * /api/depenses        -> moduleGuard('expenses')
 * /api/enseignants     -> moduleGuard('teachers')
 * /api/personnel       -> moduleGuard('staff')
 * /api/salaires        -> moduleGuard('payroll')
 * /api/conges          -> moduleGuard('leaves')
 * /api/contrats        -> moduleGuard('contracts')
 * 
 */



