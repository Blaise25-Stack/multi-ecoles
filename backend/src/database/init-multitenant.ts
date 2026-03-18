/**
 * ============================================
 * Initialisation Multi-Tenant SGS
 * ============================================
 * Ce script complète l'initialisation de la base de données
 * avec les tables et données nécessaires au multi-tenant
 * 
 * Exécuter après db:init : npm run db:multitenant
 */

import { pool, query, testConnection } from './connection'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
}

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}📋 ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg: string) => console.log(`${colors.cyan}▶️  ${msg}${colors.reset}`),
}

async function checkColumnExists(table: string, column: string): Promise<boolean> {
  const result = await query<any[]>(`
    SELECT COUNT(*) as cnt FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
  `, [table, column])
  return result[0].cnt > 0
}

async function checkTableExists(table: string): Promise<boolean> {
  const result = await query<any[]>(`
    SELECT COUNT(*) as cnt FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = ?
  `, [table])
  return result[0].cnt > 0
}

async function safeAddColumn(table: string, column: string, definition: string): Promise<boolean> {
  const exists = await checkColumnExists(table, column)
  if (exists) {
    log.info(`${table}.${column} existe déjà`)
    return false
  }
  
  try {
    await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
    log.success(`${table}.${column} ajouté`)
    return true
  } catch (e: any) {
    log.warn(`Impossible d'ajouter ${table}.${column}: ${e.message}`)
    return false
  }
}

async function safeAddForeignKey(table: string, column: string, refTable: string, refColumn: string = 'id'): Promise<void> {
  const fkName = `fk_${table}_${column}`
  try {
    // Vérifier si FK existe
    const fkExists = await query<any[]>(`
      SELECT COUNT(*) as cnt FROM information_schema.table_constraints 
      WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ?
    `, [table, fkName])
    
    if (fkExists[0].cnt === 0) {
      await query(`ALTER TABLE ${table} ADD CONSTRAINT ${fkName} FOREIGN KEY (${column}) REFERENCES ${refTable}(${refColumn})`)
      log.success(`FK ${fkName} créée`)
    }
  } catch (e: any) {
    log.warn(`FK ${fkName}: ${e.message}`)
  }
}

async function safeAddIndex(table: string, column: string): Promise<void> {
  const idxName = `idx_${table}_${column}`
  try {
    const idxExists = await query<any[]>(`
      SELECT COUNT(*) as cnt FROM information_schema.statistics 
      WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?
    `, [table, idxName])
    
    if (idxExists[0].cnt === 0) {
      await query(`CREATE INDEX ${idxName} ON ${table}(${column})`)
    }
  } catch (e: any) {
    // Ignorer les erreurs d'index
  }
}

