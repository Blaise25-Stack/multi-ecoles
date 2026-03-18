# 📦 Migrations Multi-Tenant

Ce dossier contient toutes les migrations SQL pour transformer le SGS en plateforme multi-tenant.

## 🚀 Ordre d'Exécution

```
001_create_schools_table.sql       # Table schools + settings
002_add_school_id_to_users.sql     # school_id sur utilisateurs
003_add_school_id_core_tables.sql  # eleves, enseignants, personnel, classes, annees_scolaires
004_add_school_id_academic_tables.sql # notes, bulletins, inscriptions, etc.
005_add_school_id_financial_tables.sql # paiements, depenses, factures, etc.
006_add_school_id_hr_tables.sql    # salaires, conges, contrats, presences
007_add_school_id_junction_tables.sql # classe_matieres, emploi_temps, etc.
008_add_school_id_reference_tables.sql # niveaux, filieres (optionnel par école)
009_add_school_id_communication_tables.sql # notifications, logs
010_create_school_modules.sql      # Feature flags par école
```

## 📋 Commandes

### Exécuter une migration
```bash
mysql -u root -p bdd_scolaire < migrations/001_create_schools_table.sql
```

### Exécuter toutes les migrations
```bash
./run_migrations.sh
```

### Rollback une migration
```bash
mysql -u root -p bdd_scolaire < migrations/rollback/001_drop_schools_table.sql
```

## ⚠️ Règles Importantes

1. **TOUJOURS** faire un backup avant migration
2. **TOUJOURS** tester sur staging d'abord
3. **JAMAIS** supprimer de colonnes existantes
4. **JAMAIS** rendre school_id NOT NULL avant validation complète

## 📊 Vérification Post-Migration

```sql
-- Vérifier que toutes les tables ont school_id
SELECT TABLE_NAME, COLUMN_NAME 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'bdd_scolaire' 
AND COLUMN_NAME = 'school_id';

-- Vérifier les données migrées
SELECT 
  'eleves' as tbl, COUNT(*) as total, 
  SUM(school_id = 1) as default_school 
FROM eleves
UNION ALL
SELECT 'utilisateurs', COUNT(*), SUM(school_id = 1) FROM utilisateurs WHERE school_id IS NOT NULL;
```



