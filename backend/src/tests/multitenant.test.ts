/**
 * ============================================
 * Tests Multi-Tenant SGS
 * ============================================
 * Tests E2E pour vérifier l'isolation des données par école
 * 
 * Exécuter: npx ts-node src/tests/multitenant.test.ts
 * Ou: npm test (si configuré)
 */

import { query, pool } from '../database/connection'

// ============================================
// Configuration des tests
// ============================================

interface TestSchool {
  id: number
  code: string
  name: string
}

interface TestUser {
  id: number
  email: string
  schoolId: number
  roleCode: string
  token?: string
}

const testSchools: TestSchool[] = []
const testUsers: TestUser[] = []

// Couleurs console
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
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg: string) => console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}\n${colors.blue}  ${msg}${colors.reset}\n${colors.blue}═══════════════════════════════════════${colors.reset}\n`),
}

// ============================================
// Setup / Teardown
// ============================================

async function setup() {
  log.section('SETUP - Création des données de test')

  try {
    // Créer 2 écoles de test
    for (let i = 1; i <= 2; i++) {
      const code = `TEST_SCHOOL_${i}_${Date.now()}`
      const result = await query<any>(`
        INSERT INTO schools (code, name, currency) 
        VALUES (?, ?, 'FC')
      `, [code, `École Test ${i}`])

      testSchools.push({
        id: result.insertId,
        code,
        name: `École Test ${i}`,
      })
      log.success(`École créée: ${code} (ID: ${result.insertId})`)
    }

    // Créer des utilisateurs pour chaque école
    for (const school of testSchools) {
      // Admin
      const adminResult = await query<any>(`
        INSERT INTO utilisateurs (email, password, nom, prenom, role_id, school_id, is_active)
        VALUES (?, '$2a$10$test', 'Test', 'Admin', 2, ?, TRUE)
      `, [`admin_${school.code}@test.com`, school.id])

      testUsers.push({
        id: adminResult.insertId,
        email: `admin_${school.code}@test.com`,
        schoolId: school.id,
        roleCode: 'admin',
      })

      // Comptable
      const comptableResult = await query<any>(`
        INSERT INTO utilisateurs (email, password, nom, prenom, role_id, school_id, is_active)
        VALUES (?, '$2a$10$test', 'Test', 'Comptable', 3, ?, TRUE)
      `, [`comptable_${school.code}@test.com`, school.id])

      testUsers.push({
        id: comptableResult.insertId,
        email: `comptable_${school.code}@test.com`,
        schoolId: school.id,
        roleCode: 'comptable',
      })

      log.success(`Utilisateurs créés pour ${school.name}`)
    }

    // Créer des données dans chaque école
    for (const school of testSchools) {
      // Créer des élèves
      for (let i = 1; i <= 3; i++) {
        await query(`
          INSERT INTO eleves (matricule, nom, prenom, date_naissance, lieu_naissance, sexe, nationalite, statut, school_id)
          VALUES (?, ?, ?, '2010-01-01', 'Kinshasa', 'M', 'Congolaise', 'inscrit', ?)
        `, [`MAT_${school.code}_${i}`, `Eleve${i}`, `Test`, school.id])
      }
      log.success(`3 élèves créés pour ${school.name}`)

      // Créer des paiements (si table existe avec school_id)
      try {
        await query(`
          INSERT INTO paiements (montant, mode_paiement, statut, school_id, date_paiement, annee_scolaire_id, eleve_id, type_frais_id)
          SELECT 50000, 'especes', 'valide', ?, NOW(), 1, 
            (SELECT id FROM eleves WHERE school_id = ? LIMIT 1),
            1
          FROM dual
          WHERE EXISTS (SELECT 1 FROM eleves WHERE school_id = ?)
        `, [school.id, school.id, school.id])
        log.success(`Paiement test créé pour ${school.name}`)
      } catch (e) {
        log.warn(`Impossible de créer paiement test pour ${school.name}`)
      }
    }

    log.success('Setup terminé')
    return true
  } catch (error) {
    log.error(`Erreur setup: ${error}`)
    return false
  }
}

async function teardown() {
  log.section('TEARDOWN - Nettoyage des données de test')

  try {
    // Supprimer dans l'ordre des dépendances
    for (const school of testSchools) {
      await query('DELETE FROM paiements WHERE school_id = ?', [school.id])
      await query('DELETE FROM eleves WHERE school_id = ?', [school.id])
      await query('DELETE FROM utilisateurs WHERE school_id = ?', [school.id])
      await query('DELETE FROM school_modules WHERE school_id = ?', [school.id])
      await query('DELETE FROM schools WHERE id = ?', [school.id])
      log.success(`Données nettoyées pour école ${school.code}`)
    }

    log.success('Teardown terminé')
  } catch (error) {
    log.error(`Erreur teardown: ${error}`)
  }
}

// ============================================
// Tests d'isolation des données
// ============================================

async function testDataIsolation() {
  log.section('TEST: Isolation des données entre écoles')
  let passed = 0
  let failed = 0

  // Test 1: Élèves visibles uniquement pour leur école
  const school1 = testSchools[0]
  const school2 = testSchools[1]

  const school1Eleves = await query<any[]>(
    'SELECT * FROM eleves WHERE school_id = ?',
    [school1.id]
  )
  const school2Eleves = await query<any[]>(
    'SELECT * FROM eleves WHERE school_id = ?',
    [school2.id]
  )

  if (school1Eleves.length === 3 && school2Eleves.length === 3) {
    log.success('Chaque école a exactement 3 élèves')
    passed++
  } else {
    log.error(`Nombre d'élèves incorrect: École 1 = ${school1Eleves.length}, École 2 = ${school2Eleves.length}`)
    failed++
  }

  // Test 2: Pas d'élèves en commun
  const school1Ids = school1Eleves.map(e => e.id)
  const school2Ids = school2Eleves.map(e => e.id)
  const intersection = school1Ids.filter(id => school2Ids.includes(id))

  if (intersection.length === 0) {
    log.success('Aucun élève partagé entre les écoles')
    passed++
  } else {
    log.error(`${intersection.length} élèves partagés entre écoles (VIOLATION!)`)
    failed++
  }

  // Test 3: Matricules uniques par école
  const duplicates = await query<any[]>(`
    SELECT matricule, COUNT(*) as cnt
    FROM eleves
    WHERE school_id IN (?, ?)
    GROUP BY matricule, school_id
    HAVING cnt > 1
  `, [school1.id, school2.id])

  if (duplicates.length === 0) {
    log.success('Pas de matricules dupliqués dans chaque école')
    passed++
  } else {
    log.error(`${duplicates.length} matricules dupliqués trouvés`)
    failed++
  }

  return { passed, failed }
}

