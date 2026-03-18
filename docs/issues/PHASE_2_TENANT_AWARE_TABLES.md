# Phase 2 - Tenant-Aware Tables

> 🎯 **Objectif:** Ajouter `school_id` à toutes les tables de données pour l'isolation multi-tenant

---

## Vue d'Ensemble des Migrations

Cette phase consiste à ajouter la colonne `school_id` à toutes les tables contenant des données spécifiques à une école. Chaque migration suit le même pattern:

1. Ajouter colonne `school_id` (nullable)
2. Assigner école default (id=1) aux données existantes
3. Ajouter Foreign Key vers `schools`
4. Créer index pour performance

### Tables à Migrer (par ordre de priorité)

| Priorité | Table | Dépendances |
|----------|-------|-------------|
| P1 | `eleves` | - |
| P1 | `enseignants` | - |
| P1 | `personnel` | - |
| P1 | `classes` | - |
| P1 | `annees_scolaires` | - |
| P2 | `inscriptions` | eleves, classes |
| P2 | `notes` | eleves |
| P2 | `paiements` | eleves |
| P2 | `matieres` | - |
| P2 | `periodes` | annees_scolaires |
| P2 | `bulletins` | eleves |
| P2 | `salaires` | enseignants/personnel |
| P3 | `depenses` | - |
| P3 | `factures` | eleves |
| P3 | `mouvements_caisse` | - |
| P3 | `conges` | enseignants/personnel |
| P3 | `contrats` | enseignants/personnel |
| P3 | `presences` | enseignants/personnel |
| P3 | `emploi_temps` | classes |
| P3 | `deliberations` | classes |
| P3 | `attestations` | eleves |
| P3 | `enseignant_affectations` | enseignants |
| P3 | `classe_matieres` | classes |
| P3 | `frais_scolaires` | - |
| P4 | `niveaux` | - |
| P4 | `filieres` | - |
| P4 | `salles` | - |
| P4 | `creneaux_horaires` | - |
| P4 | `notifications` | utilisateurs |
| P4 | `messages_contact` | - |
| P4 | `logs_systeme` | - |

---

## ISSUE-008: [DB] Migration batch - Tables principales (eleves, enseignants, personnel, classes)

### 📋 Informations
- **Type:** Database
- **Priorité:** Critical
- **Assigné:** Backend Dev
- **Estimé:** 4 heures
- **Labels:** `database`, `migration`, `phase-2`
- **Dépendances:** Phase 1 complétée

### 📝 Description

Ajouter `school_id` aux tables principales: `eleves`, `enseignants`, `personnel`, `classes`, `annees_scolaires`.

### 📁 Livrables

**Migration:** `backend/src/database/migrations/003_add_school_id_core_tables.sql`

### 🔧 Migration SQL

