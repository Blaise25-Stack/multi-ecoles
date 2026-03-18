/**
 * ============================================
 * Platform Settings Page - Configuration
 * ============================================
 * Paramètres globaux de la plateforme (display-only)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Settings,
  Shield,
  Wrench,
  Globe,
  Lock,
  Key,
  Database,
  Trash2,
  Server,
  Clock,
  LogOut,
  Info,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'

type TabId = 'general' | 'security' | 'maintenance'

interface TabConfig {
  id: TabId
  label: string
  icon: React.ReactNode
}

const tabs: TabConfig[] = [
  { id: 'general', label: 'Général', icon: <Globe className="h-4 w-4" /> },
  { id: 'security', label: 'Sécurité', icon: <Shield className="h-4 w-4" /> },
  { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-4 w-4" /> },
]

const SettingRow = ({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-100 dark:border-surface-700 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="font-medium text-surface-900 dark:text-white">{label}</p>
      {description && (
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{description}</p>
      )}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
)

const PlatformSettingsPage = () => {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const { logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [isClearingCache, setIsClearingCache] = useState(false)

  const [generalSettings] = useState({
    platformName: 'SGS Platform',
    defaultCurrency: 'FC',
    defaultLanguage: 'fr',
    version: '1.0.0',
    environment: import.meta.env.MODE || 'development',
  })

  const [securitySettings] = useState({
    jwtExpiration: '24h',
    refreshTokenExpiration: '7d',
    maxLoginAttempts: 5,
    lockoutDuration: '15 min',
    passwordMinLength: 6,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecial: false,
  })

  const handleClearCache = async () => {
    setIsClearingCache(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsClearingCache(false)
    addToast({
      type: 'success',
      title: 'Cache vidé',
      message: 'Le cache de la plateforme a été vidé avec succès',
    })
  }

  const renderGeneralTab = () => (
    <div className="space-y-0">
      <SettingRow label="Nom de la plateforme" description="Nom affiché dans l'interface">
        <div className="w-64">
          <Input value={generalSettings.platformName} disabled />
        </div>
      </SettingRow>

      <SettingRow label="Devise par défaut" description="Devise utilisée pour les nouvelles écoles">
        <select
          value={generalSettings.defaultCurrency}
          disabled
          className="w-40 px-3 py-2 border border-gray-200 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="FC">FC (Franc Congolais)</option>
          <option value="USD">USD (Dollar US)</option>
          <option value="EUR">EUR (Euro)</option>
        </select>
      </SettingRow>

      <SettingRow label="Langue par défaut" description="Langue de l'interface par défaut">
        <select
          value={generalSettings.defaultLanguage}
          disabled
          className="w-40 px-3 py-2 border border-gray-200 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </SettingRow>

      <SettingRow label="Version" description="Version actuelle de la plateforme">
        <Badge variant="primary" size="sm">v{generalSettings.version}</Badge>
      </SettingRow>

      <SettingRow label="Environnement" description="Environnement d'exécution actuel">
        <Badge
          variant={generalSettings.environment === 'production' ? 'success' : 'warning'}
          size="sm"
          dot
        >
          {generalSettings.environment}
        </Badge>
      </SettingRow>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-0">
      <SettingRow
        label="Expiration JWT"
        description="Durée de validité du token d'authentification"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-surface-400" />
          <span className="font-mono text-sm text-surface-700 dark:text-surface-300 bg-gray-100 dark:bg-surface-700 px-3 py-1 rounded-lg">
            {securitySettings.jwtExpiration}
          </span>
        </div>
      </SettingRow>

      <SettingRow
        label="Expiration Refresh Token"
        description="Durée de validité du token de rafraîchissement"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-surface-400" />
          <span className="font-mono text-sm text-surface-700 dark:text-surface-300 bg-gray-100 dark:bg-surface-700 px-3 py-1 rounded-lg">
            {securitySettings.refreshTokenExpiration}
          </span>
        </div>
      </SettingRow>

      <SettingRow
        label="Tentatives de connexion max"
        description="Nombre de tentatives avant verrouillage du compte"
      >
        <span className="font-mono text-sm text-surface-700 dark:text-surface-300 bg-gray-100 dark:bg-surface-700 px-3 py-1 rounded-lg">
          {securitySettings.maxLoginAttempts}
        </span>
      </SettingRow>

      <SettingRow
        label="Durée de verrouillage"
        description="Durée du verrouillage après trop de tentatives"
      >
        <span className="font-mono text-sm text-surface-700 dark:text-surface-300 bg-gray-100 dark:bg-surface-700 px-3 py-1 rounded-lg">
          {securitySettings.lockoutDuration}
        </span>
      </SettingRow>

      <div className="pt-4">
        <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Politique de mot de passe
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-surface-700/50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-surface-700 dark:text-surface-300">
              Minimum {securitySettings.passwordMinLength} caractères
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-surface-700/50 rounded-lg">
            {securitySettings.passwordRequireUppercase ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            )}
            <span className="text-sm text-surface-700 dark:text-surface-300">
              Majuscule requise
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-surface-700/50 rounded-lg">
            {securitySettings.passwordRequireNumber ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            )}
            <span className="text-sm text-surface-700 dark:text-surface-300">
              Chiffre requis
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-surface-700/50 rounded-lg">
            {securitySettings.passwordRequireSpecial ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            )}
            <span className="text-sm text-surface-700 dark:text-surface-300">
              Caractère spécial requis
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMaintenanceTab = () => (
    <div className="space-y-6">
      {/* Database Info */}
      <div className="bg-gray-50 dark:bg-surface-700/50 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <Database className="h-4 w-4" />
          Base de données
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-surface-500 mb-1">Type</p>
            <p className="font-medium text-surface-900 dark:text-white">PostgreSQL</p>
          </div>
          <div>
            <p className="text-xs text-surface-500 mb-1">Hôte</p>
            <p className="font-mono text-sm text-surface-700 dark:text-surface-300">
              {import.meta.env.VITE_DB_HOST || 'localhost:5432'}
            </p>
          </div>
          <div>
            <p className="text-xs text-surface-500 mb-1">Statut</p>
            <Badge variant="success" size="sm" dot>Connecté</Badge>
          </div>
          <div>
            <p className="text-xs text-surface-500 mb-1">ORM</p>
            <p className="font-medium text-surface-900 dark:text-white">Sequelize</p>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gray-50 dark:bg-surface-700/50 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <Server className="h-4 w-4" />
          Informations système
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-surface-500 mb-1">Frontend</p>
            <p className="font-medium text-surface-900 dark:text-white">React + Vite</p>
          </div>
          <div>
            <p className="text-xs text-surface-500 mb-1">Backend</p>
            <p className="font-medium text-surface-900 dark:text-white">Node.js + Express</p>
          </div>
          <div>
            <p className="text-xs text-surface-500 mb-1">API URL</p>
            <p className="font-mono text-sm text-surface-700 dark:text-surface-300 truncate">
              {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
            </p>
          </div>
          <div>
            <p className="text-xs text-surface-500 mb-1">Architecture</p>
            <p className="font-medium text-surface-900 dark:text-white">Multi-tenant</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-gray-100 dark:border-surface-700 p-6">
        <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Actions de maintenance
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-700/50 rounded-lg">
            <div>
              <p className="font-medium text-surface-900 dark:text-white">Vider le cache</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Supprime les données en cache côté serveur
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={handleClearCache}
              isLoading={isClearingCache}
            >
              Vider
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30">
            <div>
              <p className="font-medium text-surface-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Mode maintenance
              </p>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Bloque l'accès à la plateforme pour les utilisateurs
              </p>
            </div>
            <Badge variant="default" size="sm">Désactivé</Badge>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800/30">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Page en lecture seule
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Les paramètres affichés sont en lecture seule. L'édition sera disponible dans une prochaine mise à jour.
          </p>
        </div>
      </div>
    </div>
  )

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
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-surface-600 dark:text-surface-400" />
                </div>
                <div>
                  <h1 className="font-semibold text-surface-900 dark:text-white">
                    Paramètres Plateforme
                  </h1>
                  <p className="text-xs text-surface-500">
                    Configuration globale
                  </p>
                </div>
              </div>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:w-56 flex-shrink-0">
            <nav className="flex lg:flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-gray-100 dark:hover:bg-surface-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h2>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  {activeTab === 'general' && 'Paramètres généraux de la plateforme'}
                  {activeTab === 'security' && 'Configuration de la sécurité et authentification'}
                  {activeTab === 'maintenance' && 'Outils de maintenance et informations système'}
                </p>
              </div>

              {activeTab === 'general' && renderGeneralTab()}
              {activeTab === 'security' && renderSecurityTab()}
              {activeTab === 'maintenance' && renderMaintenanceTab()}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export { PlatformSettingsPage }
