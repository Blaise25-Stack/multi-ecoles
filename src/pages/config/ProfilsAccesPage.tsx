import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, Users, Lock, Eye, Edit, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

const MODULES = [
  { key: 'eleves', label: 'Élèves' },
  { key: 'inscriptions', label: 'Inscriptions' },
  { key: 'classes', label: 'Classes' },
  { key: 'matieres', label: 'Matières' },
  { key: 'notes', label: 'Notes & Bulletins' },
  { key: 'comptabilite', label: 'Comptabilité' },
  { key: 'rh', label: 'Ressources Humaines' },
  { key: 'presences', label: 'Présences' },
  { key: 'configuration', label: 'Configuration' },
] as const

const ACTIONS = [
  { key: 'create', label: 'Créer', icon: Plus },
  { key: 'read', label: 'Voir', icon: Eye },
  { key: 'update', label: 'Modifier', icon: Edit },
  { key: 'delete', label: 'Supprimer', icon: Trash2 },
] as const

type ModuleKey = typeof MODULES[number]['key']
type ActionKey = typeof ACTIONS[number]['key']

interface Role {
  id: number
  code: string
  libelle: string
  user_count?: number
  permissions?: Array<{ module: string; action: string }>
}

interface PermissionState {
  [roleId: number]: {
    [module: string]: {
      [action: string]: boolean
    }
  }
}

