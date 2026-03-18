import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../database/connection'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// GET /api/utilisateurs - Liste des utilisateurs
router.get('/', authenticate, authorize('super_admin', 'admin'), async (req: TenantRequest, res: Response) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    const schoolId = req.tenant?.id
    if (schoolId) { whereClause += ' AND u.school_id = ?'; params.push(schoolId) }

    if (search) {
      whereClause += ` AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)`
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (role) {
      whereClause += ` AND r.code = ?`
      params.push(role)
    }

    // Compter le total
    const countResult = await query<any[]>(`
      SELECT COUNT(*) as total
      FROM utilisateurs u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
    `, params)

    const total = countResult[0].total

    // Récupérer les utilisateurs
    const users = await query<any[]>(`
      SELECT u.id, u.email, u.nom, u.prenom, u.telephone, u.avatar,
             u.is_active, u.last_login, u.created_at,
             r.code as role, r.libelle as role_libelle
      FROM utilisateurs u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset])

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/utilisateurs/roles-stats - Statistiques par rôle
router.get('/roles-stats', authenticate, authorize('super_admin', 'admin'), async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    let schoolFilter = ''
    const params: any[] = []
    if (schoolId) {
      schoolFilter = ' AND u.school_id = ?'
      params.push(schoolId)
    }
    const roles = await query<any[]>(`
      SELECT r.libelle as role, r.description, COUNT(u.id) as count
      FROM roles r
      LEFT JOIN utilisateurs u ON u.role_id = r.id AND u.is_active = 1${schoolFilter}
      GROUP BY r.id, r.libelle, r.description
      ORDER BY r.id
    `, params)
    res.json({ success: true, data: roles })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/utilisateurs/:id - Détails d'un utilisateur
router.get('/:id', authenticate, authorize('super_admin', 'admin'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const schoolId = req.tenant?.id
    const sf = schoolId ? ' AND u.school_id = ?' : ''

    const userParams: any[] = [id]
    if (schoolId) userParams.push(schoolId)
    const users = await query<any[]>(`
      SELECT u.id, u.email, u.nom, u.prenom, u.telephone, u.avatar,
             u.is_active, u.last_login, u.created_at, u.role_id,
             r.code as role, r.libelle as role_libelle
      FROM utilisateurs u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?${sf}
    `, userParams)

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    }

    // Permissions: custom override si présent, sinon rôle par défaut
    const customCount = await query<any[]>(
      `SELECT COUNT(*) as cnt FROM utilisateur_permissions WHERE utilisateur_id = ?`,
      [id]
    )
    const hasCustomPerms = customCount[0]?.cnt > 0

    let permissions: any[]
    if (hasCustomPerms) {
      permissions = await query<any[]>(`
        SELECT DISTINCT p.module, p.action
        FROM permissions p
        JOIN utilisateur_permissions up ON p.id = up.permission_id
        WHERE up.utilisateur_id = ?
      `, [id])
    } else {
      permissions = await query<any[]>(`
        SELECT DISTINCT p.module, p.action
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `, [users[0].role_id])
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

    res.json({
      success: true,
      data: { ...users[0], permissions: formattedPermissions, hasCustomPermissions: hasCustomPerms },
    })
  } catch (error) {
    console.error('Erreur détails utilisateur:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/utilisateurs - Créer un utilisateur
router.post('/', authenticate, authorize('super_admin', 'admin'), async (req: TenantRequest, res: Response) => {
  try {
    const { email, password, nom, prenom, telephone, role, permissions } = req.body

    if (!email || !password || !nom || !prenom || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe, nom, prénom et rôle requis',
      })
    }

    // Vérifier si l'email existe déjà
    const existing = await query<any[]>(`SELECT id FROM utilisateurs WHERE email = ?`, [email])
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' })
    }

    // Récupérer l'ID du rôle
    const roles = await query<any[]>(`SELECT id FROM roles WHERE code = ?`, [role])
    if (roles.length === 0) {
      return res.status(400).json({ success: false, message: 'Rôle invalide' })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    const schoolId = req.tenant?.id
    const result = await query<any>(`
      INSERT INTO utilisateurs (email, password, nom, prenom, telephone, role_id, is_active, school_id)
      VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)
    `, [email, hashedPassword, nom, prenom, telephone || null, roles[0].id, schoolId || null])

    const userId = result.insertId

    // Ajouter les permissions personnalisées si fournies
    if (permissions && Array.isArray(permissions)) {
      for (const perm of permissions) {
        for (const action of perm.actions) {
          const permResult = await query<any[]>(`
            SELECT id FROM permissions WHERE module = ? AND action = ?
          `, [perm.module, action])

          if (permResult.length > 0) {
            await query(`
              INSERT IGNORE INTO utilisateur_permissions (utilisateur_id, permission_id)
              VALUES (?, ?)
            `, [userId, permResult[0].id])
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: { id: userId },
    })
  } catch (error) {
    console.error('Erreur création utilisateur:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/utilisateurs/:id - Modifier un utilisateur
router.put('/:id', authenticate, authorize('super_admin', 'admin'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const { nom, prenom, telephone, role, is_active, permissions, resetPermissions } = req.body

    const schoolId = req.tenant?.id
    const sf = schoolId ? ' AND school_id = ?' : ''
    const existParams: any[] = [id]
    if (schoolId) existParams.push(schoolId)
    const existing = await query<any[]>(`SELECT id FROM utilisateurs WHERE id = ?${sf}`, existParams)
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    }

    // Préparer les champs à mettre à jour
    const updates: string[] = []
    const params: any[] = []

    if (nom) {
      updates.push('nom = ?')
      params.push(nom)
    }
    if (prenom) {
      updates.push('prenom = ?')
      params.push(prenom)
    }
    if (telephone !== undefined) {
      updates.push('telephone = ?')
      params.push(telephone)
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?')
      params.push(is_active)
    }
    if (role) {
      const roles = await query<any[]>(`SELECT id FROM roles WHERE code = ?`, [role])
      if (roles.length > 0) {
        updates.push('role_id = ?')
        params.push(roles[0].id)
      }
    }

    if (updates.length > 0) {
      params.push(id)
      if (schoolId) params.push(schoolId)
      await query(`UPDATE utilisateurs SET ${updates.join(', ')} WHERE id = ?${sf}`, params)
    }

    // Réinitialiser aux permissions du rôle (supprimer les custom)
    if (resetPermissions === true) {
      await query(`DELETE FROM utilisateur_permissions WHERE utilisateur_id = ?`, [id])
    }

    // Mettre à jour les permissions si fournies
    if (!resetPermissions && permissions && Array.isArray(permissions)) {
      await query(`DELETE FROM utilisateur_permissions WHERE utilisateur_id = ?`, [id])

      // Ajouter les nouvelles
      for (const perm of permissions) {
        for (const action of perm.actions) {
          const permResult = await query<any[]>(`
            SELECT id FROM permissions WHERE module = ? AND action = ?
          `, [perm.module, action])

          if (permResult.length > 0) {
            await query(`
              INSERT IGNORE INTO utilisateur_permissions (utilisateur_id, permission_id)
              VALUES (?, ?)
            `, [id, permResult[0].id])
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Utilisateur modifié avec succès',
    })
  } catch (error) {
    console.error('Erreur modification utilisateur:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/utilisateurs/:id - Supprimer un utilisateur
router.delete('/:id', authenticate, authorize('super_admin'), async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params

    // Empêcher la suppression de son propre compte
    if (Number(id) === req.user!.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte',
      })
    }

    const schoolId = req.tenant?.id
    const sf = schoolId ? ' AND school_id = ?' : ''
    const deleteParams: any[] = [id]
    if (schoolId) deleteParams.push(schoolId)
    await query(`DELETE FROM utilisateurs WHERE id = ?${sf}`, deleteParams)

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    })
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/utilisateurs/roles/list - Liste des rôles
router.get('/roles/list', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const roles = await query<any[]>(`SELECT code, libelle, description FROM roles ORDER BY id`)
    res.json({ success: true, data: roles })
  } catch (error) {
    console.error('Erreur liste rôles:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router



