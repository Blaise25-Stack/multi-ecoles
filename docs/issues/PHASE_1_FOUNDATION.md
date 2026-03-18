# Phase 1 - Foundation Multi-Tenant

> 🎯 **Objectif:** Introduire l'entité École sans casser le système existant

---

## ISSUE-004: [DB] Créer table schools + seed default

### 📋 Informations
- **Type:** Database
- **Priorité:** Critical
- **Assigné:** Backend Dev
- **Estimé:** 2 heures
- **Labels:** `database`, `migration`, `critical`, `phase-1`
- **Dépendances:** Phase 0 complétée

### 📝 Description

Créer la table `schools` qui représentera chaque établissement scolaire. Ajouter une école par défaut (id=1) pour assigner les données existantes et maintenir la rétrocompatibilité.

### ✅ Checklist

- [ ] Créer fichier migration SQL
- [ ] Créer script rollback SQL
- [ ] Exécuter migration sur staging
- [ ] Vérifier école default créée
- [ ] Tester que le système fonctionne toujours

### 📁 Livrables

1. **Migration:** `backend/src/database/migrations/001_create_schools_table.sql`
2. **Rollback:** `backend/src/database/migrations/rollback/001_drop_schools_table.sql`

### 🔧 Migration SQL

```sql
-- backend/src/database/migrations/001_create_schools_table.sql
-- Migration: Créer table schools
-- Date: 2024-12-05
-- Description: Table principale pour le multi-tenancy

-- =====================================================
-- TABLE SCHOOLS (Établissements)
-- =====================================================
CREATE TABLE IF NOT EXISTS schools (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Code unique de l école (ex: ECO001)',
  name VARCHAR(255) NOT NULL COMMENT 'Nom complet de l établissement',
  short_name VARCHAR(100) COMMENT 'Nom court / sigle',
  
  -- Informations de contact
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100) DEFAULT 'Kinshasa',
  country VARCHAR(50) DEFAULT 'RDC',
  telephone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  whatsapp_number VARCHAR(50),
  
  -- Configuration
  currency VARCHAR(10) DEFAULT 'FC' COMMENT 'Devise (FC, USD)',
  timezone VARCHAR(50) DEFAULT 'Africa/Kinshasa',
  logo VARCHAR(255),
  primary_color VARCHAR(20) DEFAULT '#1E40AF',
  
  -- Méta
  is_active BOOLEAN DEFAULT TRUE,
  subscription_plan ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'basic',
  subscription_expires_at DATE,
  max_students INT DEFAULT 500,
  max_users INT DEFAULT 50,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  
  INDEX idx_schools_code (code),
  INDEX idx_schools_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED: École par défaut (pour migration backward-compatible)
-- =====================================================
INSERT INTO schools (id, code, name, short_name, address, telephone, email, province, currency)
SELECT 1, 'DEFAULT', 'École par défaut (Migration)', 'DEFAULT',
       e.adresse, e.telephone, e.email, e.province, 'FC'
FROM etablissement e
WHERE e.id = 1
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Si pas d'établissement existant, insérer valeurs par défaut
INSERT IGNORE INTO schools (id, code, name, short_name, province, currency)
VALUES (1, 'DEFAULT', 'École par défaut (Migration)', 'DEFAULT', 'Kinshasa', 'FC');

-- =====================================================
-- TABLE SCHOOL_SETTINGS (Configuration par école)
-- =====================================================
CREATE TABLE IF NOT EXISTS school_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_school_setting (school_id, setting_key),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED: Settings par défaut pour école default
-- =====================================================
INSERT IGNORE INTO school_settings (school_id, setting_key, setting_value, setting_type, description) VALUES
(1, 'academic_year_format', 'YYYY-YYYY', 'string', 'Format année scolaire'),
(1, 'grading_system', '20', 'number', 'Système de notation (sur 20)'),
(1, 'passing_grade', '10', 'number', 'Note de passage'),
(1, 'terms_per_year', '3', 'number', 'Nombre de trimestres'),
(1, 'allow_student_portal', 'true', 'boolean', 'Autoriser portail élève'),
(1, 'allow_parent_portal', 'true', 'boolean', 'Autoriser portail parent'),
(1, 'sms_notifications', 'false', 'boolean', 'Activer SMS'),
(1, 'email_notifications', 'true', 'boolean', 'Activer emails');

SELECT 'Migration 001 completed: schools table created' AS status;
```

