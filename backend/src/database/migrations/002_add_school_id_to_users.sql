-- ============================================
-- Migration 002: Ajouter school_id aux utilisateurs
-- SGS Multi-Tenant - Phase 1
-- Date: 2024-12-05
-- ============================================
-- Description: Rendre les utilisateurs tenant-aware
-- Dépendance: 001_create_schools_table.sql
-- Rollback: migrations/rollback/002_remove_school_id_from_users.sql
-- ============================================

-- Vérifier que la table schools existe
SELECT 'Vérification prérequis...' AS step;
SELECT COUNT(*) AS schools_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'schools';

-- =====================================================
-- ÉTAPE 1: Ajouter colonne school_id (nullable d'abord)
-- =====================================================
SELECT 'Étape 1: Ajout colonne school_id...' AS step;

-- Vérifier si la colonne existe déjà
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'utilisateurs' 
  AND COLUMN_NAME = 'school_id'
);

-- Ajouter la colonne si elle n'existe pas
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE utilisateurs ADD COLUMN school_id INT NULL COMMENT ''École de rattachement. NULL = SuperAdmin (accès global)'' AFTER role_id',
  'SELECT ''Colonne school_id existe déjà'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- ÉTAPE 2: Assigner école default aux users existants
-- =====================================================
SELECT 'Étape 2: Assignation école default...' AS step;

-- Mettre tous les utilisateurs existants dans l'école default (id=1)
UPDATE utilisateurs 
SET school_id = 1 
WHERE school_id IS NULL;

-- Afficher le résultat
SELECT 
  COUNT(*) AS total_users,
  SUM(CASE WHEN school_id = 1 THEN 1 ELSE 0 END) AS assigned_to_default
FROM utilisateurs;

-- =====================================================
-- ÉTAPE 3: SuperAdmin reste NULL (accès global)
-- =====================================================
SELECT 'Étape 3: Configuration SuperAdmin...' AS step;

-- Le SuperAdmin (role_code = 'super_admin') doit avoir school_id = NULL
-- pour indiquer qu'il a accès à toutes les écoles
UPDATE utilisateurs u
INNER JOIN roles r ON u.role_id = r.id
SET u.school_id = NULL
WHERE r.code = 'super_admin';

-- Afficher les SuperAdmins
SELECT 
  u.id, 
  u.email, 
  u.nom, 
  u.prenom,
  r.code AS role_code,
  u.school_id,
  CASE WHEN u.school_id IS NULL THEN 'Oui (accès global)' ELSE 'Non' END AS is_super_admin
FROM utilisateurs u
JOIN roles r ON u.role_id = r.id
WHERE r.code = 'super_admin';

-- =====================================================
-- ÉTAPE 4: Ajouter Foreign Key
-- =====================================================
SELECT 'Étape 4: Ajout Foreign Key...' AS step;

-- Vérifier si la FK existe déjà
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'utilisateurs'
  AND CONSTRAINT_NAME = 'fk_utilisateurs_school'
);

-- Ajouter la FK si elle n'existe pas
-- Note: ON DELETE RESTRICT pour empêcher la suppression d'une école avec des users
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE utilisateurs ADD CONSTRAINT fk_utilisateurs_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT ''FK fk_utilisateurs_school existe déjà'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- ÉTAPE 5: Ajouter index pour performance
-- =====================================================
SELECT 'Étape 5: Ajout index...' AS step;

-- Vérifier si l'index existe déjà
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'utilisateurs'
  AND INDEX_NAME = 'idx_utilisateurs_school'
);

SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_utilisateurs_school ON utilisateurs(school_id)',
  'SELECT ''Index idx_utilisateurs_school existe déjà'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index composite pour recherche par école + email
SET @idx2_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'utilisateurs'
  AND INDEX_NAME = 'idx_utilisateurs_school_email'
);

SET @sql = IF(@idx2_exists = 0,
  'CREATE INDEX idx_utilisateurs_school_email ON utilisateurs(school_id, email)',
  'SELECT ''Index idx_utilisateurs_school_email existe déjà'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================
SELECT 'Vérification finale...' AS step;

-- Structure de la table
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'utilisateurs'
AND COLUMN_NAME = 'school_id';

-- Récapitulatif des utilisateurs par école
SELECT 
  COALESCE(s.name, 'SuperAdmin (Global)') AS school_name,
  COUNT(u.id) AS user_count
FROM utilisateurs u
LEFT JOIN schools s ON u.school_id = s.id
GROUP BY u.school_id, s.name
ORDER BY u.school_id IS NULL DESC, s.name;

-- Liste des utilisateurs avec leur école
SELECT 
  u.id,
  u.email,
  CONCAT(u.prenom, ' ', u.nom) AS full_name,
  r.code AS role,
  u.school_id,
  COALESCE(s.name, '🔐 SuperAdmin') AS school_name
FROM utilisateurs u
JOIN roles r ON u.role_id = r.id
LEFT JOIN schools s ON u.school_id = s.id
ORDER BY u.school_id IS NULL DESC, u.school_id, u.id;

SELECT '✅ Migration 002 terminée: school_id ajouté aux utilisateurs' AS status;



