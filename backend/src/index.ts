import express from 'express'
import cors from 'cors'
import path from 'path'
import { config } from './config'
import { testConnection, query as dbQuery } from './database/connection'
import logger from './utils/logger'
import { notFoundHandler, errorHandler, requestLogger } from './middlewares/error.middleware'
import { authenticate } from './middlewares/auth.middleware'
import { tenantMiddleware } from './middlewares/tenant.middleware'

// Import des routes
import authRoutes from './routes/auth.routes'
import contactRoutes from './routes/contact.routes'
import utilisateursRoutes from './routes/utilisateurs.routes'
import elevesRoutes from './routes/eleves.routes'
import inscriptionsRoutes from './routes/inscriptions.routes'
import classesRoutes from './routes/classes.routes'
import matieresRoutes from './routes/matieres.routes'
import enseignantsRoutes from './routes/enseignants.routes'
import personnelRoutes from './routes/personnel.routes'
import paiementsRoutes from './routes/paiements.routes'
import depensesRoutes from './routes/depenses.routes'
import notesRoutes from './routes/notes.routes'
import congesRoutes from './routes/conges.routes'
import salairesRoutes from './routes/salaires.routes'
import contratsRoutes from './routes/contrats.routes'
import etablissementRoutes from './routes/etablissement.routes'
import dashboardRoutes from './routes/dashboard.routes'
import comptabiliteRoutes from './routes/comptabilite.routes'
import rhRoutes from './routes/rh.routes'
import emploiTempsRoutes from './routes/emploi-temps.routes'
import sallesRoutes from './routes/salles.routes'
// Routes Multi-Tenant
import schoolsRoutes from './routes/schools.routes'
import modulesRoutes from './routes/modules.routes'
import usersRoutes from './routes/users.routes'
import statsRoutes from './routes/stats.routes'
import backupRoutes from './routes/backup.routes'

const app = express()

// Configuration CORS permissive pour le développement
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3004',
      'http://127.0.0.1:3005',
    ]
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-School-Id'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  preflightContinue: false,
  optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

// Fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)))

// Routes publiques (pas de tenant)
app.use('/api/auth', authRoutes)
app.use('/api/contact', contactRoutes)

// Tenant-aware routes: authenticate + tenantMiddleware applied globally
const tenantRouter = express.Router()
tenantRouter.use(authenticate, tenantMiddleware)

tenantRouter.use('/utilisateurs', utilisateursRoutes)
tenantRouter.use('/eleves', elevesRoutes)
tenantRouter.use('/inscriptions', inscriptionsRoutes)
tenantRouter.use('/classes', classesRoutes)
tenantRouter.use('/matieres', matieresRoutes)
tenantRouter.use('/enseignants', enseignantsRoutes)
tenantRouter.use('/personnel', personnelRoutes)
tenantRouter.use('/paiements', paiementsRoutes)
tenantRouter.use('/depenses', depensesRoutes)
tenantRouter.use('/notes', notesRoutes)
tenantRouter.use('/conges', congesRoutes)
tenantRouter.use('/salaires', salairesRoutes)
tenantRouter.use('/contrats', contratsRoutes)
tenantRouter.use('/etablissement', etablissementRoutes)
tenantRouter.use('/dashboard', dashboardRoutes)
tenantRouter.use('/comptabilite', comptabiliteRoutes)
tenantRouter.use('/rh', rhRoutes)
tenantRouter.use('/emploi-temps', emploiTempsRoutes)
tenantRouter.use('/salles', sallesRoutes)

app.use('/api', tenantRouter)

