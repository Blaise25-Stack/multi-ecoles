/**
 * ============================================
 * Middlewares Index - SGS Multi-Tenant
 * ============================================
 * Point d'entrée unique pour tous les middlewares
 */

// Authentication
export {
  authenticate,
  authorize,
  checkPermission,
  type AuthRequest,
} from './auth.middleware'

// Multi-Tenancy
export {
  tenantMiddleware,
  forceSchoolContext,
  requireTenant,
  requireSchoolOrSuper,
  buildTenantFilter,
  addSchoolIdToData,
  canAccessSchool,
  type TenantContext,
  type TenantRequest,
} from './tenant.middleware'

// Feature Flags / Module Guards
export {
  moduleGuard,
  requireAllModules,
  requireAnyModule,
  isModuleEnabled,
  getSchoolModules,
  setModuleEnabled,
  invalidateModuleCache,
} from './moduleGuard.middleware'



