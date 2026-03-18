-- ============================================
-- Migration 008: Ajouter school_id aux tables communication et logs
-- SGS Multi-Tenant - Phase 2
-- Date: 2024-12-05
-- ============================================
-- Tables: notifications, messages_contact, logs_systeme, historique_connexions
-- ============================================

SELECT '🚀 Migration 008: Tables communication et logs' AS status;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: notifications
-- =====================================================
SELECT '📋 Migration table: notifications' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE notifications ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Associer notifications aux écoles via utilisateurs
UPDATE notifications n
JOIN utilisateurs u ON n.utilisateur_id = u.id
SET n.school_id = u.school_id
WHERE n.school_id IS NULL AND u.school_id IS NOT NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND CONSTRAINT_NAME = 'fk_notifications_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND INDEX_NAME = 'idx_notifications_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_notifications_school ON notifications(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ notifications: ', COUNT(*), ' migrés') AS result FROM notifications;

-- =====================================================
-- TABLE: messages_contact
-- =====================================================
SELECT '📋 Migration table: messages_contact' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages_contact' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE messages_contact ADD COLUMN school_id INT NULL COMMENT "NULL = message plateforme, sinon message école"', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Les messages existants restent NULL (messages plateforme)

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages_contact' AND CONSTRAINT_NAME = 'fk_messages_contact_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE messages_contact ADD CONSTRAINT fk_messages_contact_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages_contact' AND INDEX_NAME = 'idx_messages_contact_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_messages_contact_school ON messages_contact(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT '✅ messages_contact: restent plateforme (school_id = NULL)' AS result;

-- =====================================================
-- TABLE: logs_systeme
-- =====================================================
SELECT '📋 Migration table: logs_systeme' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'logs_systeme' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE logs_systeme ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Associer logs aux écoles via utilisateurs
UPDATE logs_systeme l
JOIN utilisateurs u ON l.utilisateur_id = u.id
SET l.school_id = u.school_id
WHERE l.school_id IS NULL AND l.utilisateur_id IS NOT NULL AND u.school_id IS NOT NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'logs_systeme' AND CONSTRAINT_NAME = 'fk_logs_systeme_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE logs_systeme ADD CONSTRAINT fk_logs_systeme_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'logs_systeme' AND INDEX_NAME = 'idx_logs_systeme_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_logs_systeme_school ON logs_systeme(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ logs_systeme: ', COUNT(*), ' migrés') AS result FROM logs_systeme WHERE school_id IS NOT NULL;

-- =====================================================
-- TABLE: historique_connexions
-- =====================================================
SELECT '📋 Migration table: historique_connexions' AS step;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'historique_connexions' AND COLUMN_NAME = 'school_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE historique_connexions ADD COLUMN school_id INT NULL', 
  'SELECT "existe déjà" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Associer historique aux écoles via utilisateurs
UPDATE historique_connexions h
JOIN utilisateurs u ON h.utilisateur_id = u.id
SET h.school_id = u.school_id
WHERE h.school_id IS NULL AND u.school_id IS NOT NULL;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'historique_connexions' AND CONSTRAINT_NAME = 'fk_historique_connexions_school');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE historique_connexions ADD CONSTRAINT fk_historique_connexions_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'historique_connexions' AND INDEX_NAME = 'idx_historique_connexions_school');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_historique_connexions_school ON historique_connexions(school_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT CONCAT('✅ historique_connexions: ', COUNT(*), ' migrés') AS result FROM historique_connexions WHERE school_id IS NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ Migration 008 terminée: Tables communication tenant-aware' AS status;



