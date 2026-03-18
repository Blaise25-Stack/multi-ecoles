# Phases 3, 4, 5 & 6 - UI, Modules, Admin & Déploiement

---

# Phase 3 - UI/UX Multi-Tenant

> 🎯 **Objectif:** Adapter l'interface utilisateur pour le multi-tenant sans demander l'école au login

---

## ISSUE-023: [FE] Supprimer sélection école sur la page login

### 📋 Informations
- **Type:** Frontend
- **Priorité:** High
- **Estimé:** 2 heures
- **Labels:** `frontend`, `auth`, `phase-3`

### 📝 Description

Le login reste simple: email + mot de passe. Le backend résout automatiquement l'école de l'utilisateur.

### ✅ Checklist

- [ ] Garder le formulaire actuel (email + password)
- [ ] Mettre à jour le service authService pour gérer le nouveau format de réponse
- [ ] Stocker les infos école dans le store
- [ ] Afficher le nom de l'école dans le header après login

### 🔧 Code Frontend

```typescript
// src/services/authService.ts

import { api } from './api'

export interface School {
  id: number
  code: string
  name: string
  shortName: string | null
  logo: string | null
  currency: string
}

export interface LoginResponse {
  user: {
    id: number
    email: string
    nom: string
    prenom: string
    role: string
    schoolId: number | null
    isSuperAdmin: boolean
    permissions: { module: string; actions: string[] }[]
  }
  school: School | null  // null pour SuperAdmin
  token: string
  refreshToken: string
}

export const authService = {
  async login(credentials: { email: string; password: string }) {
    const response = await api.post<{ success: boolean; data: LoginResponse; message?: string }>(
      '/auth/login',
      credentials
    )
    return response.data
  },

  async me() {
    const response = await api.get<{ success: boolean; data: LoginResponse['user'] & { school?: School } }>(
      '/auth/me'
    )
    return response.data
  },
}
```

```typescript
// src/stores/authStore.ts (modifications)

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface School {
  id: number
  code: string
  name: string
  shortName: string | null
  logo: string | null
  currency: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  school: School | null  // ✅ AJOUTÉ
  
  // Actions
  setAuth: (user: User, token: string, refreshToken?: string, school?: School | null) => void
  logout: () => void
  // ...
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      school: null,  // ✅ AJOUTÉ
      
      setAuth: (user, token, refreshToken, school = null) => {
        set({
          user,
          token,
          refreshToken: refreshToken || null,
          school,  // ✅ AJOUTÉ
          isAuthenticated: true,
          isLoading: false,
        })
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          school: null,  // ✅ AJOUTÉ
          isAuthenticated: false,
          isLoading: false,
        })
      },
      
      // Helper pour vérifier si SuperAdmin
      isSuperAdmin: () => {
        const user = get().user
        return user?.role === 'super_admin'
      },
      
      // Helper pour obtenir le school_id
      getSchoolId: () => {
        return get().school?.id || null
      },
      
      // ...autres méthodes
    }),
    {
      name: 'sgs-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        school: state.school,  // ✅ AJOUTÉ
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

```tsx
// src/pages/auth/LoginPage.tsx (modifications dans onSubmit)

