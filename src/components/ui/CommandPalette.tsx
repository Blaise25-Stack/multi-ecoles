/**
 * ============================================
 * Command Palette - Recherche Globale (⌘K)
 * ============================================
 * Composant de recherche rapide accessible via ⌘K / Ctrl+K
 */

import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  Users,
  GraduationCap,
  Wallet,
  Settings,
  Building2,
  FileText,
  Calendar,
  X,
  ArrowRight,
  Command,
  CornerDownLeft,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/stores/authStore'

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: string
  keywords?: string[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Définir les commandes disponibles
  const commands: CommandItem[] = [
    // Navigation principale
    {
      id: 'dashboard',
      title: 'Tableau de bord',
      description: 'Vue d\'ensemble',
      icon: LayoutDashboard,
      action: () => navigate('/dashboard'),
      category: 'Navigation',
      keywords: ['accueil', 'home', 'stats'],
    },
    {
      id: 'eleves',
      title: 'Liste des élèves',
      description: 'Gérer les élèves',
      icon: GraduationCap,
      action: () => navigate('/eleves'),
      category: 'Navigation',
      keywords: ['students', 'étudiants'],
    },
    {
      id: 'eleves-new',
      title: 'Nouvel élève',
      description: 'Créer un nouvel élève',
      icon: GraduationCap,
      action: () => navigate('/eleves/nouveau'),
      category: 'Actions rapides',
      keywords: ['create', 'ajouter'],
    },
    {
      id: 'inscriptions',
      title: 'Inscriptions',
      description: 'Gérer les inscriptions',
      icon: FileText,
      action: () => navigate('/inscriptions'),
      category: 'Navigation',
      keywords: ['enrollment'],
    },
    {
      id: 'classes',
      title: 'Classes',
      description: 'Gérer les classes',
      icon: Building2,
      action: () => navigate('/classes'),
      category: 'Navigation',
      keywords: ['classroom', 'salle'],
    },
    {
      id: 'paiements',
      title: 'Paiements',
      description: 'Gérer les paiements',
      icon: Wallet,
      action: () => navigate('/paiements'),
      category: 'Comptabilité',
      keywords: ['payment', 'argent', 'frais'],
    },
    {
      id: 'enseignants',
      title: 'Enseignants',
      description: 'Gérer les enseignants',
      icon: Users,
      action: () => navigate('/enseignants'),
      category: 'RH',
      keywords: ['teachers', 'profs'],
    },
    {
      id: 'emploi-temps',
      title: 'Emploi du temps',
      description: 'Voir les plannings',
      icon: Calendar,
      action: () => navigate('/emploi-du-temps'),
      category: 'Navigation',
      keywords: ['schedule', 'planning'],
    },
    {
      id: 'parametres',
      title: 'Paramètres',
      description: 'Configuration du système',
      icon: Settings,
      action: () => navigate('/parametres'),
      category: 'Configuration',
      keywords: ['settings', 'config'],
    },
  ]

  // Ajouter les commandes SuperAdmin si applicable
  if (user?.role === 'super_admin') {
    commands.push(
      {
        id: 'superadmin',
        title: 'Console SuperAdmin',
        description: 'Gestion de la plateforme',
        icon: Building2,
        action: () => navigate('/superadmin'),
        category: 'SuperAdmin',
        keywords: ['admin', 'platform'],
      },
      {
        id: 'schools',
        title: 'Gérer les écoles',
        description: 'CRUD des écoles',
        icon: Building2,
        action: () => navigate('/superadmin/schools'),
        category: 'SuperAdmin',
        keywords: ['schools', 'établissements'],
      }
    )
  }

  // Filtrer les commandes selon la recherche
  const filteredCommands = commands.filter((cmd) => {
    if (!query) return true
    const searchLower = query.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower)) ||
      cmd.category.toLowerCase().includes(searchLower)
    )
  })

  // Grouper par catégorie
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  // Focus sur l'input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Navigation clavier
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault()
        filteredCommands[selectedIndex].action()
        onClose()
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [filteredCommands, selectedIndex, onClose]
  )

  // Scroll vers l'élément sélectionné
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    selectedEl?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex items-start justify-center pt-[15vh] px-4">
        <div className="w-full max-w-xl bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-surface-200 dark:border-surface-700">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-200 dark:border-surface-700">
            <Search className="h-5 w-5 text-surface-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher une page, action..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none text-lg"
            />
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium text-surface-500 bg-surface-100 dark:bg-surface-700 rounded-lg">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                <p className="text-surface-500">Aucun résultat pour "{query}"</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category}>
                  <div className="px-4 py-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                    {category}
                  </div>
                  {items.map((item) => {
                    const globalIndex = filteredCommands.indexOf(item)
                    const Icon = item.icon
                    const isSelected = globalIndex === selectedIndex

                    return (
                      <button
                        key={item.id}
                        data-index={globalIndex}
                        onClick={() => {
                          item.action()
                          onClose()
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          'w-full flex items-center gap-4 px-4 py-3 text-left transition-colors',
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/30'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
                        )}
                      >
                        <div
                          className={cn(
                            'p-2 rounded-xl transition-colors',
                            isSelected
                              ? 'bg-primary-100 dark:bg-primary-900/50'
                              : 'bg-surface-100 dark:bg-surface-700'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5',
                              isSelected
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-surface-500'
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'font-medium truncate',
                              isSelected
                                ? 'text-primary-700 dark:text-primary-300'
                                : 'text-surface-900 dark:text-white'
                            )}
                          >
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-sm text-surface-500 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                            <CornerDownLeft className="h-4 w-4" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
            <div className="flex items-center justify-between text-xs text-surface-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface-200 dark:bg-surface-700 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-surface-200 dark:bg-surface-700 rounded">↓</kbd>
                  <span className="ml-1">naviguer</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface-200 dark:bg-surface-700 rounded">↵</kbd>
                  <span className="ml-1">sélectionner</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Command className="h-3 w-3" />
                <span>K pour ouvrir</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook pour gérer l'ouverture du CommandPalette avec ⌘K
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  }
}

export { CommandPalette }



