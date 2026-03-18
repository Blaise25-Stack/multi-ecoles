import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate, checkPermission } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const storage = multer.diskStorage({
  destination: 'uploads/etablissement/',
  filename: (req, file, cb) => cb(null, `logo-${uuidv4()}${path.extname(file.originalname)}`),
})
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } })

// GET /api/etablissement - Infos établissement (tenant-aware)
router.get('/', async (req: TenantRequest, res) => {
  try {
    const schoolId = req.tenant?.id
    if (schoolId) {
      const schools = await query<any[]>(`SELECT * FROM schools WHERE id = ?`, [schoolId])
      if (schools.length > 0) {
        const school = schools[0]
        const etablissements = await query<any[]>(`SELECT * FROM etablissement LIMIT 1`)
        const etab = etablissements.length > 0 ? etablissements[0] : {}
        return res.json({
          success: true,
          data: {
            ...etab,
            nom: school.name || etab.nom,
            devise: school.currency || etab.devise,
            adresse: school.address || etab.adresse,
            telephone: school.phone || etab.telephone,
            email: school.email || etab.email,
            logo: school.logo || etab.logo,
          },
        })
      }
    }
    const etablissements = await query<any[]>(`SELECT * FROM etablissement LIMIT 1`)
    if (etablissements.length === 0) {
      return res.json({ success: true, data: null })
    }
    res.json({ success: true, data: etablissements[0] })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/etablissement - Modifier infos établissement
router.put('/', authenticate, checkPermission('configuration', 'update'), upload.single('logo'), async (req: TenantRequest, res: Response) => {
  try {
    const { nom, devise, adresse, telephone, email, site_web, ministere, province } = req.body

    const schoolId = req.tenant?.id

    if (schoolId) {
      const schoolUpdates: string[] = []
      const schoolParams: any[] = []

      if (nom) { schoolUpdates.push('name = ?'); schoolParams.push(nom) }
      if (devise !== undefined) { schoolUpdates.push('currency = ?'); schoolParams.push(devise) }
      if (adresse !== undefined) { schoolUpdates.push('address = ?'); schoolParams.push(adresse) }
      if (telephone !== undefined) { schoolUpdates.push('phone = ?'); schoolParams.push(telephone) }
      if (email !== undefined) { schoolUpdates.push('email = ?'); schoolParams.push(email) }
      if (req.file) {
        schoolUpdates.push('logo = ?')
        schoolParams.push(`/uploads/etablissement/${req.file.filename}`)
      }

      if (schoolUpdates.length > 0) {
        schoolParams.push(schoolId)
        await query(`UPDATE schools SET ${schoolUpdates.join(', ')} WHERE id = ?`, schoolParams)
      }
    } else {
      const updates: string[] = []
      const params: any[] = []

      if (nom) { updates.push('nom = ?'); params.push(nom) }
      if (devise !== undefined) { updates.push('devise = ?'); params.push(devise) }
      if (adresse !== undefined) { updates.push('adresse = ?'); params.push(adresse) }
      if (telephone !== undefined) { updates.push('telephone = ?'); params.push(telephone) }
      if (email !== undefined) { updates.push('email = ?'); params.push(email) }
      if (site_web !== undefined) { updates.push('site_web = ?'); params.push(site_web) }
      if (ministere !== undefined) { updates.push('ministere = ?'); params.push(ministere) }
      if (province !== undefined) { updates.push('province = ?'); params.push(province) }

      if (req.file) {
        updates.push('logo = ?')
        params.push(`/uploads/etablissement/${req.file.filename}`)
      }

      if (updates.length > 0) {
        const existing = await query<any[]>(`SELECT id FROM etablissement LIMIT 1`)
        if (existing.length > 0) {
          params.push(existing[0].id)
          await query(`UPDATE etablissement SET ${updates.join(', ')} WHERE id = ?`, params)
        } else {
          await query(`
            INSERT INTO etablissement (nom, devise, adresse, telephone, email, site_web, ministere, province, logo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [nom || 'École', devise || null, adresse || null, telephone || null, email || null, site_web || null, ministere || null, province || null, req.file ? `/uploads/etablissement/${req.file.filename}` : null])
        }
      }
    }

    res.json({ success: true, message: 'Établissement mis à jour' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/etablissement/annee-active
router.get('/annee-active', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const sf = schoolId ? ' AND school_id = ?' : ''
    const sfp = schoolId ? [schoolId] : []
    const annees = await query<any[]>(`SELECT * FROM annees_scolaires WHERE est_active = TRUE${sf} LIMIT 1`, sfp)
    res.json({ success: true, data: annees.length > 0 ? annees[0] : null })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/etablissement/annees-scolaires
router.get('/annees-scolaires', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const schoolId = req.tenant?.id
    const sf = schoolId ? ' WHERE school_id = ?' : ''
    const sfp = schoolId ? [schoolId] : []
    const annees = await query<any[]>(`SELECT * FROM annees_scolaires${sf} ORDER BY date_debut DESC`, sfp)
    res.json({ success: true, data: annees })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/etablissement/annees-scolaires
router.post('/annees-scolaires', authenticate, checkPermission('configuration', 'create'), async (req: TenantRequest, res: Response) => {
  try {
    const { libelle, date_debut, date_fin, activer } = req.body
    if (!libelle || !date_debut || !date_fin) {
      return res.status(400).json({ success: false, message: 'Libellé, date début et fin requis' })
    }
    const schoolId = req.tenant?.id

    if (activer) {
      const sf = schoolId ? ' AND school_id = ?' : ''
      const sfp = schoolId ? [schoolId] : []
      await query(`UPDATE annees_scolaires SET est_active = FALSE WHERE 1=1${sf}`, sfp)
    }

    const result = await query<any>(`
      INSERT INTO annees_scolaires (libelle, date_debut, date_fin, est_active, school_id)
      VALUES (?, ?, ?, ?, ?)
    `, [libelle, date_debut, date_fin, activer || false, schoolId || null])

    res.status(201).json({ success: true, message: 'Année scolaire créée', data: { id: result.insertId } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router



