import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { query } from '../database/connection'
import { authenticate, AuthRequest } from '../middlewares/auth.middleware'

const router = Router()

// POST /api/auth/login - Connexion
// ✅ MULTI-TENANT: Retourne les informations de l'école
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      })
    }

    // Rechercher l'utilisateur avec les infos de l'école
    // ✅ MULTI-TENANT: JOIN sur la table schools
    const users = await query<any[]>(`
      SELECT 
        u.*, 
        r.code as role_code, 
        r.libelle as role_libelle,
        s.id as s_school_id,
        s.code as school_code,
        s.name as school_name,
        s.currency as school_currency,
        s.is_active as school_is_active
      FROM utilisateurs u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.email = ?
    `, [email])

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      })
    }

    const user = users[0]

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.',
      })
    }

    // ✅ MULTI-TENANT: Vérifier si l'école est active (sauf SuperAdmin)
    if (user.school_id && user.school_is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Cette école est désactivée. Contactez l\'administrateur plateforme.',
        error: 'SCHOOL_DISABLED',
      })
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      })
    }

    // ✅ MULTI-TENANT: Ajouter school_id au payload JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        schoolId: user.school_id || null,  // null pour SuperAdmin
        role: user.role_code
      },
      config.jwt.secret,
      { expiresIn: '24h' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: '7d' }
    )

    // Mettre à jour la dernière connexion
    await query(`UPDATE utilisateurs SET last_login = NOW() WHERE id = ?`, [user.id])

    // Enregistrer dans l'historique des connexions
    try {
      await query(`
        INSERT INTO historique_connexions (utilisateur_id, ip_address, user_agent, succes)
        VALUES (?, ?, ?, TRUE)
      `, [user.id, req.ip, req.headers['user-agent']])
    } catch (e) {
      // Ignorer si la table n'existe pas
      console.warn('Impossible d\'enregistrer l\'historique de connexion')
    }

    // Récupérer les permissions de l'utilisateur
    // Si des permissions personnalisées existent → utiliser UNIQUEMENT celles-ci (override)
    // Sinon → fallback sur les permissions du rôle
    const customCount = await query<any[]>(
      `SELECT COUNT(*) as cnt FROM utilisateur_permissions WHERE utilisateur_id = ?`,
      [user.id]
    )
    const hasCustomPerms = customCount[0]?.cnt > 0

    let permissions: any[]
    if (hasCustomPerms) {
      permissions = await query<any[]>(`
        SELECT DISTINCT p.module, p.action
        FROM permissions p
        JOIN utilisateur_permissions up ON p.id = up.permission_id
        WHERE up.utilisateur_id = ?
      `, [user.id])
    } else {
      permissions = await query<any[]>(`
        SELECT DISTINCT p.module, p.action
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `, [user.role_id])
    }

    const formattedPermissions: { module: string; actions: string[] }[] = []
    permissions.forEach(p => {
      const existing = formattedPermissions.find(fp => fp.module === p.module)
      if (existing) {
        existing.actions.push(p.action)
      } else {
        formattedPermissions.push({ module: p.module, actions: [p.action] })
      }
    })

    // ✅ MULTI-TENANT: Construire l'objet school (null pour SuperAdmin)
    const school = user.school_id ? {
      id: user.school_id,
      code: user.school_code,
      name: user.school_name,
      currency: user.school_currency || 'FC',
    } : null

    const isSuperAdmin = user.role_code === 'super_admin'

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          telephone: user.telephone,
          avatar: user.avatar,
          role: user.role_code,
          roleLibelle: user.role_libelle,
          schoolId: user.school_id || null,  // ✅ MULTI-TENANT
          isSuperAdmin,                        // ✅ MULTI-TENANT
          permissions: formattedPermissions,
          isActive: user.is_active,
          lastLogin: user.last_login,
          createdAt: user.created_at,
        },
        school,  // ✅ MULTI-TENANT: null pour SuperAdmin
        token,
        refreshToken,
      },
    })
  } catch (error) {
    console.error('Erreur login:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
})

// POST /api/auth/refresh - Rafraîchir le token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis',
      })
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: number }

      // Vérifier que l'utilisateur existe et est actif
      const users = await query<any[]>(`
        SELECT id, email FROM utilisateurs WHERE id = ? AND is_active = TRUE
      `, [decoded.userId])

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé',
        })
      }

      const user = users[0]

      // Générer un nouveau token
      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: '24h' }
      )

      res.json({
        success: true,
        data: { token: newToken },
      })
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide ou expiré',
      })
    }
  } catch (error) {
    console.error('Erreur refresh:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
})

// GET /api/auth/me - Profil utilisateur connecté
// ✅ MULTI-TENANT: Retourne aussi les infos de l'école
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // ✅ MULTI-TENANT: JOIN sur schools
    const users = await query<any[]>(`
      SELECT 
        u.*, 
        r.code as role_code, 
        r.libelle as role_libelle,
        s.id as s_school_id,
        s.code as school_code,
        s.name as school_name,
        s.currency as school_currency
      FROM utilisateurs u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.id = ?
    `, [req.user!.id])

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    const user = users[0]

    // Permissions: custom override si présent, sinon rôle par défaut
    const customCount = await query<any[]>(
      `SELECT COUNT(*) as cnt FROM utilisateur_permissions WHERE utilisateur_id = ?`,
      [user.id]
    )
    const hasCustomPerms = customCount[0]?.cnt > 0

    let permissions: any[]
    if (hasCustomPerms) {
      permissions = await query<any[]>(`
        SELECT DISTINCT p.module, p.action
        FROM permissions p
        JOIN utilisateur_permissions up ON p.id = up.permission_id
        WHERE up.utilisateur_id = ?
      `, [user.id])
    } else {
      permissions = await query<any[]>(`
        SELECT DISTINCT p.module, p.action
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `, [user.role_id])
    }

    const formattedPermissions: { module: string; actions: string[] }[] = []
    permissions.forEach(p => {
      const existing = formattedPermissions.find(fp => fp.module === p.module)
      if (existing) {
        existing.actions.push(p.action)
      } else {
        formattedPermissions.push({ module: p.module, actions: [p.action] })
      }
    })

    // ✅ MULTI-TENANT: Objet school
    const school = user.school_id ? {
      id: user.school_id,
      code: user.school_code,
      name: user.school_name,
      currency: user.school_currency || 'FC',
    } : null

    const isSuperAdmin = user.role_code === 'super_admin'

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          telephone: user.telephone,
          avatar: user.avatar,
          role: user.role_code,
          roleLibelle: user.role_libelle,
          schoolId: user.school_id || null,
          isSuperAdmin,
          permissions: formattedPermissions,
          isActive: user.is_active,
          lastLogin: user.last_login,
          createdAt: user.created_at,
        },
        school,
      },
    })
  } catch (error) {
    console.error('Erreur me:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
})

// PUT /api/auth/password - Changer le mot de passe
router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau requis',
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      })
    }

    // Vérifier le mot de passe actuel
    const users = await query<any[]>(`
      SELECT password FROM utilisateurs WHERE id = ?
    `, [req.user!.id])

    const isValid = await bcrypt.compare(currentPassword, users[0].password)

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
      })
    }

    // Hasher et mettre à jour
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await query(`UPDATE utilisateurs SET password = ? WHERE id = ?`, [hashedPassword, req.user!.id])

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    })
  } catch (error) {
    console.error('Erreur password:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
})

export default router

