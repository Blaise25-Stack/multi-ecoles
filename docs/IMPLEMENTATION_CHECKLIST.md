# ✅ Checklist d'Implémentation Multi-Tenant

## 📋 Vue Rapide - 37 Issues au Total

| Phase | Issues | Statut |
|-------|--------|--------|
| Phase 0 - Préparation | 3 | ⬜ |
| Phase 1 - Foundation | 4 | ⬜ |
| Phase 2 - Tenant-Aware Tables | 8 | ⬜ |
| Phase 3 - UI/UX | 4 | ⬜ |
| Phase 4 - Module Toggles | 3 | ⬜ |
| Phase 5 - Admin Interfaces | 4 | ⬜ |
| Phase 6 - QA & Deploy | 4 | ⬜ |

---

## Phase 0 - Préparation (BLOQUANT)

- [ ] **ISSUE-001** [OPS] Backup complet BDD bdd_scolaire
  - [ ] Dump MySQL créé
  - [ ] Checksum vérifié
  - [ ] Copie externe sauvegardée
  - [ ] Test restore OK

- [ ] **ISSUE-002** [QA] Environnement staging cloné
  - [ ] DB staging créée
  - [ ] Backend staging configuré
  - [ ] Frontend staging configuré
  - [ ] Login admin testé

- [ ] **ISSUE-003** [DEV] Branche feature/multitenancy
  - [ ] Branche créée
  - [ ] PR template ajouté
  - [ ] CI configuré

---

## Phase 1 - Foundation

- [ ] **ISSUE-004** [DB] Créer table schools
  - [ ] Migration `001_create_schools_table.sql` créée
  - [ ] Rollback créé
  - [ ] École default (id=1) insérée
  - [ ] Testé sur staging

- [ ] **ISSUE-005** [DB] Ajouter school_id à utilisateurs
  - [ ] Migration `002_add_school_id_to_users.sql` créée
  - [ ] Rollback créé
  - [ ] Users existants → school_id = 1
  - [ ] SuperAdmin → school_id = NULL
  - [ ] FK et index ajoutés

- [ ] **ISSUE-006** [BE] Modifier auth/login
  - [ ] Query modifiée pour joindre schools
  - [ ] JWT contient schoolId
  - [ ] Réponse inclut objet school
  - [ ] Vérification école active ajoutée
  - [ ] Tests unitaires

- [ ] **ISSUE-007** [BE] Créer tenant middleware
  - [ ] `tenant.middleware.ts` créé
  - [ ] Extraction school_id du context
  - [ ] SuperAdmin bypass
  - [ ] Helpers `buildTenantFilter` créés
  - [ ] Tests unitaires

---

## Phase 2 - Tenant-Aware Tables

- [ ] **ISSUE-008** [DB] Migration tables principales
  - [ ] eleves.school_id
  - [ ] enseignants.school_id
  - [ ] personnel.school_id
  - [ ] classes.school_id
  - [ ] annees_scolaires.school_id
  - [ ] Contraintes unique modifiées

- [ ] **ISSUE-009** [DB] Migration tables académiques
  - [ ] inscriptions.school_id
  - [ ] matieres.school_id
  - [ ] periodes.school_id
  - [ ] notes.school_id
  - [ ] bulletins.school_id
  - [ ] deliberations.school_id
  - [ ] attestations.school_id

- [ ] **ISSUE-010** [DB] Migration tables financières
  - [ ] frais_scolaires.school_id
  - [ ] paiements.school_id
  - [ ] factures.school_id
  - [ ] depenses.school_id
  - [ ] mouvements_caisse.school_id

- [ ] **ISSUE-011** [DB] Migration tables RH
  - [ ] salaires.school_id
  - [ ] conges.school_id
  - [ ] contrats.school_id
  - [ ] presences.school_id

- [ ] **ISSUE-012** [DB] Migration tables liaison/emploi du temps
  - [ ] classe_matieres.school_id
  - [ ] enseignant_affectations.school_id
  - [ ] salles.school_id
  - [ ] creneaux_horaires.school_id
  - [ ] emploi_temps.school_id

