-- ============================================
-- Migration 009: Créer table school_modules (Feature Flags)
-- SGS Multi-Tenant - Phase 2
-- Date: 2024-12-05
-- ============================================
-- Permet d'activer/désactiver des modules par école
-- ============================================

SELECT '🚀 Migration 009: School Modules (Feature Flags)' AS status;

-- =====================================================
-- TABLE: available_modules (catalogue des modules)
-- =====================================================
CREATE TABLE IF NOT EXISTS available_modules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  module_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'Clé technique du module',
  module_name VARCHAR(255) NOT NULL COMMENT 'Nom affiché',
  description TEXT COMMENT 'Description du module',
  category ENUM('core', 'academic', 'financial', 'hr', 'communication', 'advanced') DEFAULT 'core',
  is_default_enabled TINYINT(1) DEFAULT 1 COMMENT 'Activé par défaut pour nouvelles écoles',
  requires_subscription ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
  icon VARCHAR(50) COMMENT 'Nom icône Lucide',
  sort_order INT DEFAULT 0 COMMENT 'Ordre d affichage',
  is_active TINYINT(1) DEFAULT 1 COMMENT 'Module disponible sur la plateforme',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_available_modules_category (category),
  INDEX idx_available_modules_subscription (requires_subscription)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Catalogue des modules disponibles';

