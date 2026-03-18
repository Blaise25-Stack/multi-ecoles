/**
 * ============================================
 * Users Routes - API Multi-Tenant SGS
 * ============================================
 * Gestion des utilisateurs par école
 */

import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../database/connection'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { tenantMiddleware, TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// ============================================
// GET /api/users/school/:schoolId - Liste users d'une école
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
      const isSuperAdmin = req.tenant?.isSuper
      const isSchoolAdmin = req.user?.role_code === 'admin' && req.tenant?.id === parsedSchoolId

      if (!isSuperAdmin && !isSchoolAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        })
      }

      // Récupérer les utilisateurs
      const users = await query<any[]>(`
        SELECT 
          u.id, u.email, u.nom, u.prenom, u.telephone, u.avatar,
          u.role_id AS roleId, r.code AS roleCode, r.libelle AS roleLibelle,
          u.is_active AS isActive, u.last_login AS lastLogin, u.created_at AS createdAt
        FROM utilisateurs u
        JOIN roles r ON u.role_id = r.id
        WHERE u.school_id = ? AND r.code != 'super_admin'
        ORDER BY u.created_at DESC
      `, [parsedSchoolId])

      res.json({
        success: true,
        data: users,
      })
    } catch (error) {
      console.error('Erreur liste users:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
      })
    }
  }
)

// ============================================
// POST /api/users/school/:schoolId - Créer user dans une école
// SuperAdmin ou Admin de l'école
// ============================================
router.post('/school/:schoolId',
  authenticate,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const { schoolId } = req.params
      const parsedSchoolId = parseInt(schoolId)
      const { email, password, nom, prenom, telephone, roleId } = req.body

      // Vérifier les droits
      const isSuperAdmin = req.tenant?.isSuper
      const isSchoolAdmin = req.user?.role_code === 'admin' && req.tenant?.id === parsedSchoolId

      if (!isSuperAdmin && !isSchoolAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        })
      }

      // Validation
      if (!email || !password || !nom || !prenom || !roleId) {
        return res.status(400).json({
          success: false,
          message: 'Email, mot de passe, nom, prénom et rôle sont requis',
        })
      }

      // Vérifier unicité email
      const existing = await query<any[]>(
        'SELECT id FROM utilisateurs WHERE email = ?',
        [email]
      )
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé',
        })
      }

      // Vérifier que le rôle existe et n'est pas super_admin
      const roles = await query<any[]>(
        'SELECT id, code FROM roles WHERE id = ?',
        [roleId]
      )
      if (roles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Rôle invalide',
        })
      }
      if (roles[0].code === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Impossible de créer un super admin via cette route',
        })
      }

      // Admin école ne peut pas créer d'autres admins
      if (!isSuperAdmin && roles[0].code === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Seul le SuperAdmin peut créer des administrateurs',
        })
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10)

      // Créer l'utilisateur
      const result = await query<any>(`
        INSERT INTO utilisateurs (email, password, nom, prenom, telephone, role_id, school_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
      `, [email, hashedPassword, nom, prenom, telephone || null, roleId, parsedSchoolId])

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: { id: result.insertId },
      })
    } catch (error) {
      console.error('Erreur création user:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
      })
    }
  }
)

// ============================================
// PUT /api/users/school/:schoolId/:userId - Modifier user
// SuperAdmin ou Admin de l'école
// ============================================
router.put('/school/:schoolId/:userId',
  authenticate,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const { schoolId, userId } = req.params
      const parsedSchoolId = parseInt(schoolId)
      const parsedUserId = parseInt(userId)
      const { nom, prenom, telephone, roleId, isActive } = req.body

      // Vérifier les droits
      const isSuperAdmin = req.tenant?.isSuper
      const isSchoolAdmin = req.user?.role_code === 'admin' && req.tenant?.id === parsedSchoolId

      if (!isSuperAdmin && !isSchoolAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        })
      }

      // Vérifier que l'utilisateur existe et appartient à l'école
      const users = await query<any[]>(`
        SELECT u.id, r.code as role_code 
        FROM utilisateurs u 
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.school_id = ?
      `, [parsedUserId, parsedSchoolId])

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
        })
      }

      // Construire la requête
      const updates: string[] = []
      const values: any[] = []

      if (nom !== undefined) {
        updates.push('nom = ?')
        values.push(nom)
      }
      if (prenom !== undefined) {
        updates.push('prenom = ?')
        values.push(prenom)
      }
      if (telephone !== undefined) {
        updates.push('telephone = ?')
        values.push(telephone)
      }
      if (isActive !== undefined) {
        updates.push('is_active = ?')
        values.push(isActive ? 1 : 0)
      }
      if (roleId !== undefined) {
        // Vérifier le rôle
        const roles = await query<any[]>(
          'SELECT id, code FROM roles WHERE id = ?',
          [roleId]
        )
        if (roles.length === 0 || roles[0].code === 'super_admin') {
          return res.status(400).json({
            success: false,
            message: 'Rôle invalide',
          })
        }
        // Admin école ne peut pas promouvoir en admin
        if (!isSuperAdmin && roles[0].code === 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Seul le SuperAdmin peut définir le rôle admin',
          })
        }
        updates.push('role_id = ?')
        values.push(roleId)
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Aucune donnée à mettre à jour',
        })
      }

      values.push(parsedUserId)
      await query(`UPDATE utilisateurs SET ${updates.join(', ')} WHERE id = ?`, values)

      res.json({
        success: true,
        message: 'Utilisateur mis à jour',
      })
    } catch (error) {
      console.error('Erreur update user:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
      })
    }
  }
)

