/**
 * ============================================
 * useModules Hook - Feature Flags Frontend
 * ============================================
 * Hook pour vérifier et gérer les modules côté frontend
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { modulesService, type MyModulesResponse } from '@/services/modulesService'

interface UseModulesReturn {
  /** Modules chargés et prêts */
  isLoaded: boolean
  /** Chargement en cours */
  isLoading: boolean
  /** Erreur de chargement */
  error: string | null
  /** Liste des clés de modules activés */
  enabledModules: string[]
  /** Vérifie si un module est activé */
  isEnabled: (moduleKey: string) => boolean
  /** Vérifie si au moins un des modules est activé */
  isAnyEnabled: (...moduleKeys: string[]) => boolean
  /** Vérifie si tous les modules sont activés */
  areAllEnabled: (...moduleKeys: string[]) => boolean
  /** Recharge les modules */
  refresh: () => Promise<void>
  /** True si SuperAdmin avec tous les modules */
  isSuperAdmin: boolean
}

/**
 * Hook pour gérer les modules/feature flags côté frontend
 * 
 * @example
 * ```tsx
 * function PaymentsPage() {
 *   const { isEnabled, isLoading } = useModules()
 *   
 *   if (isLoading) return <Loader />
 *   
 *   if (!isEnabled('payments')) {
 *     return <ModuleDisabledMessage module="Paiements" />
 *   }
 *   
 *   return <PaymentsContent />
 * }
 * ```
 */
export function useModules(): UseModulesReturn {
  const { isAuthenticated, isSuperAdmin: checkIsSuperAdmin, currentSchool } = useAuthStore()
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [allModulesEnabled, setAllModulesEnabled] = useState(false)

  const isSuperAdmin = checkIsSuperAdmin()

  // Charger les modules
  const loadModules = useCallback(async () => {
    if (!isAuthenticated) {
      setEnabledModules([])
      setIsLoaded(true)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await modulesService.getMyModules()
      
      if (response.isSuperAdmin && response.allModulesEnabled) {
        setAllModulesEnabled(true)
        setEnabledModules([]) // Pas besoin de la liste, tous sont activés
      } else {
        setAllModulesEnabled(false)
        setEnabledModules(response.enabledModules || [])
      }
      
      setIsLoaded(true)
    } catch (err: any) {
      console.error('Erreur chargement modules:', err)
      setError(err?.message || 'Erreur lors du chargement des modules')
      // En cas d'erreur, permettre l'accès par défaut (fail-open)
      setEnabledModules([])
      setIsLoaded(true)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Charger au montage et quand l'auth change
  useEffect(() => {
    loadModules()
  }, [loadModules, currentSchool?.id])

  // Vérifier si un module est activé
  const isEnabled = useCallback((moduleKey: string): boolean => {
    // SuperAdmin global = tout activé
    if (allModulesEnabled) return true
    
    // Vérifier dans la liste
    return enabledModules.includes(moduleKey)
  }, [enabledModules, allModulesEnabled])

  // Vérifier si au moins un module est activé
  const isAnyEnabled = useCallback((...moduleKeys: string[]): boolean => {
    if (allModulesEnabled) return true
    return moduleKeys.some(key => enabledModules.includes(key))
  }, [enabledModules, allModulesEnabled])

  // Vérifier si tous les modules sont activés
  const areAllEnabled = useCallback((...moduleKeys: string[]): boolean => {
    if (allModulesEnabled) return true
    return moduleKeys.every(key => enabledModules.includes(key))
  }, [enabledModules, allModulesEnabled])

  return {
    isLoaded,
    isLoading,
    error,
    enabledModules,
    isEnabled,
    isAnyEnabled,
    areAllEnabled,
    refresh: loadModules,
    isSuperAdmin: allModulesEnabled,
  }
}

/**
 * HOC pour protéger un composant par module
 * 
 * @example
 * ```tsx
 * const ProtectedPayments = withModuleGuard(PaymentsPage, 'payments')
 * ```
 */
export function withModuleGuard<P extends object>(
  Component: React.ComponentType<P>,
  moduleKey: string,
  FallbackComponent?: React.ComponentType
) {
  return function ModuleGuardedComponent(props: P) {
    const { isEnabled, isLoading, isLoaded } = useModules()

    if (isLoading || !isLoaded) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      )
    }

    if (!isEnabled(moduleKey)) {
      if (FallbackComponent) {
        return <FallbackComponent />
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
            Module non disponible
          </h2>
          <p className="text-surface-500 dark:text-surface-400 max-w-md">
            Ce module n'est pas activé pour votre établissement.
            Contactez votre administrateur pour plus d'informations.
          </p>
        </div>
      )
    }

    return <Component {...props} />
  }
}

export default useModules



