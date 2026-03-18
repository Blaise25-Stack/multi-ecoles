/**
 * ============================================
 * Stats Routes - Statistiques Globales API
 * ============================================
 * Endpoints pour les statistiques SuperAdmin
 */

import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { tenantMiddleware, TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

// GET /api/stats/public - Statistiques publiques pour le site vitrine
router.get('/public', async (_req, res: Response) => {
  try {
    let totalSchools = 0, totalStudents = 0, totalUsers = 0
    try {
      const r = await query<any[]>(`SELECT COUNT(*) as total FROM schools`)
      totalSchools = r[0]?.total || 0
    } catch { /* table may not exist */ }
    try {
      const r = await query<any[]>(`SELECT COUNT(*) as total FROM eleves`)
      totalStudents = r[0]?.total || 0
    } catch { /* */ }
    try {
      const r = await query<any[]>(`SELECT COUNT(*) as total FROM utilisateurs WHERE is_active = 1`)
      totalUsers = r[0]?.total || 0
    } catch { /* */ }
    res.json({ success: true, data: { totalSchools, totalStudents, totalUsers } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// ============================================
// GET /api/stats/platform - Statistiques globales plateforme
// SuperAdmin only
// ============================================
router.get('/platform',
  authenticate,
  authorize('super_admin'),
  async (req, res: Response) => {
    try {
      // Compter les écoles
      let totalSchools = 0, activeSchools = 0
      try {
        const schoolsResult = await query<any[]>(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
          FROM schools
        `)
        totalSchools = schoolsResult[0]?.total || 0
        activeSchools = schoolsResult[0]?.active || 0
      } catch (e) {
        console.warn('Table schools non trouvée')
      }

      // Compter les utilisateurs
      let totalUsers = 0
      try {
        const usersResult = await query<any[]>(`
          SELECT COUNT(*) as total FROM utilisateurs WHERE is_active = 1
        `)
        totalUsers = usersResult[0]?.total || 0
      } catch (e) {
        console.warn('Erreur comptage utilisateurs')
      }

      // Compter les élèves
      let totalStudents = 0
      try {
        const studentsResult = await query<any[]>(`
          SELECT COUNT(*) as total FROM eleves
        `)
        totalStudents = studentsResult[0]?.total || 0
      } catch (e) {
        console.warn('Erreur comptage élèves')
      }

      // Revenus du mois (paiements)
      let currentRevenue = 0, lastMonthRevenue = 0
      try {
        const revenueResult = await query<any[]>(`
          SELECT COALESCE(SUM(montant), 0) as total
          FROM paiements
          WHERE MONTH(date_paiement) = MONTH(CURRENT_DATE())
          AND YEAR(date_paiement) = YEAR(CURRENT_DATE())
        `)
        currentRevenue = revenueResult[0]?.total || 0

        const lastMonthRevenueResult = await query<any[]>(`
          SELECT COALESCE(SUM(montant), 0) as total
          FROM paiements
          WHERE MONTH(date_paiement) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
          AND YEAR(date_paiement) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
        `)
        lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0
      } catch (e) {
        console.warn('Erreur comptage paiements')
      }

      const revenueGrowth = lastMonthRevenue > 0 
        ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
        : 0

      res.json({
        success: true,
        data: {
          totalSchools,
          activeSchools,
          totalUsers,
          totalStudents,
          monthlyRevenue: currentRevenue,
          revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
        },
      })
    } catch (error) {
      console.error('Erreur stats platform:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
      })
    }
  }
)

// ============================================
// GET /api/stats/schools - Liste des écoles avec stats
// SuperAdmin only
// ============================================
router.get('/schools',
  authenticate,
  authorize('super_admin'),
  async (req, res: Response) => {
    try {
      // Requête simplifiée sans sous-requêtes complexes
      const schools = await query<any[]>(`
        SELECT 
          s.id,
          s.code,
          s.name,
          s.currency,
          s.is_active as isActive,
          s.created_at as createdAt
        FROM schools s
        ORDER BY s.name ASC
      `)

      // Enrichir avec les stats pour chaque école
      const schoolsWithStats = await Promise.all(
        schools.map(async (school) => {
          let usersCount = 0, studentsCount = 0, monthlyRevenue = 0, lastActivity = null

          try {
            const users = await query<any[]>(
              'SELECT COUNT(*) as cnt FROM utilisateurs WHERE school_id = ?',
              [school.id]
            )
            usersCount = users[0]?.cnt || 0
          } catch (e) {}

          try {
            const students = await query<any[]>(
              'SELECT COUNT(*) as cnt FROM eleves WHERE school_id = ?',
              [school.id]
            )
            studentsCount = students[0]?.cnt || 0
          } catch (e) {}

          try {
            const activity = await query<any[]>(
              'SELECT MAX(last_login) as last_login FROM utilisateurs WHERE school_id = ?',
              [school.id]
            )
            lastActivity = activity[0]?.last_login || null
          } catch (e) {}

          try {
            const revenue = await query<any[]>(`
              SELECT COALESCE(SUM(montant), 0) as total
              FROM paiements 
              WHERE school_id = ? 
              AND MONTH(date_paiement) = MONTH(CURRENT_DATE())
            `, [school.id])
            monthlyRevenue = revenue[0]?.total || 0
          } catch (e) {}

          // Plan de souscription basé sur les modules
          let subscription: 'free' | 'basic' | 'premium' | 'enterprise' = 'free'
          try {
            const modulesCount = await query<any[]>(
              'SELECT COUNT(*) as cnt FROM school_modules WHERE school_id = ? AND enabled = 1',
              [school.id]
            )
            const cnt = modulesCount[0]?.cnt || 0
            if (cnt > 15) subscription = 'enterprise'
            else if (cnt > 10) subscription = 'premium'
            else if (cnt > 5) subscription = 'basic'
          } catch (e) {}

          return {
            ...school,
            usersCount,
            studentsCount,
            lastActivity,
            monthlyRevenue,
            subscription,
          }
        })
      )

      res.json({
        success: true,
        data: schoolsWithStats,
      })
    } catch (error) {
      console.error('Erreur stats schools:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des écoles',
      })
    }
  }
)

// ============================================
// GET /api/stats/school/:schoolId - Stats d'une école
// SuperAdmin ou Admin de l'école
// ============================================
router.get('/school/:schoolId',
  authenticate,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const { schoolId } = req.params
      const parsedSchoolId = parseInt(schoolId)

      // Vérifier accès
      if (!req.tenant?.isSuper && req.tenant?.id !== parsedSchoolId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        })
      }

      // Stats de l'école
      const [
        schoolInfo,
        usersCount,
        studentsCount,
        classesCount,
        teachersCount,
        monthlyPayments,
        pendingPayments,
      ] = await Promise.all([
        query<any[]>('SELECT * FROM schools WHERE id = ?', [parsedSchoolId]),
        query<any[]>('SELECT COUNT(*) as cnt FROM utilisateurs WHERE school_id = ? AND is_active = 1', [parsedSchoolId]),
        query<any[]>('SELECT COUNT(*) as cnt FROM eleves WHERE school_id = ? AND is_active = TRUE', [parsedSchoolId]),
        query<any[]>('SELECT COUNT(*) as cnt FROM classes WHERE school_id = ?', [parsedSchoolId]),
        query<any[]>('SELECT COUNT(*) as cnt FROM enseignants WHERE school_id = ? AND is_active = TRUE', [parsedSchoolId]),
        query<any[]>(`
          SELECT COALESCE(SUM(montant), 0) as total
          FROM paiements 
          WHERE school_id = ? AND statut = 'valide'
          AND MONTH(date_paiement) = MONTH(CURRENT_DATE())
        `, [parsedSchoolId]),
        query<any[]>(`
          SELECT COALESCE(SUM(montant), 0) as total
          FROM paiements 
          WHERE school_id = ? AND statut = 'en_attente'
        `, [parsedSchoolId]),
      ])

      if (schoolInfo.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'École non trouvée',
        })
      }

      res.json({
        success: true,
        data: {
          school: schoolInfo[0],
          stats: {
            users: usersCount[0].cnt || 0,
            students: studentsCount[0].cnt || 0,
            classes: classesCount[0].cnt || 0,
            teachers: teachersCount[0].cnt || 0,
            monthlyRevenue: monthlyPayments[0].total || 0,
            pendingPayments: pendingPayments[0].total || 0,
          },
        },
      })
    } catch (error) {
      console.error('Erreur stats school:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
      })
    }
  }
)

// ============================================
// GET /api/stats/dashboard - Stats pour le dashboard utilisateur
// Authentifié avec école
// ============================================
router.get('/dashboard',
  authenticate,
  tenantMiddleware,
  async (req: TenantRequest, res: Response) => {
    try {
      const schoolId = req.tenant?.id

      // SuperAdmin sans contexte
      if (req.tenant?.isSuper && !schoolId) {
        return res.json({
          success: true,
          data: {
            isSuperAdmin: true,
            message: 'Accédez à /api/stats/platform pour les stats globales',
          },
        })
      }

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte école requis',
        })
      }

      // Stats de base pour le dashboard
      const [
        studentsCount,
        activeStudents,
        classesCount,
        teachersCount,
        todayPayments,
        monthlyPayments,
      ] = await Promise.all([
        query<any[]>('SELECT COUNT(*) as cnt FROM eleves WHERE school_id = ?', [schoolId]),
        query<any[]>('SELECT COUNT(*) as cnt FROM eleves WHERE school_id = ? AND is_active = TRUE', [schoolId]),
        query<any[]>('SELECT COUNT(*) as cnt FROM classes WHERE school_id = ?', [schoolId]),
        query<any[]>('SELECT COUNT(*) as cnt FROM enseignants WHERE school_id = ? AND is_active = TRUE', [schoolId]),
        query<any[]>(`
          SELECT COALESCE(SUM(montant), 0) as total
          FROM paiements 
          WHERE school_id = ? AND DATE(date_paiement) = CURRENT_DATE() AND statut = 'valide'
        `, [schoolId]),
        query<any[]>(`
          SELECT COALESCE(SUM(montant), 0) as total
          FROM paiements 
          WHERE school_id = ? AND MONTH(date_paiement) = MONTH(CURRENT_DATE()) AND statut = 'valide'
        `, [schoolId]),
      ])

      res.json({
        success: true,
        data: {
          schoolId,
          stats: {
            totalStudents: studentsCount[0].cnt || 0,
            activeStudents: activeStudents[0].cnt || 0,
            classes: classesCount[0].cnt || 0,
            teachers: teachersCount[0].cnt || 0,
            todayRevenue: todayPayments[0].total || 0,
            monthlyRevenue: monthlyPayments[0].total || 0,
          },
        },
      })
    } catch (error) {
      console.error('Erreur stats dashboard:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
      })
    }
  }
)

export default router