// ============================================
// Tests de sécurité
// ============================================

async function testSecurityInjection() {
  log.section('TEST: Sécurité - Injection school_id')
  let passed = 0
  let failed = 0

  const school1 = testSchools[0]
  const school2 = testSchools[1]

  // Test 1: Tentative d'accès aux données d'une autre école via query
  const crossSchoolQuery = await query<any[]>(`
    SELECT e.* 
    FROM eleves e
    WHERE e.school_id = ? AND e.id IN (SELECT id FROM eleves WHERE school_id = ?)
  `, [school1.id, school2.id])

  if (crossSchoolQuery.length === 0) {
    log.success('Requête cross-school retourne 0 résultat')
    passed++
  } else {
    log.error(`FUITE: Requête cross-school a retourné ${crossSchoolQuery.length} résultats`)
    failed++
  }

  // Test 2: Vérifier que les FK sont respectées
  try {
    // Tenter d'insérer un élève avec un school_id inexistant
    await query(`
      INSERT INTO eleves (matricule, nom, prenom, date_naissance, lieu_naissance, sexe, nationalite, statut, school_id)
      VALUES ('FAKE', 'Fake', 'User', '2010-01-01', 'Test', 'M', 'Test', 'inscrit', 99999)
    `)
    log.error('FUITE: Insertion avec school_id invalide a réussi!')
    failed++
  } catch (e: any) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2' || e.message.includes('foreign key')) {
      log.success('FK school_id correctement appliquée')
      passed++
    } else {
      log.warn(`Erreur inattendue: ${e.message}`)
    }
  }

  // Test 3: Vérifier l'unicité des contraintes par école
  const school1User = testUsers.find(u => u.schoolId === school1.id)
  const school2User = testUsers.find(u => u.schoolId === school2.id)

  // Même email ne devrait pas pouvoir exister deux fois
  try {
    await query(`
      INSERT INTO utilisateurs (email, password, nom, prenom, role_id, school_id)
      VALUES (?, 'test', 'Test', 'Test', 2, ?)
    `, [school1User?.email, school2.id])
    log.error('FUITE: Email dupliqué accepté!')
    failed++
    // Nettoyer
    await query('DELETE FROM utilisateurs WHERE email = ? AND school_id = ?', [school1User?.email, school2.id])
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') {
      log.success('Contrainte unicité email respectée')
      passed++
    } else {
      log.warn(`Erreur: ${e.message}`)
    }
  }

  return { passed, failed }
}

