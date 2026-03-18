import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Users,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { StatCard } from '@/components/ui/StatCard'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown'
import { useToast } from '@/hooks/useToast'
import { api } from '@/services/api'
import { cn } from '@/utils/cn'

interface Classe {
  id: number
  code: string
  libelle: string
  niveau_id?: number
  niveau?: string
  filiere?: string
  capacite: number
  effectif?: number
  titulaire_id?: number
  titulaire_nom?: string
  titulaire_prenom?: string
  salle?: string
}

const ClassesPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    capacite: 35,
    niveau_id: '',
  })

  // Récupérer les classes depuis l'API
  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes', searchQuery],
    queryFn: async () => {
      const response = await api.get<any>('/classes', { params: { search: searchQuery || undefined } })
      // L'API peut retourner { data: [...] } ou directement un tableau
      const data = response.data
      if (Array.isArray(data)) return data
      if (data?.data && Array.isArray(data.data)) return data.data
      return []
    },
  })

  // Récupérer les niveaux pour le select
  const { data: niveaux } = useQuery({
    queryKey: ['niveaux'],
    queryFn: async () => {
      const response = await api.get<any>('/classes/niveaux/list')
      const data = response.data
      if (Array.isArray(data)) return data
      if (data?.data && Array.isArray(data.data)) return data.data
      return []
    },
  })

  // Mutation pour créer une classe
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.post('/classes', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      addToast({ type: 'success', title: 'Succès', message: 'Classe créée avec succès' })
      setShowNewModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer la classe' })
    },
  })

  // Mutation pour modifier une classe
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return api.put(`/classes/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      addToast({ type: 'success', title: 'Succès', message: 'Classe modifiée avec succès' })
      setShowEditModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de modifier la classe' })
    },
  })

  // Mutation pour supprimer une classe
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/classes/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      addToast({ type: 'success', title: 'Succès', message: 'Classe supprimée avec succès' })
      setShowDeleteModal(false)
      setSelectedClasse(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer la classe (peut-être des élèves y sont inscrits)' })
    },
  })

  const resetForm = () => {
    setFormData({ code: '', libelle: '', capacite: 35, niveau_id: '' })
    setSelectedClasse(null)
  }

  const handleEdit = (classe: Classe) => {
    setSelectedClasse(classe)
    setFormData({
      code: classe.code,
      libelle: classe.libelle,
      capacite: classe.capacite,
      niveau_id: classe.niveau_id?.toString() || '',
    })
    setShowEditModal(true)
  }

  const handleDelete = (classe: Classe) => {
    setSelectedClasse(classe)
    setShowDeleteModal(true)
  }

  const handleNewClasse = () => {
    resetForm()
    setShowNewModal(true)
  }

  const handleSubmitNew = () => {
    if (!formData.libelle || !formData.code) return
    createMutation.mutate(formData)
  }

  const handleSubmitEdit = () => {
    if (!selectedClasse || !formData.libelle || !formData.code) return
    updateMutation.mutate({ id: selectedClasse.id, data: formData })
  }

  const handleConfirmDelete = () => {
    if (!selectedClasse) return
    deleteMutation.mutate(selectedClasse.id)
  }

  const classesData = classes || []
  const totalCapacite = classesData.reduce((sum, c) => sum + (c.capacite || 0), 0)
  const totalEffectif = classesData.reduce((sum, c) => sum + (c.effectif || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Classes
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez les classes et les niveaux
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleNewClasse}
        >
          Nouvelle classe
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Total classes"
          value={classesData.length}
          icon={<GraduationCap className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Élèves inscrits"
          value={totalEffectif}
          icon={<Users className="h-6 w-6" />}
          color="secondary"
        />
        <StatCard
          title="Capacité totale"
          value={totalCapacite}
          icon={<Users className="h-6 w-6" />}
          color="accent"
        />
        <StatCard
          title="Taux remplissage"
          value={totalCapacite > 0 ? Math.round((totalEffectif / totalCapacite) * 100) : 0}
          suffix="%"
          icon={<Users className="h-6 w-6" />}
          color="info"
        />
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher une classe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Classes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="none">
              <div className="p-6 animate-pulse">
                <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/2 mb-4" />
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
              </div>
            </Card>
          ))
        ) : classesData.length === 0 ? (
          <div className="col-span-full">
            <Card padding="lg">
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-surface-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-2">
                  Aucune classe trouvée
                </h3>
                <p className="text-surface-500 mb-4">
                  Cliquez sur "Nouvelle classe" pour en créer une.
                </p>
                <Button onClick={handleNewClasse} leftIcon={<Plus className="h-4 w-4" />}>
                  Nouvelle classe
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          classesData.map((classe) => {
            const effectif = classe.effectif || 0
            const capacite = classe.capacite || 35
            const tauxRemplissage = (effectif / capacite) * 100
            const isOverCapacity = effectif > capacite
            
            return (
              <Card key={classe.id} hover padding="none">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-100 dark:bg-primary-900/30">
                        <GraduationCap className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{classe.libelle}</h3>
                        <p className="text-sm text-surface-500">{classe.code}</p>
                      </div>
                    </div>
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <DropdownItem icon={<Eye className="h-4 w-4" />}>
                        Voir élèves
                      </DropdownItem>
                      <DropdownItem 
                        icon={<Edit className="h-4 w-4" />}
                        onClick={() => handleEdit(classe)}
                      >
                        Modifier
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem 
                        icon={<Trash2 className="h-4 w-4" />} 
                        danger
                        onClick={() => handleDelete(classe)}
                      >
                        Supprimer
                      </DropdownItem>
                    </Dropdown>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-500">Effectif</span>
                      <span className={cn(
                        'font-medium',
                        isOverCapacity ? 'text-red-600' : ''
                      )}>
                        {effectif} / {capacite}
                      </span>
                    </div>
                    
                    <div className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          isOverCapacity 
                            ? 'bg-red-500' 
                            : tauxRemplissage > 90 
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        )}
                        style={{ width: `${Math.min(tauxRemplissage, 100)}%` }}
                      />
                    </div>
                    
                    {classe.niveau && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-500">Niveau</span>
                        <Badge variant="info">{classe.niveau}</Badge>
                      </div>
                    )}
                    
                    {(classe.titulaire_nom || classe.titulaire_prenom) && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-500">Titulaire</span>
                        <span className="font-medium">{classe.titulaire_prenom} {classe.titulaire_nom}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal nouvelle classe */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nouvelle classe"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Nom de la classe *" 
              placeholder="Ex: 6ème A"
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
            />
            <Input 
              label="Code *" 
              placeholder="Ex: 6A"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>
          <Select
            label="Niveau"
            options={[
              { value: '', label: 'Sélectionner' },
              ...(niveaux || []).map((n: any) => ({ value: n.id.toString(), label: n.libelle }))
            ]}
            value={formData.niveau_id}
            onChange={(e) => setFormData({ ...formData, niveau_id: e.target.value })}
          />
          <Input 
            label="Capacité *" 
            type="number" 
            placeholder="35"
            value={formData.capacite}
            onChange={(e) => setFormData({ ...formData, capacite: parseInt(e.target.value) || 35 })}
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
              {createMutation.isPending ? 'Création...' : 'Créer la classe'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal édition classe */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Modifier: ${selectedClasse?.libelle}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Nom de la classe *" 
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
            />
            <Input 
              label="Code *" 
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>
          <Select
            label="Niveau"
            options={[
              { value: '', label: 'Sélectionner' },
              ...(niveaux || []).map((n: any) => ({ value: n.id.toString(), label: n.libelle }))
            ]}
            value={formData.niveau_id}
            onChange={(e) => setFormData({ ...formData, niveau_id: e.target.value })}
          />
          <Input 
            label="Capacité" 
            type="number"
            value={formData.capacite}
            onChange={(e) => setFormData({ ...formData, capacite: parseInt(e.target.value) || 35 })}
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
        title="Supprimer cette classe ?"
        message={
          <p>
            Êtes-vous sûr de vouloir supprimer la classe <strong>{selectedClasse?.libelle}</strong> ?
            <br />
            <span className="text-sm text-surface-500">
              Cette action est irréversible. Les élèves inscrits devront être réaffectés.
            </span>
          </p>
        }
        confirmText="Supprimer"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

export { ClassesPage }