### 🔄 Rollback SQL

```sql
-- backend/src/database/migrations/rollback/001_drop_schools_table.sql
-- Rollback: Supprimer table schools
-- ⚠️ ATTENTION: Ne pas exécuter en prod si des FK existent !

-- Vérifier d'abord qu'aucune FK n'existe
SELECT 
  TABLE_NAME, 
  COLUMN_NAME, 
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME = 'schools'
AND TABLE_SCHEMA = 'bdd_scolaire';

-- Si aucune FK, procéder
DROP TABLE IF EXISTS school_settings;
DROP TABLE IF EXISTS schools;

SELECT 'Rollback 001 completed: schools table dropped' AS status;
```

### 🧪 Tests de Validation

```sql
-- Vérifier la création
SELECT * FROM schools WHERE id = 1;

-- Vérifier les settings
SELECT * FROM school_settings WHERE school_id = 1;

-- Vérifier les index
SHOW INDEX FROM schools;
```

### ✔️ Critères d'Acceptation

- [ ] Table `schools` créée avec toutes les colonnes
- [ ] École default (id=1) présente
- [ ] Settings default créés
- [ ] Index performants en place
- [ ] Système existant fonctionne toujours

---

## ISSUE-005: [DB] Ajouter school_id à utilisateurs

### 📋 Informations
- **Type:** Database
- **Priorité:** Critical
- **Assigné:** Backend Dev
- **Estimé:** 2 heures
- **Labels:** `database`, `migration`, `critical`, `phase-1`
- **Dépendances:** ISSUE-004

### 📝 Description

Ajouter la colonne `school_id` à la table `utilisateurs`. Tous les utilisateurs existants seront assignés à l'école default (id=1). Le SuperAdmin aura `school_id = NULL` pour indiquer accès global.

### ✅ Checklist

- [ ] Créer fichier migration SQL
- [ ] Créer script rollback SQL
- [ ] Exécuter migration sur staging
- [ ] Vérifier tous users ont school_id = 1 (sauf SuperAdmin)
- [ ] Mettre SuperAdmin à school_id = NULL
- [ ] Tester login fonctionne toujours

### 📁 Livrables

1. **Migration:** `backend/src/database/migrations/002_add_school_id_to_users.sql`
2. **Rollback:** `backend/src/database/migrations/rollback/002_remove_school_id_from_users.sql`

### 🔧 Migration SQL

```sql
-- backend/src/database/migrations/002_add_school_id_to_users.sql
-- Migration: Ajouter school_id à utilisateurs
-- Date: 2024-12-05
-- Description: Rendre les utilisateurs tenant-aware

-- =====================================================
-- ÉTAPE 1: Ajouter colonne (nullable pour commencer)
-- =====================================================
ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS school_id INT NULL 
COMMENT 'École de rattachement. NULL = SuperAdmin (accès global)'
AFTER role_id;

-- =====================================================
-- ÉTAPE 2: Assigner école default aux users existants
-- =====================================================
UPDATE utilisateurs 
SET school_id = 1 
WHERE school_id IS NULL;

-- =====================================================
-- ÉTAPE 3: SuperAdmin reste NULL (accès global)
-- =====================================================
UPDATE utilisateurs u
JOIN roles r ON u.role_id = r.id
SET u.school_id = NULL
WHERE r.code = 'super_admin';

-- =====================================================
-- ÉTAPE 4: Ajouter la Foreign Key
-- =====================================================
-- Note: On ne fait PAS school_id NOT NULL car SuperAdmin doit rester NULL
ALTER TABLE utilisateurs
ADD CONSTRAINT fk_utilisateurs_school 
FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

-- =====================================================
-- ÉTAPE 5: Ajouter index pour performance
-- =====================================================
CREATE INDEX idx_utilisateurs_school ON utilisateurs(school_id);

-- =====================================================
-- VÉRIFICATION
-- =====================================================
SELECT 
  u.id, 
  u.email, 
  u.nom, 
  r.code as role,
  u.school_id,
  s.name as school_name
FROM utilisateurs u
JOIN roles r ON u.role_id = r.id
LEFT JOIN schools s ON u.school_id = s.id
ORDER BY u.school_id IS NULL DESC, u.id;

SELECT 'Migration 002 completed: school_id added to utilisateurs' AS status;
```

