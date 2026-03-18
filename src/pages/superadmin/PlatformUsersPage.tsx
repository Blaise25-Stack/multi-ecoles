/**
 * ============================================
 * Platform Users Page - Gestion Globale Users
 * ============================================
 * Gestion multi-tenant de tous les utilisateurs
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  X,
  Shield,
  Building2,
  LogOut,
  Filter,
  UserCheck,
  UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'

interface PlatformUser {
  id: number
  email: string
  nom: string
  prenom: string
  telephone?: string
  roleId: number
  roleCode: string
  roleLibelle: string
  isActive: boolean
  schoolId?: number
  schoolName?: string
  schoolCode?: string
  lastLogin?: string
  createdAt: string
}

interface CreateUserData {
  email: string
  password: string
  nom: string
  prenom: string
  telephone?: string
  roleId: number
  schoolId?: number
}

const allRoles = [
  { id: 1, code: 'superadmin', label: 'Super Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { id: 2, code: 'admin', label: 'Administrateur', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { id: 3, code: 'comptable', label: 'Comptable', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { id: 4, code: 'rh', label: 'Ressources Humaines', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 5, code: 'enseignant', label: 'Enseignant', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { id: 6, code: 'parent', label: 'Parent', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
]

interface SchoolOption {
  id: number
  code: string
  name: string
}

interface UserModalProps {
  user?: PlatformUser | null
  schools: SchoolOption[]
  onClose: () => void
  onSave: () => void
}

const UserModal = ({ user, schools, onClose, onSave }: UserModalProps) => {
  const { addToast } = useUIStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateUserData>({
    email: user?.email || '',
    password: '',
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    telephone: user?.telephone || '',
    roleId: user?.roleId || 2,
    schoolId: user?.schoolId,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.email.trim()) newErrors.email = 'Email requis'
    if (!user && !formData.password) newErrors.password = 'Mot de passe requis'
    if (!user && formData.password.length < 6) newErrors.password = 'Min 6 caractères'
    if (!formData.nom.trim()) newErrors.nom = 'Nom requis'
    if (!formData.prenom.trim()) newErrors.prenom = 'Prénom requis'
    if (formData.roleId !== 1 && !formData.schoolId) newErrors.schoolId = 'École requise'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      if (user) {
        await api.put(`/utilisateurs/${user.id}`, {
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          roleId: formData.roleId,
          schoolId: formData.schoolId,
        })
        addToast({ type: 'success', title: 'Succès', message: 'Utilisateur mis à jour' })
      } else {
        await api.post('/utilisateurs', formData)
        addToast({ type: 'success', title: 'Succès', message: 'Utilisateur créé' })
      }
      onSave()
      onClose()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.response?.data?.message || 'Erreur lors de l\'opération',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-surface-700">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">
            {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700">
            <X className="h-5 w-5 text-surface-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Prénom *
              </label>
              <Input
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                error={errors.prenom}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Nom *
              </label>
              <Input
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                error={errors.nom}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              disabled={!!user}
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Mot de passe *
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                placeholder="Min 6 caractères"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Téléphone
            </label>
            <Input
              value={formData.telephone || ''}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder="+243..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Rôle *
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
              >
                {allRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                École {formData.roleId !== 1 ? '*' : ''}
              </label>
              <select
                value={formData.schoolId || ''}
                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                disabled={formData.roleId === 1}
              >
                <option value="">-- Aucune --</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.schoolId && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.schoolId}</p>
              )}
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-surface-700">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {user ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const PlatformUsersPage = () => {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const { logout } = useAuthStore()

  const [users, setUsers] = useState<PlatformUser[]>([])
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('')
  const [filterSchool, setFilterSchool] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        api.get('/utilisateurs'),
        api.get('/schools'),
      ])
      setUsers(usersRes.data.data || [])
      setSchools(
        (schoolsRes.data.data || []).map((s: any) => ({ id: s.id, code: s.code, name: s.name }))
      )
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.response?.data?.message || 'Impossible de charger les données',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleUserActive = async (user: PlatformUser) => {
    try {
      await api.put(`/utilisateurs/${user.id}`, { isActive: !user.isActive })
      addToast({
        type: 'success',
        title: 'Succès',
        message: `Utilisateur ${user.isActive ? 'désactivé' : 'activé'}`,
      })
      loadData()
    } catch {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la mise à jour' })
    }
  }

  const resetPassword = async (user: PlatformUser) => {
    const newPassword = prompt('Nouveau mot de passe (min 6 caractères):')
    if (!newPassword || newPassword.length < 6) {
      addToast({ type: 'error', title: 'Erreur', message: 'Mot de passe invalide (min 6 caractères)' })
      return
    }
    try {
      await api.post(`/utilisateurs/${user.id}/reset-password`, { password: newPassword })
      addToast({ type: 'success', title: 'Succès', message: 'Mot de passe réinitialisé' })
    } catch {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la réinitialisation' })
    }
  }

  const deleteUser = async (user: PlatformUser) => {
    if (!confirm(`Supprimer ${user.prenom} ${user.nom} ?`)) return
    try {
      await api.delete(`/utilisateurs/${user.id}`)
      addToast({ type: 'success', title: 'Succès', message: 'Utilisateur supprimé' })
      loadData()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.response?.data?.message || 'Erreur lors de la suppression',
      })
    }
  }

  const getRoleColor = (roleCode: string) => {
    return allRoles.find((r) => r.code === roleCode)?.color || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !searchQuery ||
      u.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchRole = !filterRole || u.roleCode === filterRole
    const matchSchool = !filterSchool || String(u.schoolId) === filterSchool
    const matchStatus =
      !filterStatus ||
      (filterStatus === 'active' && u.isActive) ||
      (filterStatus === 'inactive' && !u.isActive)
    return matchSearch && matchRole && matchSchool && matchStatus
  })

  const activeCount = users.filter((u) => u.isActive).length
  const inactiveCount = users.length - activeCount

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
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
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="font-semibold text-surface-900 dark:text-white">
                    Utilisateurs Plateforme
                  </h1>
                  <p className="text-xs text-surface-500">
                    {users.length} utilisateur{users.length > 1 ? 's' : ''} au total
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreateModal(true)}
              >
                Nouvel utilisateur
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
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{users.length}</p>
                <p className="text-sm text-surface-500">Total</p>
              </div>
              <Users className="h-8 w-8 text-primary-400 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</p>
                <p className="text-sm text-surface-500">Actifs</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-surface-500">{inactiveCount}</p>
                <p className="text-sm text-surface-500">Inactifs</p>
              </div>
              <UserX className="h-8 w-8 text-surface-300 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-gray-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{schools.length}</p>
                <p className="text-sm text-surface-500">Écoles</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-surface-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Filtres</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-surface-400" />}
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white text-sm"
            >
              <option value="">Tous les rôles</option>
              {allRoles.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white text-sm"
            >
              <option value="">Toutes les écoles</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-surface-500">
            {filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-surface-700/50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">
                    Utilisateur
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">
                    Rôle
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 uppercase">
                    École
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-surface-500 uppercase">
                    Statut
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-surface-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                            {user.prenom[0]}{user.nom[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-surface-900 dark:text-white truncate">
                            {user.prenom} {user.nom}
                          </p>
                          <p className="text-sm text-surface-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.roleCode)}`}>
                        <Shield className="h-3 w-3" />
                        {user.roleLibelle}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.schoolName ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-surface-400" />
                          <span className="text-sm text-surface-700 dark:text-surface-300">
                            {user.schoolName}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="default" size="sm">Plateforme</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleUserActive(user)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => resetPassword(user)}>
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUser(user)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
              <p className="text-surface-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          schools={schools}
          onClose={() => {
            setShowCreateModal(false)
            setEditingUser(null)
          }}
          onSave={loadData}
        />
      )}
    </div>
  )
}

export { PlatformUsersPage }
