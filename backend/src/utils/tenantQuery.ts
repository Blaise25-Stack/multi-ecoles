import { query } from '../database/connection'
import { TenantContext } from '../middlewares/tenant.middleware'

/**
 * Executes a tenant-aware SELECT query.
 * Appends `AND school_id = ?` when tenant has a school_id.
 * SuperAdmin without forced context gets unfiltered results.
 */
export async function tenantSelect<T>(
  sql: string,
  params: any[],
  tenant?: TenantContext,
  alias?: string
): Promise<T[]> {
  if (tenant && tenant.id !== null) {
    const col = alias ? `${alias}.school_id` : 'school_id'
    const tenantClause = ` AND ${col} = ?`
    const insertPos = sql.toUpperCase().indexOf('ORDER BY')
    const limitPos = sql.toUpperCase().indexOf('LIMIT')
    const groupPos = sql.toUpperCase().indexOf('GROUP BY')

    const pos = Math.min(
      insertPos > -1 ? insertPos : Infinity,
      limitPos > -1 ? limitPos : Infinity,
      groupPos > -1 ? groupPos : Infinity,
      sql.length
    )

    const before = sql.slice(0, pos)
    const after = sql.slice(pos)
    return query<T[]>(`${before}${tenantClause} ${after}`, [...params, tenant.id])
  }

  return query<T[]>(sql, params)
}

/**
 * Adds school_id to an INSERT data object.
 * Throws if tenant has no school_id (SuperAdmin must specify).
 */
export function withSchoolId(data: Record<string, any>, tenant?: TenantContext): Record<string, any> {
  if (!tenant || tenant.id === null) return data
  return { ...data, school_id: tenant.id }
}

/**
 * Returns the school_id filter value for WHERE clauses.
 * Returns null for SuperAdmin global access.
 */
export function getSchoolId(tenant?: TenantContext): number | null {
  return tenant?.id ?? null
}