### 🔄 Rollback SQL

```sql
-- backend/src/database/migrations/rollback/002_remove_school_id_from_users.sql
-- Rollback: Retirer school_id de utilisateurs

-- Supprimer la FK d'abord
ALTER TABLE utilisateurs DROP FOREIGN KEY fk_utilisateurs_school;

-- Supprimer l'index
DROP INDEX idx_utilisateurs_school ON utilisateurs;

-- Supprimer la colonne
ALTER TABLE utilisateurs DROP COLUMN school_id;

SELECT 'Rollback 002 completed: school_id removed from utilisateurs' AS status;
```

### 🧪 Tests de Validation

```sql
-- Vérifier la colonne
DESCRIBE utilisateurs;

-- Vérifier les assignations
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN school_id IS NULL THEN 1 ELSE 0 END) as super_admins,
  SUM(CASE WHEN school_id = 1 THEN 1 ELSE 0 END) as default_school
FROM utilisateurs;

-- Vérifier SuperAdmin
SELECT id, email, nom, school_id 
FROM utilisateurs u 
JOIN roles r ON u.role_id = r.id 
WHERE r.code = 'super_admin';
```

### ✔️ Critères d'Acceptation

- [ ] Colonne `school_id` ajoutée
- [ ] Users existants → school_id = 1
- [ ] SuperAdmin → school_id = NULL
- [ ] FK en place
- [ ] Index créé
- [ ] Login fonctionne toujours

---

## ISSUE-006: [BE] Modifier auth/login pour retourner school

### 📋 Informations
- **Type:** Backend
- **Priorité:** Critical
- **Assigné:** Backend Dev
- **Estimé:** 3 heures
- **Labels:** `backend`, `auth`, `critical`, `phase-1`
- **Dépendances:** ISSUE-005

### 📝 Description

Modifier le endpoint `/api/auth/login` pour inclure les informations de l'école dans la réponse. Le JWT doit aussi contenir le `school_id` pour éviter des requêtes supplémentaires.

### ✅ Checklist

- [ ] Modifier query login pour joindre schools
- [ ] Ajouter school_id au payload JWT
- [ ] Modifier réponse login pour inclure objet school
- [ ] Modifier endpoint `/api/auth/me`
- [ ] Mettre à jour les types TypeScript
- [ ] Tests unitaires
- [ ] Tester avec SuperAdmin (school = null)
- [ ] Tester avec user normal (school = object)

### 📁 Livrables

1. **Route modifiée:** `backend/src/routes/auth.routes.ts`
2. **Types:** `backend/src/types/auth.types.ts`
3. **Tests:** `backend/src/tests/auth.test.ts`

### 🔧 Code Backend

