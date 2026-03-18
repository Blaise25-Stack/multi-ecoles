/**
 * ============================================
 * Script de vérification et migration Multi-Tenant
 * ============================================
 * Vérifie si les tables multi-tenant existent et les crée si nécessaire
 * 
 * Exécuter: npx ts-node src/database/check-multitenant.ts
 */

import { pool, query, testConnection } from './connection'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}📋 ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg: string) => console.log(`\n${colors.blue}═══ ${msg} ═══${colors.reset}\n`),
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const result = await query<any[]>(`
    SELECT COUNT(*) as cnt 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = ?
  `, [tableName])
  return result[0].cnt > 0
}

async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await query<any[]>(`
    SELECT COUNT(*) as cnt 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
  `, [tableName, columnName])
  return result[0].cnt > 0
}

async function main() {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     VÉRIFICATION SYSTÈME MULTI-TENANT SGS                  ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('\n')

  // Test connexion
  const connected = await testConnection()
  if (!connected) {
    log.error('Impossible de se connecter à la base de données!')
    process.exit(1)
  }
  log.success('Connexion à MySQL OK')

  let needsMigrations = false
  const issues: string[] = []

  // ============================================
  // 1. Vérifier table schools
  // ============================================
  log.section('Table schools')
  
  const schoolsExists = await checkTableExists('schools')
  if (schoolsExists) {
    log.success('Table "schools" existe')
    
    // Vérifier école default
    const defaultSchool = await query<any[]>('SELECT * FROM schools WHERE id = 1')
    if (defaultSchool.length > 0) {
      log.success(`École default trouvée: "${defaultSchool[0].name}" (${defaultSchool[0].code})`)
    } else {
      log.warn('École default (id=1) manquante - à créer')
      issues.push('École default manquante')
    }
  } else {
    log.error('Table "schools" n\'existe pas!')
    needsMigrations = true
    issues.push('Table schools manquante')
  }

  // ============================================
  // 2. Vérifier school_id sur utilisateurs
  // ============================================
  log.section('Colonne school_id sur utilisateurs')
  
  const usersHasSchoolId = await checkColumnExists('utilisateurs', 'school_id')
  if (usersHasSchoolId) {
    log.success('Colonne school_id existe sur utilisateurs')
    
    // Vérifier les NULL
    const nullCount = await query<any[]>('SELECT COUNT(*) as cnt FROM utilisateurs WHERE school_id IS NULL')
    if (nullCount[0].cnt > 0) {
      log.warn(`${nullCount[0].cnt} utilisateur(s) sans school_id`)
      issues.push(`${nullCount[0].cnt} users sans school_id`)
    } else {
      log.success('Tous les utilisateurs ont un school_id')
    }
  } else {
    log.error('Colonne school_id manquante sur utilisateurs!')
    needsMigrations = true
    issues.push('school_id manquant sur utilisateurs')
  }

  // ============================================
  // 3. Vérifier school_modules
  // ============================================
  log.section('Tables Feature Flags')
  
  const availableModulesExists = await checkTableExists('available_modules')
  const schoolModulesExists = await checkTableExists('school_modules')
  
  if (availableModulesExists) {
    const modulesCount = await query<any[]>('SELECT COUNT(*) as cnt FROM available_modules')
    log.success(`Table available_modules: ${modulesCount[0].cnt} modules définis`)
  } else {
    log.error('Table available_modules manquante!')
    needsMigrations = true
    issues.push('Table available_modules manquante')
  }
  
  if (schoolModulesExists) {
    log.success('Table school_modules existe')
  } else {
    log.error('Table school_modules manquante!')
    needsMigrations = true
    issues.push('Table school_modules manquante')
  }

  // ============================================
  // 4. Vérifier school_id sur tables principales
  // ============================================
  log.section('school_id sur tables de données')
  
  const tables = ['eleves', 'enseignants', 'classes', 'paiements', 'notes']
  for (const table of tables) {
    const tableExists = await checkTableExists(table)
    if (!tableExists) {
      log.info(`Table ${table} n'existe pas (peut être normal)`)
      continue
    }
    
    const hasSchoolId = await checkColumnExists(table, 'school_id')
    if (hasSchoolId) {
      log.success(`${table}: school_id OK`)
    } else {
      log.warn(`${table}: school_id manquant`)
      issues.push(`${table} sans school_id`)
      needsMigrations = true
    }
  }

  // ============================================
  // RÉSUMÉ ET ACTIONS
  // ============================================
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                      RÉSUMÉ                                ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  
  if (issues.length === 0) {
    log.success('\n🎉 Le système multi-tenant est correctement configuré!\n')
  } else {
    log.warn(`\n${issues.length} problème(s) détecté(s):\n`)
    issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`))
    console.log('')
  }

  // ============================================
  // APPLIQUER LES MIGRATIONS SI NÉCESSAIRE
  // ============================================
  if (needsMigrations) {
    log.section('APPLICATION DES MIGRATIONS')
    
    try {
      // 1. Créer table schools si nécessaire
      if (!schoolsExists) {
        log.info('Création de la table schools...')
        await query(`
          CREATE TABLE IF NOT EXISTS schools (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            currency VARCHAR(10) DEFAULT 'FC',
            whatsapp_number VARCHAR(50),
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        
        // Insérer école default
        await query(`
          INSERT IGNORE INTO schools (id, code, name, currency)
          VALUES (1, 'DEFAULT', 'École par défaut', 'FC')
        `)
        log.success('Table schools créée avec école default')
      }

      // 2. Ajouter school_id à utilisateurs si nécessaire
      if (!usersHasSchoolId) {
        log.info('Ajout de school_id à utilisateurs...')
        await query('ALTER TABLE utilisateurs ADD COLUMN school_id INT NULL')
        await query('UPDATE utilisateurs SET school_id = 1 WHERE school_id IS NULL')
        await query(`
          ALTER TABLE utilisateurs 
          ADD CONSTRAINT fk_utilisateurs_school 
          FOREIGN KEY (school_id) REFERENCES schools(id)
        `)
        log.success('Colonne school_id ajoutée à utilisateurs')
      }

      // 3. Créer tables modules si nécessaire
      if (!availableModulesExists) {
        log.info('Création de la table available_modules...')
        await query(`
          CREATE TABLE IF NOT EXISTS available_modules (
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        
        // Seed modules de base
        await query(`
          INSERT IGNORE INTO available_modules (module_key, module_name, category, is_default_enabled, icon, sort_order) VALUES
          ('dashboard', 'Tableau de bord', 'core', 1, 'LayoutDashboard', 1),
          ('students', 'Gestion des élèves', 'academic', 1, 'Users', 10),
          ('classes', 'Classes', 'academic', 1, 'School', 11),
          ('grades', 'Notes', 'academic', 1, 'FileText', 13),
          ('payments', 'Paiements', 'financial', 1, 'CreditCard', 20),
          ('teachers', 'Enseignants', 'hr', 1, 'GraduationCap', 30),
          ('settings', 'Paramètres', 'core', 1, 'Settings', 99)
        `)
        log.success('Table available_modules créée avec modules de base')
      }

      if (!schoolModulesExists) {
        log.info('Création de la table school_modules...')
        await query(`
          CREATE TABLE IF NOT EXISTS school_modules (
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
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        
        // Activer tous les modules pour l'école default
        await query(`
          INSERT IGNORE INTO school_modules (school_id, module_key, enabled, enabled_at)
          SELECT 1, module_key, is_default_enabled, NOW()
          FROM available_modules
        `)
        log.success('Table school_modules créée')
      }

      // 4. Ajouter school_id aux tables de données principales
      for (const table of tables) {
        const tableExists = await checkTableExists(table)
        if (!tableExists) continue
        
        const hasSchoolId = await checkColumnExists(table, 'school_id')
        if (!hasSchoolId) {
          log.info(`Ajout de school_id à ${table}...`)
          try {
            await query(`ALTER TABLE ${table} ADD COLUMN school_id INT NULL`)
            await query(`UPDATE ${table} SET school_id = 1 WHERE school_id IS NULL`)
            await query(`
              ALTER TABLE ${table} 
              ADD CONSTRAINT fk_${table}_school 
              FOREIGN KEY (school_id) REFERENCES schools(id)
            `)
            await query(`CREATE INDEX idx_${table}_school ON ${table}(school_id)`)
            log.success(`school_id ajouté à ${table}`)
          } catch (e: any) {
            log.warn(`Erreur pour ${table}: ${e.message}`)
          }
        }
      }

      log.success('\n🎉 Migrations appliquées avec succès!')
      
    } catch (error: any) {
      log.error(`Erreur lors des migrations: ${error.message}`)
    }
  }

  // Fermer la connexion
  await pool.end()
  console.log('\n')
}

main().catch(console.error)

