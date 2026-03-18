import { Router, Request, Response } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'
import { config } from '../config'
import { query } from '../database/connection'
import path from 'path'
import fs from 'fs'
import jwt from 'jsonwebtoken'

const router = Router()

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups')

function escapeValue(val: any): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return val ? '1' : '0'
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`
  if (Buffer.isBuffer(val)) {
    if (val.length === 0) return "X''"
    return `X'${val.toString('hex')}'`
  }
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\0/g, '\\0')
  return `'${str}'`
}

async function generateSqlDump(): Promise<string> {
  const dbName = config.db.database
  const lines: string[] = []

  lines.push(`-- SQL Dump generated via mysql2 query`)
  lines.push(`-- Database: ${dbName}`)
  lines.push(`-- Date: ${new Date().toISOString()}`)
  lines.push('')
  lines.push(`SET NAMES utf8mb4;`)
  lines.push(`SET FOREIGN_KEY_CHECKS = 0;`)
  lines.push('')

  const tableRows = await query<any[]>(`SHOW TABLES`)
  const tableKey = Object.keys(tableRows[0] || {})[0]
  const tableNames: string[] = tableRows.map((r: any) => r[tableKey])

  for (const table of tableNames) {
    const createRows = await query<any[]>(`SHOW CREATE TABLE \`${table}\``)
    const createSql = createRows[0]['Create Table'] || createRows[0]['Create View']

    lines.push(`-- -------------------------------------------`)
    lines.push(`-- Table: ${table}`)
    lines.push(`-- -------------------------------------------`)
    lines.push(`DROP TABLE IF EXISTS \`${table}\`;`)
    lines.push(`${createSql};`)
    lines.push('')

    if (!createRows[0]['Create Table']) continue // skip views for data

    const rows = await query<any[]>(`SELECT * FROM \`${table}\``)
    if (rows.length === 0) continue

    const columns = Object.keys(rows[0])
    const colList = columns.map(c => `\`${c}\``).join(', ')

    const BATCH_SIZE = 500
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const valueSets = batch.map(
        row => `(${columns.map(c => escapeValue(row[c])).join(', ')})`
      )
      lines.push(`INSERT INTO \`${table}\` (${colList}) VALUES`)
      lines.push(valueSets.join(',\n') + ';')
      lines.push('')
    }
  }

  lines.push(`SET FOREIGN_KEY_CHECKS = 1;`)
  lines.push('')

  return lines.join('\n')
}

// POST /api/backup - Créer une sauvegarde
router.post('/', authenticate, authorize('super_admin', 'admin'), async (req: TenantRequest, res: Response) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup_${config.db.database}_${timestamp}.sql`
    const filepath = path.join(BACKUP_DIR, filename)

    const sqlDump = await generateSqlDump()
    fs.writeFileSync(filepath, sqlDump, 'utf8')

    const stats = fs.statSync(filepath)
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)

    res.json({
      success: true,
      message: 'Sauvegarde créée avec succès',
      data: { filename, size: `${sizeMB} MB`, date: new Date().toISOString() },
    })
  } catch (error: any) {
    console.error('Erreur sauvegarde:', error)
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde: ' + (error.message || '') })
  }
})

// GET /api/backup/list - Liste des sauvegardes
router.get('/list', authenticate, authorize('super_admin', 'admin'), async (req: TenantRequest, res: Response) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json({ success: true, data: [] })
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql'))
      .map(f => {
        const fp = path.join(BACKUP_DIR, f)
        const stats = fs.statSync(fp)
        return {
          filename: f,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          date: stats.mtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    res.json({ success: true, data: files })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/backup/download/:filename - Télécharger une sauvegarde (supporte ?token= pour les liens directs)
router.get('/download/:filename', async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ success: false, message: 'Non authentifié' })

    try {
      jwt.verify(token, config.jwt.secret)
    } catch {
      return res.status(401).json({ success: false, message: 'Token invalide' })
    }

    const { filename } = req.params
    if (filename.includes('..') || !filename.endsWith('.sql')) {
      return res.status(400).json({ success: false, message: 'Nom de fichier invalide' })
    }

    const filepath = path.join(BACKUP_DIR, filename)
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' })
    }

    res.download(filepath, filename)
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