```sql
-- backend/src/database/migrations/003_add_school_id_core_tables.sql
-- Migration: Ajouter school_id aux tables principales
-- Date: 2024-12-05
-- Description: Tables core tenant-aware

-- =====================================================
-- DÉSACTIVER LES VÉRIFICATIONS FK TEMPORAIREMENT
-- =====================================================
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: eleves
-- =====================================================
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER is_active;

UPDATE eleves SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE eleves
ADD CONSTRAINT fk_eleves_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_eleves_school ON eleves(school_id);

-- Modifier contrainte unique sur matricule pour être par école
ALTER TABLE eleves DROP INDEX matricule;
ALTER TABLE eleves ADD UNIQUE INDEX unique_eleve_matricule_school (matricule, school_id);

SELECT CONCAT('eleves: ', COUNT(*), ' rows updated') AS status FROM eleves WHERE school_id = 1;

-- =====================================================
-- TABLE: enseignants
-- =====================================================
ALTER TABLE enseignants 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER is_active;

UPDATE enseignants SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE enseignants
ADD CONSTRAINT fk_enseignants_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_enseignants_school ON enseignants(school_id);

-- Modifier contrainte unique sur matricule pour être par école
ALTER TABLE enseignants DROP INDEX matricule;
ALTER TABLE enseignants ADD UNIQUE INDEX unique_enseignant_matricule_school (matricule, school_id);

SELECT CONCAT('enseignants: ', COUNT(*), ' rows updated') AS status FROM enseignants WHERE school_id = 1;

-- =====================================================
-- TABLE: personnel
-- =====================================================
ALTER TABLE personnel 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER is_active;

UPDATE personnel SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE personnel
ADD CONSTRAINT fk_personnel_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_personnel_school ON personnel(school_id);

-- Modifier contrainte unique sur matricule pour être par école
ALTER TABLE personnel DROP INDEX matricule;
ALTER TABLE personnel ADD UNIQUE INDEX unique_personnel_matricule_school (matricule, school_id);

SELECT CONCAT('personnel: ', COUNT(*), ' rows updated') AS status FROM personnel WHERE school_id = 1;

-- =====================================================
-- TABLE: classes
-- =====================================================
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER salle;

UPDATE classes SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE classes
ADD CONSTRAINT fk_classes_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_classes_school ON classes(school_id);

-- Modifier contrainte unique pour inclure school_id
ALTER TABLE classes DROP INDEX unique_classe_annee;
ALTER TABLE classes ADD UNIQUE INDEX unique_classe_annee_school (code, annee_scolaire_id, school_id);

SELECT CONCAT('classes: ', COUNT(*), ' rows updated') AS status FROM classes WHERE school_id = 1;

-- =====================================================
-- TABLE: annees_scolaires
-- =====================================================
ALTER TABLE annees_scolaires 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER est_active;

UPDATE annees_scolaires SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE annees_scolaires
ADD CONSTRAINT fk_annees_scolaires_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_annees_scolaires_school ON annees_scolaires(school_id);

-- Modifier contrainte unique pour inclure school_id
ALTER TABLE annees_scolaires DROP INDEX libelle;
ALTER TABLE annees_scolaires ADD UNIQUE INDEX unique_annee_school (libelle, school_id);

SELECT CONCAT('annees_scolaires: ', COUNT(*), ' rows updated') AS status FROM annees_scolaires WHERE school_id = 1;

-- =====================================================
-- RÉACTIVER LES VÉRIFICATIONS FK
-- =====================================================
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 003 completed: core tables now tenant-aware' AS status;
```

### 🔄 Rollback SQL

```sql
-- backend/src/database/migrations/rollback/003_remove_school_id_core_tables.sql
-- Rollback: Retirer school_id des tables principales
-- ⚠️ ATTENTION: Perte de l'isolation multi-tenant !

SET FOREIGN_KEY_CHECKS = 0;

-- eleves
ALTER TABLE eleves DROP FOREIGN KEY fk_eleves_school;
DROP INDEX idx_eleves_school ON eleves;
ALTER TABLE eleves DROP INDEX unique_eleve_matricule_school;
ALTER TABLE eleves ADD UNIQUE INDEX matricule (matricule);
ALTER TABLE eleves DROP COLUMN school_id;

-- enseignants
ALTER TABLE enseignants DROP FOREIGN KEY fk_enseignants_school;
DROP INDEX idx_enseignants_school ON enseignants;
ALTER TABLE enseignants DROP INDEX unique_enseignant_matricule_school;
ALTER TABLE enseignants ADD UNIQUE INDEX matricule (matricule);
ALTER TABLE enseignants DROP COLUMN school_id;

-- personnel
ALTER TABLE personnel DROP FOREIGN KEY fk_personnel_school;
DROP INDEX idx_personnel_school ON personnel;
ALTER TABLE personnel DROP INDEX unique_personnel_matricule_school;
ALTER TABLE personnel ADD UNIQUE INDEX matricule (matricule);
ALTER TABLE personnel DROP COLUMN school_id;

-- classes
ALTER TABLE classes DROP FOREIGN KEY fk_classes_school;
DROP INDEX idx_classes_school ON classes;
ALTER TABLE classes DROP INDEX unique_classe_annee_school;
ALTER TABLE classes ADD UNIQUE INDEX unique_classe_annee (code, annee_scolaire_id);
ALTER TABLE classes DROP COLUMN school_id;

-- annees_scolaires
ALTER TABLE annees_scolaires DROP FOREIGN KEY fk_annees_scolaires_school;
DROP INDEX idx_annees_scolaires_school ON annees_scolaires;
ALTER TABLE annees_scolaires DROP INDEX unique_annee_school;
ALTER TABLE annees_scolaires ADD UNIQUE INDEX libelle (libelle);
ALTER TABLE annees_scolaires DROP COLUMN school_id;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Rollback 003 completed' AS status;
```

