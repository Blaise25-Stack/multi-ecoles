-- ============================================
-- Migration 007: Ajouter school_id aux tables emploi du temps et liaison
-- SGS Multi-Tenant - Phase 2
-- Date: 2024-12-05
-- ============================================
-- Tables: salles, creneaux_horaires, emploi_temps, classe_matieres, enseignant_affectations
-- ============================================

SELECT '🚀 Migration 007: Tables emploi du temps et liaison' AS status;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: salles
-- =====================================================
SELECT '📋 Migration table: salles' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salles' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE salles ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE salles SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salles' AND CONSTRAINT_NAME = 'fk_salles_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE salles ADD CONSTRAINT fk_salles_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salles' AND INDEX_NAME = 'idx_salles_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_salles_school ON salles(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Contrainte unique code par école
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salles' AND INDEX_NAME = 'code');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE salles DROP INDEX code', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'salles' AND INDEX_NAME = 'unique_salle_code_school');
SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE salles ADD UNIQUE INDEX unique_salle_code_school (code, school_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ salles: ', COUNT(*), ' migrés') AS result FROM salles;

-- =====================================================
-- TABLE: creneaux_horaires
-- =====================================================
SELECT '📋 Migration table: creneaux_horaires' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'creneaux_horaires' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE creneaux_horaires ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE creneaux_horaires SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'creneaux_horaires' AND CONSTRAINT_NAME = 'fk_creneaux_horaires_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE creneaux_horaires ADD CONSTRAINT fk_creneaux_horaires_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'creneaux_horaires' AND INDEX_NAME = 'idx_creneaux_horaires_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_creneaux_horaires_school ON creneaux_horaires(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ creneaux_horaires: ', COUNT(*), ' migrés') AS result FROM creneaux_horaires;

-- =====================================================
-- TABLE: emploi_temps
-- =====================================================
SELECT '📋 Migration table: emploi_temps' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'emploi_temps' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE emploi_temps ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE emploi_temps SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'emploi_temps' AND CONSTRAINT_NAME = 'fk_emploi_temps_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE emploi_temps ADD CONSTRAINT fk_emploi_temps_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'emploi_temps' AND INDEX_NAME = 'idx_emploi_temps_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_emploi_temps_school ON emploi_temps(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ emploi_temps: ', COUNT(*), ' migrés') AS result FROM emploi_temps;

-- =====================================================
-- TABLE: classe_matieres
-- =====================================================
SELECT '📋 Migration table: classe_matieres' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classe_matieres' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE classe_matieres ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE classe_matieres SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classe_matieres' AND CONSTRAINT_NAME = 'fk_classe_matieres_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE classe_matieres ADD CONSTRAINT fk_classe_matieres_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classe_matieres' AND INDEX_NAME = 'idx_classe_matieres_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_classe_matieres_school ON classe_matieres(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ classe_matieres: ', COUNT(*), ' migrés') AS result FROM classe_matieres;

-- =====================================================
-- TABLE: enseignant_affectations
-- =====================================================
SELECT '📋 Migration table: enseignant_affectations' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enseignant_affectations' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE enseignant_affectations ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE enseignant_affectations SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enseignant_affectations' AND CONSTRAINT_NAME = 'fk_enseignant_affectations_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE enseignant_affectations ADD CONSTRAINT fk_enseignant_affectations_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enseignant_affectations' AND INDEX_NAME = 'idx_enseignant_affectations_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_enseignant_affectations_school ON enseignant_affectations(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ enseignant_affectations: ', COUNT(*), ' migrés') AS result FROM enseignant_affectations;

-- =====================================================
-- TABLE: niveaux (optionnel par école)
-- =====================================================
SELECT '📋 Migration table: niveaux' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'niveaux' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE niveaux ADD COLUMN school_id INT NULL COMMENT "NULL = niveau standard RDC, sinon personnalisé par école"', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ne pas migrer vers école default - garder NULL pour standards nationaux
-- UPDATE niveaux SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'niveaux' AND CONSTRAINT_NAME = 'fk_niveaux_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE niveaux ADD CONSTRAINT fk_niveaux_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'niveaux' AND INDEX_NAME = 'idx_niveaux_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_niveaux_school ON niveaux(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT '✅ niveaux: restent standards nationaux (school_id = NULL)' AS result;

-- =====================================================
-- TABLE: filieres (optionnel par école)
-- =====================================================
SELECT '📋 Migration table: filieres' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'filieres' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE filieres ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'filieres' AND CONSTRAINT_NAME = 'fk_filieres_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE filieres ADD CONSTRAINT fk_filieres_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT '✅ filieres: restent standards nationaux (school_id = NULL)' AS result;

-- =====================================================
-- TABLE: cycles (optionnel par école)
-- =====================================================
SELECT '📋 Migration table: cycles' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cycles' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE cycles ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cycles' AND CONSTRAINT_NAME = 'fk_cycles_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE cycles ADD CONSTRAINT fk_cycles_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT '✅ cycles: restent standards nationaux (school_id = NULL)' AS result;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ Migration 007 terminée: Tables emploi du temps tenant-aware' AS status;



