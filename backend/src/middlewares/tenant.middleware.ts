/**
 * ============================================
 * Tenant Middleware - Multi-Tenant SGS
 * ============================================
 * Gère le contexte tenant (école) pour chaque requête
 * Doit être utilisé APRÈS le middleware d'authentification
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'
import { query } from '../database/connection'

// ============================================
// Types
// ============================================

/**
 * Contexte tenant attaché à chaque requête
 */
export interface TenantContext {
  /** ID de l'école (null = SuperAdmin accès global) */
  id: number | null
  /** True si SuperAdmin avec accès global */
  isSuper: boolean
  /** Code de l'école (ex: ECO001) */
  schoolCode?: string
  /** Nom de l'école */
  schoolName?: string
  /** Devise de l'école */
  currency?: string
}

/**
 * Extension de AuthRequest avec le contexte tenant
 */
export interface TenantRequest extends AuthRequest {
  tenant?: TenantContext
}

// ============================================
// Middleware Principal
// ============================================

/**
 * Middleware pour résoudre le contexte tenant depuis le JWT/user
 * 
 * Comportement:
 * - SuperAdmin: req.tenant = { id: null, isSuper: true }
 * - User normal: req.tenant = { id: school_id, isSuper: false, ... }
 * - École désactivée: 403 Forbidden
 * - Pas d'école assignée: 403 Forbidden
 */
export const tenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Vérifier que l'auth middleware a été exécuté
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié - tenant middleware requires auth',
        error: 'AUTH_REQUIRED',
      })
    }

    // SuperAdmin = accès global OU contexte école forcé via header
    if (req.user.role_code === 'super_admin') {
      const schoolIdHeader = req.headers['x-school-id']
      if (schoolIdHeader) {
        const schoolId = parseInt(String(schoolIdHeader), 10)
        if (!isNaN(schoolId)) {
          const schools = await query<any[]>(
            'SELECT id, code, name, currency, is_active FROM schools WHERE id = ?',
            [schoolId]
          )
          if (schools.length > 0 && schools[0].is_active) {
            req.tenant = {
              id: schoolId,
              isSuper: true,
              schoolCode: schools[0].code,
              schoolName: schools[0].name,
              currency: schools[0].currency || 'FC',
            }
            return next()
          }
        }
      }
      req.tenant = {
        id: null,
        isSuper: true,
      }
      return next()
    }

    // Récupérer les infos de l'école de l'utilisateur
    const users = await query<any[]>(`
      SELECT 
        u.school_id, 
        s.code AS school_code,
        s.name AS school_name, 
        s.currency,
        s.is_active AS school_is_active
      FROM utilisateurs u
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.id = ?
    `, [req.user.id])

    // Utilisateur sans école assignée
    if (users.length === 0 || !users[0].school_id) {
      return res.status(403).json({
        success: false,
        message: 'Aucune école assignée à cet utilisateur',
        error: 'NO_SCHOOL_ASSIGNED',
      })
    }

    const userData = users[0]

    // École désactivée
    if (!userData.school_is_active) {
      return res.status(403).json({
        success: false,
        message: 'Cette école est désactivée. Contactez l\'administrateur plateforme.',
        error: 'SCHOOL_DISABLED',
      })
    }

    // Attacher le contexte tenant à la requête
    req.tenant = {
      id: userData.school_id,
      isSuper: false,
      schoolCode: userData.school_code,
      schoolName: userData.school_name,
      currency: userData.currency || 'FC',
    }

    next()
  } catch (error) {
    console.error('Erreur tenant middleware:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur (tenant resolution)',
      error: 'TENANT_ERROR',
    })
  }
}

// ============================================
// Middlewares Utilitaires
// ============================================

/**
 * Force un contexte d'école spécifique (SuperAdmin uniquement)
 * Utilisé pour les routes comme /superadmin/schools/:schoolId/...
 * 
 * @param paramName - Nom du paramètre URL contenant l'ID école
 */
