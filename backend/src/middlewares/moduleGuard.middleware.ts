/**
 * ============================================
 * Module Guard Middleware - Feature Flags SGS
 * ============================================
 * Vérifie si un module est activé pour l'école courante
 * Doit être utilisé APRÈS tenantMiddleware
 */

import { Response, NextFunction } from 'express'
import { TenantRequest } from './tenant.middleware'
import { query } from '../database/connection'

// ============================================
// Cache des modules (performance)
// ============================================

interface ModuleCache {
  [schoolId: number]: {
    modules: { [moduleKey: string]: boolean }
    timestamp: number
  }
}

const moduleCache: ModuleCache = {}
const CACHE_TTL_MS = 60000 // 1 minute

/**
 * Nettoie le cache des modules pour une école
 * À appeler après modification des modules
 */
export function invalidateModuleCache(schoolId?: number) {
  if (schoolId !== undefined) {
    delete moduleCache[schoolId]
  } else {
    // Invalider tout le cache
    Object.keys(moduleCache).forEach((key) => {
      delete moduleCache[Number(key)]
    })
  }
}

/**
 * Récupère les modules activés pour une école (avec cache)
 */
async function getEnabledModules(schoolId: number): Promise<{ [moduleKey: string]: boolean }> {
  const now = Date.now()

  // Vérifier le cache
  if (
    moduleCache[schoolId] &&
    now - moduleCache[schoolId].timestamp < CACHE_TTL_MS
  ) {
    return moduleCache[schoolId].modules
  }

  // Charger depuis la BDD
  const modules = await query<any[]>(
    `SELECT module_key, enabled FROM school_modules WHERE school_id = ?`,
    [schoolId]
  )

  const modulesMap: { [key: string]: boolean } = {}
  modules.forEach((m) => {
    modulesMap[m.module_key] = m.enabled === 1
  })

  // Mettre en cache
  moduleCache[schoolId] = {
    modules: modulesMap,
    timestamp: now,
  }

  return modulesMap
}

// ============================================
// Middleware Principal
// ============================================

/**
 * Middleware pour vérifier qu'un module est activé
 * 
 * @param moduleKey - Clé du module à vérifier (ex: 'payments', 'grades')
 * @param options - Options supplémentaires
 * 
 * @example
 * router.get('/grades', moduleGuard('grades'), getGrades)
 * router.post('/invoices', moduleGuard('invoicing', { requirePremium: true }), createInvoice)
 */
export const moduleGuard = (
  moduleKey: string,
  options: {
    /** Message d'erreur personnalisé */
    errorMessage?: string
    /** Autoriser même si module désactivé (logging only) */
    warnOnly?: boolean
    /** Modules alternatifs acceptés */
    alternatives?: string[]
  } = {}
) => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Vérifier que tenant context existe
      if (!req.tenant) {
        return res.status(500).json({
          success: false,
          message: 'Module guard requires tenant context',
          error: 'TENANT_CONTEXT_MISSING',
        })
      }

      // SuperAdmin global = bypass toujours
      if (req.tenant.isSuper && req.tenant.id === null) {
        return next()
      }

      // Récupérer les modules activés
      const schoolId = req.tenant.id!
      const enabledModules = await getEnabledModules(schoolId)

      // Vérifier le module principal
      let moduleEnabled = enabledModules[moduleKey] ?? false

      // Vérifier les alternatives
      if (!moduleEnabled && options.alternatives?.length) {
        moduleEnabled = options.alternatives.some(
          (alt) => enabledModules[alt] ?? false
        )
      }

      // Module désactivé
      if (!moduleEnabled) {
        // Mode avertissement seulement
        if (options.warnOnly) {
          console.warn(
            `[ModuleGuard] Module "${moduleKey}" désactivé pour école ${schoolId} - accès autorisé (warn mode)`
          )
          return next()
        }

        const errorMsg =
          options.errorMessage ||
          `Le module "${moduleKey}" n'est pas activé pour votre école`

        return res.status(403).json({
          success: false,
          message: errorMsg,
          error: 'MODULE_DISABLED',
          moduleKey,
          schoolId,
        })
      }

      // Module activé
      next()
    } catch (error) {
      console.error('Erreur module guard:', error)
      return res.status(500).json({
        success: false,
        message: 'Erreur vérification module',
        error: 'MODULE_CHECK_ERROR',
      })
    }
  }
}

