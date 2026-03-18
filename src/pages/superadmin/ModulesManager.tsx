/**
 * ============================================
 * Modules Manager - Feature Flags Admin UI
 * ============================================
 * Interface pour gérer les modules par école
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Check,
  X,
  Building2,
  Zap,
  Shield,
  Settings,
  BookOpen,
  DollarSign,
  Users,
  MessageSquare,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { modulesService, type SchoolModule, type ModulesResponse } from '@/services/modulesService'
import { schoolsService, type SchoolWithStats } from '@/services/schoolsService'

// Icônes par catégorie
const categoryIcons: Record<string, React.ReactNode> = {
  core: <Shield className="h-5 w-5" />,
  academic: <BookOpen className="h-5 w-5" />,
  financial: <DollarSign className="h-5 w-5" />,
  hr: <Users className="h-5 w-5" />,
  communication: <MessageSquare className="h-5 w-5" />,
  advanced: <BarChart3 className="h-5 w-5" />,
}

// Labels des catégories
const categoryLabels: Record<string, string> = {
  core: 'Modules Essentiels',
  academic: 'Modules Académiques',
  financial: 'Modules Financiers',
  hr: 'Ressources Humaines',
  communication: 'Communication',
  advanced: 'Modules Avancés',
}

// Couleurs des catégories
const categoryColors: Record<string, string> = {
  core: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  academic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  financial: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  hr: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  communication: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  advanced: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
}

// Badge subscription
const SubscriptionBadge = ({ level }: { level: string }) => {
  const styles: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    basic: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    premium: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    enterprise: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[level] || styles.free}`}>
      {level}
    </span>
  )
}

const ModulesManager = () => {
  const { schoolId } = useParams<{ schoolId: string }>()
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const { logout } = useAuthStore()

  const [school, setSchool] = useState<SchoolWithStats | null>(null)
  const [modulesData, setModulesData] = useState<ModulesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Charger les données
  useEffect(() => {
    if (!schoolId) return

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [schoolData, modulesResponse] = await Promise.all([
          schoolsService.getById(schoolId),
          modulesService.getSchoolModules(schoolId),
        ])
        setSchool(schoolData)
        setModulesData(modulesResponse)
      } catch (error: any) {
        addToast({
          type: 'error',
          title: 'Erreur',
          message: error?.message || 'Impossible de charger les données',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [schoolId])

  // Toggle un module localement
  const handleToggle = (moduleKey: string, currentEnabled: boolean) => {
    setPendingChanges(prev => ({
      ...prev,
      [moduleKey]: !currentEnabled,
    }))
  }

  // Vérifier si un module est activé (avec changements en attente)
  const isModuleEnabled = (module: SchoolModule): boolean => {
    if (module.key in pendingChanges) {
      return pendingChanges[module.key]
    }
    return module.enabled
  }

  // Sauvegarder les changements
  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0 || !schoolId) return

    setIsSaving(true)
    try {
      await modulesService.bulkUpdate(schoolId, pendingChanges)
      
      // Recharger les données
      const modulesResponse = await modulesService.getSchoolModules(schoolId)
      setModulesData(modulesResponse)
      setPendingChanges({})
      
      addToast({
        type: 'success',
        title: 'Succès',
        message: 'Modules mis à jour avec succès',
      })
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.message || 'Erreur lors de la sauvegarde',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Réinitialiser aux valeurs par défaut
  const resetToDefaults = async () => {
    if (!schoolId) return

    if (!confirm('Réinitialiser tous les modules aux valeurs par défaut ?')) return

    setIsSaving(true)
    try {
      await modulesService.resetToDefaults(schoolId)
      
      // Recharger
      const modulesResponse = await modulesService.getSchoolModules(schoolId)
      setModulesData(modulesResponse)
      setPendingChanges({})
      
      addToast({
        type: 'success',
        title: 'Succès',
        message: 'Modules réinitialisés',
      })
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.message || 'Erreur lors de la réinitialisation',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Annuler les changements
  const cancelChanges = () => {
    setPendingChanges({})
  }

  // Filtrer les modules par recherche
  const filterModules = (modules: SchoolModule[]): SchoolModule[] => {
    if (!searchQuery) return modules
    const query = searchQuery.toLowerCase()
    return modules.filter(
      m => m.name.toLowerCase().includes(query) || m.key.toLowerCase().includes(query)
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!school || !modulesData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
            École non trouvée
          </h2>
          <Button onClick={() => navigate('/superadmin')}>
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const hasChanges = Object.keys(pendingChanges).length > 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      {/* Header */}
      <header className="bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => navigate('/superadmin')}
              >
                Retour
              </Button>
              <div className="h-6 w-px bg-gray-200 dark:bg-surface-700" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h1 className="font-semibold text-surface-900 dark:text-white">
                    {school.name}
                  </h1>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Feature Flags · {modulesData.stats.enabled}/{modulesData.stats.total} modules actifs
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <>
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    {Object.keys(pendingChanges).length} modification(s)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelChanges}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<Check className="h-4 w-4" />}
                    onClick={saveChanges}
                    isLoading={isSaving}
                  >
                    Sauvegarder
                  </Button>
                </>
              )}
              {!hasChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  onClick={resetToDefaults}
                >
                  Réinitialiser
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<LogOut className="h-4 w-4" />}
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Modules activés</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {modulesData.stats.enabled}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ToggleRight className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Modules désactivés</p>
                <p className="text-3xl font-bold text-surface-600 dark:text-surface-400">
                  {modulesData.stats.total - modulesData.stats.enabled}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ToggleLeft className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Taux d'activation</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {modulesData.stats.percentage}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 max-w-md">
          <Input
            placeholder="Rechercher un module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-surface-400" />}
          />
        </div>

        {/* Modules by Category */}
        <div className="space-y-8">
          {modulesData.categories.map(category => {
            const modules = filterModules(modulesData.modules[category] || [])
            if (modules.length === 0) return null

            return (
              <div key={category} className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 overflow-hidden">
                {/* Category Header */}
                <div className={`px-6 py-4 border-b border-gray-100 dark:border-surface-700 ${categoryColors[category]}`}>
                  <div className="flex items-center gap-3">
                    {categoryIcons[category]}
                    <h2 className="font-semibold">
                      {categoryLabels[category] || category}
                    </h2>
                    <span className="text-sm opacity-75">
                      ({modules.filter(m => isModuleEnabled(m)).length}/{modules.length} actifs)
                    </span>
                  </div>
                </div>

                {/* Modules List */}
                <div className="divide-y divide-gray-100 dark:divide-surface-700">
                  {modules.map(module => {
                    const enabled = isModuleEnabled(module)
                    const hasChange = module.key in pendingChanges

                    return (
                      <div
                        key={module.key}
                        className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-surface-700/50 transition-colors ${
                          hasChange ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleToggle(module.key, enabled)}
                            className={`relative w-12 h-7 rounded-full transition-colors ${
                              enabled
                                ? 'bg-green-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                enabled
                                  ? 'text-surface-900 dark:text-white'
                                  : 'text-surface-500 dark:text-surface-400'
                              }`}>
                                {module.name}
                              </span>
                              <SubscriptionBadge level={module.requiresSubscription} />
                              {hasChange && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                  modifié
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-surface-500 dark:text-surface-400">
                              {module.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-surface-400">
                          <code className="font-mono text-xs bg-gray-100 dark:bg-surface-700 px-2 py-1 rounded">
                            {module.key}
                          </code>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export { ModulesManager }