interface AuditEntry {
  id: number
  user_email: string
  action_type: string
  entity_type: string
  description: string
  created_at: string
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  comptable: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rh: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  enseignant: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  parent: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  eleve: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const mockAuditLogs: AuditEntry[] = [
  { id: 1, user_email: 'admin@sgs-rdc.edu', action_type: 'UPDATE', entity_type: 'role_permissions', description: 'Modification permissions rôle "Comptable"', created_at: '2026-03-01T14:30:00Z' },
  { id: 2, user_email: 'admin@sgs-rdc.edu', action_type: 'CREATE', entity_type: 'role', description: 'Création du rôle "Surveillant"', created_at: '2026-02-28T09:15:00Z' },
  { id: 3, user_email: 'admin@sgs-rdc.edu', action_type: 'UPDATE', entity_type: 'role_permissions', description: 'Modification permissions rôle "Enseignant"', created_at: '2026-02-27T16:45:00Z' },
]

function buildPermissionState(roles: Role[]): PermissionState {
  const state: PermissionState = {}
  for (const role of roles) {
    state[role.id] = {}
    for (const mod of MODULES) {
      state[role.id][mod.key] = {}
      for (const act of ACTIONS) {
        const has = role.permissions?.some(
          (p) => p.module === mod.key && p.action === act.key
        )
        state[role.id][mod.key][act.key] = !!has
      }
    }
  }
  return state
}

const ProfilsAccesPage = () => {
  const { addToast } = useUIStore()
  const [expandedRoles, setExpandedRoles] = useState<number[]>([])
  const [permissions, setPermissions] = useState<PermissionState>({})

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ['roles-list'],
    queryFn: async () => {
      const res = await api.get('/utilisateurs/roles/list')
      return res.data?.data ?? res.data ?? []
    },
    select: (data: Role[]) => {
      if (Object.keys(permissions).length === 0 && data.length > 0) {
        setTimeout(() => setPermissions(buildPermissionState(data)), 0)
      }
      return data
    },
  })

  const toggleRole = (roleId: number) => {
    setExpandedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const togglePermission = (roleId: number, module: ModuleKey, action: ActionKey) => {
    setPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [module]: {
          ...prev[roleId]?.[module],
          [action]: !prev[roleId]?.[module]?.[action],
        },
      },
    }))
  }

  const toggleModuleAll = (roleId: number, module: ModuleKey) => {
    const allChecked = ACTIONS.every((a) => permissions[roleId]?.[module]?.[a.key])
    setPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [module]: Object.fromEntries(ACTIONS.map((a) => [a.key, !allChecked])),
      },
    }))
  }

  const toggleActionAll = (roleId: number, action: ActionKey) => {
    const allChecked = MODULES.every((m) => permissions[roleId]?.[m.key]?.[action])
    setPermissions((prev) => {
      const updated = { ...prev[roleId] }
      for (const mod of MODULES) {
        updated[mod.key] = { ...updated[mod.key], [action]: !allChecked }
      }
      return { ...prev, [roleId]: updated }
    })
  }

  const getPermissionCount = (roleId: number): number => {
    const rolePerm = permissions[roleId]
    if (!rolePerm) return 0
    let count = 0
    for (const mod of MODULES) {
      for (const act of ACTIONS) {
        if (rolePerm[mod.key]?.[act.key]) count++
      }
    }
    return count
  }

  const handleSave = () => {
    addToast({
      type: 'info',
      title: 'Information',
      message: 'Fonctionnalité en cours de développement',
    })
  }

  const totalPossible = MODULES.length * ACTIONS.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Profils & Accès
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez les rôles et les permissions d'accès aux modules
          </p>
        </div>
        <Button leftIcon={<Shield className="h-4 w-4" />} onClick={handleSave}>
          Enregistrer les modifications
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{roles.length}</p>
              <p className="text-sm text-surface-500">Rôles définis</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{MODULES.length * ACTIONS.length}</p>
              <p className="text-sm text-surface-500">Permissions possibles</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {roles.reduce((sum, r) => sum + (r.user_count ?? 0), 0)}
              </p>
              <p className="text-sm text-surface-500">Utilisateurs assignés</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Roles Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} padding="md">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/4" />
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
            <p className="text-surface-500 dark:text-surface-400 text-lg font-medium">
              Aucun rôle configuré
            </p>
            <p className="text-surface-400 dark:text-surface-500 text-sm mt-1">
              Les rôles seront chargés depuis le serveur
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => {
            const isExpanded = expandedRoles.includes(role.id)
            const permCount = getPermissionCount(role.id)
            const colorClass = roleColors[role.code] || roleColors.eleve

            return (
              <Card key={role.id} padding="none">
                {/* Role Header */}
                <div
                  className={cn(
                    'flex items-center justify-between px-6 py-4 cursor-pointer transition-colors',
                    'hover:bg-surface-50 dark:hover:bg-surface-800/50',
                    isExpanded && 'border-b border-surface-200 dark:border-surface-700'
                  )}
                  onClick={() => toggleRole(role.id)}
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-surface-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-surface-400" />
                    )}
                    <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700">
                      <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-surface-900 dark:text-white">
                          {role.libelle}
                        </h3>
                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', colorClass)}>
                          {role.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {role.user_count ?? 0} utilisateur{(role.user_count ?? 0) !== 1 ? 's' : ''}
                        </span>
                        <Badge variant={permCount === totalPossible ? 'success' : permCount > 0 ? 'primary' : 'default'} size="sm">
                          {permCount}/{totalPossible} permissions
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions Grid */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-50 dark:bg-surface-800/80">
                          <th className="px-6 py-3 text-left font-medium text-surface-600 dark:text-surface-400 min-w-[180px]">
                            Module
                          </th>
                          {ACTIONS.map((action) => (
                            <th key={action.key} className="px-3 py-3 text-center font-medium text-surface-600 dark:text-surface-400 w-20">
                              <button
                                className="flex flex-col items-center gap-1 mx-auto hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleActionAll(role.id, action.key)
                                }}
                              >
                                <action.icon className="h-3.5 w-3.5" />
                                <span className="text-xs">{action.label}</span>
                              </button>
                            </th>
                          ))}
                          <th className="px-3 py-3 text-center font-medium text-surface-600 dark:text-surface-400 w-16">
                            Tout
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {MODULES.map((mod) => {
                          const allModChecked = ACTIONS.every(
                            (a) => permissions[role.id]?.[mod.key]?.[a.key]
                          )
                          return (
                            <tr
                              key={mod.key}
                              className="border-t border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                            >
                              <td className="px-6 py-3 font-medium text-surface-700 dark:text-surface-300">
                                {mod.label}
                              </td>
                              {ACTIONS.map((action) => (
                                <td key={action.key} className="px-3 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={!!permissions[role.id]?.[mod.key]?.[action.key]}
                                    onChange={() => togglePermission(role.id, mod.key, action.key)}
                                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                  />
                                </td>
                              ))}
                              <td className="px-3 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={allModChecked}
                                  onChange={() => toggleModuleAll(role.id, mod.key)}
                                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Save Button (bottom) */}
      {roles.length > 0 && (
        <div className="flex justify-end">
          <Button leftIcon={<Shield className="h-4 w-4" />} onClick={handleSave}>
            Enregistrer les modifications
          </Button>
        </div>
      )}

      {/* Audit Logs */}
      <Card padding="none">
        <CardHeader className="px-6 pt-6 pb-0 mb-4">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-surface-500" />
            Journal des modifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mockAuditLogs.length === 0 ? (
            <div className="px-6 pb-6 text-center text-surface-400 dark:text-surface-500 py-8">
              Aucun log d'audit disponible
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {mockAuditLogs.map((log) => (
                <div key={log.id} className="px-6 py-3 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        log.action_type === 'CREATE' ? 'success' :
                        log.action_type === 'UPDATE' ? 'info' :
                        log.action_type === 'DELETE' ? 'error' : 'default'
                      }
                      size="sm"
                    >
                      {log.action_type}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                        {log.description}
                      </p>
                      <p className="text-xs text-surface-400 dark:text-surface-500">
                        par {log.user_email}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-surface-400 dark:text-surface-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { ProfilsAccesPage }