- [ ] **ISSUE-013** [DB] Migration tables référentielles
  - [ ] niveaux.school_id (nullable)
  - [ ] filieres.school_id (nullable)
  - [ ] cycles.school_id (nullable)

- [ ] **ISSUE-014** [DB] Migration tables communication/logs
  - [ ] notifications.school_id
  - [ ] messages_contact.school_id
  - [ ] logs_systeme.school_id
  - [ ] historique_connexions.school_id

- [ ] **ISSUE-015** [BE] Mise à jour repositories
  - [ ] eleves.routes.ts scopé
  - [ ] enseignants.routes.ts scopé
  - [ ] classes.routes.ts scopé
  - [ ] paiements.routes.ts scopé
  - [ ] notes.routes.ts scopé
  - [ ] Tous les autres routes scopés
  - [ ] Tests pour chaque route

---

## Phase 3 - UI/UX

- [ ] **ISSUE-023** [FE] Modifier page login
  - [ ] Garder email + password
  - [ ] authService mis à jour
  - [ ] Store auth mis à jour avec school

- [ ] **ISSUE-024** [FE] Redirection post-login
  - [ ] User normal → /dashboard
  - [ ] SuperAdmin → /superadmin
  - [ ] Routes SuperAdmin créées

- [ ] **ISSUE-025** [FE] Afficher contexte école
  - [ ] Header avec nom école
  - [ ] Logo école si disponible
  - [ ] Badge SuperAdmin

- [ ] **ISSUE-026** [FE] TenantProvider
  - [ ] Context React créé
  - [ ] Hook useTenant
  - [ ] Intégration dans main.tsx
  - [ ] Chargement modules activés

---

## Phase 4 - Module Toggles

- [ ] **ISSUE-027** [DB] Table school_modules
  - [ ] Migration `010_create_school_modules.sql`
  - [ ] Table available_modules seed
  - [ ] Modules default pour école 1

- [ ] **ISSUE-028** [BE] Middleware moduleGuard
  - [ ] `module.middleware.ts` créé
  - [ ] Cache des modules
  - [ ] Intégration dans routes

- [ ] **ISSUE-029** [FE] UI toggle modules
  - [ ] Page SchoolModulesPage
  - [ ] Switches par module
  - [ ] Groupement par catégorie

---

## Phase 5 - Admin Interfaces

- [ ] **ISSUE-030** [FE/BE] SuperAdmin CRUD écoles
  - [ ] API /superadmin/schools
  - [ ] Liste écoles avec stats
  - [ ] Création école + setup initial
  - [ ] Modification école
  - [ ] Désactivation école

- [ ] **ISSUE-031** [FE/BE] SuperAdmin gestion users
  - [ ] API /superadmin/users
  - [ ] Liste tous users
  - [ ] Création user avec school
  - [ ] Reset password

- [ ] **ISSUE-032** [FE/BE] Admin école gestion users
  - [ ] API /schools/:id/users
  - [ ] Liste users de l'école
  - [ ] Création user (même école)
  - [ ] Modification rôles

- [ ] **ISSUE-033** [BE] Audit logs multi-tenant
  - [ ] Log toutes actions admin
  - [ ] Filtrage par école
  - [ ] Export logs

---

## Phase 6 - QA & Déploiement

- [ ] **ISSUE-034** [QA] Tests E2E multi-tenant
  - [ ] Isolation données testée
  - [ ] SuperAdmin access testé
  - [ ] Module guard testé
  - [ ] Login/redirect testé

- [ ] **ISSUE-035** [SEC] Tests sécurité
  - [ ] Enumération IDs
  - [ ] Injection SQL
  - [ ] Élévation privilèges
  - [ ] Data leakage
  - [ ] JWT forgery

- [ ] **ISSUE-036** [OPS] Déploiement canary
  - [ ] Sélection écoles pilotes
  - [ ] Migration prod école pilote
  - [ ] Monitoring 24h
  - [ ] Rollout progressif