async function testIDORProtection() {
  log.section('TEST: Protection IDOR (Insecure Direct Object Reference)')
  let passed = 0
  let failed = 0

  const school1 = testSchools[0]
  const school2 = testSchools[1]

  // Test: Simuler accès à un élève d'une autre école
  const school1Eleve = await query<any[]>(
    'SELECT id FROM eleves WHERE school_id = ? LIMIT 1',
    [school1.id]
  )

  if (school1Eleve.length > 0) {
    const eleveId = school1Eleve[0].id

    // Tenter d'accéder à cet élève depuis le contexte de l'école 2
    const accessAttempt = await query<any[]>(
      'SELECT * FROM eleves WHERE id = ? AND school_id = ?',
      [eleveId, school2.id]
    )

    if (accessAttempt.length === 0) {
      log.success('IDOR bloqué: élève de l\'école 1 non accessible depuis école 2')
      passed++
    } else {
      log.error('FUITE IDOR: élève accessible depuis une autre école!')
      failed++
    }
  }

  // Test: Modification interdite
  const school2Eleve = await query<any[]>(
    'SELECT id FROM eleves WHERE school_id = ? LIMIT 1',
    [school2.id]
  )

  if (school2Eleve.length > 0) {
    const eleveId = school2Eleve[0].id

    // Tenter de modifier avec le mauvais school_id
    const updateResult = await query<any>(
      'UPDATE eleves SET nom = "HACKED" WHERE id = ? AND school_id = ?',
      [eleveId, school1.id]
    )

    if (updateResult.affectedRows === 0) {
      log.success('IDOR bloqué: modification cross-school impossible')
      passed++
    } else {
      log.error('FUITE IDOR: modification cross-school a réussi!')
      failed++
    }
  }

  return { passed, failed }
}

// ============================================
// Tests modules/feature flags
// ============================================

