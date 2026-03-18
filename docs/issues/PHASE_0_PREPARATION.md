# Phase 0 - Préparation & Sauvegarde

> ⚠️ **OBLIGATOIRE** - Ne pas commencer Phase 1 sans avoir complété Phase 0

---

## ISSUE-001: [OPS] Backup complet de la BDD bdd_scolaire

### 📋 Informations
- **Type:** Operations
- **Priorité:** Critical
- **Assigné:** DevOps / DBA
- **Estimé:** 2 heures
- **Labels:** `ops`, `backup`, `critical`, `phase-0`

### 📝 Description

Créer une sauvegarde complète de la base de données `bdd_scolaire` avant toute modification. Cette sauvegarde servira de point de restauration en cas de problème.

### ✅ Checklist

- [ ] Arrêter les connexions actives (maintenance window)
- [ ] Exécuter dump MySQL complet
- [ ] Vérifier intégrité du fichier dump
- [ ] Copier le dump sur stockage externe (hors serveur)
- [ ] Tester la restauration sur environnement de dev
- [ ] Documenter la procédure de restore

### 📁 Livrables

1. **Fichier dump:** `backups/bdd_scolaire_backup_20241205_pre_multitenancy.sql`
2. **Checksum:** `backups/bdd_scolaire_backup_20241205.sha256`
3. **Log de vérification:** `backups/restore_test_log.txt`

### 🔧 Commandes

```bash
# 1. Dump complet avec structure et données
mysqldump -u root -p \
  --single-transaction \
  --routines \
  --triggers \
  --databases bdd_scolaire \
  > backups/bdd_scolaire_backup_$(date +%Y%m%d)_pre_multitenancy.sql

# 2. Générer checksum
sha256sum backups/bdd_scolaire_backup_*.sql > backups/checksums.sha256

# 3. Compresser
gzip -k backups/bdd_scolaire_backup_*.sql

# 4. Test restore sur DB temporaire
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS bdd_scolaire_restore_test"
mysql -u root -p bdd_scolaire_restore_test < backups/bdd_scolaire_backup_*.sql

# 5. Vérifier le nombre de tables
mysql -u root -p -e "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'bdd_scolaire_restore_test'"

# 6. Cleanup
mysql -u root -p -e "DROP DATABASE bdd_scolaire_restore_test"
```

### ✔️ Critères d'Acceptation

- [ ] Dump créé sans erreur
- [ ] Taille du dump cohérente (> précédent backup si existant)
- [ ] Restore test réussi
- [ ] Copie externe confirmée
- [ ] Documentation à jour

---

## ISSUE-002: [QA] Environnement de staging cloné

### 📋 Informations
- **Type:** QA / Operations
- **Priorité:** High
- **Assigné:** DevOps
- **Estimé:** 4 heures
- **Labels:** `qa`, `staging`, `phase-0`

### 📝 Description

Cloner l'environnement de production vers un environnement staging identique pour tester les migrations multi-tenant avant déploiement prod.

### ✅ Checklist

- [ ] Créer base de données `bdd_scolaire_staging`
- [ ] Restaurer le backup dans staging
- [ ] Configurer backend pour pointer vers staging
- [ ] Configurer frontend pour pointer vers backend staging
- [ ] Valider accès (login admin fonctionne)
- [ ] Documenter les URLs staging

### 📁 Livrables

1. **BDD staging:** `bdd_scolaire_staging`
2. **Backend staging:** `http://localhost:5001` ou URL dédiée
3. **Frontend staging:** `http://localhost:5174` ou URL dédiée
4. **Documentation:** `docs/STAGING_SETUP.md`

### 🔧 Configuration Staging

```bash
# backend/.env.staging
NODE_ENV=staging
PORT=5001

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bdd_scolaire_staging

JWT_SECRET=staging_jwt_secret_different_from_prod
FRONTEND_URL=http://localhost:5174
```

```bash
# frontend/.env.staging
VITE_API_URL=http://localhost:5001/api
VITE_ENV=staging
```

### 🔧 Scripts Setup Staging

```bash
# 1. Créer la DB staging
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS bdd_scolaire_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 2. Restaurer le backup
mysql -u root -p bdd_scolaire_staging < backups/bdd_scolaire_backup_*.sql

# 3. Démarrer backend staging
cd backend
cp .env .env.backup
cp .env.staging .env
npm run dev

# 4. Démarrer frontend staging (autre terminal)
cd ../
VITE_API_URL=http://localhost:5001/api npm run dev -- --port 5174
```

### ✔️ Critères d'Acceptation

- [ ] Login admin fonctionne sur staging
- [ ] Données identiques à prod
- [ ] Environnements isolés (pas de cross-pollution)
- [ ] Équipe peut accéder au staging

---

## ISSUE-003: [DEV] Branche feature/multitenancy

### 📋 Informations
- **Type:** Development
- **Priorité:** High
- **Assigné:** Lead Dev
- **Estimé:** 1 heure
- **Labels:** `dev`, `git`, `phase-0`

### 📝 Description

Créer la branche de développement dédiée à la fonctionnalité multi-tenant. Configurer les protections et templates de PR.

### ✅ Checklist

- [ ] Créer branche `feature/multitenancy` depuis `main`
- [ ] Configurer protection de branche (si GitHub/GitLab)
- [ ] Créer template de PR pour cette feature
- [ ] Configurer CI pour la branche
- [ ] Communiquer à l'équipe

### 📁 Livrables

1. **Branche:** `feature/multitenancy`
2. **PR Template:** `.github/PULL_REQUEST_TEMPLATE/multitenancy.md`

### 🔧 Commandes Git

```bash
# 1. S'assurer d'être à jour
git checkout main
git pull origin main

# 2. Créer la branche
git checkout -b feature/multitenancy

# 3. Push initial
git push -u origin feature/multitenancy

# 4. Créer sous-branches par phase (optionnel)
git checkout -b feature/multitenancy/phase-1
```

### 📄 PR Template

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE/multitenancy.md -->

## 🏫 Multi-Tenancy PR

### Phase
- [ ] Phase 0 - Préparation
- [ ] Phase 1 - Foundation
- [ ] Phase 2 - Tenant-Aware Tables
- [ ] Phase 3 - UI/UX
- [ ] Phase 4 - Module Toggles
- [ ] Phase 5 - Admin Interfaces
- [ ] Phase 6 - QA/Deploy

### Issue(s) liée(s)
Closes #XXX

### Changements
<!-- Décrire les changements -->

### Migrations
- [ ] Migration SQL ajoutée
- [ ] Script rollback créé
- [ ] Testé sur staging

### Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests E2E ajoutés/mis à jour
- [ ] Tests manuels effectués

### Checklist Sécurité Multi-Tenant
- [ ] Toutes les queries utilisent `school_id` filter
- [ ] SuperAdmin bypass vérifié
- [ ] Pas de data leakage entre tenants
- [ ] Audit log mis à jour

### Screenshots (si UI)
<!-- Ajouter screenshots -->

### Notes de déploiement
<!-- Instructions spéciales -->
```

### ✔️ Critères d'Acceptation

- [ ] Branche créée et pushée
- [ ] Template PR en place
- [ ] Équipe informée
- [ ] Premier commit (ce fichier de plan) poussé