---

## ISSUE-009: [DB] Migration - Tables académiques (notes, bulletins, inscriptions, périodes)

### 📋 Informations
- **Type:** Database
- **Priorité:** High
- **Estimé:** 3 heures
- **Labels:** `database`, `migration`, `phase-2`

### 🔧 Migration SQL

```sql
-- backend/src/database/migrations/004_add_school_id_academic_tables.sql
-- Migration: Tables académiques tenant-aware

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: inscriptions
-- =====================================================
ALTER TABLE inscriptions 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER observations;

UPDATE inscriptions SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE inscriptions
ADD CONSTRAINT fk_inscriptions_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_inscriptions_school ON inscriptions(school_id);

-- =====================================================
-- TABLE: matieres
-- =====================================================
ALTER TABLE matieres 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER coefficient;

-- Les matières peuvent être partagées OU par école
-- Pour migration, on assigne à default
UPDATE matieres SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE matieres
ADD CONSTRAINT fk_matieres_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_matieres_school ON matieres(school_id);

-- Modifier contrainte unique
ALTER TABLE matieres DROP INDEX code;
ALTER TABLE matieres ADD UNIQUE INDEX unique_matiere_code_school (code, school_id);

-- =====================================================
-- TABLE: periodes
-- =====================================================
ALTER TABLE periodes 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER ordre;

UPDATE periodes SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE periodes
ADD CONSTRAINT fk_periodes_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_periodes_school ON periodes(school_id);

-- Modifier contrainte unique
ALTER TABLE periodes DROP INDEX unique_periode;
ALTER TABLE periodes ADD UNIQUE INDEX unique_periode_school (code, annee_scolaire_id, school_id);

-- =====================================================
-- TABLE: notes
-- =====================================================
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER commentaire;

UPDATE notes SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE notes
ADD CONSTRAINT fk_notes_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_notes_school ON notes(school_id);

-- =====================================================
-- TABLE: bulletins
-- =====================================================
ALTER TABLE bulletins 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER genere_par;

UPDATE bulletins SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE bulletins
ADD CONSTRAINT fk_bulletins_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_bulletins_school ON bulletins(school_id);

-- Modifier contrainte unique
ALTER TABLE bulletins DROP INDEX unique_bulletin;
ALTER TABLE bulletins ADD UNIQUE INDEX unique_bulletin_school (eleve_id, classe_id, periode_id, school_id);

-- =====================================================
-- TABLE: deliberations
-- =====================================================
ALTER TABLE deliberations 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER created_by;

UPDATE deliberations SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE deliberations
ADD CONSTRAINT fk_deliberations_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_deliberations_school ON deliberations(school_id);

-- =====================================================
-- TABLE: attestations
-- =====================================================
ALTER TABLE attestations 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER genere_par;

UPDATE attestations SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE attestations
ADD CONSTRAINT fk_attestations_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_attestations_school ON attestations(school_id);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 004 completed: academic tables now tenant-aware' AS status;
```

---

## ISSUE-010: [DB] Migration - Tables financières (paiements, dépenses, factures, caisse)

### 📋 Informations
- **Type:** Database
- **Priorité:** High
- **Estimé:** 3 heures
- **Labels:** `database`, `migration`, `phase-2`

### 🔧 Migration SQL

