-- ============================================
-- Rollback Phase 2: Retirer school_id de toutes les tables
-- SGS Multi-Tenant
-- ============================================
-- ⚠️ ATTENTION: Ce script retire l'isolation multi-tenant !
-- À utiliser uniquement en cas de problème majeur
-- ============================================

SELECT '⚠️ ROLLBACK PHASE 2: Suppression school_id de toutes les tables' AS warning;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- Supprimer table school_modules (Migration 009)
-- =====================================================
DROP TABLE IF EXISTS school_modules;
DROP TABLE IF EXISTS available_modules;

-- =====================================================
-- Tables communication (Migration 008)
-- =====================================================
ALTER TABLE notifications DROP FOREIGN KEY IF EXISTS fk_notifications_school;
ALTER TABLE notifications DROP COLUMN IF EXISTS school_id;

ALTER TABLE messages_contact DROP FOREIGN KEY IF EXISTS fk_messages_contact_school;
ALTER TABLE messages_contact DROP COLUMN IF EXISTS school_id;

ALTER TABLE logs_systeme DROP FOREIGN KEY IF EXISTS fk_logs_systeme_school;
ALTER TABLE logs_systeme DROP COLUMN IF EXISTS school_id;

ALTER TABLE historique_connexions DROP FOREIGN KEY IF EXISTS fk_historique_connexions_school;
ALTER TABLE historique_connexions DROP COLUMN IF EXISTS school_id;

-- =====================================================
-- Tables emploi du temps (Migration 007)
-- =====================================================
ALTER TABLE salles DROP FOREIGN KEY IF EXISTS fk_salles_school;
ALTER TABLE salles DROP COLUMN IF EXISTS school_id;

ALTER TABLE creneaux_horaires DROP FOREIGN KEY IF EXISTS fk_creneaux_horaires_school;
ALTER TABLE creneaux_horaires DROP COLUMN IF EXISTS school_id;

ALTER TABLE emploi_temps DROP FOREIGN KEY IF EXISTS fk_emploi_temps_school;
ALTER TABLE emploi_temps DROP COLUMN IF EXISTS school_id;

ALTER TABLE classe_matieres DROP FOREIGN KEY IF EXISTS fk_classe_matieres_school;
ALTER TABLE classe_matieres DROP COLUMN IF EXISTS school_id;

ALTER TABLE enseignant_affectations DROP FOREIGN KEY IF EXISTS fk_enseignant_affectations_school;
ALTER TABLE enseignant_affectations DROP COLUMN IF EXISTS school_id;

ALTER TABLE niveaux DROP FOREIGN KEY IF EXISTS fk_niveaux_school;
ALTER TABLE niveaux DROP COLUMN IF EXISTS school_id;

ALTER TABLE filieres DROP FOREIGN KEY IF EXISTS fk_filieres_school;
ALTER TABLE filieres DROP COLUMN IF EXISTS school_id;

ALTER TABLE cycles DROP FOREIGN KEY IF EXISTS fk_cycles_school;
ALTER TABLE cycles DROP COLUMN IF EXISTS school_id;

-- =====================================================
-- Tables RH (Migration 006)
-- =====================================================
ALTER TABLE salaires DROP FOREIGN KEY IF EXISTS fk_salaires_school;
ALTER TABLE salaires DROP COLUMN IF EXISTS school_id;

ALTER TABLE conges DROP FOREIGN KEY IF EXISTS fk_conges_school;
ALTER TABLE conges DROP COLUMN IF EXISTS school_id;

ALTER TABLE contrats DROP FOREIGN KEY IF EXISTS fk_contrats_school;
ALTER TABLE contrats DROP COLUMN IF EXISTS school_id;

ALTER TABLE presences DROP FOREIGN KEY IF EXISTS fk_presences_school;
ALTER TABLE presences DROP COLUMN IF EXISTS school_id;

-- =====================================================
-- Tables financières (Migration 005)
-- =====================================================
ALTER TABLE frais_scolaires DROP FOREIGN KEY IF EXISTS fk_frais_scolaires_school;
ALTER TABLE frais_scolaires DROP COLUMN IF EXISTS school_id;

ALTER TABLE paiements DROP FOREIGN KEY IF EXISTS fk_paiements_school;
ALTER TABLE paiements DROP COLUMN IF EXISTS school_id;

ALTER TABLE factures DROP FOREIGN KEY IF EXISTS fk_factures_school;
ALTER TABLE factures DROP COLUMN IF EXISTS school_id;

ALTER TABLE facture_lignes DROP FOREIGN KEY IF EXISTS fk_facture_lignes_school;
ALTER TABLE facture_lignes DROP COLUMN IF EXISTS school_id;

ALTER TABLE depenses DROP FOREIGN KEY IF EXISTS fk_depenses_school;
ALTER TABLE depenses DROP COLUMN IF EXISTS school_id;

ALTER TABLE mouvements_caisse DROP FOREIGN KEY IF EXISTS fk_mouvements_caisse_school;
ALTER TABLE mouvements_caisse DROP COLUMN IF EXISTS school_id;

-- =====================================================
-- Tables académiques (Migration 004)
-- =====================================================
ALTER TABLE inscriptions DROP FOREIGN KEY IF EXISTS fk_inscriptions_school;
ALTER TABLE inscriptions DROP COLUMN IF EXISTS school_id;

ALTER TABLE periodes DROP FOREIGN KEY IF EXISTS fk_periodes_school;
ALTER TABLE periodes DROP COLUMN IF EXISTS school_id;

ALTER TABLE notes DROP FOREIGN KEY IF EXISTS fk_notes_school;
ALTER TABLE notes DROP COLUMN IF EXISTS school_id;

ALTER TABLE bulletins DROP FOREIGN KEY IF EXISTS fk_bulletins_school;
ALTER TABLE bulletins DROP COLUMN IF EXISTS school_id;

ALTER TABLE deliberations DROP FOREIGN KEY IF EXISTS fk_deliberations_school;
ALTER TABLE deliberations DROP COLUMN IF EXISTS school_id;

ALTER TABLE resultats_deliberation DROP FOREIGN KEY IF EXISTS fk_resultats_deliberation_school;
ALTER TABLE resultats_deliberation DROP COLUMN IF EXISTS school_id;

ALTER TABLE attestations DROP FOREIGN KEY IF EXISTS fk_attestations_school;
ALTER TABLE attestations DROP COLUMN IF EXISTS school_id;

-- =====================================================
-- Tables principales (Migration 003)
-- =====================================================
ALTER TABLE eleves DROP FOREIGN KEY IF EXISTS fk_eleves_school;
ALTER TABLE eleves DROP COLUMN IF EXISTS school_id;

ALTER TABLE enseignants DROP FOREIGN KEY IF EXISTS fk_enseignants_school;
ALTER TABLE enseignants DROP COLUMN IF EXISTS school_id;

ALTER TABLE personnel DROP FOREIGN KEY IF EXISTS fk_personnel_school;
ALTER TABLE personnel DROP COLUMN IF EXISTS school_id;

ALTER TABLE classes DROP FOREIGN KEY IF EXISTS fk_classes_school;
ALTER TABLE classes DROP COLUMN IF EXISTS school_id;

ALTER TABLE annees_scolaires DROP FOREIGN KEY IF EXISTS fk_annees_scolaires_school;
ALTER TABLE annees_scolaires DROP COLUMN IF EXISTS school_id;

ALTER TABLE matieres DROP FOREIGN KEY IF EXISTS fk_matieres_school;
ALTER TABLE matieres DROP COLUMN IF EXISTS school_id;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ Rollback Phase 2 terminé' AS status;



