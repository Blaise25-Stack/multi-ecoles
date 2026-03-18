# 🛠️ Scripts Multi-Tenant SGS

## Prérequis

### 1. WAMP Server installé et démarré
- Télécharger WAMP: https://www.wampserver.com/
- Installer dans `C:\wamp64`
- Démarrer WAMP (icône verte dans la barre des tâches)

### 2. MySQL accessible
Après installation de WAMP, MySQL est disponible à:
```
C:\wamp64\bin\mysql\mysql8.x.x\bin\mysql.exe
```

### 3. Ajouter MySQL au PATH (optionnel mais recommandé)
1. Ouvrir "Variables d'environnement" Windows
2. Modifier la variable `PATH`
3. Ajouter: `C:\wamp64\bin\mysql\mysql8.x.x\bin`

---

## Scripts Disponibles

### 📦 backup_database.ps1
Créer une sauvegarde complète de la base de données.

```powershell
cd backend\scripts
.\backup_database.ps1

# Avec mot de passe
.\backup_database.ps1 -DbPassword "votre_mot_de_passe"
```

### 🔄 restore_database.ps1
Restaurer un backup (pour test).

```powershell
.\restore_database.ps1 -BackupFile "..\backups\bdd_scolaire_backup_xxx.sql"
```

### 🎭 setup_staging.ps1
Configurer l'environnement de staging.

```powershell
.\setup_staging.ps1
```

### 🚀 run_migrations.ps1
Exécuter les migrations multi-tenant.

```powershell
# Sur staging (recommandé d'abord)
.\run_migrations.ps1 -Target staging

# Dry run (simulation)
.\run_migrations.ps1 -Target staging -DryRun

# Une migration spécifique
.\run_migrations.ps1 -Target staging -Migration "001"

# Sur production (après validation staging)
.\run_migrations.ps1 -Target production
```

---

## Ordre d'Exécution - Phase 0

```
1. Démarrer WAMP Server
2. Vérifier que MySQL est accessible dans phpMyAdmin
3. Exécuter: .\backup_database.ps1
4. Vérifier le backup dans backend\backups\
5. Exécuter: .\setup_staging.ps1
6. Tester le staging: .\start_staging.ps1
```

---

## Dépannage

### "MySQL non trouvé"
- Vérifier que WAMP est démarré (icône verte)
- Vérifier le chemin MySQL dans les scripts
- Modifier `$MysqlPaths` dans les scripts si nécessaire

### "Access denied"
- Vérifier le mot de passe MySQL (par défaut: vide)
- Utiliser le paramètre `-DbPassword`

### "Database does not exist"
- Créer la base via phpMyAdmin
- Ou exécuter le script d'init: `npm run db:init`

---

## Migrations Phase 2 (Toutes les tables tenant-aware)

| Migration | Description |
|-----------|-------------|
| 003 | Tables principales (eleves, enseignants, classes, matieres, annees_scolaires, personnel) |
| 004 | Tables académiques (inscriptions, notes, bulletins, periodes, deliberations, attestations) |
| 005 | Tables financières (paiements, frais_scolaires, depenses, factures, mouvements_caisse) |
| 006 | Tables RH (salaires, conges, contrats, presences) |
| 007 | Tables emploi du temps (salles, creneaux, emploi_temps, affectations) |
| 008 | Tables communication (notifications, logs, historique_connexions) |
| 009 | Feature flags (school_modules, available_modules) |

### Exécuter Phase 2 complète

```powershell
# Sur staging d'abord !
.\run_migrations.ps1 -Target staging -Migration "003"
.\run_migrations.ps1 -Target staging -Migration "004"
.\run_migrations.ps1 -Target staging -Migration "005"
.\run_migrations.ps1 -Target staging -Migration "006"
.\run_migrations.ps1 -Target staging -Migration "007"
.\run_migrations.ps1 -Target staging -Migration "008"
.\run_migrations.ps1 -Target staging -Migration "009"
```

### Rollback Phase 2

En cas de problème majeur :
```powershell
# Exécuter le rollback complet Phase 2
mysql -u root bdd_scolaire_staging < "..\src\database\migrations\rollback\003_009_rollback_all_phase2.sql"
```

---

## Structure des Migrations

```
backend/src/database/migrations/
├── 001_create_schools_table.sql          # Phase 1
├── 002_add_school_id_to_users.sql        # Phase 1
├── 003_add_school_id_core_tables.sql     # Phase 2
├── 004_add_school_id_academic_tables.sql # Phase 2
├── 005_add_school_id_financial_tables.sql # Phase 2
├── 006_add_school_id_hr_tables.sql       # Phase 2
├── 007_add_school_id_schedule_tables.sql # Phase 2
├── 008_add_school_id_comm_tables.sql     # Phase 2
├── 009_create_school_modules.sql         # Phase 2
└── rollback/
    ├── 001_drop_schools_table.sql
    ├── 002_remove_school_id_from_users.sql
    └── 003_009_rollback_all_phase2.sql   # Rollback Phase 2 complet
```

Chaque migration a son script de rollback correspondant.

---

## Middlewares Node.js (après migrations)

Après application des migrations, utiliser ces middlewares dans le backend :

```typescript
import {
  authenticate,       // Vérifie JWT
  tenantMiddleware,   // Résout school_id
  moduleGuard,        // Vérifie feature flags
} from './middlewares'

// Exemple de route tenant-aware
router.get('/students',
  authenticate,
  tenantMiddleware,
  moduleGuard('students'),
  getStudents
)
```

