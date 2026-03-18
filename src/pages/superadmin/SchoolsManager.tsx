/**
 * ============================================
 * Schools Manager - CRUD Écoles SuperAdmin
 * ============================================
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Settings,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
  X,
  Check,
  AlertTriangle,
  ArrowLeft,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { schoolsService, type SchoolWithStats, type CreateSchoolData } from '@/services/schoolsService'

// Modal de création/édition
interface SchoolModalProps {
  school?: SchoolWithStats | null
  onClose: () => void
  onSave: (data: CreateSchoolData) => Promise<void>
  isLoading: boolean
}

const SchoolModal = ({ school, onClose, onSave, isLoading }: SchoolModalProps) => {
  const [formData, setFormData] = useState<CreateSchoolData>({
    code: school?.code || '',
    name: school?.name || '',
    currency: school?.currency || 'FC',
    whatsappNumber: school?.whatsappNumber || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.code.trim()) newErrors.code = 'Code requis'
    if (formData.code.length > 50) newErrors.code = 'Code trop long (max 50)'
    if (!formData.name.trim()) newErrors.name = 'Nom requis'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-surface-700">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">
            {school ? 'Modifier l\'école' : 'Nouvelle école'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700"
          >
            <X className="h-5 w-5 text-surface-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Code *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="ECO001"
              error={errors.code}
              disabled={!!school} // Code non modifiable après création
            />
            <p className="text-xs text-surface-500 mt-1">
              Identifiant unique de l'école (non modifiable)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Nom de l'école *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Lycée Moderne de Kinshasa"
              error={errors.name}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Devise
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
              >
                <option value="FC">FC (Franc Congolais)</option>
                <option value="USD">USD (Dollar US)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                WhatsApp
              </label>
              <Input
                value={formData.whatsappNumber || ''}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="+243..."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-surface-700">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {school ? 'Enregistrer' : 'Créer l\'école'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Modal de confirmation suppression
interface DeleteModalProps {
  school: SchoolWithStats
  onClose: () => void
  onConfirm: () => Promise<void>
  isLoading: boolean
}

const DeleteModal = ({ school, onClose, onConfirm, isLoading }: DeleteModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
      <div className="p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
          Supprimer l'école ?
        </h2>
        <p className="text-surface-500 dark:text-surface-400 mb-4">
          Êtes-vous sûr de vouloir supprimer <strong>{school.name}</strong> ?
          Cette action est irréversible.
        </p>
        {(school.usersCount > 0 || school.studentsCount > 0) && (
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm p-3 rounded-lg mb-4">
            ⚠️ Cette école contient {school.usersCount} utilisateurs et {school.studentsCount} élèves.
            Vous devez d'abord les supprimer ou les transférer.
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-surface-700">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Annuler
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          isLoading={isLoading}
          disabled={school.usersCount > 0 || school.studentsCount > 0}
        >
          Supprimer
        </Button>
      </div>
    </div>
  </div>
)

const SchoolsManager = () => {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const { logout } = useAuthStore()

  const [schools, setSchools] = useState<SchoolWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSchool, setEditingSchool] = useState<SchoolWithStats | null>(null)
  const [deletingSchool, setDeletingSchool] = useState<SchoolWithStats | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Charger les écoles
  const loadSchools = async () => {
    setIsLoading(true)
    try {
      const data = await schoolsService.getAll()
      setSchools(data)
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.message || 'Impossible de charger les écoles',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSchools()
  }, [])

  // Créer une école
  const handleCreate = async (data: CreateSchoolData) => {
    setIsSaving(true)
    try {
      await schoolsService.create(data)
      addToast({
        type: 'success',
        title: 'Succès',
        message: `École "${data.name}" créée avec succès`,
      })
      setShowCreateModal(false)
      loadSchools()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.response?.data?.message || 'Erreur lors de la création',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Modifier une école
  const handleUpdate = async (data: CreateSchoolData) => {
    if (!editingSchool) return
    setIsSaving(true)
    try {
      await schoolsService.update(editingSchool.id, {
        name: data.name,
        currency: data.currency,
        whatsappNumber: data.whatsappNumber,
      })
      addToast({
        type: 'success',
        title: 'Succès',
        message: 'École mise à jour',
      })
      setEditingSchool(null)
      loadSchools()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.response?.data?.message || 'Erreur lors de la mise à jour',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Supprimer une école
  const handleDelete = async () => {
    if (!deletingSchool) return
    setIsSaving(true)
    try {
      await schoolsService.delete(deletingSchool.id)
      addToast({
        type: 'success',
        title: 'Succès',
        message: 'École supprimée',
      })
      setDeletingSchool(null)
      loadSchools()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.response?.data?.message || 'Erreur lors de la suppression',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle actif/inactif
  const handleToggleActive = async (school: SchoolWithStats) => {
    try {
      await schoolsService.toggleActive(school.id, !school.isActive)
      addToast({
        type: 'success',
        title: 'Succès',
        message: `École ${school.isActive ? 'désactivée' : 'activée'}`,
      })
      loadSchools()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.response?.data?.message || 'Erreur',
      })
    }
  }

  // Filtrer les écoles
  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <div>
                <h1 className="font-semibold text-surface-900 dark:text-white">
                  Gestion des écoles
                </h1>
                <p className="text-xs text-surface-500">
                  {schools.length} école{schools.length > 1 ? 's' : ''} inscrite{schools.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreateModal(true)}
              >
                Nouvelle école
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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6 max-w-md">
          <Input
            placeholder="Rechercher une école..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-surface-400" />}
          />
        </div>

        {/* Schools Table */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-surface-700/50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  École
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  Utilisateurs
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  Élèves
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-surface-700">
              {filteredSchools.map((school) => (
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
                        <p className="font-medium text-surface-900 dark:text-white">
                          {school.name}
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-400 font-mono">
                          {school.code} · {school.currency}
                        </p>
                      </div>
                    </div>
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
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(school)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        school.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {school.isActive ? (
                        <>
                          <ToggleRight className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/superadmin/schools/${school.id}/users`)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/superadmin/schools/${school.id}/modules`)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSchool(school)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingSchool(school)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        disabled={school.code === 'DEFAULT'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSchools.length === 0 && (
            <div className="p-12 text-center">
              <Building2 className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
              <p className="text-surface-500 dark:text-surface-400">
                {searchQuery ? 'Aucune école trouvée' : 'Aucune école créée'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <SchoolModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
          isLoading={isSaving}
        />
      )}

      {editingSchool && (
        <SchoolModal
          school={editingSchool}
          onClose={() => setEditingSchool(null)}
          onSave={handleUpdate}
          isLoading={isSaving}
        />
      )}

      {deletingSchool && (
        <DeleteModal
          school={deletingSchool}
          onClose={() => setDeletingSchool(null)}
          onConfirm={handleDelete}
          isLoading={isSaving}
        />
      )}
    </div>
  )
}

export { SchoolsManager }

