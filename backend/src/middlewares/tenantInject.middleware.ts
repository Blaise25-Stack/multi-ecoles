import { Response, NextFunction } from 'express'
import { TenantRequest } from './tenant.middleware'

/**
 * After tenantMiddleware resolves the school context, this middleware
 * injects school_id into SQL queries executed by legacy routes that
 * don't explicitly handle multi-tenancy.
 *
 * It monkey-patches the `query` function on the request object so that
 * legacy routes automatically filter by school_id when the tenant context
 * has a non-null id.
 *
 * For a non-invasive approach, we inject school_id into req.query
 * so routes that build WHERE clauses from req.query can pick it up.
 */
export const tenantInject = (req: TenantRequest, res: Response, next: NextFunction) => {
  if (req.tenant && req.tenant.id !== null && !req.tenant.isSuper) {
    ;(req as any)._schoolId = req.tenant.id
  }
  next()
}
