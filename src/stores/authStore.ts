import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserRole, Permission, School } from '@/types'

// Interface pour l'enseignant connecté
interface EnseignantInfo {
  id: string
  matricule: string
  specialite: string
  matiereIds: string[]
  classesTitulaire: string[] // Un enseignant ne peut être titulaire que d'une seule classe
  classesAssignees: string[] // Classes où il enseigne
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  enseignantInfo: EnseignantInfo | null
  
  // Multi-tenant: École courante
  currentSchool: School | null
  
  // Actions
  setAuth: (user: User, token: string, refreshToken?: string, school?: School | null) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  setLoading: (isLoading: boolean) => void
  setEnseignantInfo: (info: EnseignantInfo | null) => void
  setCurrentSchool: (school: School | null) => void
  
  // Helpers RBAC
  hasRole: (role: UserRole | UserRole[]) => boolean
  hasPermission: (module: string, action: 'create' | 'read' | 'update' | 'delete') => boolean
  canAccess: (module: string) => boolean
  canAccessClass: (classeId: string) => boolean
  canAccessMatiere: (matiereId: string) => boolean
  isClasseTitulaire: (classeId: string) => boolean
  
  // Helpers Multi-tenant
  isSuperAdmin: () => boolean
  getSchoolId: () => string | number | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      enseignantInfo: null,
      currentSchool: null,
      
      setAuth: (user, token, refreshToken, school) => {
        set({
          user,
          token,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          isLoading: false,
          currentSchool: school || null,
        })
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          enseignantInfo: null,
          currentSchool: null,
        })
      },
      
      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } })
        }
      },
      
      setLoading: (isLoading) => {
        set({ isLoading })
      },
      
      setEnseignantInfo: (info) => {
        set({ enseignantInfo: info })
      },
      
      setCurrentSchool: (school) => {
        set({ currentSchool: school })
      },
      
      hasRole: (role) => {
        const user = get().user
        if (!user) return false
        
        // Super admin a tous les droits
        if (user.role === 'super_admin') return true
        
        const roles = Array.isArray(role) ? role : [role]
        return roles.includes(user.role)
      },
      
      hasPermission: (module, action) => {
        const user = get().user
        if (!user) return false
        
        // Super admin a tous les droits
        if (user.role === 'super_admin') return true
        
        const permission = user.permissions.find((p) => p.module === module)
        return permission?.actions.includes(action) || false
      },
      
      canAccess: (module) => {
        const user = get().user
        if (!user) return false
        
        // Super admin a tous les droits
        if (user.role === 'super_admin') return true
        
        // Vérifier si l'utilisateur a au moins une permission sur ce module
        return user.permissions.some((p) => p.module === module && p.actions.length > 0)
      },
      
      // Pour les enseignants: vérifier si ils peuvent accéder à une classe
      canAccessClass: (classeId) => {
        const { user, enseignantInfo } = get()
        if (!user) return false
        
        // Super admin et admin ont accès à tout
        if (user.role === 'super_admin' || user.role === 'admin') return true
        
        // Pour les enseignants, vérifier si la classe est dans leurs classes assignées ou titulaire
        if (user.role === 'enseignant' && enseignantInfo) {
          return enseignantInfo.classesAssignees.includes(classeId) || 
                 enseignantInfo.classesTitulaire.includes(classeId)
        }
        
        return true
      },
      
      // Pour les enseignants: vérifier si ils peuvent accéder à une matière
      canAccessMatiere: (matiereId) => {
        const { user, enseignantInfo } = get()
        if (!user) return false
        
        // Super admin et admin ont accès à tout
        if (user.role === 'super_admin' || user.role === 'admin') return true
        
        // Pour les enseignants, vérifier si la matière est dans leurs matières
        if (user.role === 'enseignant' && enseignantInfo) {
          return enseignantInfo.matiereIds.includes(matiereId)
        }
        
        return true
      },
      
      // Vérifier si l'enseignant est titulaire d'une classe
      isClasseTitulaire: (classeId) => {
        const { user, enseignantInfo } = get()
        if (!user || user.role !== 'enseignant' || !enseignantInfo) return false
        return enseignantInfo.classesTitulaire.includes(classeId)
      },
      
      // ===== Helpers Multi-tenant =====
      
      // Vérifie si l'utilisateur est SuperAdmin
      isSuperAdmin: () => {
        const user = get().user
        return user?.role === 'super_admin'
      },
      
      // Retourne l'ID de l'école courante (null pour SuperAdmin sans contexte)
      getSchoolId: () => {
        const { user, currentSchool } = get()
        if (user?.role === 'super_admin') {
          // SuperAdmin peut avoir un contexte école forcé ou global
          return currentSchool?.id || null
        }
        return currentSchool?.id || user?.schoolId || null
      },
    }),
    {
      name: 'sgs-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        enseignantInfo: state.enseignantInfo,
        currentSchool: state.currentSchool,
      }),
    }
  )
)