async function main() {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     INITIALISATION MULTI-TENANT SGS                        ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('\n')

  const connected = await testConnection()
  if (!connected) {
    log.error('Impossible de se connecter à la base de données!')
    process.exit(1)
  }

  try {
    // ============================================
    // 1. TABLE SCHOOLS
    // ============================================
    log.step('Création table schools...')
    
    if (!(await checkTableExists('schools'))) {
      await query(`
        CREATE TABLE schools (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          currency VARCHAR(10) DEFAULT 'FC',
          whatsapp_number VARCHAR(50),
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_schools_code (code),
          INDEX idx_schools_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      log.success('Table schools créée')
    } else {
      log.info('Table schools existe déjà')
    }

    // Insérer école default
    await query(`
      INSERT IGNORE INTO schools (id, code, name, currency, is_active)
      VALUES (1, 'DEFAULT', 'École par défaut', 'FC', 1)
    `)
    log.success('École default présente (id=1)')

    // ============================================
    // 2. TABLE AVAILABLE_MODULES
    // ============================================
    log.step('Création table available_modules...')
    
    if (!(await checkTableExists('available_modules'))) {
      await query(`
        CREATE TABLE available_modules (
          id INT PRIMARY KEY AUTO_INCREMENT,
          module_key VARCHAR(100) NOT NULL UNIQUE,
          module_name VARCHAR(255) NOT NULL,
          description TEXT,
          category ENUM('core', 'academic', 'financial', 'hr', 'communication', 'advanced') DEFAULT 'core',
          is_default_enabled TINYINT(1) DEFAULT 1,
          requires_subscription ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
          icon VARCHAR(50),
          sort_order INT DEFAULT 0,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_modules_category (category),
          INDEX idx_modules_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      log.success('Table available_modules créée')
    } else {
      log.info('Table available_modules existe déjà')
    }

    // Seed modules
    log.step('Insertion des modules disponibles...')
    await query(`
      INSERT IGNORE INTO available_modules (module_key, module_name, description, category, is_default_enabled, requires_subscription, icon, sort_order) VALUES
      -- Core
      ('dashboard', 'Tableau de bord', 'Vue d''ensemble et statistiques', 'core', 1, 'free', 'LayoutDashboard', 1),
      ('settings', 'Paramètres', 'Configuration de l''école', 'core', 1, 'free', 'Settings', 2),
      ('profile', 'Profil utilisateur', 'Gestion du profil personnel', 'core', 1, 'free', 'User', 3),
      
      -- Academic
      ('students', 'Gestion des élèves', 'Inscriptions, fiches élèves', 'academic', 1, 'free', 'Users', 10),
      ('classes', 'Classes', 'Gestion des classes et niveaux', 'academic', 1, 'free', 'School', 11),
      ('subjects', 'Matières', 'Catalogue des matières', 'academic', 1, 'free', 'BookOpen', 12),
      ('grades', 'Notes', 'Saisie et gestion des notes', 'academic', 1, 'free', 'FileText', 13),
      ('report_cards', 'Bulletins', 'Génération des bulletins', 'academic', 1, 'free', 'FileOutput', 14),
      ('schedule', 'Emploi du temps', 'Planning des cours', 'academic', 1, 'basic', 'Calendar', 15),
      
      -- Financial
      ('payments', 'Paiements', 'Encaissement des frais', 'financial', 1, 'free', 'CreditCard', 20),
      ('fees', 'Frais scolaires', 'Configuration des frais', 'financial', 1, 'free', 'Receipt', 21),
      ('expenses', 'Dépenses', 'Suivi des dépenses', 'financial', 1, 'basic', 'TrendingDown', 22),
      ('cashbox', 'Caisse', 'Mouvements de caisse', 'financial', 0, 'basic', 'Wallet', 23),
      
      -- HR
      ('teachers', 'Enseignants', 'Gestion du corps enseignant', 'hr', 1, 'free', 'GraduationCap', 30),
      ('staff', 'Personnel', 'Personnel administratif', 'hr', 0, 'basic', 'Briefcase', 31),
      ('attendance_hr', 'Présences RH', 'Suivi des présences', 'hr', 0, 'basic', 'UserCheck', 32),
      ('leaves', 'Congés', 'Demandes de congés', 'hr', 0, 'basic', 'CalendarOff', 33),
      ('payroll', 'Salaires', 'Paie des employés', 'hr', 0, 'premium', 'Banknote', 34),
      
      -- Communication
      ('notifications', 'Notifications', 'Alertes internes', 'communication', 1, 'free', 'Bell', 40),
      ('announcements', 'Annonces', 'Publications', 'communication', 0, 'basic', 'Megaphone', 41)
    `)
    log.success('Modules disponibles insérés')

    // ============================================
    // 3. TABLE SCHOOL_MODULES
    // ============================================
    log.step('Création table school_modules...')
    
    if (!(await checkTableExists('school_modules'))) {
      await query(`
        CREATE TABLE school_modules (
          id INT PRIMARY KEY AUTO_INCREMENT,
          school_id INT NOT NULL,
          module_key VARCHAR(100) NOT NULL,
          enabled TINYINT(1) DEFAULT 1,
          config TEXT,
          enabled_at TIMESTAMP NULL,
          disabled_at TIMESTAMP NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updated_by INT,
          UNIQUE KEY unique_school_module (school_id, module_key),
          FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
          INDEX idx_school_modules_enabled (school_id, enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      log.success('Table school_modules créée')
    } else {
      log.info('Table school_modules existe déjà')
    }

    // Activer modules pour école default
    await query(`
      INSERT IGNORE INTO school_modules (school_id, module_key, enabled, enabled_at)
      SELECT 1, module_key, is_default_enabled, NOW()
      FROM available_modules
      WHERE is_active = 1
    `)
    log.success('Modules activés pour école default')

    // ============================================
    // 4. AJOUTER school_id AUX TABLES EXISTANTES
    // ============================================
    log.step('Ajout de school_id aux tables de données...')
    
    const tablesNeedingSchoolId = [
      'utilisateurs',
      'eleves',
      'enseignants',
      'personnel',
      'classes',
      'annees_scolaires',
      'matieres',
      'inscriptions',
      'periodes',
      'notes',
      'bulletins',
      'deliberations',
      'resultats_deliberation',
      'attestations',
      'frais_scolaires',
      'types_frais',
      'paiements',
      'depenses',
      'factures',
      'mouvements_caisse',
      'salaires',
      'conges',
      'contrats',
      'presences',
      'salles',
      'creneaux_horaires',
      'emploi_temps',
      'classe_matieres',
      'enseignant_matieres',
      'notifications',
    ]

    for (const table of tablesNeedingSchoolId) {
      if (await checkTableExists(table)) {
        const added = await safeAddColumn(table, 'school_id', 'INT NULL')
        if (added) {
          // Mettre à jour les enregistrements existants
          await query(`UPDATE ${table} SET school_id = 1 WHERE school_id IS NULL`)
          await safeAddForeignKey(table, 'school_id', 'schools')
          await safeAddIndex(table, 'school_id')
        }
      }
    }

    // ============================================
    // 5. TABLE AUDIT_LOGS
    // ============================================
    log.step('Création table audit_logs...')
    
    if (!(await checkTableExists('audit_logs'))) {
      await query(`
        CREATE TABLE audit_logs (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          user_email VARCHAR(191),
          user_role VARCHAR(50),
          school_id INT,
          school_code VARCHAR(50),
          action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ENABLE', 'DISABLE', 'RESET_PASSWORD', 'ASSIGN', 'UNASSIGN') NOT NULL,
          entity_type VARCHAR(100) NOT NULL,
          entity_id INT,
          entity_name VARCHAR(255),
          description TEXT,
          old_values TEXT,
          new_values TEXT,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_audit_user (user_id),
          INDEX idx_audit_school (school_id),
          INDEX idx_audit_action (action_type),
          INDEX idx_audit_date (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      log.success('Table audit_logs créée')
    } else {
      log.info('Table audit_logs existe déjà')
    }

    // ============================================
    // RÉSUMÉ
    // ============================================
    console.log('\n')
    console.log('╔════════════════════════════════════════════════════════════╗')
    console.log('║     ✅ INITIALISATION MULTI-TENANT TERMINÉE                ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log('\n')

    // Stats
    const schoolsCount = await query<any[]>('SELECT COUNT(*) as cnt FROM schools')
    const modulesCount = await query<any[]>('SELECT COUNT(*) as cnt FROM available_modules')
    const usersCount = await query<any[]>('SELECT COUNT(*) as cnt FROM utilisateurs WHERE school_id IS NOT NULL')

    console.log(`  🏫 Écoles: ${schoolsCount[0].cnt}`)
    console.log(`  🧩 Modules disponibles: ${modulesCount[0].cnt}`)
    console.log(`  👥 Utilisateurs avec école: ${usersCount[0].cnt}`)
    console.log('\n')

  } catch (error: any) {
    log.error(`Erreur: ${error.message}`)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()



