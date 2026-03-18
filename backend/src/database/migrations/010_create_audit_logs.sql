-- ============================================
-- Migration 010: Table Audit Logs
-- SGS Multi-Tenant - Phase 5
-- Date: 2024-12-05
-- ============================================
-- Journalisation des actions administratives
-- ============================================

SELECT '🚀 Migration 010: Audit Logs' AS status;

-- =====================================================
-- TABLE: audit_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Qui a fait l'action
  user_id INT COMMENT 'ID utilisateur ayant effectué l action',
  user_email VARCHAR(191) COMMENT 'Email snapshot au moment de l action',
  user_role VARCHAR(50) COMMENT 'Rôle snapshot',
  
  -- Contexte école
  school_id INT COMMENT 'École concernée (NULL = action plateforme)',
  school_code VARCHAR(50) COMMENT 'Code école snapshot',
  
  -- Action
  action_type ENUM(
    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
    'ENABLE', 'DISABLE', 'RESET_PASSWORD', 'ASSIGN', 'UNASSIGN',
    'IMPORT', 'EXPORT', 'APPROVE', 'REJECT'
  ) NOT NULL,
  
  -- Entité concernée
  entity_type VARCHAR(100) NOT NULL COMMENT 'Type: user, school, student, payment, module, etc.',
  entity_id INT COMMENT 'ID de l entité concernée',
  entity_name VARCHAR(255) COMMENT 'Nom/label de l entité (pour lisibilité)',
  
  -- Détails
  description TEXT COMMENT 'Description lisible de l action',
  old_values JSON COMMENT 'Valeurs avant modification',
  new_values JSON COMMENT 'Valeurs après modification',
  
  -- Métadonnées
  ip_address VARCHAR(45) COMMENT 'IP de l utilisateur',
  user_agent TEXT COMMENT 'Navigateur/client',
  request_id VARCHAR(100) COMMENT 'ID de requête pour traçabilité',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_school (school_id),
  INDEX idx_audit_action (action_type),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_date (created_at),
  INDEX idx_audit_composite (school_id, action_type, created_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Journal d audit des actions administratives';

-- =====================================================
-- TABLE: audit_log_details (pour actions avec beaucoup de détails)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  audit_log_id INT NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  
  FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id) ON DELETE CASCADE,
  INDEX idx_audit_detail_log (audit_log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Détails granulaires des modifications';

-- =====================================================
-- VÉRIFICATION
-- =====================================================
SELECT 'Tables audit créées:' AS info;
SHOW TABLES LIKE 'audit%';

SELECT '✅ Migration 010 terminée: Audit Logs' AS status;



