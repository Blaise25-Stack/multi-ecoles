/**
 * ============================================
 * Global Reports Page - Rapports Plateforme
 * ============================================
 * Statistiques et analyses globales avec Recharts
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  RefreshCw,
  LogOut,
  BarChart3,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { statsService, type PlatformStats, type SchoolSummary } from '@/services/statsService'

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

const STATUS_COLORS = {
  active: '#22c55e',
  inactive: '#94a3b8',
}

const SUBSCRIPTION_COLORS: Record<string, string> = {
  free: '#94a3b8',
  basic: '#3b82f6',
  premium: '#f59e0b',
  enterprise: '#8b5cf6',
}

const formatMoney = (amount: number, currency: string = 'FC') => {
  return new Intl.NumberFormat('fr-CD', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(amount) + ` ${currency}`
}

const GlobalReportsPage = () => {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const { logout } = useAuthStore()

  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [schools, setSchools] = useState<SchoolSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  // Chart data
  const statusData = stats
    ? [
        { name: 'Actives', value: stats.activeSchools, color: STATUS_COLORS.active },
        { name: 'Inactives', value: stats.totalSchools - stats.activeSchools, color: STATUS_COLORS.inactive },
      ]
    : []

  const subscriptionData = schools.reduce(
    (acc, s) => {
      const existing = acc.find((d) => d.name === s.subscription)
      if (existing) existing.value++
      else acc.push({ name: s.subscription, value: 1 })
      return acc
    },
    [] as { name: string; value: number }[]
  )

  const revenueBySchool = [...schools]
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 10)
    .map((s) => ({
      name: s.code,
      revenue: s.monthlyRevenue,
      fullName: s.name,
    }))

  const usersBySchool = [...schools]
    .sort((a, b) => b.usersCount - a.usersCount)
    .slice(0, 10)
    .map((s) => ({
      name: s.code,
      users: s.usersCount,
      students: s.studentsCount,
      fullName: s.name,
    }))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-surface-500">Chargement des rapports...</p>
        </div>
      </div>
    )
  }

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
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="font-semibold text-surface-900 dark:text-white">
                    Rapports Globaux
                  </h1>
                  <p className="text-xs text-surface-500">
                    Statistiques de la plateforme
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="success" size="sm">{stats.activeSchools} actives</Badge>
              </div>
              <p className="text-3xl font-bold text-surface-900 dark:text-white">{stats.totalSchools}</p>
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
                  <GraduationCap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
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
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Schools by Status */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
              Écoles par statut
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tw-bg-opacity, #fff)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Schools by Subscription */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
              Écoles par abonnement
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={index} fill={SUBSCRIPTION_COLORS[entry.name] || CHART_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Revenue by School Chart */}
        {revenueBySchool.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700 mb-8">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
              Revenus par école (Top 10)
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBySchool} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                    }}
                    formatter={(value: number) => [formatMoney(value), 'Revenus']}
                    labelFormatter={(label) => {
                      const school = revenueBySchool.find((s) => s.name === label)
                      return school?.fullName || label
                    }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Users by School Chart */}
        {usersBySchool.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-surface-700 mb-8">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
              Utilisateurs et élèves par école (Top 10)
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usersBySchool} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                    }}
                    labelFormatter={(label) => {
                      const school = usersBySchool.find((s) => s.name === label)
                      return school?.fullName || label
                    }}
                  />
                  <Legend />
                  <Bar dataKey="users" name="Utilisateurs" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="students" name="Élèves" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Schools Table */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-surface-700">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
              Détail par école
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Métriques clés de chaque école
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-surface-700/50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">
                    École
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-surface-500 uppercase">
                    Statut
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-surface-500 uppercase">
                    Abonnement
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-surface-500 uppercase">
                    Utilisateurs
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-surface-500 uppercase">
                    Élèves
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase">
                    Revenus
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-700">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-surface-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          school.isActive
                            ? 'bg-primary-100 dark:bg-primary-900/30'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <Building2 className={`h-5 w-5 ${
                            school.isActive
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-surface-900 dark:text-white">{school.name}</p>
                          <p className="text-xs text-surface-500 font-mono">{school.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={school.isActive ? 'success' : 'default'} size="sm" dot>
                        {school.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant={
                          school.subscription === 'enterprise' ? 'primary' :
                          school.subscription === 'premium' ? 'warning' :
                          school.subscription === 'basic' ? 'info' : 'default'
                        }
                        size="sm"
                      >
                        {school.subscription}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-surface-900 dark:text-white">
                        {school.usersCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-surface-900 dark:text-white">
                        {school.studentsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-surface-900 dark:text-white">
                        {formatMoney(school.monthlyRevenue, school.currency)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {schools.length === 0 && (
            <div className="p-12 text-center">
              <Building2 className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
              <p className="text-surface-500">Aucune école trouvée</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export { GlobalReportsPage }