// Hook pour récupérer les permissions par rôle
export const getRolePermissions = (role: UserRole): Permission[] => {
  const allModules = [
    'dashboard',
    'eleves',
    'inscriptions',
    'classes',
    'matieres',
    'notes',
    'bulletins',
    'resultats',
    'attestations',
    'emploi_temps',
    'comptabilite',
    'paiements',
    'depenses',
    'caisse',
    'enseignants',
    'personnel',
    'presences',
    'conges',
    'salaires',
    'contrats',
    'configuration',
    'utilisateurs',
    'rapports',
  ]
  
  const rolePermissions: Record<UserRole, Permission[]> = {
    // Super Admin: Crée tous les utilisateurs, octroie tous les droits
    super_admin: allModules.map((m) => ({ module: m, actions: ['create', 'read', 'update', 'delete'] })),
    
    // Admin: Gestion complète sauf création d'autres admins
    admin: allModules.map((m) => ({ module: m, actions: ['create', 'read', 'update', 'delete'] })),
    
    // Comptable: Module comptabilité uniquement
    comptable: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'eleves', actions: ['read'] },
      { module: 'comptabilite', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'paiements', actions: ['create', 'read', 'update'] },
      { module: 'depenses', actions: ['create', 'read', 'update'] },
      { module: 'caisse', actions: ['create', 'read', 'update'] },
      { module: 'rapports', actions: ['read'] },
    ],
    
    // RH: Gestion du personnel
    rh: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'enseignants', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'personnel', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'presences', actions: ['create', 'read', 'update'] },
      { module: 'conges', actions: ['create', 'read', 'update'] },
      { module: 'salaires', actions: ['read', 'update'] },
      { module: 'contrats', actions: ['create', 'read', 'update'] },
      { module: 'rapports', actions: ['read'] },
    ],
    
    // Enseignant: Accès limité à sa classe/matière + demande de congé
    enseignant: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'eleves', actions: ['read'] }, // Lecture des élèves de sa classe uniquement
      { module: 'classes', actions: ['read'] }, // Lecture des classes assignées
      { module: 'matieres', actions: ['read'] }, // Lecture de ses matières
      { module: 'notes', actions: ['create', 'read', 'update'] }, // Gestion des notes de ses matières
      { module: 'bulletins', actions: ['read'] },
      { module: 'emploi_temps', actions: ['read'] },
      { module: 'presences', actions: ['read'] },
      { module: 'conges', actions: ['create', 'read'] }, // Peut demander un congé
    ],
    
    // Parent: Consultation des infos de son enfant + paiements
    parent: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'eleves', actions: ['read'] }, // Lecture de son enfant uniquement
      { module: 'notes', actions: ['read'] },
      { module: 'bulletins', actions: ['read'] },
      { module: 'resultats', actions: ['read'] },
      { module: 'attestations', actions: ['read'] },
      { module: 'emploi_temps', actions: ['read'] },
      { module: 'paiements', actions: ['create', 'read'] },
    ],
    
    // Élève: Consultation de ses propres infos
    eleve: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'notes', actions: ['read'] },
      { module: 'bulletins', actions: ['read'] },
      { module: 'resultats', actions: ['read'] },
      { module: 'emploi_temps', actions: ['read'] },
    ],
  }
  
  return rolePermissions[role] || []
}

// Labels des rôles en français
export const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Administrateur',
  admin: 'Administrateur',
  comptable: 'Comptable',
  rh: 'Ressources Humaines',
  enseignant: 'Enseignant',
  parent: 'Parent',
  eleve: 'Élève',
}