const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true)
  try {
    const response = await authService.login(data)
    
    if (response.success && response.data) {
      const user = {
        id: String(response.data.user.id),
        email: response.data.user.email,
        nom: response.data.user.nom,
        prenom: response.data.user.prenom,
        role: response.data.user.role as any,
        permissions: response.data.user.permissions,
        isSuperAdmin: response.data.user.isSuperAdmin,
        // ...
      }
      
      // ✅ MODIFIÉ: Passer l'école au store
      setAuth(user, response.data.token, response.data.refreshToken, response.data.school)
      
      addToast({ 
        type: 'success', 
        title: 'Connexion réussie', 
        message: response.data.school 
          ? `Bienvenue sur ${response.data.school.name}` 
          : 'Bienvenue, Super Administrateur'
      })
      
      // ✅ MODIFIÉ: Redirection selon le rôle
      if (response.data.user.isSuperAdmin) {
        navigate('/superadmin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  } catch (error) {
    // ...
  } finally {
    setIsLoading(false)
  }
}
```

---

## ISSUE-024: [FE] Redirection post-login selon le rôle

### 📋 Informations
- **Type:** Frontend
- **Priorité:** High
- **Estimé:** 3 heures
- **Labels:** `frontend`, `routing`, `phase-3`

### 🔧 Code

```tsx
// src/App.tsx (ajout routes SuperAdmin)

import { Routes, Route, Navigate } from 'react-router-dom'
// ... imports existants

// Nouvelles pages SuperAdmin
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout'
import { SuperAdminDashboard } from '@/pages/superadmin/SuperAdminDashboard'
import { SchoolsManagement } from '@/pages/superadmin/SchoolsManagement'
import { PlatformUsers } from '@/pages/superadmin/PlatformUsers'
import { PlatformSettings } from '@/pages/superadmin/PlatformSettings'

// Guard pour SuperAdmin seulement
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (user?.role !== 'super_admin') {
    return <Navigate to="/unauthorized" replace />
  }
  
  return <>{children}</>
}

function App() {
  // ...
  
  return (
    <>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ========================================= */}
        {/* ROUTES SUPER ADMIN                       */}
        {/* ========================================= */}
        <Route
          path="/superadmin/*"
          element={
            <SuperAdminRoute>
              <SuperAdminLayout />
            </SuperAdminRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="schools" element={<SchoolsManagement />} />
          <Route path="schools/:schoolId/*" element={<SchoolDetailPage />} />
          <Route path="users" element={<PlatformUsers />} />
          <Route path="settings" element={<PlatformSettings />} />
        </Route>

        {/* Routes protégées standard (école spécifique) */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* ... autres routes existantes */}
        </Route>

        {/* Erreurs */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toast />
    </>
  )
}
```

---

## ISSUE-025: [FE] Afficher le contexte école dans le header

### 🔧 Code

```tsx
// src/components/layout/Header.tsx (modifications)

import { useAuthStore } from '@/stores/authStore'
import { Building2, ChevronDown } from 'lucide-react'

export const Header = () => {
  const { user, school } = useAuthStore()
  
  return (
    <header className="h-16 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-6 flex items-center justify-between">
      {/* Gauche: Info école */}
      <div className="flex items-center gap-3">
        {school ? (
          <>
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              {school.logo ? (
                <img src={school.logo} alt={school.name} className="w-8 h-8 rounded" />
              ) : (
                <Building2 className="w-5 h-5 text-primary-600" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-surface-900 dark:text-white text-sm">
                {school.shortName || school.name}
              </h2>
              <p className="text-xs text-surface-500">
                Code: {school.code} • {school.currency}
              </p>
            </div>
          </>
        ) : user?.role === 'super_admin' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
              🔐 Mode Super Admin
            </span>
          </div>
        ) : null}
      </div>

      {/* Droite: User menu (existant) */}
      <div className="flex items-center gap-4">
        {/* ... notifications, user dropdown, etc. */}
      </div>
    </header>
  )
}
```

---

## ISSUE-026: [FE] Créer TenantProvider pour contexte React

### 🔧 Code

```tsx
// src/contexts/TenantContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/services/api'

interface TenantContextType {
  schoolId: number | null
  schoolName: string | null
  schoolCode: string | null
  currency: string
  isSuperAdmin: boolean
  isLoading: boolean
  // Modules activés pour cette école
  enabledModules: string[]
  isModuleEnabled: (moduleKey: string) => boolean
  // Pour SuperAdmin: switcher d'école
  switchSchool: (schoolId: number | null) => void
  currentViewingSchool: number | null
}

const TenantContext = createContext<TenantContextType | null>(null)

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, school } = useAuthStore()
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentViewingSchool, setCurrentViewingSchool] = useState<number | null>(null)
  
  const isSuperAdmin = user?.role === 'super_admin'
  
  // Charger les modules activés pour l'école
  useEffect(() => {
    const loadModules = async () => {
      if (!school && !isSuperAdmin) {
        setIsLoading(false)
        return
      }
      
      try {
        const schoolIdToUse = currentViewingSchool || school?.id
        if (schoolIdToUse) {
          const response = await api.get(`/schools/${schoolIdToUse}/modules`)
          if (response.data.success) {
            setEnabledModules(
              response.data.data
                .filter((m: any) => m.enabled)
                .map((m: any) => m.module_key)
            )
          }
        } else if (isSuperAdmin) {
          // SuperAdmin a accès à tous les modules
          setEnabledModules(['*'])
        }
      } catch (error) {
        console.error('Erreur chargement modules:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadModules()
  }, [school, isSuperAdmin, currentViewingSchool])
  
  const isModuleEnabled = (moduleKey: string): boolean => {
    if (isSuperAdmin && enabledModules.includes('*')) return true
    return enabledModules.includes(moduleKey)
  }
  
  const switchSchool = (schoolId: number | null) => {
    if (!isSuperAdmin) {
      console.warn('Only SuperAdmin can switch schools')
      return
    }
    setCurrentViewingSchool(schoolId)
  }
  
  const value: TenantContextType = {
    schoolId: currentViewingSchool || school?.id || null,
    schoolName: school?.name || null,
    schoolCode: school?.code || null,
    currency: school?.currency || 'FC',
    isSuperAdmin,
    isLoading,
    enabledModules,
    isModuleEnabled,
    switchSchool,
    currentViewingSchool,
  }
  
  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}
```

```tsx
// src/main.tsx (intégration)

import { TenantProvider } from '@/contexts/TenantContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TenantProvider>
        <App />
      </TenantProvider>
    </BrowserRouter>
  </React.StrictMode>
)
```

---

# Phase 4 - Feature Toggles / Modules par École

---

## ISSUE-027: [DB] Créer table school_modules

### 🔧 Migration SQL

```sql
-- backend/src/database/migrations/010_create_school_modules.sql

CREATE TABLE IF NOT EXISTS school_modules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  module_key VARCHAR(100) NOT NULL,
  module_name VARCHAR(255),
  enabled TINYINT(1) DEFAULT 1,
  config JSON COMMENT 'Configuration spécifique au module',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  
  UNIQUE KEY unique_school_module (school_id, module_key),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Liste des modules disponibles
CREATE TABLE IF NOT EXISTS available_modules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  module_key VARCHAR(100) NOT NULL UNIQUE,
  module_name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('core', 'academic', 'financial', 'hr', 'communication', 'advanced') DEFAULT 'core',
  is_default_enabled TINYINT(1) DEFAULT 1 COMMENT 'Activé par défaut pour nouvelles écoles',
  requires_subscription ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
  icon VARCHAR(50),
  sort_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed modules disponibles
INSERT INTO available_modules (module_key, module_name, description, category, is_default_enabled, requires_subscription, sort_order) VALUES
-- Core (toujours activés)
('dashboard', 'Tableau de bord', 'Vue d''ensemble de l''école', 'core', 1, 'free', 1),
('settings', 'Paramètres', 'Configuration de l''école', 'core', 1, 'free', 2),

-- Academic
('students', 'Gestion des élèves', 'Inscriptions, fiches élèves, historique', 'academic', 1, 'free', 10),
('classes', 'Classes', 'Gestion des classes et niveaux', 'academic', 1, 'free', 11),
('grades', 'Notes & Bulletins', 'Saisie des notes, génération bulletins', 'academic', 1, 'free', 12),
('schedule', 'Emploi du temps', 'Planning des cours', 'academic', 1, 'basic', 13),
('certificates', 'Attestations', 'Génération d''attestations et certificats', 'academic', 0, 'basic', 14),
('deliberations', 'Délibérations', 'Conseils de classe, décisions', 'academic', 0, 'premium', 15),

-- Financial
('payments', 'Paiements', 'Encaissement des frais scolaires', 'financial', 1, 'free', 20),
('fees', 'Frais scolaires', 'Configuration des frais', 'financial', 1, 'free', 21),
('expenses', 'Dépenses', 'Suivi des dépenses', 'financial', 1, 'basic', 22),
('cashbox', 'Caisse', 'Mouvements de caisse', 'financial', 0, 'basic', 23),
('invoicing', 'Facturation', 'Génération de factures', 'financial', 0, 'premium', 24),
('reports_financial', 'Rapports financiers', 'Analyses et rapports', 'financial', 0, 'premium', 25),

-- HR
('teachers', 'Enseignants', 'Gestion du corps enseignant', 'hr', 1, 'free', 30),
('staff', 'Personnel', 'Personnel administratif et technique', 'hr', 0, 'basic', 31),
('attendance', 'Présences', 'Suivi des présences employés', 'hr', 0, 'basic', 32),
('leaves', 'Congés', 'Demandes et approbation congés', 'hr', 0, 'basic', 33),
('payroll', 'Salaires', 'Paie des employés', 'hr', 0, 'premium', 34),
('contracts', 'Contrats', 'Gestion des contrats', 'hr', 0, 'premium', 35),

-- Communication
('notifications', 'Notifications', 'Alertes et notifications', 'communication', 1, 'free', 40),
('messages', 'Messages', 'Communication interne', 'communication', 0, 'basic', 41),
('sms', 'SMS', 'Envoi de SMS aux parents', 'communication', 0, 'premium', 42),
('parent_portal', 'Portail Parents', 'Accès parents aux infos', 'communication', 0, 'premium', 43),

-- Advanced
('analytics', 'Analyses', 'Statistiques avancées', 'advanced', 0, 'enterprise', 50),
('api_access', 'API', 'Accès API externe', 'advanced', 0, 'enterprise', 51),
('multi_campus', 'Multi-Campus', 'Gestion plusieurs sites', 'advanced', 0, 'enterprise', 52);

-- Seed modules pour l'école default
INSERT INTO school_modules (school_id, module_key, enabled)
SELECT 1, module_key, is_default_enabled
FROM available_modules;

SELECT 'Migration 010 completed: school_modules table created' AS status;
```

---

## ISSUE-028: [BE] Middleware moduleGuard

### 🔧 Code Backend

```typescript
// backend/src/middlewares/module.middleware.ts

import { Response, NextFunction } from 'express'
import { TenantRequest } from './tenant.middleware'
import { query } from '../database/connection'

// Cache des modules (éviter requêtes répétées)
const moduleCache = new Map<number, { modules: Set<string>; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute

async function getEnabledModules(schoolId: number): Promise<Set<string>> {
  // Check cache
  const cached = moduleCache.get(schoolId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.modules
  }
  
  // Query DB
  const modules = await query<any[]>(
    'SELECT module_key FROM school_modules WHERE school_id = ? AND enabled = 1',
    [schoolId]
  )
  
  const moduleSet = new Set(modules.map(m => m.module_key))
  
  // Update cache
  moduleCache.set(schoolId, { modules: moduleSet, timestamp: Date.now() })
  
  return moduleSet
}

// Invalider le cache (après update)
export function invalidateModuleCache(schoolId: number) {
  moduleCache.delete(schoolId)
}

/**
 * Middleware pour vérifier si un module est activé pour l'école
 * @param moduleKey - Clé du module requis
 */
export const moduleGuard = (moduleKey: string) => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // SuperAdmin sans contexte école = bypass
      if (req.tenant?.isSuper && req.tenant.id === null) {
        return next()
      }
      
      const schoolId = req.tenant?.id
      
      if (!schoolId) {
        return res.status(403).json({
          success: false,
          message: 'Aucune école dans le contexte',
        })
      }
      
      const enabledModules = await getEnabledModules(schoolId)
      
      if (!enabledModules.has(moduleKey)) {
        return res.status(403).json({
          success: false,
          message: `Le module "${moduleKey}" n'est pas activé pour cette école`,
          error: 'MODULE_DISABLED',
          module: moduleKey,
        })
      }
      
      next()
    } catch (error) {
      console.error('Erreur module guard:', error)
      return res.status(500).json({
        success: false,
        message: 'Erreur vérification module',
      })
    }
  }
}

