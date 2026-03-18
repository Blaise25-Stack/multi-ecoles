import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  User,
  Phone,
  CheckCircle,
  XCircle,
  Key,
  UserCog,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Wallet,
  Users,
  Settings,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
  TableEmpty,
  TableSkeleton,
} from '@/components/ui/Table'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useAuthStore, roleLabels, getRolePermissions } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'
import { api } from '@/services/api'
import type { UserRole, Permission } from '@/types'

interface ModuleItem {
  id: string
  nom: string
  actions: string[]
}

interface ModuleCategory {
  id: string
  nom: string
  icon: React.ElementType
  modules: ModuleItem[]
}

const modulesGroupes: ModuleCategory[] = [
  {
    id: 'principal',
    nom: 'Principal',
    icon: Settings,
    modules: [
      { id: 'dashboard', nom: 'Tableau de bord', actions: ['read'] },
    ],
  },
  {
    id: 'gestion_scolaire',
    nom: 'Gestion Scolaire',
    icon: GraduationCap,
    modules: [
      { id: 'eleves', nom: 'Élèves', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'inscriptions', nom: 'Inscriptions', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'classes', nom: 'Classes', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'matieres', nom: 'Matières', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'notes', nom: 'Notes & Bulletins', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'resultats', nom: 'Résultats', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'emploi_temps', nom: 'Emploi du temps', actions: ['create', 'read', 'update', 'delete'] },
    ],
  },
  {
    id: 'comptabilite',
    nom: 'Comptabilité',
    icon: Wallet,
    modules: [
      { id: 'paiements', nom: 'Paiements', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'comptabilite', nom: 'Frais scolaires', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'depenses', nom: 'Dépenses', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'caisse', nom: 'Caisse', actions: ['create', 'read', 'update', 'delete'] },
    ],
  },
  {
    id: 'ressources_humaines',
    nom: 'Ressources Humaines',
    icon: Users,
    modules: [
      { id: 'enseignants', nom: 'Enseignants', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'personnel', nom: 'Personnel', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'presences', nom: 'Présences', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'conges', nom: 'Congés', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'salaires', nom: 'Salaires', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'contrats', nom: 'Contrats', actions: ['create', 'read', 'update', 'delete'] },
    ],
  },
  {
    id: 'configuration',
    nom: 'Configuration',
    icon: Settings,
    modules: [
      { id: 'configuration', nom: 'Paramètres', actions: ['create', 'read', 'update', 'delete'] },
      { id: 'utilisateurs', nom: 'Utilisateurs', actions: ['create', 'read', 'update', 'delete'] },
    ],
  },
]

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  comptable: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rh: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  enseignant: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  parent: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  eleve: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const UtilisateursPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: '' as UserRole | '',
    password: '',
  })
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([])
  const [resetToDefaults, setResetToDefaults] = useState(false)

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['utilisateurs', searchQuery, roleFilter],
    queryFn: async () => {
      const params: any = { limit: 100 }
      if (searchQuery) params.search = searchQuery
      if (roleFilter) params.role = roleFilter
      const res = await api.get<any>('/utilisateurs', { params })
      return res.data?.data || res.data || []
    },
  })

  const utilisateurs: any[] = usersData || []

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!formData.nom || !formData.prenom || !formData.email || !formData.role || !formData.password) {
        throw new Error('Champs requis manquants')
      }
      return api.post('/utilisateurs', {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone || null,
        role: formData.role,
        password: formData.password,
        permissions: selectedPermissions,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
      addToast({ type: 'success', title: 'Succès', message: 'Utilisateur créé avec succès' })
      setShowNewModal(false)
      resetForm()
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Erreur', message: err?.response?.data?.message || 'Impossible de créer l\'utilisateur' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error('Aucun utilisateur sélectionné')
      return api.put(`/utilisateurs/${selectedUser.id}`, {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone || null,
        role: formData.role,
        password: formData.password || undefined,
        permissions: selectedPermissions,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
      addToast({ type: 'success', title: 'Succès', message: 'Utilisateur modifié avec succès' })
      setShowEditModal(false)
      resetForm()
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Erreur', message: err?.response?.data?.message || 'Impossible de modifier l\'utilisateur' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error('Aucun utilisateur sélectionné')
      return api.delete(`/utilisateurs/${selectedUser.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
      addToast({ type: 'success', title: 'Succès', message: 'Utilisateur supprimé' })
      setShowDeleteModal(false)
      setSelectedUser(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'utilisateur' })
    },
  })

  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error('Aucun utilisateur sélectionné')
      if (resetToDefaults) {
        return api.put(`/utilisateurs/${selectedUser.id}`, { resetPermissions: true })
      }
      return api.put(`/utilisateurs/${selectedUser.id}`, { permissions: selectedPermissions })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
      addToast({ type: 'success', title: 'Succès', message: 'Permissions mises à jour' })
      setResetToDefaults(false)
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Erreur', message: err?.response?.data?.message || 'Impossible de sauvegarder les permissions' })
      setResetToDefaults(false)
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async (user: any) => {
      return api.put(`/utilisateurs/${user.id}`, { is_active: !user.is_active })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
      addToast({ type: 'success', title: 'Succès', message: 'Statut modifié' })
    },
  })

  const resetForm = () => {
    setFormData({ nom: '', prenom: '', email: '', telephone: '', role: '', password: '' })
    setSelectedPermissions([])
    setSelectedUser(null)
  }

  const handleCreate = () => {
    resetForm()
    setExpandedCategories([])
    setShowNewModal(true)
  }

  const handleEdit = async (user: any) => {
    setSelectedUser(user)
    setFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone || '',
      role: user.role,
      password: '',
    })
    setExpandedCategories([])
    setShowEditModal(true)
    try {
      const res = await api.get<any>(`/utilisateurs/${user.id}`)
      const userData = res.data?.data || res.data
      if (userData?.permissions && Array.isArray(userData.permissions)) {
        setSelectedPermissions(userData.permissions)
      } else {
        setSelectedPermissions(getRolePermissions(user.role))
      }
    } catch {
      setSelectedPermissions(getRolePermissions(user.role))
    }
  }

  const handleDelete = (user: any) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleEditPermissions = async (user: any) => {
    setSelectedUser(user)
    setExpandedCategories([])
    setResetToDefaults(false)
    setShowPermissionsModal(true)
    try {
      const res = await api.get<any>(`/utilisateurs/${user.id}`)
      const userData = res.data?.data || res.data
      if (userData?.permissions && Array.isArray(userData.permissions)) {
        setSelectedPermissions(userData.permissions)
      } else {
        setSelectedPermissions(getRolePermissions(user.role))
      }
    } catch {
      setSelectedPermissions(getRolePermissions(user.role))
    }
  }

  const handleRoleChange = (role: UserRole) => {
    setFormData({ ...formData, role })
    setSelectedPermissions(getRolePermissions(role))
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    )
  }

  const getCategoryPermissionCount = (category: ModuleCategory) => {
    return category.modules.reduce((count, module) => {
      const perm = selectedPermissions.find(p => p.module === module.id)
      return count + (perm?.actions.length || 0)
    }, 0)
  }

  const toggleAllCategoryPermissions = (category: ModuleCategory) => {
    const totalPossible = category.modules.reduce((sum, m) => sum + m.actions.length, 0)
    const currentCount = getCategoryPermissionCount(category)
    if (currentCount === totalPossible) {
      setSelectedPermissions(prev => prev.filter(p => !category.modules.some(m => m.id === p.module)))
    } else {
      setSelectedPermissions(prev => {
        const filtered = prev.filter(p => !category.modules.some(m => m.id === p.module))
        const newPerms = category.modules.map(m => ({ module: m.id, actions: m.actions as any[] }))
        return [...filtered, ...newPerms]
      })
    }
  }

  const toggleModulePermission = (moduleId: string, action: string) => {
    setSelectedPermissions(prev => {
      const idx = prev.findIndex(p => p.module === moduleId)
      if (idx === -1) return [...prev, { module: moduleId, actions: [action as any] }]
      const mod = prev[idx]
      const has = mod.actions.includes(action as any)
      if (has) {
        const newActions = mod.actions.filter(a => a !== action)
        if (newActions.length === 0) return prev.filter((_, i) => i !== idx)
        return prev.map((p, i) => i === idx ? { ...p, actions: newActions } : p)
      }
      return prev.map((p, i) => i === idx ? { ...p, actions: [...p.actions, action as any] } : p)
    })
  }

  const hasPermission = (moduleId: string, action: string) => {
    return selectedPermissions.find(p => p.module === moduleId)?.actions.includes(action as any) || false
  }

  const toggleAllModuleActions = (moduleId: string, actions: string[]) => {
    const mod = selectedPermissions.find(p => p.module === moduleId)
    if (mod?.actions.length === actions.length) {
      setSelectedPermissions(prev => prev.filter(p => p.module !== moduleId))
    } else {
      setSelectedPermissions(prev => {
        const filtered = prev.filter(p => p.module !== moduleId)
        return [...filtered, { module: moduleId, actions: actions as any[] }]
      })
    }
  }

  const stats = {
    total: utilisateurs.length,
    actifs: utilisateurs.filter((u: any) => u.is_active !== false).length,
    admins: utilisateurs.filter((u: any) => u.role === 'super_admin' || u.role === 'admin').length,
    enseignants: utilisateurs.filter((u: any) => u.role === 'enseignant').length,
  }

  const renderPermissionsAccordion = () => (
    <div className="max-h-96 overflow-y-auto space-y-2">
      {modulesGroupes.map(category => {
        const CategoryIcon = category.icon
        const isExpanded = expandedCategories.includes(category.id)
        const permCount = getCategoryPermissionCount(category)
        const totalActions = category.modules.reduce((sum, m) => sum + m.actions.length, 0)
        const allChecked = permCount === totalActions

        return (
          <div key={category.id} className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
            <div
              className={cn('flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-800', isExpanded && 'bg-surface-50 dark:bg-surface-800')}
              onClick={() => toggleCategory(category.id)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="h-5 w-5 text-surface-500" /> : <ChevronRight className="h-5 w-5 text-surface-500" />}
                <CategoryIcon className="h-5 w-5 text-primary-600" />
                <span className="font-semibold">{category.nom}</span>
                {permCount > 0 && <Badge variant="primary" size="sm">{permCount}/{totalActions}</Badge>}
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-surface-500">Tout</span>
                <input type="checkbox" checked={allChecked} onChange={() => toggleAllCategoryPermissions(category)} className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
              </div>
            </div>
            {isExpanded && (
              <div className="border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50 dark:bg-surface-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-surface-600 dark:text-surface-400">Menu</th>
                      <th className="px-2 py-2 text-center font-medium text-surface-600 dark:text-surface-400 w-16">Voir</th>
                      <th className="px-2 py-2 text-center font-medium text-surface-600 dark:text-surface-400 w-16">Créer</th>
                      <th className="px-2 py-2 text-center font-medium text-surface-600 dark:text-surface-400 w-16">Modifier</th>
                      <th className="px-2 py-2 text-center font-medium text-surface-600 dark:text-surface-400 w-16">Suppr.</th>
                      <th className="px-2 py-2 text-center font-medium text-surface-600 dark:text-surface-400 w-16">Tout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.modules.map(mod => (
                      <tr key={mod.id} className="border-t border-surface-100 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                        <td className="px-4 py-2.5">{mod.nom}</td>
                        {['read', 'create', 'update', 'delete'].map(action => (
                          <td key={action} className="px-2 py-2.5 text-center">
                            {mod.actions.includes(action) ? (
                              <input type="checkbox" checked={hasPermission(mod.id, action)} onChange={() => toggleModulePermission(mod.id, action)} className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
                            ) : <span className="text-surface-300">-</span>}
                          </td>
                        ))}
                        <td className="px-2 py-2.5 text-center">
                          <input type="checkbox" checked={selectedPermissions.find(p => p.module === mod.id)?.actions.length === mod.actions.length} onChange={() => toggleAllModuleActions(mod.id, mod.actions)} className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">Gestion des utilisateurs</h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">Créez et gérez les comptes utilisateurs et leurs permissions</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreate}>Nouvel utilisateur</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30"><User className="h-6 w-6 text-primary-600 dark:text-primary-400" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-surface-500">Total</p></div></div></Card>
        <Card padding="md"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30"><CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" /></div><div><p className="text-2xl font-bold">{stats.actifs}</p><p className="text-sm text-surface-500">Actifs</p></div></div></Card>
        <Card padding="md"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30"><Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" /></div><div><p className="text-2xl font-bold">{stats.admins}</p><p className="text-sm text-surface-500">Admins</p></div></div></Card>
        <Card padding="md"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/30"><UserCog className="h-6 w-6 text-cyan-600 dark:text-cyan-400" /></div><div><p className="text-2xl font-bold">{stats.enseignants}</p><p className="text-sm text-surface-500">Enseignants</p></div></div></Card>
      </div>

      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input placeholder="Rechercher par nom ou email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <Select
            options={[
              { value: '', label: 'Tous les rôles' },
              { value: 'super_admin', label: 'Super Admin' },
              { value: 'admin', label: 'Administrateur' },
              { value: 'comptable', label: 'Comptable' },
              { value: 'rh', label: 'RH' },
              { value: 'enseignant', label: 'Enseignant' },
              { value: 'parent', label: 'Parent' },
            ]}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full lg:w-48"
          />
        </div>
      </Card>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Utilisateur</TableTh>
              <TableTh>Rôle</TableTh>
              <TableTh>Contact</TableTh>
              <TableTh>Dernière connexion</TableTh>
              <TableTh>Statut</TableTh>
              <TableTh className="w-12"></TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={6} rows={5} />
            ) : utilisateurs.length === 0 ? (
              <TableEmpty colSpan={6} message="Aucun utilisateur trouvé" />
            ) : (
              utilisateurs.map((user: any) => (
                <TableRow key={user.id}>
                  <TableTd>
                    <div className="flex items-center gap-3">
                      <Avatar nom={user.nom} prenom={user.prenom} size="sm" />
                      <div>
                        <p className="font-medium">{user.prenom} {user.nom}</p>
                        <p className="text-xs text-surface-500">{user.email}</p>
                      </div>
                    </div>
                  </TableTd>
                  <TableTd>
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', roleColors[user.role] || roleColors.eleve)}>
                      {roleLabels[user.role as UserRole] || user.role}
                    </span>
                  </TableTd>
                  <TableTd>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3 text-surface-400" />
                      {user.telephone || '-'}
                    </p>
                  </TableTd>
                  <TableTd>
                    {user.last_login || user.lastLogin
                      ? <span className="text-sm">{formatDate(user.last_login || user.lastLogin)}</span>
                      : '-'}
                  </TableTd>
                  <TableTd>
                    <Badge variant={user.is_active !== false ? 'success' : 'error'} dot>
                      {user.is_active !== false ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <Dropdown trigger={<Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>}>
                      <DropdownItem icon={<Edit className="h-4 w-4" />} onClick={() => handleEdit(user)}>Modifier</DropdownItem>
                      <DropdownItem icon={<Key className="h-4 w-4" />} onClick={() => handleEditPermissions(user)}>Gérer permissions</DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        icon={user.is_active !== false ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        onClick={() => toggleStatusMutation.mutate(user)}
                      >
                        {user.is_active !== false ? 'Désactiver' : 'Activer'}
                      </DropdownItem>
                      <DropdownItem icon={<Trash2 className="h-4 w-4" />} danger onClick={() => handleDelete(user)}>Supprimer</DropdownItem>
                    </Dropdown>
                  </TableTd>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Nouveau/Modifier */}
      <Modal
        isOpen={showNewModal || showEditModal}
        onClose={() => { setShowNewModal(false); setShowEditModal(false) }}
        title={showNewModal ? 'Nouvel utilisateur' : `Modifier: ${selectedUser?.prenom} ${selectedUser?.nom}`}
        size="xl"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2"><User className="h-5 w-5" />Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nom *" placeholder="Ex: Kabongo" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
              <Input label="Prénom *" placeholder="Ex: Jean-Pierre" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} />
              <Input label="Email *" type="email" placeholder="email@sgs-rdc.edu" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <Input label="Téléphone" type="tel" placeholder="+243 XX XXX XXXX" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2"><Shield className="h-5 w-5" />Rôle et accès</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Rôle *"
                options={[
                  { value: '', label: 'Sélectionner un rôle' },
                  { value: 'admin', label: 'Administrateur' },
                  { value: 'comptable', label: 'Comptable' },
                  { value: 'rh', label: 'Ressources Humaines' },
                  { value: 'enseignant', label: 'Enseignant' },
                  { value: 'parent', label: 'Parent' },
                ]}
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              />
              {showNewModal && (
                <Input label="Mot de passe *" type="password" placeholder="Minimum 6 caractères" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              )}
            </div>
          </div>

          {formData.role && (
            <div className="space-y-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2"><Key className="h-5 w-5" />Permissions détaillées</h3>
              {renderPermissionsAccordion()}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <Button variant="outline" onClick={() => { setShowNewModal(false); setShowEditModal(false) }}>Annuler</Button>
            <Button
              onClick={() => showNewModal ? createMutation.mutate() : updateMutation.mutate()}
              disabled={!formData.nom || !formData.email || !formData.role || (showNewModal && !formData.password) || createMutation.isPending || updateMutation.isPending}
              leftIcon={(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Enregistrement...' : showNewModal ? 'Créer l\'utilisateur' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Permissions */}
      <Modal isOpen={showPermissionsModal} onClose={() => setShowPermissionsModal(false)} title={`Permissions: ${selectedUser?.prenom} ${selectedUser?.nom}`} size="xl">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <Avatar nom={selectedUser.nom} prenom={selectedUser.prenom} size="lg" />
              <div>
                <p className="font-semibold text-lg">{selectedUser.prenom} {selectedUser.nom}</p>
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', roleColors[selectedUser.role] || '')}>
                  {roleLabels[selectedUser.role as UserRole] || selectedUser.role}
                </span>
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400"><AlertTriangle className="h-4 w-4 inline mr-1" />Modifier les permissions peut affecter l'accès de l'utilisateur.</p>
            </div>
            {renderPermissionsAccordion()}
            <div className="flex justify-between items-center pt-4 border-t border-surface-200 dark:border-surface-700">
              <Button variant="outline" size="sm" onClick={() => {
                setSelectedPermissions(getRolePermissions(selectedUser.role))
                setResetToDefaults(true)
              }}>Réinitialiser</Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowPermissionsModal(false)}>Annuler</Button>
                <Button onClick={() => { savePermissionsMutation.mutate(); setShowPermissionsModal(false) }}>Enregistrer</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Suppression */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirmer la suppression">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">Supprimer définitivement cet utilisateur ?</p>
                <p className="text-sm text-red-700 dark:text-red-300">Cette action est irréversible.</p>
              </div>
            </div>
            <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg flex items-center gap-3">
              <Avatar nom={selectedUser.nom} prenom={selectedUser.prenom} size="md" />
              <div>
                <p className="font-medium">{selectedUser.prenom} {selectedUser.nom}</p>
                <p className="text-sm text-surface-500">{selectedUser.email}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export { UtilisateursPage }
