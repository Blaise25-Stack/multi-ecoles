-- ============================================
-- Rollback 001: Supprimer table schools
-- SGS Multi-Tenant - Phase 1
-- ============================================
-- ⚠️ ATTENTION: Ce script supprime les tables schools et school_settings
-- Exécuter uniquement si aucune FK n'existe vers ces tables
-- ============================================

-- Vérifier les FK existantes vers schools
SELECT '⚠️ Vérification des Foreign Keys vers schools:' AS warning;

SELECT 
  TABLE_NAME, 
  COLUMN_NAME, 
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME = 'schools'
AND TABLE_SCHEMA = DATABASE();

-- Si des FK existent, ce script échouera (sécurité)
-- Supprimer d'abord les FK manuellement si nécessaire

-- Supprimer les tables dans l'ordre (dépendances d'abord)
DROP TABLE IF EXISTS school_settings;
DROP TABLE IF EXISTS schools;

SELECT '✅ Rollback 001 terminé: Tables schools supprimées' AS status;



