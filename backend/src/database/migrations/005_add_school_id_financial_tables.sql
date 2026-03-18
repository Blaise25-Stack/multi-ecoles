-- ============================================
-- Migration 005: Ajouter school_id aux tables financières
-- SGS Multi-Tenant - Phase 2
-- Date: 2024-12-05
-- ============================================
-- Tables: frais_scolaires, paiements, factures, facture_lignes, depenses, mouvements_caisse
-- ============================================

SELECT '🚀 Migration 005: Tables financières' AS status;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: frais_scolaires
-- =====================================================
SELECT '📋 Migration table: frais_scolaires' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'frais_scolaires' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE frais_scolaires ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE frais_scolaires SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'frais_scolaires' AND CONSTRAINT_NAME = 'fk_frais_scolaires_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE frais_scolaires ADD CONSTRAINT fk_frais_scolaires_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'frais_scolaires' AND INDEX_NAME = 'idx_frais_scolaires_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_frais_scolaires_school ON frais_scolaires(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ frais_scolaires: ', COUNT(*), ' migrés') AS result FROM frais_scolaires;

-- =====================================================
-- TABLE: paiements
-- =====================================================
SELECT '📋 Migration table: paiements' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'paiements' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE paiements ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE paiements SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'paiements' AND CONSTRAINT_NAME = 'fk_paiements_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE paiements ADD CONSTRAINT fk_paiements_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'paiements' AND INDEX_NAME = 'idx_paiements_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_paiements_school ON paiements(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index composite pour recherches fréquentes
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'paiements' AND INDEX_NAME = 'idx_paiements_school_date');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_paiements_school_date ON paiements(school_id, date_paiement)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ paiements: ', COUNT(*), ' migrés') AS result FROM paiements;

-- =====================================================
-- TABLE: factures
-- =====================================================
SELECT '📋 Migration table: factures' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'factures' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE factures ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE factures SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'factures' AND CONSTRAINT_NAME = 'fk_factures_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE factures ADD CONSTRAINT fk_factures_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'factures' AND INDEX_NAME = 'idx_factures_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_factures_school ON factures(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ factures: ', COUNT(*), ' migrés') AS result FROM factures;

-- =====================================================
-- TABLE: facture_lignes
-- =====================================================
SELECT '📋 Migration table: facture_lignes' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facture_lignes' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE facture_lignes ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE facture_lignes SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facture_lignes' AND CONSTRAINT_NAME = 'fk_facture_lignes_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE facture_lignes ADD CONSTRAINT fk_facture_lignes_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================================================
-- TABLE: depenses
-- =====================================================
SELECT '📋 Migration table: depenses' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'depenses' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE depenses ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE depenses SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'depenses' AND CONSTRAINT_NAME = 'fk_depenses_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE depenses ADD CONSTRAINT fk_depenses_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'depenses' AND INDEX_NAME = 'idx_depenses_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_depenses_school ON depenses(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ depenses: ', COUNT(*), ' migrés') AS result FROM depenses;

-- =====================================================
-- TABLE: mouvements_caisse
-- =====================================================
SELECT '📋 Migration table: mouvements_caisse' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mouvements_caisse' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE mouvements_caisse ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE mouvements_caisse SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mouvements_caisse' AND CONSTRAINT_NAME = 'fk_mouvements_caisse_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE mouvements_caisse ADD CONSTRAINT fk_mouvements_caisse_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mouvements_caisse' AND INDEX_NAME = 'idx_mouvements_caisse_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_mouvements_caisse_school ON mouvements_caisse(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ mouvements_caisse: ', COUNT(*), ' migrés') AS result FROM mouvements_caisse;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ Migration 005 terminée: Tables financières tenant-aware' AS status;