```typescript
// backend/src/routes/auth.routes.ts (modifications)

// POST /api/auth/login - Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      })
    }

    // ✅ MODIFIÉ: Joindre la table schools
    const users = await query<any[]>(`
      SELECT 
        u.*, 
        r.code as role_code, 
        r.libelle as role_libelle,
        s.id as school_id,
        s.code as school_code,
        s.name as school_name,
        s.short_name as school_short_name,
        s.logo as school_logo,
        s.currency as school_currency,
        s.is_active as school_is_active
      FROM utilisateurs u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.email = ?
    `, [email])

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      })
    }

    const user = users[0]

    // Vérifications existantes...
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.',
      })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      })
    }

    // ✅ MODIFIÉ: Vérifier si l'école est active (sauf SuperAdmin)
    if (user.school_id && !user.school_is_active) {
      return res.status(403).json({
        success: false,
        message: 'Cette école est désactivée. Contactez l\'administrateur plateforme.',
      })
    }

    // ✅ MODIFIÉ: Ajouter school_id au JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        schoolId: user.school_id,  // null pour SuperAdmin
        role: user.role_code
      },
      config.jwt.secret,
      { expiresIn: '24h' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: '7d' }
    )

    // Mettre à jour la dernière connexion
    await query(`UPDATE utilisateurs SET last_login = NOW() WHERE id = ?`, [user.id])

    // Enregistrer dans l'historique
    await query(`
      INSERT INTO historique_connexions (utilisateur_id, ip_address, user_agent, succes)
      VALUES (?, ?, ?, TRUE)
    `, [user.id, req.ip, req.headers['user-agent']])

    // Récupérer les permissions (code existant)
    const permissions = await query<any[]>(`
      SELECT DISTINCT p.module, p.action
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = ?
      LEFT JOIN utilisateur_permissions up ON p.id = up.permission_id AND up.utilisateur_id = ?
      WHERE rp.permission_id IS NOT NULL OR up.permission_id IS NOT NULL
    `, [user.role_id, user.id])

    const formattedPermissions = formatPermissions(permissions)

    // ✅ MODIFIÉ: Construire l'objet school
    const school = user.school_id ? {
      id: user.school_id,
      code: user.school_code,
      name: user.school_name,
      shortName: user.school_short_name,
      logo: user.school_logo,
      currency: user.school_currency,
    } : null

    // ✅ MODIFIÉ: Réponse avec school
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          telephone: user.telephone,
          avatar: user.avatar,
          role: user.role_code,
          roleLibelle: user.role_libelle,
          schoolId: user.school_id,  // ✅ AJOUTÉ
          permissions: formattedPermissions,
          isActive: user.is_active,
          isSuperAdmin: user.role_code === 'super_admin',  // ✅ AJOUTÉ
          lastLogin: user.last_login,
          createdAt: user.created_at,
        },
        school,  // ✅ AJOUTÉ: null pour SuperAdmin
        token,
        refreshToken,
      },
    })
  } catch (error) {
    console.error('Erreur login:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    })
  }
})

// Helper function
function formatPermissions(permissions: any[]): { module: string; actions: string[] }[] {
  const result: { module: string; actions: string[] }[] = []
  permissions.forEach(p => {
    const existing = result.find(fp => fp.module === p.module)
    if (existing) {
      existing.actions.push(p.action)
    } else {
      result.push({ module: p.module, actions: [p.action] })
    }
  })
  return result
}
```

### 📄 Types TypeScript

```typescript
// backend/src/types/auth.types.ts

export interface JwtPayload {
  userId: number
  email: string
  schoolId: number | null  // null = SuperAdmin
  role: string
  iat?: number
  exp?: number
}

export interface School {
  id: number
  code: string
  name: string
  shortName: string | null
  logo: string | null
  currency: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: {
      id: number
      email: string
      nom: string
      prenom: string
      telephone: string | null
      avatar: string | null
      role: string
      roleLibelle: string
      schoolId: number | null
      permissions: { module: string; actions: string[] }[]
      isActive: boolean
      isSuperAdmin: boolean
      lastLogin: string | null
      createdAt: string
    }
    school: School | null  // null pour SuperAdmin
    token: string
    refreshToken: string
  }
}
```

### 🧪 Tests

```typescript
// backend/src/tests/auth.test.ts

describe('Auth Login Multi-Tenant', () => {
  
  it('should return school info for regular user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@school.edu', password: 'password123' })
    
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.school).not.toBeNull()
    expect(response.body.data.school.id).toBeDefined()
    expect(response.body.data.user.schoolId).toBe(response.body.data.school.id)
    expect(response.body.data.user.isSuperAdmin).toBe(false)
  })

  it('should return null school for SuperAdmin', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@sgs-rdc.edu', password: 'admin123' })
    
    expect(response.status).toBe(200)
    expect(response.body.data.school).toBeNull()
    expect(response.body.data.user.schoolId).toBeNull()
    expect(response.body.data.user.isSuperAdmin).toBe(true)
  })

  it('should reject login for disabled school', async () => {
    // Setup: Désactiver une école
    await query("UPDATE schools SET is_active = FALSE WHERE id = 2")
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@disabled-school.edu', password: 'password123' })
    
    expect(response.status).toBe(403)
    expect(response.body.message).toContain('désactivée')
    
    // Cleanup
    await query("UPDATE schools SET is_active = TRUE WHERE id = 2")
  })

  it('should include schoolId in JWT token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@school.edu', password: 'password123' })
    
    const decoded = jwt.decode(response.body.data.token) as any
    expect(decoded.schoolId).toBeDefined()
  })
})
```

### ✔️ Critères d'Acceptation

