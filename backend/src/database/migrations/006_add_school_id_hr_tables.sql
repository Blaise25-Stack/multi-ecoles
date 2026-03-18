-- ============================================
-- Migration 006: Ajouter school_id aux tables RH
-- SGS Multi-Tenant - Phase 2
-- Date: 2024-12-05
-- ============================================
-- Tables: salaires, conges, contrats, presences
-- ============================================

SELECT '🚀 Migration 006: Tables RH' AS status;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: salaires
-- =====================================================
SELECT '📋 Migration table: salaires' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salaires' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE salaires ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE salaires SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salaires' AND CONSTRAINT_NAME = 'fk_salaires_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE salaires ADD CONSTRAINT fk_salaires_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salaires' AND INDEX_NAME = 'idx_salaires_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_salaires_school ON salaires(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Modifier contrainte unique pour inclure school_id
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salaires' AND INDEX_NAME = 'unique_salaire');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE salaires DROP INDEX unique_salaire', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salaires' AND INDEX_NAME = 'unique_salaire_school');
SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE salaires ADD UNIQUE INDEX unique_salaire_school (employe_type, employe_id, mois, annee, school_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ salaires: ', COUNT(*), ' migrés') AS result FROM salaires;

-- =====================================================
-- TABLE: conges
-- =====================================================
SELECT '📋 Migration table: conges' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conges' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE conges ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE conges SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conges' AND CONSTRAINT_NAME = 'fk_conges_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE conges ADD CONSTRAINT fk_conges_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conges' AND INDEX_NAME = 'idx_conges_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_conges_school ON conges(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ conges: ', COUNT(*), ' migrés') AS result FROM conges;

-- =====================================================
-- TABLE: contrats
-- =====================================================
SELECT '📋 Migration table: contrats' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contrats' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE contrats ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE contrats SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contrats' AND CONSTRAINT_NAME = 'fk_contrats_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE contrats ADD CONSTRAINT fk_contrats_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contrats' AND INDEX_NAME = 'idx_contrats_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_contrats_school ON contrats(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ contrats: ', COUNT(*), ' migrés') AS result FROM contrats;

-- =====================================================
-- TABLE: presences
-- =====================================================
SELECT '📋 Migration table: presences' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'presences' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE presences ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE presences SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'presences' AND CONSTRAINT_NAME = 'fk_presences_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE presences ADD CONSTRAINT fk_presences_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'presences' AND INDEX_NAME = 'idx_presences_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_presences_school ON presences(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Modifier contrainte unique pour inclure school_id
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'presences' AND INDEX_NAME = 'unique_presence');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE presences DROP INDEX unique_presence', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'presences' AND INDEX_NAME = 'unique_presence_school');
SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE presences ADD UNIQUE INDEX unique_presence_school (employe_type, employe_id, date_presence, school_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ presences: ', COUNT(*), ' migrés') AS result FROM presences;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ Migration 006 terminée: Tables RH tenant-aware' AS status;



