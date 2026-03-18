/**
 * ============================================
 * Header - Barre de navigation supérieure
 * ============================================
 * Avec recherche globale (⌘K), notifications et profil
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Command,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useConfigStore } from '@/stores/configStore'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown'
import { Badge } from '@/components/ui/Badge'
import { CommandPalette, useCommandPalette } from '@/components/ui/CommandPalette'

const Header = () => {
  const navigate = useNavigate()
  const { user, logout, currentSchool } = useAuthStore()
  const { toggleSidebar, theme, setTheme, sidebarCollapsed } = useUIStore()
  const { anneeScolaireActive } = useConfigStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const commandPalette = useCommandPalette()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 z-30 h-16',
          'bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl',
          'border-b border-surface-200/50 dark:border-surface-800/50',
          'transition-all duration-300',
          sidebarCollapsed ? 'left-20' : 'left-0 lg:left-72'
        )}
      >
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all active:scale-95"
            >
              <Menu className="h-5 w-5 text-surface-600 dark:text-surface-400" />
            </button>

            {/* Search button - Opens Command Palette */}
            <button
              onClick={commandPalette.open}
              className={cn(
                'hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl',
                'bg-surface-100/80 dark:bg-surface-800/80',
                'hover:bg-surface-200/80 dark:hover:bg-surface-700/80',
                'border border-surface-200/50 dark:border-surface-700/50',
                'text-surface-500 dark:text-surface-400',
                'transition-all duration-200 group',
                'hover:border-primary-300 dark:hover:border-primary-700',
                'hover:shadow-sm'
              )}
            >
              <Search className="h-4 w-4 group-hover:text-primary-500 transition-colors" />
              <span className="text-sm">Rechercher...</span>
              <kbd className="hidden lg:flex items-center gap-0.5 ml-8 px-2 py-0.5 text-xs font-medium bg-white dark:bg-surface-700 rounded-lg border border-surface-200 dark:border-surface-600 shadow-sm">
                <Command className="h-3 w-3" />
                <span>K</span>
              </kbd>
            </button>

            {/* Mobile search button */}
            <button
              onClick={commandPalette.open}
              className="md:hidden p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all active:scale-95"
            >
              <Search className="h-5 w-5 text-surface-600 dark:text-surface-400" />
            </button>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* École context badge */}
            {currentSchool && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800">
                <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300 max-w-[150px] truncate">
                  {currentSchool.name}
                </span>
              </div>
            )}

            {/* Année scolaire */}
            {anneeScolaireActive && (
              <Badge variant="secondary" className="hidden sm:flex">
                {anneeScolaireActive.libelle}
              </Badge>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                'hover:bg-surface-100 dark:hover:bg-surface-800',
                'active:scale-95',
                'group'
              )}
              title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-surface-600 group-hover:text-primary-600 transition-colors" />
              ) : (
                <Sun className="h-5 w-5 text-surface-400 group-hover:text-amber-400 transition-colors" />
              )}
            </button>

            {/* Notifications */}
            <Dropdown
              trigger={
                <button className={cn(
                  'relative p-2.5 rounded-xl transition-all duration-200',
                  'hover:bg-surface-100 dark:hover:bg-surface-800',
                  'active:scale-95 group'
                )}>
                  <Bell className="h-5 w-5 text-surface-600 dark:text-surface-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-surface-900 animate-pulse" />
                </button>
              }
              align="right"
              className="w-80"
            >
              <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                <h3 className="font-semibold text-surface-900 dark:text-white">
                  Notifications
                </h3>
                <Badge variant="primary" size="sm">3 nouvelles</Badge>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {/* Notification item */}
                <div className="px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 cursor-pointer transition-colors border-l-2 border-transparent hover:border-primary-500">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex-shrink-0">
                      <Bell className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        45 élèves avec paiements en retard
                      </p>
                      <p className="text-xs text-surface-500 mt-1">Il y a 2 heures</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 cursor-pointer transition-colors border-l-2 border-transparent hover:border-primary-500">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
                      <User className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        3 demandes de congé en attente
                      </p>
                      <p className="text-xs text-surface-500 mt-1">Il y a 5 heures</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 cursor-pointer transition-colors border-l-2 border-transparent hover:border-primary-500">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        Bulletins du 1er trimestre générés
                      </p>
                      <p className="text-xs text-surface-500 mt-1">Hier</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50">
                <button className="w-full text-sm text-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors">
                  Voir toutes les notifications
                </button>
              </div>
            </Dropdown>

            {/* User menu */}
            <Dropdown
              trigger={
                <button className={cn(
                  'flex items-center gap-2 p-1.5 pr-3 rounded-xl',
                  'hover:bg-surface-100 dark:hover:bg-surface-800',
                  'transition-all duration-200 active:scale-[0.98]',
                  'border border-transparent hover:border-surface-200 dark:hover:border-surface-700'
                )}>
                  <Avatar
                    nom={user?.nom}
                    prenom={user?.prenom}
                    size="sm"
                  />
                  <div className="hidden lg:block text-left">
                    <span className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                      {user?.prenom}
                    </span>
                    <span className="block text-xs text-surface-500 capitalize">
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-surface-400 hidden lg:block" />
                </button>
              }
              align="right"
            >
              <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                <p className="font-semibold text-surface-900 dark:text-white">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-sm text-surface-500 truncate">{user?.email}</p>
              </div>
              <DropdownItem
                icon={<User className="h-4 w-4" />}
                onClick={() => navigate('/profil')}
              >
                Mon profil
              </DropdownItem>
              <DropdownItem
                icon={<Settings className="h-4 w-4" />}
                onClick={() => navigate('/parametres')}
              >
                Paramètres
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                icon={<LogOut className="h-4 w-4" />}
                onClick={handleLogout}
                danger
              >
                Déconnexion
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPalette.isOpen} 
        onClose={commandPalette.close} 
      />
    </>
  )
}

export { Header }