- [ ] Login retourne objet `school` pour user normal
- [ ] Login retourne `school: null` pour SuperAdmin
- [ ] JWT contient `schoolId`
- [ ] École désactivée → login refusé (sauf SuperAdmin)
- [ ] Tous les tests passent
- [ ] Frontend existant fonctionne toujours

---

## ISSUE-007: [BE] Créer tenant middleware

### 📋 Informations
- **Type:** Backend
- **Priorité:** Critical
- **Assigné:** Backend Dev
- **Estimé:** 4 heures
- **Labels:** `backend`, `middleware`, `critical`, `phase-1`
- **Dépendances:** ISSUE-006

### 📝 Description

Créer le middleware `tenantMiddleware` qui extrait le `school_id` du JWT et l'ajoute au contexte de la requête. Ce middleware sera utilisé pour filtrer automatiquement les données par école.

### ✅ Checklist

- [ ] Créer fichier `tenant.middleware.ts`
- [ ] Extraire school_id du JWT décodé
- [ ] Gérer cas SuperAdmin (bypass)
- [ ] Exposer helpers pour queries scopées
- [ ] Intégrer dans les routes existantes
- [ ] Tests unitaires
- [ ] Documentation

### 📁 Livrables

1. **Middleware:** `backend/src/middlewares/tenant.middleware.ts`
2. **Types:** `backend/src/types/tenant.types.ts`
3. **Helpers:** `backend/src/database/scopedQuery.ts`
4. **Tests:** `backend/src/tests/tenant.middleware.test.ts`

### 🔧 Code Middleware

```typescript
// backend/src/middlewares/tenant.middleware.ts

import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'
import { query } from '../database/connection'

// Types pour le contexte tenant
export interface TenantContext {
  id: number | null       // school_id (null = SuperAdmin)
  isSuper: boolean        // true si SuperAdmin
  schoolCode?: string     // Code de l'école
  schoolName?: string     // Nom de l'école
}

// Étendre AuthRequest pour inclure tenant
export interface TenantRequest extends AuthRequest {
  tenant?: TenantContext
}

/**
 * Middleware pour résoudre le contexte tenant depuis le JWT/user
 * Doit être utilisé APRÈS authenticate middleware
 */
export const tenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Vérifier que l'auth est déjà faite
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié - tenant middleware requires auth',
      })
    }

    // SuperAdmin = accès global
    if (req.user.role_code === 'super_admin') {
      req.tenant = {
        id: null,
        isSuper: true,
      }
      return next()
    }

    // Récupérer school_id depuis le user (déjà chargé par auth)
    // Note: On pourrait aussi le récupérer depuis le JWT décodé
    const users = await query<any[]>(`
      SELECT u.school_id, s.code, s.name, s.is_active
      FROM utilisateurs u
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.id = ?
    `, [req.user.id])

    if (users.length === 0 || !users[0].school_id) {
      return res.status(403).json({
        success: false,
        message: 'Aucune école assignée à cet utilisateur',
      })
    }

    const userData = users[0]

    // Vérifier que l'école est active
    if (!userData.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Cette école est désactivée',
      })
    }

    req.tenant = {
      id: userData.school_id,
      isSuper: false,
      schoolCode: userData.code,
      schoolName: userData.name,
    }

    next()
  } catch (error) {
    console.error('Erreur tenant middleware:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur (tenant resolution)',
    })
  }
}

/**
 * Middleware pour forcer un school_id spécifique (SuperAdmin seulement)
 * Usage: PUT /api/superadmin/schools/:schoolId/...
 */
export const forceSchoolContext = (paramName: string = 'schoolId') => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    // Doit être SuperAdmin
    if (!req.tenant?.isSuper) {
      return res.status(403).json({
        success: false,
        message: 'Accès SuperAdmin requis',
      })
    }

    const schoolId = parseInt(req.params[paramName])
    
    if (isNaN(schoolId)) {
      return res.status(400).json({
        success: false,
        message: 'school_id invalide',
      })
    }

    // Vérifier que l'école existe
    const schools = await query<any[]>(
      'SELECT id, code, name FROM schools WHERE id = ?',
      [schoolId]
    )

    if (schools.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'École non trouvée',
      })
    }

    // Override le tenant context
    req.tenant = {
      id: schoolId,
      isSuper: true,  // Garde le flag super
      schoolCode: schools[0].code,
      schoolName: schools[0].name,
    }

    next()
  }
}

/**
 * Guard pour s'assurer que le tenant context est présent
 */
export const requireTenant = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.tenant) {
    return res.status(500).json({
      success: false,
      message: 'Tenant context missing - check middleware order',
    })
  }

  if (!req.tenant.isSuper && !req.tenant.id) {
    return res.status(403).json({
      success: false,
      message: 'Aucune école dans le contexte',
    })
  }

  next()
}
```