// Routes Multi-Tenant (SuperAdmin) - gèrent leur propre auth/tenant
app.use('/api/schools', schoolsRoutes)
app.use('/api/modules', modulesRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/backup', backupRoutes)

// Route de base
app.get('/api', (req, res) => {
  res.json({
    message: 'API Système de Gestion Scolaire - RDC',
    version: '1.0.0',
    status: 'running',
  })
})

app.use(notFoundHandler)
app.use(errorHandler)

async function seedRolePermissions() {
  try {
    const allModules = [
      'dashboard', 'eleves', 'inscriptions', 'classes', 'matieres', 'notes',
      'bulletins', 'resultats', 'attestations', 'emploi_temps', 'paiements',
      'comptabilite', 'depenses', 'caisse', 'enseignants', 'personnel',
      'presences', 'conges', 'salaires', 'contrats', 'configuration', 'utilisateurs'
    ]
    const allActions = ['create', 'read', 'update', 'delete']

    const rolePerms: Record<string, { module: string; actions: string[] }[]> = {
      admin: allModules.map(m => ({ module: m, actions: allActions })),
      comptable: [
        { module: 'dashboard', actions: ['read'] },
        { module: 'eleves', actions: ['read'] },
        { module: 'inscriptions', actions: ['read'] },
        { module: 'classes', actions: ['read'] },
        { module: 'comptabilite', actions: allActions },
        { module: 'paiements', actions: ['create', 'read', 'update'] },
        { module: 'depenses', actions: ['create', 'read', 'update'] },
        { module: 'caisse', actions: ['create', 'read', 'update'] },
        { module: 'salaires', actions: ['read'] },
      ],
      rh: [
        { module: 'dashboard', actions: ['read'] },
        { module: 'enseignants', actions: allActions },
        { module: 'personnel', actions: allActions },
        { module: 'presences', actions: ['create', 'read', 'update'] },
        { module: 'conges', actions: ['create', 'read', 'update'] },
        { module: 'salaires', actions: ['create', 'read', 'update'] },
        { module: 'contrats', actions: ['create', 'read', 'update'] },
      ],
      enseignant: [
        { module: 'dashboard', actions: ['read'] },
        { module: 'eleves', actions: ['read'] },
        { module: 'inscriptions', actions: ['read'] },
        { module: 'classes', actions: ['read'] },
        { module: 'matieres', actions: ['read'] },
        { module: 'notes', actions: ['create', 'read', 'update'] },
        { module: 'bulletins', actions: ['read'] },
        { module: 'resultats', actions: ['read'] },
        { module: 'emploi_temps', actions: ['read'] },
        { module: 'presences', actions: ['read'] },
        { module: 'conges', actions: ['create', 'read'] },
      ],
    }

    for (const [roleCode, perms] of Object.entries(rolePerms)) {
      const roles = await dbQuery<any[]>(`SELECT id FROM roles WHERE code = ?`, [roleCode])
      if (roles.length === 0) continue
      const roleId = roles[0].id
      for (const perm of perms) {
        for (const action of perm.actions) {
          try {
            const ps = await dbQuery<any[]>(`SELECT id FROM permissions WHERE module = ? AND action = ?`, [perm.module, action])
            if (ps.length > 0) {
              await dbQuery(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, [roleId, ps[0].id])
            }
          } catch { /* ignore */ }
        }
      }
    }

    // Migration: affecter les données orphelines à la première école
    try {
      const schools = await dbQuery<any[]>(`SELECT id FROM schools ORDER BY id LIMIT 1`)
      if (schools.length > 0) {
        const sid = schools[0].id
        const tables = [
          'utilisateurs', 'eleves', 'enseignants', 'personnel', 'classes',
          'inscriptions', 'paiements', 'depenses', 'frais_scolaires', 'notes',
          'contrats', 'conges', 'salaires', 'presences', 'mouvements_caisse',
          'matieres', 'emploi_temps', 'salles', 'annees_scolaires'
        ]
        for (const t of tables) {
          try { await dbQuery(`UPDATE \`${t}\` SET school_id = ? WHERE school_id IS NULL`, [sid]) } catch { /* */ }
        }
      }
    } catch { /* */ }

    logger.info('Permissions et migrations appliquées')
  } catch (err) {
    logger.error('Erreur seed permissions:', err as any)
  }
}

const startServer = async () => {
  const dbConnected = await testConnection()

  if (!dbConnected) {
    logger.error('Impossible de se connecter à la base de données. Vérifiez que MySQL est actif.')
    process.exit(1)
  }

  await seedRolePermissions()

  app.listen(config.port, () => {
    logger.info(`Serveur SGS Backend démarré`, {
      url: `http://localhost:${config.port}`,
      frontend: config.frontendUrl,
      mode: config.nodeEnv,
    })
  })
}

startServer()
