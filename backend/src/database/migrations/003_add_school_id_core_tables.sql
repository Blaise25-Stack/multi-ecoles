-- ============================================
-- Migration 003: Ajouter school_id aux tables principales
-- SGS Multi-Tenant - Phase 2
-- Date: 2024-12-05
-- ============================================
-- Tables: eleves, enseignants, personnel, classes, annees_scolaires
-- Dépendance: 002_add_school_id_to_users.sql
-- ============================================

SELECT '🚀 Migration 003: Tables principales' AS status;

-- Désactiver temporairement les vérifications FK
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: eleves
-- =====================================================
SELECT '📋 Migration table: eleves' AS step;

-- Ajouter colonne si n'existe pas
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eleves' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE eleves ADD COLUMN school_id INT NULL AFTER is_active', 
  'SELECT "school_id existe déjà sur eleves" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Assigner école default
UPDATE eleves SET school_id = 1 WHERE school_id IS NULL;

-- Ajouter FK si n'existe pas
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eleves' AND CONSTRAINT_NAME = 'fk_eleves_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE eleves ADD CONSTRAINT fk_eleves_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT "FK existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eleves' AND INDEX_NAME = 'idx_eleves_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_eleves_school ON eleves(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Modifier contrainte unique matricule pour être par école
-- D'abord supprimer l'ancienne contrainte si existe
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eleves' AND INDEX_NAME = 'matricule');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE eleves DROP INDEX matricule', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Créer nouvelle contrainte unique par école
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eleves' AND INDEX_NAME = 'unique_eleve_matricule_school');
SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE eleves ADD UNIQUE INDEX unique_eleve_matricule_school (matricule, school_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ eleves: ', COUNT(*), ' enregistrements migrés') AS result FROM eleves WHERE school_id = 1;

-- =====================================================
-- TABLE: enseignants
-- =====================================================
SELECT '📋 Migration table: enseignants' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enseignants' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE enseignants ADD COLUMN school_id INT NULL AFTER is_active', 
  'SELECT "school_id existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE enseignants SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enseignants' AND CONSTRAINT_NAME = 'fk_enseignants_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE enseignants ADD CONSTRAINT fk_enseignants_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enseignants' AND INDEX_NAME = 'idx_enseignants_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_enseignants_school ON enseignants(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Contrainte unique matricule par école
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enseignants' AND INDEX_NAME = 'matricule');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE enseignants DROP INDEX matricule', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enseignants' AND INDEX_NAME = 'unique_enseignant_matricule_school');
SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE enseignants ADD UNIQUE INDEX unique_enseignant_matricule_school (matricule, school_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ enseignants: ', COUNT(*), ' enregistrements migrés') AS result FROM enseignants WHERE school_id = 1;

-- =====================================================
-- TABLE: personnel
-- =====================================================
SELECT '📋 Migration table: personnel' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'personnel' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE personnel ADD COLUMN school_id INT NULL AFTER is_active', 
  'SELECT "school_id existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE personnel SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'personnel' AND CONSTRAINT_NAME = 'fk_personnel_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE personnel ADD CONSTRAINT fk_personnel_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'personnel' AND INDEX_NAME = 'idx_personnel_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_personnel_school ON personnel(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Contrainte unique matricule par école
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'personnel' AND INDEX_NAME = 'matricule');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE personnel DROP INDEX matricule', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'personnel' AND INDEX_NAME = 'unique_personnel_matricule_school');
SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE personnel ADD UNIQUE INDEX unique_personnel_matricule_school (matricule, school_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ personnel: ', COUNT(*), ' enregistrements') AS result FROM personnel;

-- =====================================================
-- TABLE: classes
-- =====================================================
SELECT '📋 Migration table: classes' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE classes ADD COLUMN school_id INT NULL AFTER salle', 
  'SELECT "school_id existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE classes SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND CONSTRAINT_NAME = 'fk_classes_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE classes ADD CONSTRAINT fk_classes_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND INDEX_NAME = 'idx_classes_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_classes_school ON classes(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Modifier contrainte unique pour inclure school_id
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND INDEX_NAME = 'unique_classe_annee');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE classes DROP INDEX unique_classe_annee', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND INDEX_NAME = 'unique_classe_annee_school');
SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE classes ADD UNIQUE INDEX unique_classe_annee_school (code, annee_scolaire_id, school_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ classes: ', COUNT(*), ' enregistrements migrés') AS result FROM classes WHERE school_id = 1;

-- =====================================================
-- TABLE: annees_scolaires
-- =====================================================
SELECT '📋 Migration table: annees_scolaires' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'annees_scolaires' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE annees_scolaires ADD COLUMN school_id INT NULL AFTER est_active', 
  'SELECT "school_id existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE annees_scolaires SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'annees_scolaires' AND CONSTRAINT_NAME = 'fk_annees_scolaires_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE annees_scolaires ADD CONSTRAINT fk_annees_scolaires_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'annees_scolaires' AND INDEX_NAME = 'idx_annees_scolaires_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_annees_scolaires_school ON annees_scolaires(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Modifier contrainte unique libelle pour être par école
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'annees_scolaires' AND INDEX_NAME = 'libelle');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE annees_scolaires DROP INDEX libelle', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'annees_scolaires' AND INDEX_NAME = 'unique_annee_school');
SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE annees_scolaires ADD UNIQUE INDEX unique_annee_school (libelle, school_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ annees_scolaires: ', COUNT(*), ' enregistrements migrés') AS result FROM annees_scolaires WHERE school_id = 1;

-- =====================================================
-- TABLE: matieres
-- =====================================================
SELECT '📋 Migration table: matieres' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'matieres' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE matieres ADD COLUMN school_id INT NULL AFTER coefficient', 
  'SELECT "school_id existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE matieres SET school_id = 1 WHERE school_id IS NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'matieres' AND CONSTRAINT_NAME = 'fk_matieres_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE matieres ADD CONSTRAINT fk_matieres_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'matieres' AND INDEX_NAME = 'idx_matieres_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_matieres_school ON matieres(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Contrainte unique code par école
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'matieres' AND INDEX_NAME = 'code');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE matieres DROP INDEX code', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'matieres' AND INDEX_NAME = 'unique_matiere_code_school');
SET @sql = IF(@idx_exists = 0, 
  'ALTER TABLE matieres ADD UNIQUE INDEX unique_matiere_code_school (code, school_id)', 
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ matieres: ', COUNT(*), ' enregistrements migrés') AS result FROM matieres WHERE school_id = 1;

-- Réactiver les vérifications FK
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- RÉSUMÉ
-- =====================================================
SELECT '✅ Migration 003 terminée: Tables principales tenant-aware' AS status;

SELECT 
  'eleves' AS tbl, COUNT(*) AS total, SUM(school_id = 1) AS default_school FROM eleves
UNION ALL SELECT 'enseignants', COUNT(*), SUM(school_id = 1) FROM enseignants
UNION ALL SELECT 'personnel', COUNT(*), SUM(school_id = 1) FROM personnel
UNION ALL SELECT 'classes', COUNT(*), SUM(school_id = 1) FROM classes
UNION ALL SELECT 'annees_scolaires', COUNT(*), SUM(school_id = 1) FROM annees_scolaires
UNION ALL SELECT 'matieres', COUNT(*), SUM(school_id = 1) FROM matieres;



