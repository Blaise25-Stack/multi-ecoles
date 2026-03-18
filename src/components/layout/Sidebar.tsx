/**
 * ============================================
 * Sidebar - Navigation Multi-Tenant
 * ============================================
 * Filtre les modules selon les feature flags activés
 */

import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  FileText,
  Wallet,
  Receipt,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  Building2,
  ClipboardList,
  Clock,
  PiggyBank,
  BookOpen,
  Banknote,
  FileCheck,
  CalendarOff,
  Award,
  BarChart3,
  UserPlus,
  FileOutput,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useModules } from '@/hooks/useModules'
import { Avatar } from '@/components/ui/Avatar'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
  /** Clé du module (doit correspondre à available_modules.module_key) */
  moduleKey?: string
  /** Clé du module dans le système de permissions utilisateur */
  permModule?: string
  adminOnly?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

/**
 * Navigation avec module keys harmonisées avec le backend
 * moduleKey = feature flag école (school_modules)
 * permModule = permission utilisateur (permissions table)
 */
const navigation: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard', moduleKey: 'dashboard', permModule: 'dashboard' },
    ],
  },
  {
    title: 'Gestion Scolaire',
    items: [
      { label: 'Élèves', icon: GraduationCap, path: '/eleves', moduleKey: 'students', permModule: 'eleves' },
      { label: 'Inscriptions', icon: ClipboardList, path: '/inscriptions', moduleKey: 'students', permModule: 'inscriptions' },
      { label: 'Classes', icon: Building2, path: '/classes', moduleKey: 'classes', permModule: 'classes' },
      { label: 'Matières', icon: BookOpen, path: '/matieres', moduleKey: 'subjects', permModule: 'matieres' },
      { label: 'Notes', icon: FileText, path: '/notes', moduleKey: 'grades', permModule: 'notes' },
      { label: 'Bulletins', icon: FileOutput, path: '/resultats', moduleKey: 'report_cards', permModule: 'resultats' },
      { label: 'Emploi du temps', icon: CalendarDays, path: '/emploi-du-temps', moduleKey: 'schedule', permModule: 'emploi_temps' },
      { label: 'Attestations', icon: Award, path: '/attestations', moduleKey: 'report_cards', permModule: 'attestations' },
    ],
  },
  {
    title: 'Comptabilité',
    items: [
      { label: 'Paiements', icon: Wallet, path: '/paiements', moduleKey: 'payments', permModule: 'paiements' },
      { label: 'Frais scolaires', icon: Receipt, path: '/frais', moduleKey: 'fees', permModule: 'comptabilite' },
      { label: 'Dépenses', icon: PiggyBank, path: '/depenses', moduleKey: 'expenses', permModule: 'depenses' },
      { label: 'Caisse', icon: Banknote, path: '/caisse', moduleKey: 'cashbox', permModule: 'caisse' },
    ],
  },
  {
    title: 'Ressources Humaines',
    items: [
      { label: 'Enseignants', icon: Users, path: '/enseignants', moduleKey: 'teachers', permModule: 'enseignants' },
      { label: 'Personnel', icon: UserCog, path: '/personnel', moduleKey: 'staff', permModule: 'personnel' },
      { label: 'Présences', icon: Clock, path: '/presences', moduleKey: 'attendance_hr', permModule: 'presences' },
      { label: 'Congés', icon: CalendarOff, path: '/conges', moduleKey: 'leaves', permModule: 'conges' },
      { label: 'Salaires', icon: Banknote, path: '/salaires', moduleKey: 'payroll', permModule: 'salaires' },
      { label: 'Contrats', icon: FileCheck, path: '/contrats', moduleKey: 'staff', permModule: 'contrats' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Messages contact', icon: MessageSquare, path: '/messages-contact', moduleKey: 'settings', adminOnly: true },
      { label: 'Paramètres', icon: Settings, path: '/parametres', moduleKey: 'settings', permModule: 'configuration' },
    ],
  },
]

const Sidebar = () => {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebarCollapse, sidebarOpen, setSidebarOpen } = useUIStore()
  
  // ✅ Utiliser useModules pour filtrer selon les feature flags
  const { isEnabled, isLoaded, isSuperAdmin } = useModules()

  const handleLogout = () => {
    logout()
  }

  const userHasPermission = (permModule: string): boolean => {
    if (!user?.permissions || !Array.isArray(user.permissions)) return true
    return user.permissions.some(p => p.module === permModule && p.actions.includes('read'))
  }

  const filteredNavigation = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.adminOnly && !isSuperAdmin && user?.role !== 'admin' && user?.role !== 'super_admin') return false
        if (isSuperAdmin) return true
        // Vérifier le feature flag école
        if (item.moduleKey && !isEnabled(item.moduleKey)) return false
        // Vérifier la permission utilisateur
        if (item.permModule && !userHasPermission(item.permModule)) return false
        return true
      }),
    }))
    .filter((section) => section.items.length > 0)

  // Loader pendant le chargement des modules
  if (!isLoaded) {
    return (
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-white dark:bg-surface-900',
          'border-r border-surface-200 dark:border-surface-800',
          'w-72 flex items-center justify-center'
        )}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </aside>
    )
  }

  return (
    <>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-white dark:bg-surface-900',
          'border-r border-surface-200 dark:border-surface-800',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          sidebarCollapsed ? 'w-20' : 'w-72',
          // Mobile: hors écran par défaut
          'transform lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-surface-200 dark:border-surface-800">
          <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center w-full')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-heading font-bold text-lg text-surface-900 dark:text-white">
                  SGS
                </h1>
                <p className="text-xs text-surface-500">Gestion Scolaire</p>
              </div>
            )}
          </div>
          
          {/* Toggle collapse - desktop only */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <ChevronLeft
              className={cn(
                'h-5 w-5 text-surface-500 transition-transform',
                sidebarCollapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
          {filteredNavigation.map((section) => (
            <div key={section.title} className="mb-6">
              {!sidebarCollapsed && (
                <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
                  {section.title}
                </h2>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname.startsWith(item.path)

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                          'transition-all duration-200',
                          'group',
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100',
                          sidebarCollapsed && 'justify-center'
                        )}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5 flex-shrink-0',
                            isActive
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300'
                          )}
                        />
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-surface-200 dark:border-surface-800">
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800',
              sidebarCollapsed && 'justify-center'
            )}
          >
            <Avatar
              nom={user?.nom}
              prenom={user?.prenom}
              size="sm"
            />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs text-surface-500 capitalize truncate">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full mt-2 px-3 py-2.5 rounded-lg',
              'text-red-600 dark:text-red-400',
              'hover:bg-red-50 dark:hover:bg-red-900/20',
              'transition-colors',
              sidebarCollapsed && 'justify-center'
            )}
            title={sidebarCollapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export { Sidebar }
