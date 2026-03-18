import { Response, NextFunction } from 'express'
import { logFromRequest, AuditActionType } from '../services/auditService'
import { TenantRequest } from './tenant.middleware'

const methodToAction: Record<string, AuditActionType> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
}

export const auditLog = (entityType: string) => {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res)
    let responseBody: any

    res.json = (body: any) => {
      responseBody = body
      return originalJson(body)
    }

    res.on('finish', () => {
      if (res.statusCode >= 400) return
      
      const actionType = methodToAction[req.method]
      if (!actionType) return

      const entityId = req.params?.id ? parseInt(req.params.id) : responseBody?.data?.id
      const entityName = responseBody?.data?.nom || responseBody?.data?.libelle || responseBody?.data?.numero || ''

      logFromRequest(req, actionType, entityType, `${actionType} ${entityType}`, {
        entityId,
        entityName,
        newValues: req.method !== 'DELETE' ? req.body : undefined,
      }).catch(() => {})
    })

    next()
  }
}