-- =====================================================
-- TABLE: school_modules (activation par école)
-- =====================================================
CREATE TABLE IF NOT EXISTS school_modules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  module_key VARCHAR(100) NOT NULL,
  enabled TINYINT(1) DEFAULT 1 COMMENT '1=activé, 0=désactivé',
  config JSON COMMENT 'Configuration spécifique au module pour cette école',
  enabled_at TIMESTAMP NULL COMMENT 'Date activation',
  disabled_at TIMESTAMP NULL COMMENT 'Date désactivation',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT COMMENT 'Utilisateur ayant modifié',
  
  UNIQUE KEY unique_school_module (school_id, module_key),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES utilisateurs(id) ON DELETE SET NULL,
  INDEX idx_school_modules_enabled (school_id, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Modules activés par école';

-- =====================================================
-- SEED: Catalogue des modules
-- =====================================================
INSERT INTO available_modules (module_key, module_name, description, category, is_default_enabled, requires_subscription, icon, sort_order) VALUES

-- 🏠 Core (toujours disponibles)
('dashboard', 'Tableau de bord', 'Vue d''ensemble et statistiques', 'core', 1, 'free', 'LayoutDashboard', 1),
('settings', 'Paramètres', 'Configuration de l''école', 'core', 1, 'free', 'Settings', 2),
('profile', 'Profil utilisateur', 'Gestion du profil personnel', 'core', 1, 'free', 'User', 3),

-- 🎓 Academic
('students', 'Gestion des élèves', 'Inscriptions, fiches élèves, historique', 'academic', 1, 'free', 'Users', 10),
('classes', 'Classes', 'Gestion des classes et niveaux', 'academic', 1, 'free', 'School', 11),
('subjects', 'Matières', 'Catalogue des matières enseignées', 'academic', 1, 'free', 'BookOpen', 12),
('grades', 'Notes', 'Saisie et gestion des notes', 'academic', 1, 'free', 'FileText', 13),
('report_cards', 'Bulletins', 'Génération des bulletins scolaires', 'academic', 1, 'free', 'FileOutput', 14),
('schedule', 'Emploi du temps', 'Planning des cours', 'academic', 1, 'basic', 'Calendar', 15),
('certificates', 'Attestations', 'Génération d''attestations et certificats', 'academic', 0, 'basic', 'Award', 16),
('deliberations', 'Délibérations', 'Conseils de classe et décisions', 'academic', 0, 'premium', 'Users2', 17),
('exams', 'Examens', 'Gestion des examens officiels', 'academic', 0, 'premium', 'ClipboardCheck', 18),

-- 💰 Financial
('payments', 'Paiements', 'Encaissement des frais scolaires', 'financial', 1, 'free', 'CreditCard', 20),
('fees', 'Frais scolaires', 'Configuration des frais par niveau/classe', 'financial', 1, 'free', 'Receipt', 21),
('expenses', 'Dépenses', 'Suivi des dépenses de l''école', 'financial', 1, 'basic', 'TrendingDown', 22),
('cashbox', 'Caisse', 'Mouvements de caisse', 'financial', 0, 'basic', 'Wallet', 23),
('invoicing', 'Facturation', 'Génération et suivi des factures', 'financial', 0, 'premium', 'FileInvoice', 24),
('financial_reports', 'Rapports financiers', 'Analyses et rapports comptables', 'financial', 0, 'premium', 'PieChart', 25),

-- 👥 HR
('teachers', 'Enseignants', 'Gestion du corps enseignant', 'hr', 1, 'free', 'GraduationCap', 30),
('staff', 'Personnel', 'Personnel administratif et technique', 'hr', 0, 'basic', 'Briefcase', 31),
('attendance_hr', 'Présences RH', 'Suivi des présences employés', 'hr', 0, 'basic', 'UserCheck', 32),
('leaves', 'Congés', 'Demandes et approbation des congés', 'hr', 0, 'basic', 'CalendarOff', 33),
('payroll', 'Salaires', 'Paie des employés', 'hr', 0, 'premium', 'Banknote', 34),
('contracts', 'Contrats', 'Gestion des contrats de travail', 'hr', 0, 'premium', 'FileSignature', 35),

-- 📢 Communication
('notifications', 'Notifications', 'Alertes et notifications internes', 'communication', 1, 'free', 'Bell', 40),
('announcements', 'Annonces', 'Publications et annonces', 'communication', 0, 'basic', 'Megaphone', 41),
('messaging', 'Messagerie', 'Communication interne', 'communication', 0, 'basic', 'MessageSquare', 42),
('sms', 'SMS', 'Envoi de SMS aux parents', 'communication', 0, 'premium', 'Smartphone', 43),
('email', 'Emails', 'Envoi d''emails automatisés', 'communication', 0, 'premium', 'Mail', 44),
('parent_portal', 'Portail Parents', 'Accès parents aux informations', 'communication', 0, 'premium', 'Home', 45),
('student_portal', 'Portail Élèves', 'Accès élèves aux informations', 'communication', 0, 'premium', 'GraduationCap', 46),

-- 🚀 Advanced
('analytics', 'Analyses avancées', 'Statistiques et tableaux de bord avancés', 'advanced', 0, 'enterprise', 'BarChart3', 50),
('api_access', 'Accès API', 'API pour intégrations externes', 'advanced', 0, 'enterprise', 'Code', 51),
('multi_campus', 'Multi-Campus', 'Gestion de plusieurs sites', 'advanced', 0, 'enterprise', 'Building2', 52),
('custom_reports', 'Rapports personnalisés', 'Création de rapports sur mesure', 'advanced', 0, 'enterprise', 'FileBarChart', 53),
('data_export', 'Export données', 'Export massif des données', 'advanced', 0, 'enterprise', 'Download', 54)

ON DUPLICATE KEY UPDATE 
  module_name = VALUES(module_name),
  description = VALUES(description),
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- SEED: Modules pour l'école default (id=1)
-- =====================================================
INSERT INTO school_modules (school_id, module_key, enabled, enabled_at)
SELECT 1, module_key, is_default_enabled, IF(is_default_enabled = 1, NOW(), NULL)
FROM available_modules
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- VÉRIFICATION
-- =====================================================
SELECT 'Modules disponibles par catégorie:' AS info;
SELECT category, COUNT(*) AS module_count 
FROM available_modules 
GROUP BY category 
ORDER BY MIN(sort_order);

SELECT 'Modules activés pour école default:' AS info;
SELECT 
  sm.module_key, 
  am.module_name, 
  sm.enabled,
  am.requires_subscription
FROM school_modules sm
JOIN available_modules am ON sm.module_key = am.module_key
WHERE sm.school_id = 1 AND sm.enabled = 1
ORDER BY am.sort_order;

SELECT '✅ Migration 009 terminée: School Modules créé' AS status;



