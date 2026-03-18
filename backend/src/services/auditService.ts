/**
 * ============================================
 * Audit Service - Journalisation SGS
 * ============================================
 * Service pour enregistrer les actions administratives
 */

import { query } from '../database/connection'
import { TenantRequest } from '../middlewares/tenant.middleware'

// Types
export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'ENABLE'
  | 'DISABLE'
  | 'RESET_PASSWORD'
  | 'ASSIGN'
  | 'UNASSIGN'
  | 'IMPORT'
  | 'EXPORT'
  | 'APPROVE'
  | 'REJECT'

export interface AuditLogEntry {
  userId?: number
  userEmail?: string
  userRole?: string
  schoolId?: number | null
  schoolCode?: string
  actionType: AuditActionType
  entityType: string
  entityId?: number
  entityName?: string
  description: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  requestId?: string
}

// ============================================
// Fonctions principales
// ============================================

/**
 * Enregistre une action dans le journal d'audit
 */
export async function logAudit(entry: AuditLogEntry): Promise<number> {
  try {
    const result = await query<any>(`
      INSERT INTO audit_logs (
        user_id, user_email, user_role,
        school_id, school_code,
        action_type, entity_type, entity_id, entity_name,
        description, old_values, new_values,
        ip_address, user_agent, request_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entry.userId || null,
      entry.userEmail || null,
      entry.userRole || null,
      entry.schoolId ?? null,
      entry.schoolCode || null,
      entry.actionType,
      entry.entityType,
      entry.entityId || null,
      entry.entityName || null,
      entry.description,
      entry.oldValues ? JSON.stringify(entry.oldValues) : null,
      entry.newValues ? JSON.stringify(entry.newValues) : null,
      entry.ipAddress || null,
      entry.userAgent || null,
      entry.requestId || null,
    ])

    return result.insertId
  } catch (error) {
    // Log silencieux - l'audit ne doit pas bloquer les opérations
    console.error('Erreur audit log:', error)
    return 0
  }
}

/**
 * Helper pour logger depuis une requête Express
 */
export async function logFromRequest(
  req: TenantRequest,
  actionType: AuditActionType,
  entityType: string,
  description: string,
  options: {
    entityId?: number
    entityName?: string
    oldValues?: Record<string, any>
    newValues?: Record<string, any>
  } = {}
): Promise<number> {
  return logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role_code,
    schoolId: req.tenant?.id,
    schoolCode: req.tenant?.schoolCode,
    actionType,
    entityType,
    description,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
    requestId: req.headers['x-request-id'] as string,
    ...options,
  })
}

/**
 * Raccourcis pour actions courantes
 */
export const audit = {
  create: (req: TenantRequest, entityType: string, entityId: number, entityName: string, newValues?: Record<string, any>) =>
    logFromRequest(req, 'CREATE', entityType, `Création de ${entityType} "${entityName}"`, { entityId, entityName, newValues }),

  update: (req: TenantRequest, entityType: string, entityId: number, entityName: string, oldValues?: Record<string, any>, newValues?: Record<string, any>) =>
    logFromRequest(req, 'UPDATE', entityType, `Modification de ${entityType} "${entityName}"`, { entityId, entityName, oldValues, newValues }),

  delete: (req: TenantRequest, entityType: string, entityId: number, entityName: string, oldValues?: Record<string, any>) =>
    logFromRequest(req, 'DELETE', entityType, `Suppression de ${entityType} "${entityName}"`, { entityId, entityName, oldValues }),

  enable: (req: TenantRequest, entityType: string, entityId: number, entityName: string) =>
    logFromRequest(req, 'ENABLE', entityType, `Activation de ${entityType} "${entityName}"`, { entityId, entityName }),

  disable: (req: TenantRequest, entityType: string, entityId: number, entityName: string) =>
    logFromRequest(req, 'DISABLE', entityType, `Désactivation de ${entityType} "${entityName}"`, { entityId, entityName }),

  login: (req: TenantRequest, userId: number, userEmail: string) =>
    logFromRequest(req, 'LOGIN', 'user', `Connexion de ${userEmail}`, { entityId: userId, entityName: userEmail }),

  logout: (req: TenantRequest) =>
    logFromRequest(req, 'LOGOUT', 'user', `Déconnexion de ${req.user?.email}`, { entityId: req.user?.id, entityName: req.user?.email }),

  resetPassword: (req: TenantRequest, userId: number, userEmail: string) =>
    logFromRequest(req, 'RESET_PASSWORD', 'user', `Réinitialisation mot de passe de ${userEmail}`, { entityId: userId, entityName: userEmail }),

  moduleToggle: (req: TenantRequest, schoolId: number, moduleKey: string, enabled: boolean) =>
    logFromRequest(req, enabled ? 'ENABLE' : 'DISABLE', 'module', `${enabled ? 'Activation' : 'Désactivation'} du module "${moduleKey}"`, { entityName: moduleKey, newValues: { enabled } }),
}

// ============================================
// Fonctions de lecture
// ============================================

export interface AuditLogFilter {
  schoolId?: number
  userId?: number
  actionType?: AuditActionType
  entityType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

/**
 * Récupère les logs d'audit avec filtres
 */
export async function getAuditLogs(filter: AuditLogFilter = {}): Promise<any[]> {
  const conditions: string[] = []
  const params: any[] = []

  if (filter.schoolId !== undefined) {
    conditions.push('school_id = ?')
    params.push(filter.schoolId)
  }
  if (filter.userId !== undefined) {
    conditions.push('user_id = ?')
    params.push(filter.userId)
  }
  if (filter.actionType) {
    conditions.push('action_type = ?')
    params.push(filter.actionType)
  }
  if (filter.entityType) {
    conditions.push('entity_type = ?')
    params.push(filter.entityType)
  }
  if (filter.startDate) {
    conditions.push('created_at >= ?')
    params.push(filter.startDate)
  }
  if (filter.endDate) {
    conditions.push('created_at <= ?')
    params.push(filter.endDate)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = filter.limit || 100
  const offset = filter.offset || 0

  params.push(limit, offset)

  const logs = await query<any[]>(`
    SELECT 
      id, user_id, user_email, user_role,
      school_id, school_code,
      action_type, entity_type, entity_id, entity_name,
      description, old_values, new_values,
      ip_address, created_at
    FROM audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, params)

  return logs.map(log => ({
    ...log,
    oldValues: log.old_values ? JSON.parse(log.old_values) : null,
    newValues: log.new_values ? JSON.parse(log.new_values) : null,
  }))
}

/**
 * Compte les logs pour pagination
 */
export async function countAuditLogs(filter: Omit<AuditLogFilter, 'limit' | 'offset'>): Promise<number> {
  const conditions: string[] = []
  const params: any[] = []

  if (filter.schoolId !== undefined) {
    conditions.push('school_id = ?')
    params.push(filter.schoolId)
  }
  if (filter.userId !== undefined) {
    conditions.push('user_id = ?')
    params.push(filter.userId)
  }
  if (filter.actionType) {
    conditions.push('action_type = ?')
    params.push(filter.actionType)
  }
  if (filter.entityType) {
    conditions.push('entity_type = ?')
    params.push(filter.entityType)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await query<any[]>(`
    SELECT COUNT(*) as count FROM audit_logs ${whereClause}
  `, params)

  return result[0]?.count || 0
}

// ============================================
// Helpers
// ============================================

function getClientIp(req: TenantRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket.remoteAddress || 'unknown'
}

export default {
  log: logAudit,
  logFromRequest,
  ...audit,
  getAuditLogs,
  countAuditLogs,
}



