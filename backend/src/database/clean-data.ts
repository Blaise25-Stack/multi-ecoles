/**
 * ============================================
 * Clean Data - Suppression des données
 * ============================================
 * Supprime toutes les données de la base de données
 * 
 * Usage: npm run db:clean
 */

import { query, pool } from './connection'

async function cleanData() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║     🗑️  SUPPRESSION DES DONNÉES                             ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  try {
    // Désactiver les contraintes de clés étrangères temporairement
    await query('SET FOREIGN_KEY_CHECKS = 0')
    console.log('🔓 Contraintes FK désactivées\n')

    // Supprimer les tables dans l'ordre
    const tables = [
      'paiements',
      'depenses', 
      'mouvements_caisse',
      'notes',
      'bulletins',
      'inscriptions',
      'eleves',
      'enseignants',
      'personnel',
      'frais_scolaires',
      'classes',
      'types_frais',
      'matieres',
      'niveaux',
      'cycles',
    ]

    for (const table of tables) {
      try {
        const result = await query<any>(`DELETE FROM ${table}`)
        console.log(`   ✅ ${table} - vidé`)
      } catch (err: any) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`   ⚠️  ${table} - table inexistante`)
        } else {
          console.log(`   ❌ ${table} - erreur: ${err.message}`)
        }
      }
    }

    // Réactiver les contraintes
    await query('SET FOREIGN_KEY_CHECKS = 1')
    console.log('\n🔒 Contraintes FK réactivées')

    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║     ✅ NETTOYAGE TERMINÉ                                    ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')

  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage:', error)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

cleanData()