- [ ] **ISSUE-037** [OPS] Documentation rollback
  - [ ] Scripts rollback testés
  - [ ] Runbook documenté
  - [ ] Communication prête

---

## 📁 Fichiers Créés/Modifiés

### Backend - Nouveaux Fichiers
```
backend/src/
├── database/
│   └── migrations/
│       ├── 001_create_schools_table.sql
│       ├── 002_add_school_id_to_users.sql
│       ├── 003_add_school_id_core_tables.sql
│       ├── 004_add_school_id_academic_tables.sql
│       ├── 005_add_school_id_financial_tables.sql
│       ├── 006_add_school_id_hr_tables.sql
│       ├── 007_add_school_id_junction_tables.sql
│       ├── 008_add_school_id_reference_tables.sql
│       ├── 009_add_school_id_communication_tables.sql
│       ├── 010_create_school_modules.sql
│       ├── run_migrations.sh
│       └── rollback/
│           └── (un fichier rollback par migration)
├── middlewares/
│   ├── tenant.middleware.ts (NOUVEAU)
│   └── module.middleware.ts (NOUVEAU)
├── routes/
│   ├── schools.routes.ts (NOUVEAU)
│   └── superadmin/
│       ├── schools.routes.ts (NOUVEAU)
│       └── users.routes.ts (NOUVEAU)
└── types/
    ├── auth.types.ts (MODIFIÉ)
    └── tenant.types.ts (NOUVEAU)
```

### Frontend - Nouveaux Fichiers
```
src/
├── contexts/
│   └── TenantContext.tsx (NOUVEAU)
├── pages/
│   └── superadmin/
│       ├── SuperAdminDashboard.tsx (NOUVEAU)
│       ├── SchoolsManagement.tsx (NOUVEAU)
│       ├── SchoolDetailPage.tsx (NOUVEAU)
│       ├── SchoolModulesPage.tsx (NOUVEAU)
│       └── PlatformUsers.tsx (NOUVEAU)
├── components/
│   └── layout/
│       └── SuperAdminLayout.tsx (NOUVEAU)
├── stores/
│   └── authStore.ts (MODIFIÉ - ajout school)
└── services/
    └── authService.ts (MODIFIÉ - nouveau format)
```

### Documentation
```
docs/
├── MULTITENANCY_IMPLEMENTATION_PLAN.md
├── API_CONTRACTS_MULTITENANT.md
├── IMPLEMENTATION_CHECKLIST.md
└── issues/
    ├── PHASE_0_PREPARATION.md
    ├── PHASE_1_FOUNDATION.md
    ├── PHASE_2_TENANT_AWARE_TABLES.md
    └── PHASE_3_4_5_6_UI_MODULES_ADMIN.md
```

---

## 🎯 Jalons Clés

| Jalon | Date Cible | Critères |
|-------|------------|----------|
| **M1: Foundation Ready** | J+5 | Phase 0+1 complétées, login retourne school |
| **M2: Data Isolated** | J+12 | Phase 2 complétée, toutes tables scopées |
| **M3: UI Updated** | J+15 | Phase 3+4 complétées, modules toggleables |
| **M4: Admin Ready** | J+20 | Phase 5 complétée, SuperAdmin fonctionnel |
| **M5: Production** | J+25 | Phase 6 complétée, déployé en prod |

---

## 🚨 Points de Vigilance

1. **Ne jamais rendre school_id NOT NULL** avant validation complète
2. **Toujours tester sur staging** avant toute migration prod
3. **Backup avant chaque migration** prod
4. **Vérifier les contraintes unique** lors des migrations
5. **Invalider le cache** après modification des modules
6. **Logger les actions** SuperAdmin pour audit

---

## 📞 Contacts & Escalade

| Rôle | Contact | Cas d'Usage |
|------|---------|-------------|
| Lead Dev | - | Questions techniques |
| DBA | - | Problèmes migration |
| DevOps | - | Déploiement, rollback |
| Product Owner | - | Priorisation, décisions |