### 🔧 Helpers pour Queries Scopées

```typescript
// backend/src/database/scopedQuery.ts

import { query } from './connection'
import { TenantRequest, TenantContext } from '../middlewares/tenant.middleware'

/**
 * Construit une clause WHERE pour filtrer par school_id
 * @param tenant - Context tenant de la requête
 * @param alias - Alias de table optionnel (ex: 'e' pour eleves)
 * @returns Tuple [whereClause, params]
 */
export function buildTenantFilter(
  tenant: TenantContext,
  alias?: string
): [string, any[]] {
  // SuperAdmin sans contexte forcé = pas de filtre
  if (tenant.isSuper && tenant.id === null) {
    return ['1=1', []]
  }

  const column = alias ? `${alias}.school_id` : 'school_id'
  return [`${column} = ?`, [tenant.id]]
}

/**
 * Execute une query scopée par tenant
 */
export async function scopedQuery<T>(
  tenant: TenantContext,
  sql: string,
  params: any[] = []
): Promise<T> {
  // Si SuperAdmin sans scope, exécuter tel quel
  if (tenant.isSuper && tenant.id === null) {
    return query<T>(sql, params)
  }

  // Sinon, s'assurer que school_id est dans la query
  // Note: Cette fonction est basique, les queries complexes
  // doivent gérer le scope manuellement
  return query<T>(sql, params)
}

/**
 * Helper pour INSERT avec school_id automatique
 */
export function addSchoolIdToInsert(
  tenant: TenantContext,
  data: Record<string, any>
): Record<string, any> {
  if (tenant.id === null) {
    throw new Error('Cannot insert without school_id (SuperAdmin must specify school)')
  }
  return {
    ...data,
    school_id: tenant.id,
  }
}

/**
 * Exemple d'utilisation dans un repository
 */
export class ScopedRepository<T> {
  constructor(
    private tableName: string,
    private tenant: TenantContext
  ) {}

  async findAll(additionalWhere?: string, params?: any[]): Promise<T[]> {
    const [tenantWhere, tenantParams] = buildTenantFilter(this.tenant)
    
    let sql = `SELECT * FROM ${this.tableName} WHERE ${tenantWhere}`
    const allParams = [...tenantParams]

    if (additionalWhere) {
      sql += ` AND ${additionalWhere}`
      allParams.push(...(params || []))
    }

    return query<T[]>(sql, allParams)
  }

  async findById(id: number): Promise<T | null> {
    const [tenantWhere, tenantParams] = buildTenantFilter(this.tenant)
    
    const results = await query<T[]>(
      `SELECT * FROM ${this.tableName} WHERE id = ? AND ${tenantWhere}`,
      [id, ...tenantParams]
    )

    return results[0] || null
  }

  async create(data: Record<string, any>): Promise<any> {
    const dataWithSchool = addSchoolIdToInsert(this.tenant, data)
    const columns = Object.keys(dataWithSchool).join(', ')
    const placeholders = Object.keys(dataWithSchool).map(() => '?').join(', ')
    
    return query(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
      Object.values(dataWithSchool)
    )
  }

  async update(id: number, data: Record<string, any>): Promise<any> {
    const [tenantWhere, tenantParams] = buildTenantFilter(this.tenant)
    const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ')
    
    return query(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = ? AND ${tenantWhere}`,
      [...Object.values(data), id, ...tenantParams]
    )
  }

  async delete(id: number): Promise<any> {
    const [tenantWhere, tenantParams] = buildTenantFilter(this.tenant)
    
    return query(
      `DELETE FROM ${this.tableName} WHERE id = ? AND ${tenantWhere}`,
      [id, ...tenantParams]
    )
  }
}
```

### 🔧 Intégration dans Routes

```typescript
// backend/src/routes/eleves.routes.ts (exemple d'intégration)