/**
 * Vérifie plusieurs modules (tous doivent être activés)
 */
export const requireAllModules = (...moduleKeys: string[]) => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.tenant) {
        return res.status(500).json({
          success: false,
          message: 'Module guard requires tenant context',
          error: 'TENANT_CONTEXT_MISSING',
        })
      }

      // SuperAdmin bypass
      if (req.tenant.isSuper && req.tenant.id === null) {
        return next()
      }

      const schoolId = req.tenant.id!
      const enabledModules = await getEnabledModules(schoolId)

      const disabledModules = moduleKeys.filter(
        (key) => !(enabledModules[key] ?? false)
      )

      if (disabledModules.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Modules requis non activés: ${disabledModules.join(', ')}`,
          error: 'MODULES_DISABLED',
          disabledModules,
          schoolId,
        })
      }

      next()
    } catch (error) {
      console.error('Erreur module guard:', error)
      return res.status(500).json({
        success: false,
        message: 'Erreur vérification modules',
        error: 'MODULE_CHECK_ERROR',
      })
    }
  }
}

/**
 * Vérifie au moins un module parmi la liste (OR logic)
 */
export const requireAnyModule = (...moduleKeys: string[]) => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.tenant) {
        return res.status(500).json({
          success: false,
          message: 'Module guard requires tenant context',
          error: 'TENANT_CONTEXT_MISSING',
        })
      }

      // SuperAdmin bypass
      if (req.tenant.isSuper && req.tenant.id === null) {
        return next()
      }

      const schoolId = req.tenant.id!
      const enabledModules = await getEnabledModules(schoolId)

      const hasAnyModule = moduleKeys.some(
        (key) => enabledModules[key] ?? false
      )

      if (!hasAnyModule) {
        return res.status(403).json({
          success: false,
          message: `Au moins un de ces modules doit être activé: ${moduleKeys.join(', ')}`,
          error: 'NO_MODULE_ENABLED',
          requiredModules: moduleKeys,
          schoolId,
        })
      }

      next()
    } catch (error) {
      console.error('Erreur module guard:', error)
      return res.status(500).json({
        success: false,
        message: 'Erreur vérification modules',
        error: 'MODULE_CHECK_ERROR',
      })
    }
  }
}

// ============================================
// Service Helper (pour usage dans les routes/services)
// ============================================

/**
 * Vérifie si un module est activé pour une école
 * À utiliser dans la logique métier (pas middleware)
 */
export async function isModuleEnabled(
  schoolId: number,
  moduleKey: string
): Promise<boolean> {
  const modules = await getEnabledModules(schoolId)
  return modules[moduleKey] ?? false
}

/**
 * Récupère tous les modules activés pour une école
 */
export async function getSchoolModules(
  schoolId: number
): Promise<string[]> {
  const modules = await getEnabledModules(schoolId)
  return Object.entries(modules)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key)
}

/**
 * Active/désactive un module pour une école
 */
export async function setModuleEnabled(
  schoolId: number,
  moduleKey: string,
  enabled: boolean,
  updatedBy?: number
): Promise<void> {
  await query(
    `INSERT INTO school_modules (school_id, module_key, enabled, enabled_at, updated_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
       enabled = VALUES(enabled),
       ${enabled ? 'enabled_at = NOW(),' : 'disabled_at = NOW(),'}
       updated_by = VALUES(updated_by)`,
    [
      schoolId,
      moduleKey,
      enabled ? 1 : 0,
      enabled ? new Date() : null,
      updatedBy || null,
    ]
  )

  // Invalider le cache
  invalidateModuleCache(schoolId)
}



