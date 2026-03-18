-- ============================================
-- Migration 004: Ajouter school_id aux tables académiques
-- SGS Multi-Tenant - Phase 2
-- Date: 2024-12-05
-- ============================================
-- Tables: inscriptions, periodes, notes, bulletins, deliberations, attestations
-- ============================================

SELECT '🚀 Migration 004: Tables académiques' AS status;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: inscriptions
-- =====================================================
SELECT '📋 Migration table: inscriptions' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inscriptions' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE inscriptions ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE inscriptions SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inscriptions' AND CONSTRAINT_NAME = 'fk_inscriptions_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE inscriptions ADD CONSTRAINT fk_inscriptions_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inscriptions' AND INDEX_NAME = 'idx_inscriptions_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_inscriptions_school ON inscriptions(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ inscriptions: ', COUNT(*), ' migrés') AS result FROM inscriptions;

-- =====================================================
-- TABLE: periodes
-- =====================================================
SELECT '📋 Migration table: periodes' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'periodes' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE periodes ADD COLUMN school_id INT NULL AFTER ordre', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE periodes SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'periodes' AND CONSTRAINT_NAME = 'fk_periodes_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE periodes ADD CONSTRAINT fk_periodes_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'periodes' AND INDEX_NAME = 'idx_periodes_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_periodes_school ON periodes(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Modifier contrainte unique
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'periodes' AND INDEX_NAME = 'unique_periode');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE periodes DROP INDEX unique_periode', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'periodes' AND INDEX_NAME = 'unique_periode_school');
SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE periodes ADD UNIQUE INDEX unique_periode_school (code, annee_scolaire_id, school_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ periodes: ', COUNT(*), ' migrés') AS result FROM periodes;

-- =====================================================
-- TABLE: notes
-- =====================================================
SELECT '📋 Migration table: notes' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notes' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE notes ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE notes SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notes' AND CONSTRAINT_NAME = 'fk_notes_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE notes ADD CONSTRAINT fk_notes_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notes' AND INDEX_NAME = 'idx_notes_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_notes_school ON notes(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ notes: ', COUNT(*), ' migrés') AS result FROM notes;

-- =====================================================
-- TABLE: bulletins
-- =====================================================
SELECT '📋 Migration table: bulletins' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bulletins' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE bulletins ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE bulletins SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bulletins' AND CONSTRAINT_NAME = 'fk_bulletins_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE bulletins ADD CONSTRAINT fk_bulletins_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bulletins' AND INDEX_NAME = 'idx_bulletins_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_bulletins_school ON bulletins(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Modifier contrainte unique
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bulletins' AND INDEX_NAME = 'unique_bulletin');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE bulletins DROP INDEX unique_bulletin', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bulletins' AND INDEX_NAME = 'unique_bulletin_school');
SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE bulletins ADD UNIQUE INDEX unique_bulletin_school (eleve_id, classe_id, periode_id, school_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ bulletins: ', COUNT(*), ' migrés') AS result FROM bulletins;

-- =====================================================
-- TABLE: deliberations
-- =====================================================
SELECT '📋 Migration table: deliberations' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deliberations' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE deliberations ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE deliberations SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deliberations' AND CONSTRAINT_NAME = 'fk_deliberations_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE deliberations ADD CONSTRAINT fk_deliberations_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deliberations' AND INDEX_NAME = 'idx_deliberations_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_deliberations_school ON deliberations(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ deliberations: ', COUNT(*), ' migrés') AS result FROM deliberations;

-- =====================================================
-- TABLE: resultats_deliberation
-- =====================================================
SELECT '📋 Migration table: resultats_deliberation' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resultats_deliberation' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE resultats_deliberation ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE resultats_deliberation SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resultats_deliberation' AND CONSTRAINT_NAME = 'fk_resultats_deliberation_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE resultats_deliberation ADD CONSTRAINT fk_resultats_deliberation_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resultats_deliberation' AND INDEX_NAME = 'idx_resultats_deliberation_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_resultats_deliberation_school ON resultats_deliberation(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================================================
-- TABLE: attestations
-- =====================================================
SELECT '📋 Migration table: attestations' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attestations' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE attestations ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE attestations SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attestations' AND CONSTRAINT_NAME = 'fk_attestations_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE attestations ADD CONSTRAINT fk_attestations_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attestations' AND INDEX_NAME = 'idx_attestations_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_attestations_school ON attestations(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ attestations: ', COUNT(*), ' migrés') AS result FROM attestations;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ Migration 004 terminée: Tables académiques tenant-aware' AS status;