```sql
-- backend/src/database/migrations/005_add_school_id_financial_tables.sql
-- Migration: Tables financières tenant-aware

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: frais_scolaires
-- =====================================================
ALTER TABLE frais_scolaires 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER date_limite;

UPDATE frais_scolaires SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE frais_scolaires
ADD CONSTRAINT fk_frais_scolaires_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_frais_scolaires_school ON frais_scolaires(school_id);

-- =====================================================
-- TABLE: paiements
-- =====================================================
ALTER TABLE paiements 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER recu_par;

UPDATE paiements SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE paiements
ADD CONSTRAINT fk_paiements_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_paiements_school ON paiements(school_id);

-- =====================================================
-- TABLE: factures
-- =====================================================
ALTER TABLE factures 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER date_echeance;

UPDATE factures SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE factures
ADD CONSTRAINT fk_factures_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_factures_school ON factures(school_id);

-- =====================================================
-- TABLE: depenses
-- =====================================================
ALTER TABLE depenses 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER created_by;

UPDATE depenses SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE depenses
ADD CONSTRAINT fk_depenses_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_depenses_school ON depenses(school_id);

-- =====================================================
-- TABLE: mouvements_caisse
-- =====================================================
ALTER TABLE mouvements_caisse 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER created_by;

UPDATE mouvements_caisse SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE mouvements_caisse
ADD CONSTRAINT fk_mouvements_caisse_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_mouvements_caisse_school ON mouvements_caisse(school_id);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 005 completed: financial tables now tenant-aware' AS status;
```

---

## ISSUE-011: [DB] Migration - Tables RH (salaires, congés, contrats, présences)

### 🔧 Migration SQL

```sql
-- backend/src/database/migrations/006_add_school_id_hr_tables.sql
-- Migration: Tables RH tenant-aware

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: salaires
-- =====================================================
ALTER TABLE salaires 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER observations;

UPDATE salaires SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE salaires
ADD CONSTRAINT fk_salaires_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_salaires_school ON salaires(school_id);

-- Modifier contrainte unique
ALTER TABLE salaires DROP INDEX unique_salaire;
ALTER TABLE salaires ADD UNIQUE INDEX unique_salaire_school (employe_type, employe_id, mois, annee, school_id);

-- =====================================================
-- TABLE: conges
-- =====================================================
ALTER TABLE conges 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER commentaire_approbation;

UPDATE conges SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE conges
ADD CONSTRAINT fk_conges_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_conges_school ON conges(school_id);

-- =====================================================
-- TABLE: contrats
-- =====================================================
ALTER TABLE contrats 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER statut;

UPDATE contrats SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE contrats
ADD CONSTRAINT fk_contrats_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_contrats_school ON contrats(school_id);

-- =====================================================
-- TABLE: presences
-- =====================================================
ALTER TABLE presences 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER observations;

UPDATE presences SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE presences
ADD CONSTRAINT fk_presences_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_presences_school ON presences(school_id);

-- Modifier contrainte unique
ALTER TABLE presences DROP INDEX unique_presence;
ALTER TABLE presences ADD UNIQUE INDEX unique_presence_school (employe_type, employe_id, date_presence, school_id);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 006 completed: HR tables now tenant-aware' AS status;
```

---

## ISSUE-012: [DB] Migration - Tables de liaison et emploi du temps

### 🔧 Migration SQL

```sql
-- backend/src/database/migrations/007_add_school_id_junction_tables.sql
-- Migration: Tables de liaison et emploi du temps

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: classe_matieres
-- =====================================================
ALTER TABLE classe_matieres 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER heures_semaine;

UPDATE classe_matieres SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE classe_matieres
ADD CONSTRAINT fk_classe_matieres_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_classe_matieres_school ON classe_matieres(school_id);

-- =====================================================
-- TABLE: enseignant_affectations
-- =====================================================
ALTER TABLE enseignant_affectations 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER heures_semaine;

UPDATE enseignant_affectations SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE enseignant_affectations
ADD CONSTRAINT fk_enseignant_affectations_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_enseignant_affectations_school ON enseignant_affectations(school_id);

-- =====================================================
-- TABLE: salles
-- =====================================================
ALTER TABLE salles 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER equipements;

UPDATE salles SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE salles
ADD CONSTRAINT fk_salles_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_salles_school ON salles(school_id);

-- Modifier contrainte unique
ALTER TABLE salles DROP INDEX code;
ALTER TABLE salles ADD UNIQUE INDEX unique_salle_code_school (code, school_id);

-- =====================================================
-- TABLE: creneaux_horaires
-- =====================================================
ALTER TABLE creneaux_horaires 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER ordre;

UPDATE creneaux_horaires SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE creneaux_horaires
ADD CONSTRAINT fk_creneaux_horaires_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_creneaux_horaires_school ON creneaux_horaires(school_id);

-- =====================================================
-- TABLE: emploi_temps
-- =====================================================
ALTER TABLE emploi_temps 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER annee_scolaire_id;

UPDATE emploi_temps SET school_id = 1 WHERE school_id IS NULL;

ALTER TABLE emploi_temps
ADD CONSTRAINT fk_emploi_temps_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

CREATE INDEX idx_emploi_temps_school ON emploi_temps(school_id);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 007 completed: junction tables now tenant-aware' AS status;
```

