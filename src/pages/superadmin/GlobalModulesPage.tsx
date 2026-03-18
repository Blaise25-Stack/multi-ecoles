/**
 * ============================================
 * Global Modules Page - Matrix Feature Flags
 * ============================================
 * Vue matricielle des modules par école
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  ToggleRight,
  Check,
  Building2,
  Zap,
  Shield,
  BookOpen,
  DollarSign,
  Users,
  MessageSquare,
  BarChart3,
  LogOut,
  CheckSquare,
  XSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { modulesService, type AvailableModule } from '@/services/modulesService'
import { schoolsService, type SchoolWithStats } from '@/services/schoolsService'

const categoryIcons: Record<string, React.ReactNode> = {
  core: <Shield className="h-4 w-4" />,
  academic: <BookOpen className="h-4 w-4" />,
  financial: <DollarSign className="h-4 w-4" />,
  hr: <Users className="h-4 w-4" />,
  communication: <MessageSquare className="h-4 w-4" />,
  advanced: <BarChart3 className="h-4 w-4" />,
}

const categoryLabels: Record<string, string> = {
  core: 'Essentiels',
  academic: 'Académiques',
  financial: 'Financiers',
  hr: 'RH',
  communication: 'Communication',
  advanced: 'Avancés',
}

interface SchoolModuleState {
  [schoolId: number]: {
    [moduleKey: string]: boolean
  }
}

const GlobalModulesPage = () => {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const { logout } = useAuthStore()

  const [modules, setModules] = useState<AvailableModule[]>([])
  const [schools, setSchools] = useState<SchoolWithStats[]>([])
  const [moduleStates, setModuleStates] = useState<SchoolModuleState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingChanges, setPendingChanges] = useState<SchoolModuleState>({})

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [modulesData, schoolsData] = await Promise.all([
        modulesService.getAvailable(),
        schoolsService.getAll(),
      ])
      setModules(modulesData.modules)
      setSchools(schoolsData)

      const states: SchoolModuleState = {}
      await Promise.all(
        schoolsData.map(async (school) => {
          try {
            const schoolModules = await modulesService.getSchoolModules(school.id)
            states[school.id] = {}
            for (const category of schoolModules.categories) {
              for (const mod of schoolModules.modules[category] || []) {
                states[school.id][mod.key] = mod.enabled
              }
            }
          } catch {
            states[school.id] = {}
          }
        })
      )
      setModuleStates(states)
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

  useEffect(() => {
    loadData()
  }, [])

  const isEnabled = (schoolId: number, moduleKey: string): boolean => {
    if (pendingChanges[schoolId]?.[moduleKey] !== undefined) {
      return pendingChanges[schoolId][moduleKey]
    }
    return moduleStates[schoolId]?.[moduleKey] ?? false
  }

  const handleToggle = (schoolId: number, moduleKey: string) => {
    const current = isEnabled(schoolId, moduleKey)
    setPendingChanges((prev) => ({
      ...prev,
      [schoolId]: {
        ...(prev[schoolId] || {}),
        [moduleKey]: !current,
      },
    }))
  }

  const bulkToggleModule = (moduleKey: string, enable: boolean) => {
    const changes = { ...pendingChanges }
    for (const school of schools) {
      changes[school.id] = {
        ...(changes[school.id] || {}),
        [moduleKey]: enable,
      }
    }
    setPendingChanges(changes)
  }

  const bulkToggleSchool = (schoolId: number, enable: boolean) => {
    const changes = { ...pendingChanges }
    changes[schoolId] = {}
    for (const mod of modules) {
      changes[schoolId][mod.key] = enable
    }
    setPendingChanges(changes)
  }

  const hasChanges = Object.keys(pendingChanges).some(
    (sid) => Object.keys(pendingChanges[parseInt(sid)]).length > 0
  )

  const totalChanges = Object.values(pendingChanges).reduce(
    (sum, schoolChanges) => sum + Object.keys(schoolChanges).length,
    0
  )

  const saveChanges = async () => {
    setIsSaving(true)
    try {
      const updates = Object.entries(pendingChanges).map(([schoolId, changes]) =>
        modulesService.bulkUpdate(schoolId, changes)
      )
      await Promise.all(updates)
      addToast({ type: 'success', title: 'Succès', message: 'Modules mis à jour' })
      setPendingChanges({})
      loadData()
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

  const cancelChanges = () => setPendingChanges({})

  const filteredModules = modules.filter(
    (m) =>
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getEnabledCount = (moduleKey: string): number => {
    return schools.filter((s) => isEnabled(s.id, moduleKey)).length
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-surface-500">Chargement de la matrice...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      {/* Header */}
      <header className="bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="font-semibold text-surface-900 dark:text-white">
                    Modules Globaux
                  </h1>
                  <p className="text-xs text-surface-500">
                    {modules.length} modules · {schools.length} écoles
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <>
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    {totalChanges} modification{totalChanges > 1 ? 's' : ''}
                  </span>
                  <Button variant="outline" size="sm" onClick={cancelChanges}>
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

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Modules disponibles</p>
                <p className="text-3xl font-bold text-surface-900 dark:text-white">{modules.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Écoles connectées</p>
                <p className="text-3xl font-bold text-surface-900 dark:text-white">{schools.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Activations totales</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {Object.values(moduleStates).reduce(
                    (sum, s) => sum + Object.values(s).filter(Boolean).length,
                    0
                  )}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ToggleRight className="h-6 w-6 text-green-600 dark:text-green-400" />
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

        {/* Matrix */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-surface-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase sticky left-0 bg-gray-50 dark:bg-surface-700/50 z-[1] min-w-[200px]">
                    Module
                  </th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-surface-500 uppercase min-w-[60px]">
                    Tous
                  </th>
                  {schools.map((school) => (
                    <th
                      key={school.id}
                      className="text-center px-2 py-3 text-xs font-semibold text-surface-500 min-w-[100px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="truncate max-w-[90px]" title={school.name}>
                          {school.code}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => bulkToggleSchool(school.id, true)}
                            className="p-0.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30"
                            title="Tout activer"
                          >
                            <CheckSquare className="h-3 w-3 text-green-600" />
                          </button>
                          <button
                            onClick={() => bulkToggleSchool(school.id, false)}
                            className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                            title="Tout désactiver"
                          >
                            <XSquare className="h-3 w-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-700">
                {filteredModules.map((mod) => {
                  const enabledCount = getEnabledCount(mod.key)
                  return (
                    <tr key={mod.key} className="hover:bg-gray-50 dark:hover:bg-surface-700/50">
                      <td className="px-4 py-3 sticky left-0 bg-white dark:bg-surface-800 z-[1]">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {categoryIcons[mod.category]}
                            <div>
                              <p className="font-medium text-sm text-surface-900 dark:text-white">
                                {mod.name}
                              </p>
                              <p className="text-xs text-surface-400">
                                {enabledCount}/{schools.length} écoles
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => bulkToggleModule(mod.key, true)}
                            className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30"
                            title="Activer partout"
                          >
                            <CheckSquare className="h-4 w-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => bulkToggleModule(mod.key, false)}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                            title="Désactiver partout"
                          >
                            <XSquare className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                      {schools.map((school) => {
                        const enabled = isEnabled(school.id, mod.key)
                        const original = moduleStates[school.id]?.[mod.key] ?? false
                        const changed = pendingChanges[school.id]?.[mod.key] !== undefined
                        return (
                          <td key={school.id} className="px-2 py-3 text-center">
                            <button
                              onClick={() => handleToggle(school.id, mod.key)}
                              className={`relative w-10 h-6 rounded-full transition-colors ${
                                enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                              } ${changed ? 'ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-surface-800' : ''}`}
                            >
                              <div
                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                  enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredModules.length === 0 && (
            <div className="p-12 text-center">
              <Zap className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
              <p className="text-surface-500">Aucun module trouvé</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-surface-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 rounded-full bg-green-500" />
            <span>Activé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>Désactivé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 rounded-full bg-green-500 ring-2 ring-amber-400 ring-offset-1" />
            <span>Modifié (non sauvegardé)</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export { GlobalModulesPage }
