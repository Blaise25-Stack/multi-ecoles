import { Request, Response, NextFunction } from 'express'
import { config } from '../config'
import logger from '../utils/logger'

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`Route non trouvée: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  })
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`,
  })
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500
  const isOperational = err instanceof AppError ? err.isOperational : false

  logger.error(err.message, {
    statusCode,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    isOperational,
  })

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : 'Erreur interne du serveur',
    ...(config.nodeEnv === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  })
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const level = res.statusCode >= 400 ? 'warn' : 'info'
    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
    })
  })

  next()
}