---

## ISSUE-013: [DB] Migration - Tables référentielles optionnelles

### 📝 Description

Certaines tables référentielles peuvent rester globales (cycles RDC standard) ou être dupliquées par école. Cette migration ajoute `school_id` nullable pour permettre les deux cas.

### 🔧 Migration SQL

```sql
-- backend/src/database/migrations/008_add_school_id_reference_tables.sql
-- Migration: Tables référentielles (optionnellement par école)

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: niveaux
-- Note: school_id NULL = niveau standard RDC
-- school_id = X = niveau personnalisé pour école X
-- =====================================================
ALTER TABLE niveaux 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER ordre;

-- On garde les niveaux existants comme standards (NULL)
-- Les écoles pourront créer leurs propres niveaux si besoin

ALTER TABLE niveaux
ADD CONSTRAINT fk_niveaux_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

CREATE INDEX idx_niveaux_school ON niveaux(school_id);

-- Modifier contrainte unique pour permettre même code par école
ALTER TABLE niveaux DROP INDEX code;
ALTER TABLE niveaux ADD UNIQUE INDEX unique_niveau_code_school (code, IFNULL(school_id, 0));

-- =====================================================
-- TABLE: filieres
-- =====================================================
ALTER TABLE filieres 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER description;

ALTER TABLE filieres
ADD CONSTRAINT fk_filieres_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

CREATE INDEX idx_filieres_school ON filieres(school_id);

-- =====================================================
-- TABLE: cycles (reste global - standard RDC)
-- On ajoute school_id pour possibilité future mais on ne l'utilise pas
-- =====================================================
ALTER TABLE cycles 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER ordre;

ALTER TABLE cycles
ADD CONSTRAINT fk_cycles_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 008 completed: reference tables updated' AS status;
```

---

## ISSUE-014: [DB] Migration - Tables communication et logs

### 🔧 Migration SQL

```sql
-- backend/src/database/migrations/009_add_school_id_communication_tables.sql
-- Migration: Tables communication et logs

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE: notifications
-- =====================================================
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER lien;

UPDATE notifications n
JOIN utilisateurs u ON n.utilisateur_id = u.id
SET n.school_id = u.school_id
WHERE n.school_id IS NULL;

ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

CREATE INDEX idx_notifications_school ON notifications(school_id);

-- =====================================================
-- TABLE: messages_contact
-- Note: Messages de la landing page - peuvent être par école
-- =====================================================
ALTER TABLE messages_contact 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER created_at;

-- Messages existants restent sans école (platform-wide)
-- Nouveaux messages seront assignés à l'école si contexte disponible

ALTER TABLE messages_contact
ADD CONSTRAINT fk_messages_contact_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;

CREATE INDEX idx_messages_contact_school ON messages_contact(school_id);

-- =====================================================
-- TABLE: logs_systeme
-- =====================================================
ALTER TABLE logs_systeme 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER user_agent;

-- Associer les logs existants via l'utilisateur
UPDATE logs_systeme l
JOIN utilisateurs u ON l.utilisateur_id = u.id
SET l.school_id = u.school_id
WHERE l.school_id IS NULL AND l.utilisateur_id IS NOT NULL;

ALTER TABLE logs_systeme
ADD CONSTRAINT fk_logs_systeme_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;

CREATE INDEX idx_logs_systeme_school ON logs_systeme(school_id);

-- =====================================================
-- TABLE: historique_connexions
-- =====================================================
ALTER TABLE historique_connexions 
ADD COLUMN IF NOT EXISTS school_id INT NULL AFTER succes;

UPDATE historique_connexions h
JOIN utilisateurs u ON h.utilisateur_id = u.id
SET h.school_id = u.school_id
WHERE h.school_id IS NULL;

ALTER TABLE historique_connexions
ADD CONSTRAINT fk_historique_connexions_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

CREATE INDEX idx_historique_connexions_school ON historique_connexions(school_id);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 009 completed: communication tables now tenant-aware' AS status;
```