import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { tenantMiddleware, TenantRequest, requireTenant } from '../middlewares/tenant.middleware'
import { buildTenantFilter, ScopedRepository } from '../database/scopedQuery'
import { query } from '../database/connection'

const router = Router()

// Appliquer middlewares dans l'ordre correct
router.use(authenticate)
router.use(tenantMiddleware)
router.use(requireTenant)

// GET /api/eleves - Liste des élèves (scopée par école)
router.get('/', async (req: TenantRequest, res) => {
  try {
    const [tenantWhere, tenantParams] = buildTenantFilter(req.tenant!)
    
    const eleves = await query<any[]>(`
      SELECT e.*, c.libelle as classe_nom
      FROM eleves e
      LEFT JOIN inscriptions i ON e.id = i.eleve_id
      LEFT JOIN classes c ON i.classe_id = c.id
      WHERE ${tenantWhere} AND e.is_active = TRUE
      ORDER BY e.nom, e.prenom
    `, tenantParams)

    res.json({
      success: true,
      data: eleves,
      meta: {
        total: eleves.length,
        school: req.tenant!.schoolName,
      }
    })
  } catch (error) {
    console.error('Erreur liste élèves:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/eleves - Créer un élève (avec school_id automatique)
router.post('/', async (req: TenantRequest, res) => {
  try {
    // SuperAdmin doit spécifier l'école
    if (req.tenant!.isSuper && req.tenant!.id === null) {
      return res.status(400).json({
        success: false,
        message: 'SuperAdmin doit spécifier school_id dans le body',
      })
    }

    const schoolId = req.tenant!.id

    const result = await query(`
      INSERT INTO eleves (matricule, nom, prenom, ..., school_id)
      VALUES (?, ?, ?, ..., ?)
    `, [...Object.values(req.body), schoolId])

    res.status(201).json({
      success: true,
      message: 'Élève créé',
      data: { id: (result as any).insertId }
    })
  } catch (error) {
    console.error('Erreur création élève:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
```

### 🧪 Tests

```typescript
// backend/src/tests/tenant.middleware.test.ts

import { tenantMiddleware, TenantRequest } from '../middlewares/tenant.middleware'

describe('Tenant Middleware', () => {
  
  it('should set isSuper=true for SuperAdmin', async () => {
    const req = mockRequest({
      user: { id: 1, role_code: 'super_admin' }
    }) as TenantRequest
    
    await tenantMiddleware(req, mockRes, mockNext)
    
    expect(req.tenant).toBeDefined()
    expect(req.tenant!.isSuper).toBe(true)
    expect(req.tenant!.id).toBeNull()
  })

  it('should set school_id for regular user', async () => {
    const req = mockRequest({
      user: { id: 2, role_code: 'admin' }
    }) as TenantRequest
    
    // Mock query to return user with school_id
    mockQuery.mockResolvedValue([{
      school_id: 1,
      code: 'ECO001',
      name: 'École Test',
      is_active: true
    }])
    
    await tenantMiddleware(req, mockRes, mockNext)
    
    expect(req.tenant).toBeDefined()
    expect(req.tenant!.id).toBe(1)
    expect(req.tenant!.isSuper).toBe(false)
    expect(req.tenant!.schoolCode).toBe('ECO001')
  })

  it('should reject user with disabled school', async () => {
    const req = mockRequest({
      user: { id: 2, role_code: 'admin' }
    }) as TenantRequest
    
    mockQuery.mockResolvedValue([{
      school_id: 1,
      is_active: false
    }])
    
    await tenantMiddleware(req, mockRes, mockNext)
    
    expect(mockRes.status).toHaveBeenCalledWith(403)
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should reject user without school', async () => {
    const req = mockRequest({
      user: { id: 2, role_code: 'admin' }
    }) as TenantRequest
    
    mockQuery.mockResolvedValue([{ school_id: null }])
    
    await tenantMiddleware(req, mockRes, mockNext)
    
    expect(mockRes.status).toHaveBeenCalledWith(403)
  })
})
```

### ✔️ Critères d'Acceptation

- [ ] Middleware extrait correctement school_id
- [ ] SuperAdmin → `isSuper: true, id: null`
- [ ] User normal → `isSuper: false, id: <school_id>`
- [ ] École désactivée → rejet 403
- [ ] Helpers de query fonctionnent
- [ ] Intégration dans au moins une route validée
- [ ] Tests passent



