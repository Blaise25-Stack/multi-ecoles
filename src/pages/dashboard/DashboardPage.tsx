import { useQuery } from '@tanstack/react-query'
import {
  Users,
  GraduationCap,
  Building2,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Spinner'
import { StatCard } from '@/components/ui/StatCard'
import { useAuthStore } from '@/stores/authStore'
import { useConfigStore } from '@/stores/configStore'
import { formatCurrency, formatPercent } from '@/utils/format'
import { api } from '@/services/api'

interface DashboardStats {
  totalEleves: number
  totalEnseignants: number
  totalClasses: number
  tauxRecouvrement: number
  repartitionSexe: { garcons: number; filles: number }
  elevesParNiveau: { niveau: string; count: number }[]
  recettesParMois: { mois: string; montant: number }[]
  alertes: { type: string; message: string }[]
}

const DashboardPage = () => {
  const { user } = useAuthStore()
  const { anneeScolaireActive } = useConfigStore()

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data?.data as DashboardStats
    },
    refetchInterval: 60000,
  })

  if (isLoading) {
    return <PageLoader message="Chargement du tableau de bord..." />
  }

  const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

  // Préparer les données du camembert
  const pieData = [
    { name: 'Garçons', value: stats?.repartitionSexe?.garcons || 0 },
    { name: 'Filles', value: stats?.repartitionSexe?.filles || 0 },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Bienvenue, {user?.prenom} 👋
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Voici un aperçu de votre établissement aujourd'hui
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            Actualiser
          </Button>
          {anneeScolaireActive && (
            <Badge variant="primary" size="lg">
              {anneeScolaireActive.libelle}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats grid avec composant StatCard amélioré */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 stagger-children">
        <StatCard
          title="Total Élèves"
          value={stats?.totalEleves || 0}
          icon={<GraduationCap className="h-6 w-6" />}
          color="primary"
          onClick={() => window.location.href = '/eleves'}
        />
        <StatCard
          title="Enseignants"
          value={stats?.totalEnseignants || 0}
          icon={<Users className="h-6 w-6" />}
          color="secondary"
          onClick={() => window.location.href = '/enseignants'}
        />
        <StatCard
          title="Classes"
          value={stats?.totalClasses || 0}
          icon={<Building2 className="h-6 w-6" />}
          color="accent"
          onClick={() => window.location.href = '/classes'}
        />
        <StatCard
          title="Taux de recouvrement"
          value={stats?.tauxRecouvrement || 0}
          suffix="%"
          decimals={1}
          icon={<Wallet className="h-6 w-6" />}
          color="success"
          onClick={() => window.location.href = '/paiements'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Élèves par niveau */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des élèves par niveau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {stats?.elevesParNiveau && stats.elevesParNiveau.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.elevesParNiveau}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="niveau" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value) => [`${value} élèves`, 'Effectif']}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#6366f1" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-surface-500">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recettes mensuelles */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des recettes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {stats?.recettesParMois && stats.recettesParMois.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.recettesParMois}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="mois" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(0)}M` : `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Recettes']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="montant" 
                      stroke="#14b8a6" 
                      strokeWidth={3}
                      dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#14b8a6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-surface-500">
                  <p>Aucune recette enregistrée</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alertes et notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.alertes && stats.alertes.length > 0 ? (
              stats.alertes.map((alerte, index) => {
                const icons = {
                  warning: AlertCircle,
                  info: Clock,
                  success: CheckCircle,
                }
                const Icon = icons[alerte.type as keyof typeof icons] || AlertCircle
                const variants = {
                  warning: 'warning' as const,
                  info: 'info' as const,
                  success: 'success' as const,
                }

                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800 transition-colors hover:bg-surface-100 dark:hover:bg-surface-700"
                  >
                    <Badge variant={variants[alerte.type as keyof typeof variants] || 'default'} dot>
                      <Icon className="h-4 w-4" />
                    </Badge>
                    <p className="flex-1 text-sm text-surface-700 dark:text-surface-300">
                      {alerte.message}
                    </p>
                  </div>
                )
              })
            ) : (
              <div className="flex items-center justify-center p-8 text-surface-500">
                <CheckCircle className="h-5 w-5 mr-2 text-emerald-500" />
                <p>Aucune alerte pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Répartition par sexe - camembert */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par sexe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {pieData[0].value + pieData[1].value > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} élèves`, 'Effectif']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-surface-500">
                  <p>Aucun élève enregistré</p>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
                <span className="text-sm text-surface-600 dark:text-surface-400">
                  Garçons ({stats?.repartitionSexe?.garcons || 0})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }} />
                <span className="text-sm text-surface-600 dark:text-surface-400">
                  Filles ({stats?.repartitionSexe?.filles || 0})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { DashboardPage }
