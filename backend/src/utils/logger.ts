import path from 'path'
import fs from 'fs'

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

const LOG_DIR = path.join(__dirname, '..', '..', 'logs')

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

const COLORS: Record<LogLevel, string> = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[90m',
}
const RESET = '\x1b[0m'

function formatTimestamp(): string {
  return new Date().toISOString()
}

function writeToFile(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const logLine = JSON.stringify({
    timestamp: formatTimestamp(),
    level,
    message,
    ...meta,
  }) + '\n'

  const filename = level === 'error' ? 'error.log' : 'combined.log'
  fs.appendFileSync(path.join(LOG_DIR, filename), logLine)

  if (level !== 'error') {
    fs.appendFileSync(path.join(LOG_DIR, 'combined.log'), logLine)
  }
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const color = COLORS[level]
  const ts = formatTimestamp()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
  console.log(`${color}[${ts}] [${level.toUpperCase()}]${RESET} ${message}${metaStr}`)

  writeToFile(level, message, meta)
}

export const logger = {
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
}

export default logger
