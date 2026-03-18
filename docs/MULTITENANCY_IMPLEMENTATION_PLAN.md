# 🏫 Plan d'Implémentation Multi-Tenant (Multi-Écoles)

## Système de Gestion Scolaire - SGS RDC

**Date:** 5 Décembre 2024  
**Version:** 1.0  
**Auteur:** Équipe Technique SGS

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Multi-Tenant](#architecture-multi-tenant)
3. [Inventaire des Tables](#inventaire-des-tables)
4. [Phases d'Implémentation](#phases-dimplémentation)
5. [Issues GitHub Détaillées](#issues-github-détaillées)
6. [Scripts de Migration](#scripts-de-migration)
7. [API Contracts](#api-contracts)
8. [Tests E2E & Sécurité](#tests-e2e--sécurité)
9. [Procédure de Rollback](#procédure-de-rollback)
10. [Rollout Plan](#rollout-plan)

---

## Vue d'ensemble

### Objectif
Transformer le SGS mono-école en plateforme multi-écoles où chaque établissement a ses données isolées, tout en maintenant la rétrocompatibilité.

### Stratégie Choisie
**Shared Schema + Column `school_id`** (approche non-intrusive)

| Avantages | Inconvénients |
|-----------|---------------|
| Modifications minimales | Isolation logique uniquement |
| Faible coût de migration | Requiert discipline dans les queries |
| Simple à implémenter | Moins sécurisé que BDD par école |
| Backup/maintenance simplifiés | |

### Principes Clés
1. ✅ **Additif uniquement** : Pas de suppression de colonnes/tables
2. ✅ **Réversible** : Scripts de rollback pour chaque migration
3. ✅ **Backward-compatible** : École "default" pour données existantes
4. ✅ **Login simplifié** : Pas de sélection d'école à la connexion

---

## Architecture Multi-Tenant

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Login   │  │ SuperAdmin   │  │   School Admin Dashboard   │ │
│  │  (email  │  │   Console    │  │   (scoped to school_id)    │ │
│  │ +passwd) │  │  (all data)  │  │                            │ │
│  └────┬─────┘  └──────┬───────┘  └─────────────┬──────────────┘ │
└───────┼───────────────┼────────────────────────┼────────────────┘
        │               │                        │
        ▼               ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Auth Middleware                            ││
│  │   - Verify JWT                                               ││
│  │   - Extract user.school_id                                   ││
│  │   - Set req.tenant context                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Tenant Middleware                          ││
│  │   - SuperAdmin: req.tenant.isSuper = true (bypass)          ││
│  │   - Normal: req.tenant.id = school_id (scoped queries)      ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Module Guard                               ││
│  │   - Check school_modules for enabled modules                ││
│  │   - Return 403 if module disabled for school                ││
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MySQL (bdd_scolaire)                        │
│                                                                 │
│  ┌────────────┐  ┌─────────────────────────────────────────┐   │
│  │  schools   │  │         Tenant-Aware Tables             │   │
│  │  ────────  │  │  ───────────────────────────────────    │   │
│  │  id        │◄─┤  utilisateurs.school_id                 │   │
│  │  code      │  │  eleves.school_id                       │   │
│  │  name      │  │  enseignants.school_id                  │   │
│  │  ...       │  │  classes.school_id                      │   │
│  └────────────┘  │  paiements.school_id                    │   │
│                  │  ...                                     │   │
│  ┌────────────┐  └─────────────────────────────────────────┘   │
│  │  school_   │                                                 │
│  │  modules   │  ┌─────────────────────────────────────────┐   │
│  │  ────────  │  │         Shared Reference Tables         │   │
│  │  school_id │  │  ───────────────────────────────────    │   │
│  │  module_key│  │  roles (system-wide)                    │   │
│  │  enabled   │  │  permissions (system-wide)              │   │
│  └────────────┘  │  cycles (shared or per-school)          │   │
│                  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Inventaire des Tables

### Tables Nécessitant `school_id` (Tenant-Aware)

| Table | Priorité | Notes |
|-------|----------|-------|
| `utilisateurs` | P0 | Critical - auth flow |
| `eleves` | P1 | Core entity |
| `inscriptions` | P1 | Core entity |
| `classes` | P1 | Core entity |
| `enseignants` | P1 | Core entity |
| `personnel` | P1 | Core entity |
| `annees_scolaires` | P1 | Each school has own academic years |
| `matieres` | P2 | Can be per-school or shared |
| `notes` | P2 | Dependent on eleves |
| `bulletins` | P2 | Dependent on eleves |
| `paiements` | P2 | Financial data |
| `depenses` | P2 | Financial data |
| `factures` | P2 | Financial data |
| `mouvements_caisse` | P2 | Financial data |
| `salaires` | P2 | HR data |
| `conges` | P2 | HR data |
| `contrats` | P2 | HR data |
| `presences` | P2 | HR data |
| `emploi_temps` | P2 | Dependent on classes |
| `deliberations` | P2 | Academic data |
| `attestations` | P2 | Documents |
| `periodes` | P2 | Dependent on annees_scolaires |
| `frais_scolaires` | P2 | Financial config |
| `enseignant_affectations` | P2 | Dependent on enseignants |
| `classe_matieres` | P2 | Dependent on classes |
| `niveaux` | P3 | Can be shared (RDC standard) |
| `filieres` | P3 | Can be shared |
| `salles` | P3 | Per-school |
| `creneaux_horaires` | P3 | Can be per-school |
| `notifications` | P3 | User-specific |
| `logs_systeme` | P3 | Audit logs |
| `historique_connexions` | P3 | Audit logs |
| `messages_contact` | P3 | Per-school or platform |

### Tables Restant Globales (Shared)

| Table | Raison |
|-------|--------|
| `roles` | System-wide roles |
| `permissions` | System-wide permissions |
| `role_permissions` | System-wide mappings |
| `types_frais` | Standardized (can override per-school) |
| `types_conges` | Standardized |
| `types_evaluations` | Standardized |
| `categories_depenses` | Standardized |
| `cycles` | RDC National Standard |

### Nouvelles Tables

| Table | Description |
|-------|-------------|
| `schools` | Liste des écoles/établissements |
| `school_modules` | Feature flags par école |
| `school_settings` | Configuration par école |

---

## Phases d'Implémentation

```
Phase 0          Phase 1           Phase 2            Phase 3
Préparation      Foundation        Tenant-Aware       UI/UX
   │                │                  │                 │
   ▼                ▼                  ▼                 ▼
┌──────┐        ┌──────┐          ┌──────┐          ┌──────┐
│Backup│───────►│schools│─────────►│Add   │─────────►│Login │
│Clone │        │table  │          │school│          │Flow  │
│Branch│        │users  │          │_id to│          │Redir │
└──────┘        │school │          │all   │          │Super │
                │_id    │          │tables│          │Admin │
                └───────┘          └──────┘          └──────┘
                                       │
                                       ▼
Phase 4           Phase 5           Phase 6
Module Toggles    Admin UIs         QA/Deploy
     │                │                 │
     ▼                ▼                 ▼
 ┌──────┐        ┌──────┐          ┌──────┐
 │school│        │Super │          │E2E   │
 │_modul│        │Admin │          │Tests │
 │guard │        │CRUD  │          │Secur │
 └──────┘        │School│          │Canary│
                 │Admin │          └──────┘
                 └──────┘
```

---

## Issues GitHub Détaillées

Voir les fichiers séparés dans `/docs/issues/` pour chaque issue détaillée.

### Résumé des Issues par Phase

#### Phase 0 - Préparation (3 issues)
- `ISSUE-001`: [OPS] Backup complet BDD bdd_scolaire
- `ISSUE-002`: [QA] Environnement staging cloné
- `ISSUE-003`: [DEV] Branche feature/multitenancy

#### Phase 1 - Foundation (4 issues)
- `ISSUE-004`: [DB] Créer table schools + seed default
- `ISSUE-005`: [DB] Ajouter school_id à utilisateurs
- `ISSUE-006`: [BE] Modifier auth/login pour retourner school
- `ISSUE-007`: [BE] Créer tenant middleware

#### Phase 2 - Tenant-Aware Tables (15 issues)
- `ISSUE-008` à `ISSUE-022`: Migrations pour chaque table

#### Phase 3 - UI/UX (4 issues)
- `ISSUE-023`: [FE] Supprimer sélection école login
- `ISSUE-024`: [FE] Redirection post-login
- `ISSUE-025`: [FE] SuperAdmin landing page
- `ISSUE-026`: [FE] Tenant context provider

#### Phase 4 - Feature Toggles (3 issues)
- `ISSUE-027`: [DB] Table school_modules
- `ISSUE-028`: [BE] Middleware moduleGuard
- `ISSUE-029`: [FE] UI toggle modules

#### Phase 5 - Admin Interfaces (4 issues)
- `ISSUE-030`: [FE/BE] SuperAdmin CRUD écoles
- `ISSUE-031`: [FE/BE] SuperAdmin gestion users
- `ISSUE-032`: [FE/BE] Admin école gestion users
- `ISSUE-033`: [BE] Audit logs multi-tenant

#### Phase 6 - QA & Deploy (4 issues)
- `ISSUE-034`: [QA] Tests E2E multi-tenant
- `ISSUE-035`: [SEC] Tests sécurité isolation
- `ISSUE-036`: [OPS] Déploiement canary
- `ISSUE-037`: [OPS] Documentation rollback

---

## Estimation Temporelle

| Phase | Durée Estimée | Dépendances |
|-------|---------------|-------------|
| Phase 0 | 1 jour | - |
| Phase 1 | 3 jours | Phase 0 |
| Phase 2 | 5 jours | Phase 1 |
| Phase 3 | 3 jours | Phase 1 |
| Phase 4 | 2 jours | Phase 2 |
| Phase 5 | 4 jours | Phase 4 |
| Phase 6 | 3 jours | Phase 5 |

**Total estimé: 3-4 semaines**

---

## Livrables par Phase

### Phase 0
- [ ] Dump SQL complet `bdd_scolaire_backup_YYYYMMDD.sql`
- [ ] Environnement staging fonctionnel
- [ ] Branche `feature/multitenancy` créée

### Phase 1
- [ ] Table `schools` avec école default (id=1)
- [ ] Colonne `school_id` sur `utilisateurs`
- [ ] Auth flow modifié (retourne school dans JWT)
- [ ] Middleware `tenantMiddleware.ts`

### Phase 2
- [ ] 30+ migrations SQL (une par table)
- [ ] Helpers repository scopés
- [ ] Tests unitaires middleware

### Phase 3
- [ ] Login page modifiée
- [ ] Context React `TenantProvider`
- [ ] SuperAdmin redirect logic

### Phase 4
- [ ] Table `school_modules`
- [ ] API `/schools/:id/modules`
- [ ] UI toggles

### Phase 5
- [ ] Console SuperAdmin complète
- [ ] Gestion users par école
- [ ] Audit trail

### Phase 6
- [ ] 50+ tests E2E
- [ ] Rapport sécurité
- [ ] Runbook déploiement
- [ ] Scripts rollback validés