export const forceSchoolContext = (paramName: string = 'schoolId') => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    // Doit être SuperAdmin
    if (!req.tenant?.isSuper) {
      return res.status(403).json({
        success: false,
        message: 'Accès SuperAdmin requis',
        error: 'SUPER_ADMIN_REQUIRED',
      })
    }

    const schoolId = parseInt(req.params[paramName])

    if (isNaN(schoolId)) {
      return res.status(400).json({
        success: false,
        message: 'ID école invalide',
        error: 'INVALID_SCHOOL_ID',
      })
    }

    // Vérifier que l'école existe
    const schools = await query<any[]>(
      'SELECT id, code, name, currency, is_active FROM schools WHERE id = ?',
      [schoolId]
    )

    if (schools.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'École non trouvée',
        error: 'SCHOOL_NOT_FOUND',
      })
    }

    const school = schools[0]

    // Override le tenant context avec l'école spécifiée
    req.tenant = {
      id: schoolId,
      isSuper: true, // Garde le flag super pour les permissions
      schoolCode: school.code,
      schoolName: school.name,
      currency: school.currency,
    }

    next()
  }
}

/**
 * Guard pour s'assurer que le tenant context est présent
 * À utiliser après tenantMiddleware
 */
export const requireTenant = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.tenant) {
    return res.status(500).json({
      success: false,
      message: 'Tenant context manquant - vérifiez l\'ordre des middlewares',
      error: 'TENANT_CONTEXT_MISSING',
    })
  }

  // Pour les routes qui nécessitent une école spécifique (pas SuperAdmin global)
  if (!req.tenant.isSuper && !req.tenant.id) {
    return res.status(403).json({
      success: false,
      message: 'Contexte école requis',
      error: 'SCHOOL_CONTEXT_REQUIRED',
    })
  }

  next()
}

/**
 * Guard optionnel - vérifie qu'on a une école si pas SuperAdmin
 * Plus permissif que requireTenant
 */
export const requireSchoolOrSuper = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.tenant) {
    return res.status(500).json({
      success: false,
      message: 'Tenant context manquant',
      error: 'TENANT_CONTEXT_MISSING',
    })
  }

  // OK si SuperAdmin (même sans école)
  if (req.tenant.isSuper) {
    return next()
  }

  // Sinon, doit avoir une école
  if (!req.tenant.id) {
    return res.status(403).json({
      success: false,
      message: 'École requise',
      error: 'SCHOOL_REQUIRED',
    })
  }

  next()
}

// ============================================
// Helpers pour les Queries
// ============================================

/**
 * Construit une clause WHERE pour filtrer par school_id
 * 
 * @param tenant - Context tenant de la requête
 * @param alias - Alias de table optionnel (ex: 'e' pour eleves)
 * @returns Tuple [whereClause, params]
 * 
 * @example
 * const [where, params] = buildTenantFilter(req.tenant, 'e')
 * const results = await query(`SELECT * FROM eleves e WHERE ${where}`, params)
 */
export function buildTenantFilter(
  tenant: TenantContext,
  alias?: string
): [string, any[]] {
  // SuperAdmin sans contexte forcé = pas de filtre
  if (tenant.isSuper && tenant.id === null) {
    return ['1=1', []]
  }

  const column = alias ? `${alias}.school_id` : 'school_id'
  return [`${column} = ?`, [tenant.id]]
}

/**
 * Ajoute school_id aux données d'insertion
 * 
 * @throws Error si tenant.id est null (SuperAdmin doit spécifier école)
 */
export function addSchoolIdToData(
  tenant: TenantContext,
  data: Record<string, any>
): Record<string, any> {
  if (tenant.id === null) {
    throw new Error('school_id requis - SuperAdmin doit spécifier l\'école')
  }
  return {
    ...data,
    school_id: tenant.id,
  }
}

/**
 * Vérifie si le tenant peut accéder à une ressource avec un school_id spécifique
 */
export function canAccessSchool(tenant: TenantContext, resourceSchoolId: number | null): boolean {
  // SuperAdmin global peut tout voir
  if (tenant.isSuper && tenant.id === null) {
    return true
  }
  
  // SuperAdmin avec contexte forcé
  if (tenant.isSuper && tenant.id !== null) {
    return tenant.id === resourceSchoolId
  }
  
  // User normal
  return tenant.id === resourceSchoolId
}



