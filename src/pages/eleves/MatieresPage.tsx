import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { StatCard } from '@/components/ui/StatCard'
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
import { useToast } from '@/hooks/useToast'
import { api } from '@/services/api'

interface Matiere {
  id: number
  code: string
  libelle: string
  description?: string
  coefficient: number
}

const MatieresPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    libelle: '',
    code: '',
    description: '',
    coefficient: 1,
  })

  // Récupérer les matières depuis l'API
  const { data: matieres, isLoading } = useQuery({
    queryKey: ['matieres', searchQuery],
    queryFn: async () => {
      const response = await api.get<any>('/matieres', { search: searchQuery })
      // L'API peut retourner { data: [...] } ou directement un tableau
      const data = response.data
      if (Array.isArray(data)) return data
      if (data?.data && Array.isArray(data.data)) return data.data
      return []
    },
  })

  // Mutation pour créer une matière
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.post('/matieres', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matieres'] })
      addToast({ type: 'success', title: 'Succès', message: 'Matière créée avec succès' })
      setShowNewModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer la matière' })
    },
  })

  // Mutation pour modifier une matière
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return api.put(`/matieres/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matieres'] })
      addToast({ type: 'success', title: 'Succès', message: 'Matière modifiée avec succès' })
      setShowEditModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de modifier la matière' })
    },
  })

  // Mutation pour supprimer une matière
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/matieres/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matieres'] })
      addToast({ type: 'success', title: 'Succès', message: 'Matière supprimée avec succès' })
      setShowDeleteModal(false)
      setSelectedMatiere(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer la matière' })
    },
  })

  const resetForm = () => {
    setFormData({ libelle: '', code: '', description: '', coefficient: 1 })
    setSelectedMatiere(null)
  }

  const handleEdit = (matiere: Matiere) => {
    setSelectedMatiere(matiere)
    setFormData({
      libelle: matiere.libelle,
      code: matiere.code,
      description: matiere.description || '',
      coefficient: matiere.coefficient,
    })
    setShowEditModal(true)
  }

  const handleDelete = (matiere: Matiere) => {
    setSelectedMatiere(matiere)
    setShowDeleteModal(true)
  }

  const handleNewMatiere = () => {
    resetForm()
    setShowNewModal(true)
  }

  const handleSubmitNew = () => {
    if (!formData.libelle || !formData.code) return
    createMutation.mutate(formData)
  }

  const handleSubmitEdit = () => {
    if (!selectedMatiere || !formData.libelle || !formData.code) return
    updateMutation.mutate({ id: selectedMatiere.id, data: formData })
  }

  const handleConfirmDelete = () => {
    if (!selectedMatiere) return
    deleteMutation.mutate(selectedMatiere.id)
  }

  const matieresData = matieres || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Matières
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez les matières et leurs coefficients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleNewMatiere}
          >
            Nouvelle matière
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        <StatCard
          title="Total matières"
          value={matieresData.length}
          icon={<BookOpen className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Mat. principales"
          value={matieresData.filter(m => m.coefficient >= 4).length}
          icon={<GraduationCap className="h-6 w-6" />}
          color="success"
        />
        <StatCard
          title="Coef. moyen"
          value={matieresData.length > 0 
            ? parseFloat((matieresData.reduce((sum, m) => sum + m.coefficient, 0) / matieresData.length).toFixed(1))
            : 0}
          icon={<BookOpen className="h-6 w-6" />}
          decimals={1}
          color="info"
        />
      </div>

      {/* Search */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher une matière..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Code</TableTh>
              <TableTh>Matière</TableTh>
              <TableTh>Description</TableTh>
              <TableTh>Coefficient</TableTh>
              <TableTh className="w-12">Actions</TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={5} rows={6} />
            ) : matieresData.length === 0 ? (
              <TableEmpty colSpan={5} message="Aucune matière trouvée. Cliquez sur 'Nouvelle matière' pour en créer une." />
            ) : (
              matieresData.map((matiere) => (
                <TableRow key={matiere.id}>
                  <TableTd>
                    <code className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded text-sm font-mono">
                      {matiere.code}
                    </code>
                  </TableTd>
                  <TableTd className="font-medium">{matiere.libelle}</TableTd>
                  <TableTd className="text-sm text-surface-500 max-w-xs truncate">
                    {matiere.description || '-'}
                  </TableTd>
                  <TableTd>
                    <Badge variant={matiere.coefficient >= 4 ? 'primary' : 'default'}>
                      {matiere.coefficient}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <DropdownItem 
                        icon={<Edit className="h-4 w-4" />}
                        onClick={() => handleEdit(matiere)}
                      >
                        Modifier
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem 
                        icon={<Trash2 className="h-4 w-4" />} 
                        danger
                        onClick={() => handleDelete(matiere)}
                      >
                        Supprimer
                      </DropdownItem>
                    </Dropdown>
                  </TableTd>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal nouvelle matière */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nouvelle matière"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Nom de la matière *" 
              placeholder="Ex: Mathématiques"
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
            />
            <Input 
              label="Code *" 
              placeholder="Ex: MATH"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>
          
          <Input 
            label="Description (optionnel)" 
            placeholder="Description de la matière..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          
          <Input 
            label="Coefficient *" 
            type="number" 
            min="1" 
            max="10"
            value={formData.coefficient}
            onChange={(e) => setFormData({ ...formData, coefficient: parseInt(e.target.value) || 1 })}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitNew}
              disabled={!formData.libelle || !formData.code || createMutation.isPending}
              leftIcon={createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {createMutation.isPending ? 'Création...' : 'Créer la matière'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal édition matière */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Modifier: ${selectedMatiere?.libelle}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Nom de la matière *" 
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
            />
            <Input 
              label="Code *" 
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>
          
          <Input 
            label="Description" 
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          
          <Input 
            label="Coefficient" 
            type="number" 
            min="1" 
            max="10"
            value={formData.coefficient}
            onChange={(e) => setFormData({ ...formData, coefficient: parseInt(e.target.value) || 1 })}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitEdit}
              disabled={!formData.libelle || !formData.code || updateMutation.isPending}
              leftIcon={updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal confirmation suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer cette matière ?"
        message={
          <p>
            Êtes-vous sûr de vouloir supprimer la matière <strong>{selectedMatiere?.libelle}</strong> ?
            <br />
            <span className="text-sm text-surface-500">Cette action est irréversible.</span>
          </p>
        }
        confirmText="Supprimer"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

export { MatieresPage }
