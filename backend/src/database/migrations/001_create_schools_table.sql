-- ============================================
-- Migration 001: Créer table schools
-- SGS Multi-Tenant - Phase 1
-- Date: 2024-12-05
-- ============================================
-- Description: Table principale pour le multi-tenancy
-- Rollback: migrations/rollback/001_drop_schools_table.sql
-- ============================================

-- Vérifier qu'on est sur la bonne base
SELECT DATABASE() AS current_database;

-- =====================================================
-- TABLE SCHOOLS (Établissements scolaires)
-- =====================================================
CREATE TABLE IF NOT EXISTS schools (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Identification
  code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Code unique (ex: ECO001, LYC002)',
  name VARCHAR(255) NOT NULL COMMENT 'Nom complet de l établissement',
  short_name VARCHAR(100) COMMENT 'Nom court / sigle',
  
  -- Informations de contact
  address TEXT COMMENT 'Adresse complète',
  city VARCHAR(100) COMMENT 'Ville',
  province VARCHAR(100) DEFAULT 'Kinshasa' COMMENT 'Province RDC',
  country VARCHAR(50) DEFAULT 'RDC' COMMENT 'Pays',
  telephone VARCHAR(50) COMMENT 'Téléphone principal',
  telephone_2 VARCHAR(50) COMMENT 'Téléphone secondaire',
  email VARCHAR(255) COMMENT 'Email de contact',
  website VARCHAR(255) COMMENT 'Site web',
  whatsapp_number VARCHAR(50) COMMENT 'Numéro WhatsApp',
  
  -- Configuration
  currency VARCHAR(10) DEFAULT 'FC' COMMENT 'Devise (FC, USD)',
  timezone VARCHAR(50) DEFAULT 'Africa/Kinshasa' COMMENT 'Fuseau horaire',
  locale VARCHAR(10) DEFAULT 'fr_CD' COMMENT 'Langue/locale',
  logo VARCHAR(255) COMMENT 'Chemin vers le logo',
  favicon VARCHAR(255) COMMENT 'Chemin vers le favicon',
  primary_color VARCHAR(20) DEFAULT '#1E40AF' COMMENT 'Couleur principale (hex)',
  secondary_color VARCHAR(20) DEFAULT '#3B82F6' COMMENT 'Couleur secondaire',
  
  -- Informations légales
  ministry VARCHAR(255) DEFAULT 'Ministère de l''Éducation Nationale - RDC',
  registration_number VARCHAR(100) COMMENT 'Numéro d agrément',
  tax_id VARCHAR(100) COMMENT 'Numéro fiscal',
  
  -- Abonnement / Limites
  subscription_plan ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'basic' COMMENT 'Plan actif',
  subscription_expires_at DATE COMMENT 'Date expiration abonnement',
  max_students INT DEFAULT 500 COMMENT 'Limite élèves',
  max_users INT DEFAULT 50 COMMENT 'Limite utilisateurs',
  max_storage_mb INT DEFAULT 1024 COMMENT 'Limite stockage (MB)',
  
  -- Statut
  is_active BOOLEAN DEFAULT TRUE COMMENT 'École active/désactivée',
  is_demo BOOLEAN DEFAULT FALSE COMMENT 'Compte de démonstration',
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT COMMENT 'ID utilisateur créateur',
  
  -- Index
  INDEX idx_schools_code (code),
  INDEX idx_schools_active (is_active),
  INDEX idx_schools_province (province),
  INDEX idx_schools_subscription (subscription_plan, subscription_expires_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Établissements scolaires - Table principale multi-tenant';

-- =====================================================
-- TABLE SCHOOL_SETTINGS (Configuration par école)
-- =====================================================
CREATE TABLE IF NOT EXISTS school_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  setting_key VARCHAR(100) NOT NULL COMMENT 'Clé du paramètre',
  setting_value TEXT COMMENT 'Valeur du paramètre',
  setting_type ENUM('string', 'number', 'boolean', 'json', 'date') DEFAULT 'string',
  category VARCHAR(50) DEFAULT 'general' COMMENT 'Catégorie (general, academic, financial, etc)',
  description VARCHAR(255) COMMENT 'Description du paramètre',
  is_public BOOLEAN DEFAULT FALSE COMMENT 'Visible sur la landing page',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_school_setting (school_id, setting_key),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  INDEX idx_school_settings_category (school_id, category)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Paramètres configurables par école';

-- =====================================================
-- SEED: École par défaut (backward-compatible)
-- =====================================================
-- Migrer les données de la table etablissement existante si elle existe

INSERT INTO schools (
  id, 
  code, 
  name, 
  short_name, 
  address, 
  telephone, 
  email, 
  province,
  ministry,
  currency,
  is_active
)
SELECT 
  1,
  'DEFAULT',
  COALESCE(e.nom, 'École par défaut (Migration)'),
  'DEFAULT',
  e.adresse,
  e.telephone,
  e.email,
  COALESCE(e.province, 'Kinshasa'),
  COALESCE(e.ministere, 'Ministère de l''Éducation Nationale - RDC'),
  'FC',
  TRUE
FROM etablissement e
WHERE e.id = 1
ON DUPLICATE KEY UPDATE 
  name = COALESCE(VALUES(name), schools.name),
  address = COALESCE(VALUES(address), schools.address),
  updated_at = CURRENT_TIMESTAMP;

-- Si pas d'établissement existant, créer une entrée par défaut
INSERT IGNORE INTO schools (
  id, 
  code, 
  name, 
  short_name, 
  province, 
  currency,
  is_active
)
VALUES (
  1, 
  'DEFAULT', 
  'École par défaut (Migration)', 
  'DEFAULT', 
  'Kinshasa', 
  'FC',
  TRUE
);

-- =====================================================
-- SEED: Paramètres par défaut
-- =====================================================
INSERT IGNORE INTO school_settings (school_id, setting_key, setting_value, setting_type, category, description) VALUES
-- Académique
(1, 'academic_year_format', 'YYYY-YYYY', 'string', 'academic', 'Format année scolaire'),
(1, 'grading_system', '20', 'number', 'academic', 'Système de notation (sur X)'),
(1, 'passing_grade', '10', 'number', 'academic', 'Note de passage'),
(1, 'terms_per_year', '3', 'number', 'academic', 'Nombre de trimestres/semestres'),
(1, 'class_capacity_default', '40', 'number', 'academic', 'Capacité classe par défaut'),

-- Financier
(1, 'currency', 'FC', 'string', 'financial', 'Devise principale'),
(1, 'secondary_currency', 'USD', 'string', 'financial', 'Devise secondaire'),
(1, 'exchange_rate', '2500', 'number', 'financial', 'Taux de change USD->FC'),
(1, 'payment_reminder_days', '7', 'number', 'financial', 'Jours avant rappel paiement'),

-- Communication
(1, 'sms_notifications', 'false', 'boolean', 'communication', 'Activer SMS'),
(1, 'email_notifications', 'true', 'boolean', 'communication', 'Activer emails'),
(1, 'whatsapp_notifications', 'false', 'boolean', 'communication', 'Activer WhatsApp'),

-- Portails
(1, 'allow_student_portal', 'true', 'boolean', 'portal', 'Autoriser portail élève'),
(1, 'allow_parent_portal', 'true', 'boolean', 'portal', 'Autoriser portail parent'),
(1, 'allow_teacher_portal', 'true', 'boolean', 'portal', 'Autoriser portail enseignant'),

-- Système
(1, 'maintenance_mode', 'false', 'boolean', 'system', 'Mode maintenance'),
(1, 'backup_frequency', 'daily', 'string', 'system', 'Fréquence backup');

-- =====================================================
-- VÉRIFICATION
-- =====================================================
SELECT 'Migration 001 - Résultats:' AS info;
SELECT COUNT(*) AS schools_count FROM schools;
SELECT COUNT(*) AS settings_count FROM school_settings;
SELECT id, code, name, is_active FROM schools;

SELECT '✅ Migration 001 terminée: Table schools créée' AS status;