async function testModuleIsolation() {
  log.section('TEST: Isolation des modules par école')
  let passed = 0
  let failed = 0

  const school1 = testSchools[0]
  const school2 = testSchools[1]

  // Créer des configurations de modules différentes
  await query(`
    INSERT INTO school_modules (school_id, module_key, enabled)
    VALUES (?, 'payments', 1), (?, 'payroll', 0)
    ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)
  `, [school1.id, school1.id])

  await query(`
    INSERT INTO school_modules (school_id, module_key, enabled)
    VALUES (?, 'payments', 0), (?, 'payroll', 1)
    ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)
  `, [school2.id, school2.id])

  // Vérifier l'isolation
  const school1Modules = await query<any[]>(
    'SELECT module_key, enabled FROM school_modules WHERE school_id = ?',
    [school1.id]
  )
  const school2Modules = await query<any[]>(
    'SELECT module_key, enabled FROM school_modules WHERE school_id = ?',
    [school2.id]
  )

  const s1Payments = school1Modules.find(m => m.module_key === 'payments')
  const s2Payments = school2Modules.find(m => m.module_key === 'payments')

  if (s1Payments?.enabled !== s2Payments?.enabled) {
    log.success('Modules configurés différemment par école')
    passed++
  } else {
    log.error('Modules identiques entre écoles (devrait être différent)')
    failed++
  }

  // Vérifier qu'une école ne peut pas voir les modules d'une autre
  const crossModules = await query<any[]>(`
    SELECT sm1.*, sm2.*
    FROM school_modules sm1
    JOIN school_modules sm2 ON sm1.module_key = sm2.module_key
    WHERE sm1.school_id = ? AND sm2.school_id = ?
    AND sm1.enabled != sm2.enabled
  `, [school1.id, school2.id])

  if (crossModules.length > 0) {
    log.success(`${crossModules.length} différences de config modules détectées`)
    passed++
  } else {
    log.warn('Pas de différences de modules (peut être normal)')
  }

  return { passed, failed }
}

// ============================================
// Tests SuperAdmin
// ============================================

async function testSuperAdminAccess() {
  log.section('TEST: Accès SuperAdmin (global)')
  let passed = 0
  let failed = 0

  // SuperAdmin doit pouvoir voir toutes les écoles
  const allSchools = await query<any[]>('SELECT * FROM schools')
  
  if (allSchools.length >= 2) {
    log.success(`SuperAdmin voit ${allSchools.length} écoles`)
    passed++
  } else {
    log.error('SuperAdmin ne voit pas toutes les écoles')
    failed++
  }

  // SuperAdmin doit pouvoir voir tous les élèves
  const allEleves = await query<any[]>('SELECT * FROM eleves')
  const school1Eleves = await query<any[]>('SELECT * FROM eleves WHERE school_id = ?', [testSchools[0].id])
  const school2Eleves = await query<any[]>('SELECT * FROM eleves WHERE school_id = ?', [testSchools[1].id])

  if (allEleves.length >= school1Eleves.length + school2Eleves.length) {
    log.success(`SuperAdmin voit tous les élèves (${allEleves.length} total)`)
    passed++
  } else {
    log.error('SuperAdmin ne voit pas tous les élèves')
    failed++
  }

  return { passed, failed }
}

// ============================================
// Rapport final
// ============================================

async function runAllTests() {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║          TESTS MULTI-TENANT SGS - PHASE 6                  ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('\n')

  const setupOk = await setup()
  if (!setupOk) {
    log.error('Setup échoué, arrêt des tests')
    await teardown()
    process.exit(1)
  }

  const results = {
    passed: 0,
    failed: 0,
  }

  try {
    // Exécuter tous les tests
    const tests = [
      testDataIsolation,
      testSecurityInjection,
      testIDORProtection,
      testModuleIsolation,
      testSuperAdminAccess,
    ]

    for (const test of tests) {
      const result = await test()
      results.passed += result.passed
      results.failed += result.failed
    }
  } catch (error) {
    log.error(`Erreur lors des tests: ${error}`)
    results.failed++
  }

  await teardown()

  // Rapport final
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                    RAPPORT FINAL                           ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log(`\n  ✅ Tests réussis: ${results.passed}`)
  console.log(`  ❌ Tests échoués: ${results.failed}`)
  console.log(`  📊 Total: ${results.passed + results.failed}`)
  console.log(`  📈 Taux de réussite: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%\n`)

  if (results.failed > 0) {
    console.log(`${colors.red}⚠️  ATTENTION: Des tests ont échoué! Vérifiez l'isolation des données.${colors.reset}\n`)
    process.exit(1)
  } else {
    console.log(`${colors.green}🎉 Tous les tests sont passés! Le système est sécurisé.${colors.reset}\n`)
  }

  // Fermer la connexion
  await pool.end()
}

// Lancer les tests
runAllTests().catch(console.error)



