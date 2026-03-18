import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { query } from '../database/connection'

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    nom: string
    prenom: string
    role_id: number
    role_code: string
  }
}

interface JwtPayload {
  userId: number
  email: string
}

// Middleware d'authentification
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis',
      })
    }

    const token = authHeader.split(' ')[1]

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload

      // Récupérer l'utilisateur depuis la base de données
      const users = await query<any[]>(`
        SELECT u.id, u.email, u.nom, u.prenom, u.role_id, r.code as role_code
        FROM utilisateurs u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.is_active = TRUE
      `, [decoded.userId])

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé ou désactivé',
        })
      }

      req.user = users[0]
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
      })
    }
  } catch (error) {
    console.error('Erreur auth middleware:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
}

// Middleware pour vérifier les rôles
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      })
    }

    // Super admin a toujours accès
    if (req.user.role_code === 'super_admin') {
      return next()
    }

    if (!allowedRoles.includes(req.user.role_code)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé pour ce rôle',
      })
    }

    next()
  }
}

// Middleware pour vérifier les permissions sur un module
// Logique : si l'utilisateur a des permissions personnalisées → on utilise UNIQUEMENT celles-ci
// Sinon → on utilise les permissions du rôle
export const checkPermission = (module: string, action: 'create' | 'read' | 'update' | 'delete') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      })
    }

    if (req.user.role_code === 'super_admin') {
      return next()
    }

    try {
      const customCount = await query<any[]>(
        `SELECT COUNT(*) as cnt FROM utilisateur_permissions WHERE utilisateur_id = ?`,
        [req.user.id]
      )
      const hasCustomPerms = customCount[0]?.cnt > 0

      let allowed: any[]
      if (hasCustomPerms) {
        allowed = await query<any[]>(`
          SELECT p.module, p.action
          FROM permissions p
          JOIN utilisateur_permissions up ON p.id = up.permission_id
          WHERE up.utilisateur_id = ? AND p.module = ? AND p.action = ?
        `, [req.user.id, module, action])
      } else {
        allowed = await query<any[]>(`
          SELECT p.module, p.action
          FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = ? AND p.module = ? AND p.action = ?
        `, [req.user.role_id, module, action])
      }

      if (allowed.length === 0) {
        return res.status(403).json({
          success: false,
          message: `Permission "${action}" non accordée sur le module "${module}"`,
        })
      }

      next()
    } catch (error) {
      console.error('Erreur vérification permission:', error)
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
      })
    }
  }
}



