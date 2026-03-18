/**
 * ============================================
 * SuperAdmin Dashboard - Console Plateforme
 * ============================================
 * Page d'accueil pour le Super Administrateur
 * Vue globale de toutes les écoles de la plateforme
 * 
 * ✅ Connecté à l'API /api/stats/platform et /api/stats/schools
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  TrendingUp,
  Settings,
  Plus,
  Search,
  ChevronRight,
  School,
  Activity,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { statsService, type PlatformStats, type SchoolSummary } from '@/services/statsService'

const SuperAdminDashboard = () => {
  const navigate = useNavigate()
  const { user, setCurrentSchool, logout } = useAuthStore()
  const { addToast } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ✅ Données réelles depuis l'API
  const [stats, setStats] = useState<PlatformStats>({
    totalSchools: 0,
    activeSchools: 0,
    totalUsers: 0,
    totalStudents: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
  })

  const [schools, setSchools] = useState<SchoolSummary[]>([])

  // Charger les données
  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const [platformStats, schoolsList] = await Promise.all([
        statsService.getPlatformStats(),
        statsService.getSchoolsWithStats(),
      ])

      setStats(platformStats)
      setSchools(schoolsList)
    } catch (error: any) {
      console.error('Erreur chargement stats:', error)
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.response?.data?.message || 'Impossible de charger les statistiques',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtrer les écoles par recherche
  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Entrer dans le contexte d'une école
  const enterSchoolContext = (school: SchoolSummary) => {
    setCurrentSchool({
      id: school.id,
      code: school.code,
      name: school.name,
      currency: school.currency,
      isActive: school.isActive,
    })
    navigate('/dashboard')
  }

  // Formater les montants
  const formatMoney = (amount: number, currency: string = 'FC') => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ` ${currency}`
  }

  // Formater la date relative
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Jamais'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
  }

  // Badge de souscription
  const SubscriptionBadge = ({ type }: { type: SchoolSummary['subscription'] }) => {
    const styles = {
      free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      basic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      premium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    }
    const labels = {
      free: 'Gratuit',
      basic: 'Basic',
      premium: 'Premium',
      enterprise: 'Enterprise',
    }
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[type]}`}>
        {labels[type]}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-surface-500">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      {/* Header */}
      <header className="bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-surface-900 dark:text-white">
                  SGS Platform
                </h1>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Console Super Admin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                onClick={() => loadData(true)}
                disabled={isRefreshing}
              >
                Actualiser
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings className="h-4 w-4" />}
                onClick={() => navigate('/superadmin/settings')}
              >
                Paramètres
              </Button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-xs text-surface-500">Super Admin</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    {user?.prenom?.[0]}{user?.nom?.[0]}
                  </span>
                </div>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                {stats.activeSchools} actives
              </span>
            </div>
            <p className="text-3xl font-bold text-surface-900 dark:text-white">
              {stats.totalSchools}
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Écoles inscrites</p>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-surface-900 dark:text-white">
              {stats.totalUsers.toLocaleString()}
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Utilisateurs totaux</p>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <School className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-surface-900 dark:text-white">
              {stats.totalStudents.toLocaleString()}
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Élèves inscrits</p>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              {stats.revenueGrowth !== 0 && (
                <span className={`text-xs font-medium flex items-center gap-1 ${
                  stats.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="h-3 w-3" />
                  {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth}%
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-surface-900 dark:text-white">
              {formatMoney(stats.monthlyRevenue)}
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Revenus ce mois</p>
          </div>
        </div>

        {/* Schools Section */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700">
          {/* Section Header */}
          <div className="p-6 border-b border-gray-100 dark:border-surface-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                  Écoles de la plateforme
                </h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Gérez toutes les écoles inscrites sur la plateforme
                </p>
              </div>
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => navigate('/superadmin/schools')}
              >
                Gérer les écoles
              </Button>
            </div>

            {/* Search */}
            <div className="mt-4 max-w-md">
              <Input
                placeholder="Rechercher une école..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-surface-400" />}
              />
            </div>
          </div>

          {/* Schools List */}
          <div className="divide-y divide-gray-100 dark:divide-surface-700">
            {filteredSchools.map((school) => (
              <div
                key={school.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-surface-700/50 transition-colors cursor-pointer group"
                onClick={() => enterSchoolContext(school)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        school.isActive
                          ? 'bg-primary-100 dark:bg-primary-900/30'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <Building2
                        className={`h-6 w-6 ${
                          school.isActive
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-surface-900 dark:text-white">
                          {school.name}
                        </h3>
                        {school.isActive ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-surface-500 dark:text-surface-400 font-mono">
                          {school.code}
                        </span>
                        <SubscriptionBadge type={school.subscription} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="hidden md:flex items-center gap-6 text-sm text-surface-500 dark:text-surface-400">
                      <div className="text-center">
                        <p className="font-semibold text-surface-900 dark:text-white">
                          {school.studentsCount}
                        </p>
                        <p className="text-xs">Élèves</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-surface-900 dark:text-white">
                          {school.usersCount}
                        </p>
                        <p className="text-xs">Utilisateurs</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-surface-900 dark:text-white">
                          {formatMoney(school.monthlyRevenue, school.currency)}
                        </p>
                        <p className="text-xs">Ce mois</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(school.lastActivity)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/superadmin/schools/${school.id}/modules`)
                        }}
                      >
                        Modules
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/superadmin/schools/${school.id}/users`)
                        }}
                      >
                        Users
                      </Button>
                      <ChevronRight className="h-5 w-5 text-surface-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredSchools.length === 0 && (
            <div className="p-12 text-center">
              <Building2 className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-2">
                Aucune école trouvée
              </h3>
              <p className="text-surface-500 dark:text-surface-400 mb-4">
                {searchQuery
                  ? `Aucune école ne correspond à "${searchQuery}"`
                  : 'Commencez par créer votre première école'}
              </p>
              {!searchQuery && (
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => navigate('/superadmin/schools')}
                >
                  Créer une école
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => navigate('/superadmin/schools')}
            className="p-6 bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-left group"
          >
            <Building2 className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-4" />
            <h3 className="font-semibold text-surface-900 dark:text-white mb-1">
              Gestion des écoles
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Créer, modifier et gérer les écoles de la plateforme
            </p>
          </button>

          <button
            onClick={() => navigate('/superadmin/modules')}
            className="p-6 bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-left group"
          >
            <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-4" />
            <h3 className="font-semibold text-surface-900 dark:text-white mb-1">
              Feature Flags
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Activer/désactiver les modules par école
            </p>
          </button>

          <button
            onClick={() => navigate('/superadmin/reports')}
            className="p-6 bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-left group"
          >
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 mb-4" />
            <h3 className="font-semibold text-surface-900 dark:text-white mb-1">
              Rapports globaux
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Statistiques et analyses de la plateforme
            </p>
          </button>

          <button
            onClick={() => navigate('/superadmin/messages')}
            className="p-6 bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors text-left group"
          >
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400 mb-4" />
            <h3 className="font-semibold text-surface-900 dark:text-white mb-1">
              Messages de contact
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Voir les messages reçus du site vitrine
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}

export { SuperAdminDashboard }