/**
 * Exemple d'utilisation dans les routes:
 * 
 * router.get('/salaires', moduleGuard('payroll'), async (req, res) => { ... })
 * router.post('/sms/send', moduleGuard('sms'), async (req, res) => { ... })
 */
```

```typescript
// backend/src/routes/schools.routes.ts (API modules)

import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { tenantMiddleware, TenantRequest, forceSchoolContext } from '../middlewares/tenant.middleware'
import { invalidateModuleCache } from '../middlewares/module.middleware'
import { query } from '../database/connection'

const router = Router()

// GET /api/schools/:schoolId/modules - Liste des modules d'une école
router.get('/:schoolId/modules',
  authenticate,
  tenantMiddleware,
  forceSchoolContext('schoolId'),
  async (req: TenantRequest, res) => {
    try {
      const schoolId = req.tenant!.id
      
      const modules = await query<any[]>(`
        SELECT 
          sm.id,
          sm.module_key,
          sm.enabled,
          sm.config,
          sm.updated_at,
          am.module_name,
          am.description,
          am.category,
          am.requires_subscription,
          am.icon
        FROM school_modules sm
        JOIN available_modules am ON sm.module_key = am.module_key
        WHERE sm.school_id = ?
        ORDER BY am.sort_order
      `, [schoolId])
      
      res.json({
        success: true,
        data: modules,
      })
    } catch (error) {
      console.error('Erreur liste modules:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  }
)

// PUT /api/schools/:schoolId/modules/:moduleKey - Toggle module
router.put('/:schoolId/modules/:moduleKey',
  authenticate,
  authorize('super_admin', 'admin'),
  tenantMiddleware,
  forceSchoolContext('schoolId'),
  async (req: TenantRequest, res) => {
    try {
      const schoolId = req.tenant!.id!
      const { moduleKey } = req.params
      const { enabled, config } = req.body
      
      // Vérifier que le module existe
      const moduleExists = await query<any[]>(
        'SELECT id FROM available_modules WHERE module_key = ?',
        [moduleKey]
      )
      
      if (moduleExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Module inconnu',
        })
      }
      
      // Vérifier le plan de subscription si nécessaire
      // (à implémenter selon les besoins)
      
      // Upsert
      await query(`
        INSERT INTO school_modules (school_id, module_key, enabled, config, updated_by)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          enabled = VALUES(enabled),
          config = COALESCE(VALUES(config), config),
          updated_by = VALUES(updated_by),
          updated_at = CURRENT_TIMESTAMP
      `, [schoolId, moduleKey, enabled ? 1 : 0, config ? JSON.stringify(config) : null, req.user!.id])
      
      // Invalider le cache
      invalidateModuleCache(schoolId)
      
      res.json({
        success: true,
        message: `Module ${moduleKey} ${enabled ? 'activé' : 'désactivé'}`,
      })
    } catch (error) {
      console.error('Erreur toggle module:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  }
)

export default router
```

---

## ISSUE-029: [FE] UI Toggle modules par école

### 🔧 Code Frontend

```tsx
// src/pages/superadmin/SchoolModulesPage.tsx

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/services/api'
import { Switch } from '@/components/ui/Switch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/stores/uiStore'

interface Module {
  id: number
  module_key: string
  module_name: string
  description: string
  category: string
  enabled: boolean
  requires_subscription: string
  icon: string
}

const categoryLabels: Record<string, string> = {
  core: 'Système',
  academic: 'Académique',
  financial: 'Finances',
  hr: 'Ressources Humaines',
  communication: 'Communication',
  advanced: 'Avancé',
}

const categoryColors: Record<string, string> = {
  core: 'bg-gray-100 text-gray-800',
  academic: 'bg-blue-100 text-blue-800',
  financial: 'bg-green-100 text-green-800',
  hr: 'bg-orange-100 text-orange-800',
  communication: 'bg-purple-100 text-purple-800',
  advanced: 'bg-red-100 text-red-800',
}

export const SchoolModulesPage: React.FC = () => {
  const { schoolId } = useParams()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const { addToast } = useUIStore()
  
  useEffect(() => {
    loadModules()
  }, [schoolId])
  
  const loadModules = async () => {
    try {
      const response = await api.get(`/schools/${schoolId}/modules`)
      if (response.data.success) {
        setModules(response.data.data)
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de charger les modules' })
    } finally {
      setLoading(false)
    }
  }
  
  const toggleModule = async (moduleKey: string, enabled: boolean) => {
    setUpdating(moduleKey)
    try {
      const response = await api.put(`/schools/${schoolId}/modules/${moduleKey}`, { enabled })
      if (response.data.success) {
        setModules(prev => 
          prev.map(m => m.module_key === moduleKey ? { ...m, enabled } : m)
        )
        addToast({ 
          type: 'success', 
          title: 'Module mis à jour',
          message: `${moduleKey} ${enabled ? 'activé' : 'désactivé'}`
        })
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de modifier le module' })
    } finally {
      setUpdating(null)
    }
  }
  
  if (loading) return <Spinner />
  
  // Grouper par catégorie
  const groupedModules = modules.reduce((acc, module) => {
    const cat = module.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(module)
    return acc
  }, {} as Record<string, Module[]>)
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modules de l'école</h1>
        <p className="text-surface-500">Activez ou désactivez les fonctionnalités disponibles</p>
      </div>
      
      {Object.entries(groupedModules).map(([category, mods]) => (
        <Card key={category} className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Badge className={categoryColors[category]}>
              {categoryLabels[category]}
            </Badge>
          </div>
          
          <div className="space-y-4">
            {mods.map(module => (
              <div 
                key={module.module_key}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{module.module_name}</h3>
                    {module.requires_subscription !== 'free' && (
                      <Badge variant="outline" size="sm">
                        {module.requires_subscription}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-surface-500">{module.description}</p>
                </div>
                
                <Switch
                  checked={module.enabled}
                  onCheckedChange={(checked) => toggleModule(module.module_key, checked)}
                  disabled={updating === module.module_key || category === 'core'}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
```

---

# Phase 5 - SuperAdmin Console & School Admin

---

## ISSUE-030: [FE/BE] SuperAdmin CRUD Écoles

### 🔧 Code Backend

```typescript
// backend/src/routes/superadmin/schools.routes.ts

import { Router } from 'express'
import { authenticate, authorize } from '../../middlewares/auth.middleware'
import { query, transaction } from '../../database/connection'

const router = Router()

// Middleware: SuperAdmin only
router.use(authenticate)
router.use(authorize('super_admin'))

// GET /api/superadmin/schools - Liste toutes les écoles
router.get('/', async (req, res) => {
  try {
    const schools = await query<any[]>(`
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM utilisateurs WHERE school_id = s.id) as users_count,
        (SELECT COUNT(*) FROM eleves WHERE school_id = s.id) as students_count,
        (SELECT COUNT(*) FROM enseignants WHERE school_id = s.id) as teachers_count
      FROM schools s
      ORDER BY s.created_at DESC
    `)
    
    res.json({ success: true, data: schools })
  } catch (error) {
    console.error('Erreur liste écoles:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /api/superadmin/schools/:id - Détails école
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const schools = await query<any[]>('SELECT * FROM schools WHERE id = ?', [id])
    
    if (schools.length === 0) {
      return res.status(404).json({ success: false, message: 'École non trouvée' })
    }
    
    // Stats
    const [stats] = await query<any[]>(`
      SELECT 
        (SELECT COUNT(*) FROM utilisateurs WHERE school_id = ?) as users,
        (SELECT COUNT(*) FROM eleves WHERE school_id = ?) as students,
        (SELECT COUNT(*) FROM enseignants WHERE school_id = ?) as teachers,
        (SELECT COUNT(*) FROM classes WHERE school_id = ?) as classes,
        (SELECT SUM(montant) FROM paiements WHERE school_id = ? AND YEAR(date_paiement) = YEAR(NOW())) as revenue_ytd
    `, [id, id, id, id, id])
    
    res.json({
      success: true,
      data: {
        ...schools[0],
        stats,
      },
    })
  } catch (error) {
    console.error('Erreur détails école:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /api/superadmin/schools - Créer école
router.post('/', async (req, res) => {
  try {
    const { code, name, shortName, address, city, province, telephone, email, currency } = req.body
    
    // Vérifier unicité code
    const existing = await query<any[]>('SELECT id FROM schools WHERE code = ?', [code])
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Ce code école existe déjà' })
    }
    
    // Transaction: créer école + modules par défaut + admin
    const result = await transaction(async (conn) => {
      // Créer l'école
      const [schoolResult] = await conn.execute(`
        INSERT INTO schools (code, name, short_name, address, city, province, telephone, email, currency, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [code, name, shortName, address, city, province, telephone, email, currency || 'FC', req.user!.id])
      
      const schoolId = (schoolResult as any).insertId
      
      // Ajouter modules par défaut
      await conn.execute(`
        INSERT INTO school_modules (school_id, module_key, enabled)
        SELECT ?, module_key, is_default_enabled
        FROM available_modules
      `, [schoolId])
      
      // Créer année scolaire par défaut
      await conn.execute(`
        INSERT INTO annees_scolaires (libelle, date_debut, date_fin, est_active, school_id)
        VALUES ('2024-2025', '2024-09-02', '2025-06-30', TRUE, ?)
      `, [schoolId])
      
      return schoolId
    })
    
    res.status(201).json({
      success: true,
      message: 'École créée avec succès',
      data: { id: result },
    })
  } catch (error) {
    console.error('Erreur création école:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PUT /api/superadmin/schools/:id - Mettre à jour école
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    delete updates.id
    delete updates.created_at
    
    const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ')
    
    await query(
      `UPDATE schools SET ${setClause} WHERE id = ?`,
      [...Object.values(updates), id]
    )
    
    res.json({ success: true, message: 'École mise à jour' })
  } catch (error) {
    console.error('Erreur update école:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/superadmin/schools/:id - Supprimer école
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Vérifier qu'il n'y a pas de données
    const [counts] = await query<any[]>(`
      SELECT 
        (SELECT COUNT(*) FROM eleves WHERE school_id = ?) as eleves,
        (SELECT COUNT(*) FROM paiements WHERE school_id = ?) as paiements
    `, [id, id])
    
    if (counts.eleves > 0 || counts.paiements > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une école avec des données. Désactivez-la plutôt.',
      })
    }
    
    await query('DELETE FROM schools WHERE id = ?', [id])
    
    res.json({ success: true, message: 'École supprimée' })
  } catch (error) {
    console.error('Erreur suppression école:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
```

---

# Phase 6 - Tests, QA & Déploiement

---

## ISSUE-034: [QA] Tests E2E Multi-Tenant

### 📋 Informations
- **Type:** QA
- **Priorité:** Critical
- **Estimé:** 8 heures
- **Labels:** `qa`, `testing`, `phase-6`

### 📝 Cas de Tests

```typescript
// tests/e2e/multitenancy.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Multi-Tenancy Tests', () => {
  
  test.describe('Data Isolation', () => {
    
    test('User from School A cannot see School B students', async ({ page }) => {
      // Login as School A user
      await page.goto('/login')
      await page.fill('[name="email"]', 'admin@schoola.edu')
      await page.fill('[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      
      // Navigate to students
      await page.goto('/eleves')
      
      // Get all student IDs
      const studentIds = await page.$$eval('[data-student-id]', els => 
        els.map(el => el.getAttribute('data-student-id'))
      )
      
      // Verify all students belong to School A
      for (const id of studentIds) {
        const response = await page.request.get(`/api/eleves/${id}`)
        const data = await response.json()
        expect(data.data.school_id).toBe(1) // School A = 1
      }
    })
    
    test('User cannot access other school data via direct API', async ({ request }) => {
      // Login as School A user
      const loginRes = await request.post('/api/auth/login', {
        data: { email: 'admin@schoola.edu', password: 'password123' }
      })
      const { token } = (await loginRes.json()).data
      
      // Try to access School B student (ID 1001 = School B)
      const studentRes = await request.get('/api/eleves/1001', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      expect(studentRes.status()).toBe(404)
    })
    
    test('User cannot forge school_id in POST request', async ({ request }) => {
      // Login as School A user
      const loginRes = await request.post('/api/auth/login', {
        data: { email: 'admin@schoola.edu', password: 'password123' }
      })
      const { token } = (await loginRes.json()).data
      
      // Try to create student with School B's ID
      const createRes = await request.post('/api/eleves', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          matricule: 'TEST001',
          nom: 'Test',
          prenom: 'Student',
          sexe: 'M',
          date_naissance: '2010-01-01',
          school_id: 2 // Trying to inject School B's ID
        }
      })
      
      const data = await createRes.json()
      
      // Either rejected or created with School A's ID
      if (createRes.status() === 201) {
        // Verify it was created with School A's ID, not B's
        const getRes = await request.get(`/api/eleves/${data.data.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const student = (await getRes.json()).data
        expect(student.school_id).toBe(1) // School A
      }
    })
  })
  
  test.describe('SuperAdmin Access', () => {
    
    test('SuperAdmin can see all schools', async ({ page }) => {
      await page.goto('/login')
      await page.fill('[name="email"]', 'admin@sgs-rdc.edu')
      await page.fill('[name="password"]', 'admin123')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/superadmin')
      
      await page.goto('/superadmin/schools')
      
      const schoolRows = await page.$$('[data-school-row]')
      expect(schoolRows.length).toBeGreaterThan(1)
    })
    
    test('SuperAdmin can switch school context', async ({ page }) => {
      // Login as SuperAdmin
      await page.goto('/login')
      await page.fill('[name="email"]', 'admin@sgs-rdc.edu')
      await page.fill('[name="password"]', 'admin123')
      await page.click('button[type="submit"]')
      
      // Go to School A detail
      await page.goto('/superadmin/schools/1')
      
      // Click "View as this school"
      await page.click('[data-action="view-as-school"]')
      
      // Should now see School A's dashboard
      await page.waitForURL('/dashboard')
      const header = await page.textContent('[data-school-name]')
      expect(header).toContain('School A')
    })
  })
  
  test.describe('Module Access', () => {
    
    test('Disabled module returns 403', async ({ request }) => {
      // Setup: Disable 'payroll' for School A via SuperAdmin
      
      // Login as School A admin
      const loginRes = await request.post('/api/auth/login', {
        data: { email: 'admin@schoola.edu', password: 'password123' }
      })
      const { token } = (await loginRes.json()).data
      
      // Try to access payroll (disabled)
      const payrollRes = await request.get('/api/salaires', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      expect(payrollRes.status()).toBe(403)
      const data = await payrollRes.json()
      expect(data.error).toBe('MODULE_DISABLED')
    })
    
    test('Enabled module is accessible', async ({ request }) => {
      // Login as School A admin
      const loginRes = await request.post('/api/auth/login', {
        data: { email: 'admin@schoola.edu', password: 'password123' }
      })
      const { token } = (await loginRes.json()).data
      
      // Access students (always enabled)
      const studentsRes = await request.get('/api/eleves', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      expect(studentsRes.status()).toBe(200)
    })
  })
  
  test.describe('Login & Redirect', () => {
    
    test('Regular user redirected to dashboard', async ({ page }) => {
      await page.goto('/login')
      await page.fill('[name="email"]', 'admin@schoola.edu')
      await page.fill('[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/dashboard')
      expect(page.url()).toContain('/dashboard')
    })
    
    test('SuperAdmin redirected to superadmin console', async ({ page }) => {
      await page.goto('/login')
      await page.fill('[name="email"]', 'admin@sgs-rdc.edu')
      await page.fill('[name="password"]', 'admin123')
      await page.click('button[type="submit"]')
      
      await page.waitForURL('/superadmin')
      expect(page.url()).toContain('/superadmin')
    })
    
    test('User of disabled school cannot login', async ({ page }) => {
      // Assuming School B is disabled
      await page.goto('/login')
      await page.fill('[name="email"]', 'admin@schoolb.edu')
      await page.fill('[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Should see error message
      const errorMessage = await page.textContent('[data-error-message]')
      expect(errorMessage).toContain('désactivée')
    })
  })
})
```

---

## ISSUE-035: [SEC] Tests de Sécurité

### 📝 Tests de Sécurité à Effectuer

```markdown
# Checklist Sécurité Multi-Tenant

## 1. Enumération d'IDs
- [ ] Tester accès séquentiel aux IDs (1, 2, 3...)
- [ ] Vérifier que 404 est retourné (pas de différence avec 403)

## 2. Injection SQL
- [ ] Tester injection dans school_id
- [ ] Tester injection dans paramètres de recherche
- [ ] Vérifier les prepared statements partout

## 3. Élévation de Privilèges
- [ ] User normal ne peut pas accéder aux routes /superadmin
- [ ] Admin école ne peut pas modifier une autre école
- [ ] Forger un JWT avec school_id différent

## 4. Session Hijacking
- [ ] Vérifier que les tokens expirent
- [ ] Tester refresh token invalidation après logout

## 5. Data Leakage
- [ ] Vérifier les réponses d'erreur (pas d'info sensible)
- [ ] Logs ne contiennent pas de données cross-tenant
- [ ] Export/rapports limités à l'école

## 6. API Rate Limiting
- [ ] Limite par IP
- [ ] Limite par user
- [ ] Limite par école
```

---

## ISSUE-037: [OPS] Procédure de Rollback

### 📝 Plan de Rollback

```markdown
# Procédure de Rollback Multi-Tenant

## Prérequis
- Backup de la BDD avant migration
- Scripts de rollback testés en staging
- Fenêtre de maintenance planifiée

## Étapes de Rollback

### Niveau 1: Rollback Code (sans DB)
Si problème avec le nouveau code mais DB OK:

1. Revert git vers commit précédent
2. Redéployer l'ancienne version
3. Vérifier fonctionnement

### Niveau 2: Rollback DB Partiel
Si problème avec certaines migrations:

1. Identifier la migration problématique
2. Exécuter le script rollback correspondant
3. Vérifier intégrité des données

### Niveau 3: Rollback DB Complet
Si problème majeur nécessitant retour complet:

1. Arrêter les services
2. Restaurer le backup pré-migration
3. Déployer l'ancien code
4. Vérifier fonctionnement
5. Analyser les logs pour comprendre le problème

## Scripts de Rollback

### Exécuter tous les rollbacks (ordre inverse)
```bash
#!/bin/bash
# rollback_all.sh

echo "⚠️ ROLLBACK COMPLET - Êtes-vous sûr? (Ctrl+C pour annuler)"
read -p "Tapez 'ROLLBACK' pour confirmer: " confirm
if [ "$confirm" != "ROLLBACK" ]; then
  echo "Annulé"
  exit 1
fi

ROLLBACK_DIR="./migrations/rollback"
DB_NAME="bdd_scolaire"

# Exécuter en ordre inverse
for rollback in $(ls -r $ROLLBACK_DIR/*.sql); do
  echo "🔄 Rollback: $rollback"
  mysql -u root -p$DB_PASSWORD $DB_NAME < $rollback
done

echo "✅ Rollback terminé"
```

## Points de Contrôle Post-Rollback

- [ ] Login fonctionne
- [ ] Données visibles
- [ ] Pas d'erreurs dans les logs
- [ ] Performances normales

## Communication

1. Informer les utilisateurs avant maintenance
2. Notifier en cas de rollback
3. Post-mortem après résolution
```