---

## ISSUE-015: [BE] Mise à jour des repositories avec filtrage tenant

### 📋 Informations
- **Type:** Backend
- **Priorité:** Critical
- **Estimé:** 8 heures
- **Labels:** `backend`, `phase-2`

### 📝 Description

Mettre à jour tous les endpoints API pour utiliser le filtrage par `school_id` via le tenant middleware.

### ✅ Checklist

- [ ] Mettre à jour `eleves.routes.ts`
- [ ] Mettre à jour `enseignants.routes.ts`
- [ ] Mettre à jour `classes.routes.ts`
- [ ] Mettre à jour `paiements.routes.ts`
- [ ] Mettre à jour `notes.routes.ts`
- [ ] Mettre à jour tous les autres routes
- [ ] Ajouter tests pour chaque route
- [ ] Vérifier qu'un user ne peut pas accéder aux données d'une autre école

### 🔧 Exemple Pattern à Appliquer

```typescript
// backend/src/routes/eleves.routes.ts

import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { tenantMiddleware, TenantRequest, requireTenant } from '../middlewares/tenant.middleware'
import { buildTenantFilter } from '../database/scopedQuery'
import { query } from '../database/connection'

const router = Router()

// Appliquer les middlewares sur toutes les routes
router.use(authenticate)
router.use(tenantMiddleware)
router.use(requireTenant)

// GET /api/eleves
router.get('/', async (req: TenantRequest, res) => {
  try {
    const { page = 1, limit = 20, search, classeId, statut } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    
    // ✅ Construire le filtre tenant
    const [tenantWhere, tenantParams] = buildTenantFilter(req.tenant!, 'e')
    
    let whereClause = tenantWhere
    const params = [...tenantParams]
    
    // Filtres additionnels
    if (search) {
      whereClause += ` AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ?)`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }
    
    if (classeId) {
      whereClause += ` AND i.classe_id = ?`
      params.push(classeId)
    }
    
    // Query avec pagination
    const eleves = await query<any[]>(`
      SELECT 
        e.*,
        c.libelle as classe_nom,
        c.id as classe_id
      FROM eleves e
      LEFT JOIN inscriptions i ON e.id = i.eleve_id 
        AND i.annee_scolaire_id = (SELECT id FROM annees_scolaires WHERE est_active = TRUE AND school_id = e.school_id LIMIT 1)
      LEFT JOIN classes c ON i.classe_id = c.id
      WHERE ${whereClause}
      ORDER BY e.nom, e.prenom
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), offset])
    
    // Count total
    const [countResult] = await query<any[]>(`
      SELECT COUNT(*) as total FROM eleves e WHERE ${tenantWhere}
    `, tenantParams)
    
    res.json({
      success: true,
      data: eleves,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erreur liste élèves:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/eleves/:id
router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params
    const [tenantWhere, tenantParams] = buildTenantFilter(req.tenant!, 'e')
    
    const eleves = await query<any[]>(`
      SELECT e.* FROM eleves e
      WHERE e.id = ? AND ${tenantWhere}
    `, [id, ...tenantParams])
    
    if (eleves.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Élève non trouvé'
      })
    }
    
    res.json({ success: true, data: eleves[0] })
  } catch (error) {
    console.error('Erreur détail élève:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/eleves
router.post('/', async (req: TenantRequest, res) => {
  try {
    // SuperAdmin sans contexte école doit spécifier school_id
    let schoolId = req.tenant!.id
    
    if (req.tenant!.isSuper && schoolId === null) {
      if (!req.body.school_id) {
        return res.status(400).json({
          success: false,
          message: 'SuperAdmin doit spécifier school_id'
        })
      }
      schoolId = req.body.school_id
    }
    
    const { matricule, nom, prenom, sexe, date_naissance, ...rest } = req.body
    
    // Vérifier unicité matricule pour cette école
    const existing = await query<any[]>(
      'SELECT id FROM eleves WHERE matricule = ? AND school_id = ?',
      [matricule, schoolId]
    )
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ce matricule existe déjà dans cette école'
      })
    }
    
    const result = await query<any>(`
      INSERT INTO eleves (matricule, nom, prenom, sexe, date_naissance, school_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [matricule, nom, prenom, sexe, date_naissance, schoolId])
    
    res.status(201).json({
      success: true,
      message: 'Élève créé',
      data: { id: result.insertId }
    })
  } catch (error) {
    console.error('Erreur création élève:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/eleves/:id
router.put('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params
    const [tenantWhere, tenantParams] = buildTenantFilter(req.tenant!)
    
    // Vérifier que l'élève appartient à cette école
    const existing = await query<any[]>(
      `SELECT id FROM eleves WHERE id = ? AND ${tenantWhere}`,
      [id, ...tenantParams]
    )
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Élève non trouvé'
      })
    }
    
    // Update avec les champs fournis
    const updates = req.body
    delete updates.id
    delete updates.school_id // Empêcher changement d'école
    
    const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ')
    
    await query(
      `UPDATE eleves SET ${setClause} WHERE id = ? AND ${tenantWhere}`,
      [...Object.values(updates), id, ...tenantParams]
    )
    
    res.json({ success: true, message: 'Élève mis à jour' })
  } catch (error) {
    console.error('Erreur update élève:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/eleves/:id
router.delete('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params
    const [tenantWhere, tenantParams] = buildTenantFilter(req.tenant!)
    
    const result = await query<any>(
      `DELETE FROM eleves WHERE id = ? AND ${tenantWhere}`,
      [id, ...tenantParams]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Élève non trouvé'
      })
    }
    
    res.json({ success: true, message: 'Élève supprimé' })
  } catch (error) {
    console.error('Erreur suppression élève:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
```

---

## Résumé Phase 2

### Migrations à Exécuter (dans l'ordre)

1. `003_add_school_id_core_tables.sql`
2. `004_add_school_id_academic_tables.sql`
3. `005_add_school_id_financial_tables.sql`
4. `006_add_school_id_hr_tables.sql`
5. `007_add_school_id_junction_tables.sql`
6. `008_add_school_id_reference_tables.sql`
7. `009_add_school_id_communication_tables.sql`

### Script de Migration Complet

```bash
#!/bin/bash
# backend/src/database/run_migrations.sh

echo "🚀 Exécution des migrations Multi-Tenant Phase 2"

MIGRATIONS_DIR="./migrations"
DB_NAME="bdd_scolaire_staging"

for migration in $MIGRATIONS_DIR/00[3-9]_*.sql; do
  echo "📝 Exécution: $migration"
  mysql -u root -p$DB_PASSWORD $DB_NAME < $migration
  if [ $? -ne 0 ]; then
    echo "❌ Erreur sur $migration"
    exit 1
  fi
  echo "✅ $migration terminé"
done

echo "🎉 Toutes les migrations Phase 2 complétées!"
```

### Vérification Post-Migration

```sql
-- Vérifier que toutes les tables ont school_id
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'bdd_scolaire'
AND COLUMN_NAME = 'school_id'
ORDER BY TABLE_NAME;

-- Vérifier les FK vers schools
SELECT 
  TABLE_NAME,
  CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME = 'schools'
AND TABLE_SCHEMA = 'bdd_scolaire';

-- Vérifier que toutes les données ont school_id = 1
SELECT 'eleves' as tbl, COUNT(*) as total, SUM(school_id IS NULL) as nulls FROM eleves
UNION ALL SELECT 'classes', COUNT(*), SUM(school_id IS NULL) FROM classes
UNION ALL SELECT 'enseignants', COUNT(*), SUM(school_id IS NULL) FROM enseignants
UNION ALL SELECT 'paiements', COUNT(*), SUM(school_id IS NULL) FROM paiements;
```