// ============================================
// POST /api/users/school/:schoolId/:userId/reset-password
// Réinitialiser mot de passe
// ============================================
router.post('/school/:schoolId/:userId/reset-password',
  authenticate,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const { schoolId, userId } = req.params
      const parsedSchoolId = parseInt(schoolId)
      const parsedUserId = parseInt(userId)
      const { password } = req.body

      // Vérifier les droits
      const isSuperAdmin = req.tenant?.isSuper
      const isSchoolAdmin = req.user?.role_code === 'admin' && req.tenant?.id === parsedSchoolId

      if (!isSuperAdmin && !isSchoolAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        })
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mot de passe invalide (min 6 caractères)',
        })
      }

      // Vérifier que l'utilisateur existe et appartient à l'école
      const users = await query<any[]>(
        'SELECT id FROM utilisateurs WHERE id = ? AND school_id = ?',
        [parsedUserId, parsedSchoolId]
      )

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
        })
      }

      // Hasher et mettre à jour
      const hashedPassword = await bcrypt.hash(password, 10)
      await query(
        'UPDATE utilisateurs SET password = ? WHERE id = ?',
        [hashedPassword, parsedUserId]
      )

      res.json({
        success: true,
        message: 'Mot de passe réinitialisé',
      })
    } catch (error) {
      console.error('Erreur reset password:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
      })
    }
  }
)

// ============================================
// DELETE /api/users/school/:schoolId/:userId - Supprimer user
// SuperAdmin ou Admin de l'école
// ============================================
router.delete('/school/:schoolId/:userId',
  authenticate,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const { schoolId, userId } = req.params
      const parsedSchoolId = parseInt(schoolId)
      const parsedUserId = parseInt(userId)

      // Vérifier les droits
      const isSuperAdmin = req.tenant?.isSuper
      const isSchoolAdmin = req.user?.role_code === 'admin' && req.tenant?.id === parsedSchoolId

      if (!isSuperAdmin && !isSchoolAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        })
      }

      // Vérifier que l'utilisateur existe et appartient à l'école
      const users = await query<any[]>(`
        SELECT u.id, r.code as role_code 
        FROM utilisateurs u 
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.school_id = ?
      `, [parsedUserId, parsedSchoolId])

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
        })
      }

      // Admin école ne peut pas supprimer d'autres admins
      if (!isSuperAdmin && users[0].role_code === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Seul le SuperAdmin peut supprimer des administrateurs',
        })
      }

      // Ne pas pouvoir se supprimer soi-même
      if (req.user?.id === parsedUserId) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas supprimer votre propre compte',
        })
      }

      // Supprimer
      await query('DELETE FROM utilisateurs WHERE id = ?', [parsedUserId])

      res.json({
        success: true,
        message: 'Utilisateur supprimé',
      })
    } catch (error) {
      console.error('Erreur suppression user:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
      })
    }
  }
)

// ============================================
// GET /api/users/roles - Liste des rôles disponibles
// ============================================
router.get('/roles',
  authenticate,
  async (req: TenantRequest, res: Response) => {
    try {
      const isSuperAdmin = req.user?.role_code === 'super_admin'

      const roles = await query<any[]>(`
        SELECT id, code, libelle, description
        FROM roles
        WHERE code != 'super_admin' ${isSuperAdmin ? '' : "AND code != 'admin'"}
        ORDER BY id
      `)

      res.json({
        success: true,
        data: roles.map(r => ({
          id: r.id,
          code: r.code,
          label: r.libelle,
          description: r.description,
        })),
      })
    } catch (error) {
      console.error('Erreur liste rôles:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
      })
    }
  }
)

export default router



