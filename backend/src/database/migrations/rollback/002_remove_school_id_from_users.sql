-- ============================================
-- Rollback 002: Retirer school_id des utilisateurs
-- SGS Multi-Tenant - Phase 1
-- ============================================
-- ⚠️ ATTENTION: Ce script retire l'isolation multi-tenant des utilisateurs
-- ============================================

SELECT '⚠️ ROLLBACK 002: Suppression school_id de utilisateurs' AS warning;

-- Supprimer les index d'abord
DROP INDEX IF EXISTS idx_utilisateurs_school_email ON utilisateurs;
DROP INDEX IF EXISTS idx_utilisateurs_school ON utilisateurs;

-- Supprimer la Foreign Key
ALTER TABLE utilisateurs DROP FOREIGN KEY IF EXISTS fk_utilisateurs_school;

-- Supprimer la colonne
ALTER TABLE utilisateurs DROP COLUMN IF EXISTS school_id;

-- Vérification
SELECT 
  COLUMN_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'utilisateurs'
AND COLUMN_NAME = 'school_id';

SELECT '✅ Rollback 002 terminé: school_id retiré des utilisateurs' AS status;



