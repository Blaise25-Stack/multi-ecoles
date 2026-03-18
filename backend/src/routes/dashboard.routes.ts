import { Router, Response } from 'express'
import { query } from '../database/connection'
import { authenticate } from '../middlewares/auth.middleware'
import { TenantRequest } from '../middlewares/tenant.middleware'

const router = Router()

function schoolFilter(alias: string, tenant: { id: number | null; isSuper: boolean } | undefined): [string, any[]] {
  if (!tenant || (tenant.isSuper && tenant.id === null)) return ['', []]
  return [` AND ${alias}.school_id = ?`, [tenant.id]]
}

router.get('/stats', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const [sf_e, sp_e] = schoolFilter('e', req.tenant)
    const [sf_i, sp_i] = schoolFilter('i', req.tenant)
    const [sf_ens, sp_ens] = schoolFilter('ens', req.tenant)
    const [sf_c, sp_c] = schoolFilter('c', req.tenant)
    const [sf_p, sp_p] = schoolFilter('p', req.tenant)

    const elevesResult = await query<any[]>(`
      SELECT COUNT(*) as total FROM eleves e WHERE e.is_active = TRUE ${sf_e}
    `, sp_e)
    const totalEleves = elevesResult[0]?.total || 0

    const enseignantsResult = await query<any[]>(`
      SELECT COUNT(*) as total FROM enseignants ens WHERE ens.is_active = TRUE ${sf_ens}
    `, sp_ens)
    const totalEnseignants = enseignantsResult[0]?.total || 0

    const classesResult = await query<any[]>(`
      SELECT COUNT(*) as total FROM classes c
      JOIN annees_scolaires a ON c.annee_scolaire_id = a.id
      WHERE a.est_active = TRUE ${sf_c}
    `, sp_c)
    const totalClasses = classesResult[0]?.total || 0

    const recouvrementResult = await query<any[]>(`
      SELECT COALESCE(SUM(p.montant), 0) as total_paye
      FROM paiements p
      JOIN annees_scolaires a ON p.annee_scolaire_id = a.id
      WHERE a.est_active = TRUE AND p.statut = 'valide' ${sf_p}
    `, sp_p)
    const totalPaye = recouvrementResult[0]?.total_paye || 0

    const prevuResult = await query<any[]>(`
      SELECT COUNT(i.id) * COALESCE((SELECT AVG(montant) FROM frais_scolaires), 0) as total_prevu
      FROM inscriptions i
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id
      WHERE a.est_active = TRUE AND i.statut = 'validee' ${sf_i}
    `, sp_i)
    const totalPrevu = prevuResult[0]?.total_prevu || 1
    const tauxRecouvrement = totalPrevu > 0 ? (totalPaye / totalPrevu) * 100 : 0

    const sexeResult = await query<any[]>(`
      SELECT sexe, COUNT(*) as count
      FROM eleves e
      WHERE e.is_active = TRUE ${sf_e}
      GROUP BY sexe
    `, sp_e)
    const repartitionSexe = {
      garcons: sexeResult.find(r => r.sexe === 'M')?.count || 0,
      filles: sexeResult.find(r => r.sexe === 'F')?.count || 0,
    }

    const niveauxResult = await query<any[]>(`
      SELECT COALESCE(n.libelle, 'Non assigné') as niveau, COUNT(DISTINCT e.id) as count
      FROM eleves e
      LEFT JOIN inscriptions i ON e.id = i.eleve_id
        AND i.annee_scolaire_id IN (SELECT id FROM annees_scolaires WHERE est_active = TRUE)
        AND i.statut = 'validee'
      LEFT JOIN classes c ON i.classe_id = c.id
      LEFT JOIN niveaux n ON c.niveau_id = n.id
      WHERE e.is_active = TRUE ${sf_e}
      GROUP BY n.id, n.libelle
      ORDER BY count DESC
    `, sp_e)

    const recettesResult = await query<any[]>(`
      SELECT DATE_FORMAT(date_paiement, '%b %Y') as mois, SUM(montant) as montant
      FROM paiements p
      WHERE p.statut = 'valide' AND p.date_paiement >= DATE_SUB(NOW(), INTERVAL 12 MONTH) ${sf_p}
      GROUP BY DATE_FORMAT(date_paiement, '%Y-%m'), DATE_FORMAT(date_paiement, '%b %Y')
      ORDER BY DATE_FORMAT(date_paiement, '%Y-%m') ASC
    `, sp_p)

    const alertes: { type: string; message: string }[] = []

    const retardResult = await query<any[]>(`
      SELECT COUNT(DISTINCT e.id) as count
      FROM eleves e
      JOIN inscriptions i ON e.id = i.eleve_id ${sf_e}
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id AND a.est_active = TRUE
      LEFT JOIN paiements p ON e.id = p.eleve_id AND p.annee_scolaire_id = a.id
      WHERE i.statut = 'validee'
      GROUP BY e.id
      HAVING COALESCE(SUM(p.montant), 0) = 0
    `, sp_e)
    const elevesEnRetard = retardResult.length || 0
    if (elevesEnRetard > 0) {
      alertes.push({
        type: 'warning',
        message: `${elevesEnRetard} élève(s) n'ont effectué aucun paiement cette année`,
      })
    }

    const inscAttente = await query<any[]>(`
      SELECT COUNT(*) as count FROM inscriptions i
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id AND a.est_active = TRUE
      WHERE i.statut = 'en_attente' ${sf_i}
    `, sp_i)
    if (inscAttente[0]?.count > 0) {
      alertes.push({ type: 'info', message: `${inscAttente[0].count} inscription(s) en attente de validation` })
    }

    const [sf_cong, sp_cong] = schoolFilter('conges', req.tenant)
    const congesAttente = await query<any[]>(`SELECT COUNT(*) as count FROM conges WHERE statut = 'en_attente'${sf_cong}`, sp_cong)
    if (congesAttente[0]?.count > 0) {
      alertes.push({ type: 'info', message: `${congesAttente[0].count} demande(s) de congé en attente` })
    }

    if (alertes.length === 0) {
      alertes.push({ type: 'success', message: 'Tout est en ordre ! Aucune alerte pour le moment.' })
    }

    res.json({
      success: true,
      data: {
        totalEleves,
        totalEnseignants,
        totalClasses,
        tauxRecouvrement: Math.min(tauxRecouvrement, 100),
        repartitionSexe,
        elevesParNiveau: niveauxResult.map(n => ({ niveau: n.niveau, count: n.count })),
        recettesParMois: recettesResult.map(r => ({ mois: r.mois, montant: parseFloat(r.montant) || 0 })),
        alertes,
      },
    })
  } catch (error) {
    console.error('Erreur dashboard stats:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.get('/paiements-recents', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const [sf, sp] = schoolFilter('p', req.tenant)
    const paiements = await query<any[]>(`
      SELECT p.id, p.montant, p.date_paiement, p.mode_paiement, p.reference_paiement,
             e.nom, e.prenom, e.matricule, tf.libelle as type_frais
      FROM paiements p
      JOIN eleves e ON p.eleve_id = e.id
      LEFT JOIN types_frais tf ON p.type_frais_id = tf.id
      WHERE p.statut = 'valide' ${sf}
      ORDER BY p.date_paiement DESC LIMIT 10
    `, sp)
    res.json({ success: true, data: paiements })
  } catch (error) {
    console.error('Erreur paiements récents:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.get('/inscriptions-recentes', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const [sf, sp] = schoolFilter('i', req.tenant)
    const inscriptions = await query<any[]>(`
      SELECT i.id, i.numero, i.date_inscription, i.statut, i.type_inscription,
             e.nom, e.prenom, e.matricule, c.libelle as classe
      FROM inscriptions i
      LEFT JOIN eleves e ON i.eleve_id = e.id
      LEFT JOIN classes c ON i.classe_id = c.id
      JOIN annees_scolaires a ON i.annee_scolaire_id = a.id AND a.est_active = TRUE
      WHERE 1=1 ${sf}
      ORDER BY i.created_at DESC LIMIT 10
    `, sp)
    res.json({ success: true, data: inscriptions })
  } catch (error) {
    console.error('Erreur inscriptions récentes:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.get('/evolution-paiements', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const [sf, sp] = schoolFilter('p', req.tenant)
    const evolution = await query<any[]>(`
      SELECT DATE_FORMAT(date_paiement, '%Y-%m') as mois,
             DATE_FORMAT(date_paiement, '%b') as mois_label,
             SUM(montant) as total
      FROM paiements p
      WHERE p.statut = 'valide' AND p.date_paiement >= DATE_SUB(NOW(), INTERVAL 12 MONTH) ${sf}
      GROUP BY DATE_FORMAT(date_paiement, '%Y-%m'), DATE_FORMAT(date_paiement, '%b')
      ORDER BY mois ASC
    `, sp)
    res.json({ success: true, data: evolution })
  } catch (error) {
    console.error('Erreur évolution paiements:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.get('/repartition-eleves', authenticate, async (req: TenantRequest, res: Response) => {
  try {
    const [sf, sp] = schoolFilter('c', req.tenant)
    const repartition = await query<any[]>(`
      SELECT c.libelle as classe, COUNT(i.id) as effectif
      FROM classes c
      JOIN annees_scolaires a ON c.annee_scolaire_id = a.id AND a.est_active = TRUE
      LEFT JOIN inscriptions i ON c.id = i.classe_id AND i.statut = 'validee'
      WHERE 1=1 ${sf}
      GROUP BY c.id, c.libelle
      ORDER BY effectif DESC
    `, sp)
    res.json({ success: true, data: repartition })
  } catch (error) {
    console.error('Erreur répartition élèves:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
