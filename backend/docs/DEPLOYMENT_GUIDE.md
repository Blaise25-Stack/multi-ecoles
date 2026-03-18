# 🚀 Guide de Déploiement Multi-Tenant SGS

## Vue d'ensemble

Ce guide décrit le processus de déploiement du système multi-tenant SGS.
L'approche est **progressive et réversible** pour minimiser les risques.

---

## 📋 Prérequis

### Environnement
- [ ] WAMP Server installé et démarré
- [ ] MySQL accessible (via phpMyAdmin ou CLI)
- [ ] Node.js v18+ installé
- [ ] PowerShell 5.1+

### Sauvegardes
- [ ] Backup complet de la BDD production
- [ ] Backup du code source
- [ ] Environnement staging configuré

---

## 🔄 Ordre de déploiement

```
Phase 0: Préparation     ──► Phase 1: Foundation   ──► Phase 2: Tables
    │                            │                         │
    └─ Backup                    └─ schools                └─ school_id
       Staging                      utilisateurs              partout
                                    
Phase 3: Frontend        ──► Phase 4: Modules      ──► Phase 5: Admin
    │                            │                         │
    └─ Login/Redirect            └─ Feature Flags          └─ Console
       SuperAdmin                   API                       Users
```

---

## 📦 Étape 1: Backup Production

```powershell
cd backend/scripts
.\backup_database.ps1 -DbPassword "votre_mdp"
```

Vérifier le backup dans `backend/backups/`

---

## 🎭 Étape 2: Déployer sur Staging

```powershell
# 1. Configurer staging
.\setup_staging.ps1

# 2. Exécuter toutes les migrations
.\run_migrations.ps1 -Target staging

# 3. Valider
.\validate_migrations.ps1 -Target staging
```

---

## ✅ Étape 3: Tests sur Staging

### Tests automatiques
```powershell
cd backend
npx ts-node src/tests/multitenant.test.ts
```

### Tests manuels

| Test | Attendu | ✓ |
|------|---------|---|
| Login admin existant | Redirigé vers /dashboard | ☐ |
| Login super_admin | Redirigé vers /superadmin | ☐ |
| Données isolées par école | Élèves école A invisibles depuis B | ☐ |
| Création élève | school_id automatiquement assigné | ☐ |
| Module désactivé | Retourne 403 | ☐ |
| SuperAdmin switch école | Peut voir toutes les données | ☐ |

---

## 🚀 Étape 4: Déployer en Production

### 4.1 Fenêtre de maintenance

```
📅 Planifier une fenêtre de 30 minutes minimum
📢 Prévenir les utilisateurs
🔒 Mettre le site en maintenance
```

### 4.2 Migrations

```powershell
# IMPORTANT: Backup frais avant
.\backup_database.ps1 -DbPassword "votre_mdp"

# Exécuter les migrations
.\run_migrations.ps1 -Target production
```

### 4.3 Déployer le code

```bash
# Backend
cd backend
npm install
npm run build

# Frontend
cd ../frontend
npm install
npm run build
```

### 4.4 Validation

```powershell
.\validate_migrations.ps1 -Target production
```

### 4.5 Réactiver le site

```
✅ Tester un login
✅ Vérifier les données existantes
✅ Retirer le mode maintenance
```

---

## 🔙 Plan de Rollback

### Scénario 1: Erreur pendant migration

```powershell
# Restaurer depuis le backup
.\restore_database.ps1 -BackupFile "..\backups\bdd_scolaire_backup_XXXXX.sql"

# Redéployer l'ancien code
git checkout main
npm run build
```

### Scénario 2: Problème après déploiement

```powershell
# 1. Mettre en maintenance
# 2. Restaurer la BDD
.\restore_database.ps1 -BackupFile "..\backups\PRE_MIGRATION_BACKUP.sql"

# 3. Rollback migrations (si partiel)
mysql -u root bdd_scolaire < "src/database/migrations/rollback/003_009_rollback_all_phase2.sql"

# 4. Redéployer ancien code
```

### Scénario 3: Rollback partiel (garder certaines migrations)

```sql
-- Exemple: retirer school_id d'une seule table
ALTER TABLE eleves DROP FOREIGN KEY fk_eleves_school;
ALTER TABLE eleves DROP COLUMN school_id;
```

---

## 📊 Checklist Pré-Production

### Base de données
- [ ] Backup production créé et testé
- [ ] Staging identique à production
- [ ] Toutes les migrations testées en staging
- [ ] Script de rollback prêt

### Code
- [ ] Build frontend réussi
- [ ] Build backend réussi
- [ ] Aucune erreur TypeScript
- [ ] Tests E2E passés

### Infrastructure
- [ ] Fenêtre de maintenance planifiée
- [ ] Équipe disponible pour support
- [ ] Communication aux utilisateurs faite
- [ ] Monitoring actif

### Post-déploiement
- [ ] Validation migrations OK
- [ ] Login fonctionne
- [ ] Données existantes intactes
- [ ] SuperAdmin peut accéder
- [ ] Modules fonctionnent

---

## 🆘 Contacts d'urgence

| Rôle | Contact |
|------|---------|
| DBA | [À compléter] |
| Lead Dev | [À compléter] |
| DevOps | [À compléter] |

---

## 📝 Journal des déploiements

| Date | Version | Status | Notes |
|------|---------|--------|-------|
| | | | |

---

## 🔧 Commandes utiles

```powershell
# Vérifier connexion MySQL
mysql -u root -p -e "SELECT VERSION();"

# Voir les tables
mysql -u root bdd_scolaire -e "SHOW TABLES;"

# Compter les écoles
mysql -u root bdd_scolaire -e "SELECT COUNT(*) FROM schools;"

# Voir les utilisateurs par école
mysql -u root bdd_scolaire -e "SELECT school_id, COUNT(*) as users FROM utilisateurs GROUP BY school_id;"
```



