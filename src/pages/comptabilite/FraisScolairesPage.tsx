import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Receipt,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { StatCard } from '@/components/ui/StatCard'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown'
import { useToast } from '@/hooks/useToast'
import { api } from '@/services/api'
import { formatCurrency } from '@/utils/format'

interface FraisScolaire {
  id: number
  type_frais_id: number
  type_frais_libelle?: string
  montant: number
  date_limite?: string
  niveau_id?: number
  classe_id?: number
}

const FraisScolairesPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [showNewModal, setShowNewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedFrais, setSelectedFrais] = useState<FraisScolaire | null>(null)

  const [formData, setFormData] = useState({
    type_frais_id: '',
    montant: 0,
    date_limite: '',
    classe_id: '',
    niveau_id: '',
  })

  const { data: typesFrais } = useQuery({
    queryKey: ['types-frais-list'],
    queryFn: async () => {
      const res = await api.get<any>('/paiements/types-frais/list')
      return res.data?.data || res.data || []
    },
  })

  const { data: fraisData, isLoading } = useQuery({
    queryKey: ['frais-scolaires'],
    queryFn: async () => {
      const response = await api.get<any>('/comptabilite/frais')
      const data = response.data
      if (Array.isArray(data)) return data
      if (data?.data && Array.isArray(data.data)) return data.data
      return []
    },
  })

  const getTypeFraisLabel = (typeId: number) => {
    const t = (typesFrais || []).find((tf: any) => tf.id === typeId)
    return t?.libelle || `Type #${typeId}`
  }

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.post('/comptabilite/frais', {
        type_frais_id: Number(data.type_frais_id),
        montant: data.montant,
        date_limite: data.date_limite || null,
        classe_id: data.classe_id ? Number(data.classe_id) : null,
        niveau_id: data.niveau_id ? Number(data.niveau_id) : null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frais-scolaires'] })
      addToast({ type: 'success', title: 'Succès', message: 'Frais créé avec succès' })
      setShowNewModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer le frais' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return api.put(`/comptabilite/frais/${id}`, {
        type_frais_id: Number(data.type_frais_id),
        montant: data.montant,
        date_limite: data.date_limite || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frais-scolaires'] })
      addToast({ type: 'success', title: 'Succès', message: 'Frais modifié avec succès' })
      setShowEditModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de modifier le frais' })
    },
  })

  // Mutation pour supprimer un frais
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/comptabilite/frais/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frais-scolaires'] })
      addToast({ type: 'success', title: 'Succès', message: 'Frais supprimé avec succès' })
      setShowDeleteModal(false)
      setSelectedFrais(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer le frais' })
    },
  })

  const resetForm = () => {
    setFormData({
      type_frais_id: '',
      montant: 0,
      date_limite: '',
      classe_id: '',
      niveau_id: '',
    })
    setSelectedFrais(null)
  }

  const handleEdit = (frais: FraisScolaire) => {
    setSelectedFrais(frais)
    setFormData({
      type_frais_id: String(frais.type_frais_id || ''),
      montant: frais.montant,
      date_limite: frais.date_limite ? String(frais.date_limite).split('T')[0] : '',
      classe_id: frais.classe_id ? String(frais.classe_id) : '',
      niveau_id: frais.niveau_id ? String(frais.niveau_id) : '',
    })
    setShowEditModal(true)
  }

  const handleDelete = (frais: FraisScolaire) => {
    setSelectedFrais(frais)
    setShowDeleteModal(true)
  }

  const handleSubmitNew = () => {
    if (!formData.type_frais_id || !formData.montant) return
    createMutation.mutate(formData)
  }

  const handleSubmitEdit = () => {
    if (!selectedFrais || !formData.type_frais_id) return
    updateMutation.mutate({ id: selectedFrais.id, data: formData })
  }

  const handleConfirmDelete = () => {
    if (!selectedFrais) return
    deleteMutation.mutate(selectedFrais.id)
  }

  const frais = fraisData || []
  const totalFrais = frais.reduce((sum: number, f: FraisScolaire) => sum + (parseFloat(String(f.montant)) || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Frais scolaires
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Configurez les différents frais de l'année scolaire
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => { resetForm(); setShowNewModal(true) }}
        >
          Nouveau frais
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
        <StatCard
          title="Total frais configurés"
          value={frais.length}
          icon={<Receipt className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Total montant"
          value={totalFrais}
          icon={<AlertCircle className="h-6 w-6" />}
          suffix=" FC"
          color="warning"
        />
      </div>

      {/* Liste des frais */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="none">
              <div className="p-6 animate-pulse">
                <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/2 mb-4" />
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : frais.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-surface-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-2">
              Aucun frais configuré
            </h3>
            <p className="text-surface-500 mb-4">
              Cliquez sur "Nouveau frais" pour configurer les frais scolaires.
            </p>
            <Button onClick={() => { resetForm(); setShowNewModal(true) }} leftIcon={<Plus className="h-4 w-4" />}>
              Nouveau frais
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {frais.map((item) => (
            <Card key={item.id} hover padding="none">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="primary" className="text-xs">
                        {item.type_frais_libelle || getTypeFraisLabel(item.type_frais_id)}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg">{item.type_frais_libelle || getTypeFraisLabel(item.type_frais_id)}</h3>
                  </div>
                  <Dropdown
                    trigger={
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <DropdownItem 
                      icon={<Edit className="h-4 w-4" />}
                      onClick={() => handleEdit(item)}
                    >
                      Modifier
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem 
                      icon={<Trash2 className="h-4 w-4" />} 
                      danger
                      onClick={() => handleDelete(item)}
                    >
                      Supprimer
                    </DropdownItem>
                  </Dropdown>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-500">Montant</span>
                    <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                      {formatCurrency(item.montant)}
                    </span>
                  </div>
                  {item.date_limite && (
                    <p className="text-sm text-surface-500">
                      Date limite : {new Date(item.date_limite).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal nouveau frais */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nouveau frais scolaire"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Type de frais *"
            options={[
              { value: '', label: 'Sélectionner un type' },
              ...((typesFrais || []) as any[]).map((t: any) => ({
                value: String(t.id),
                label: t.libelle,
              })),
            ]}
            value={formData.type_frais_id}
            onChange={(e) => setFormData({ ...formData, type_frais_id: e.target.value })}
          />
          <Input 
            label="Montant (FC) *"
            type="number"
            placeholder="0"
            value={formData.montant || ''}
            onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
          />
          <Input 
            label="Date limite (optionnel)"
            type="date"
            value={formData.date_limite}
            onChange={(e) => setFormData({ ...formData, date_limite: e.target.value })}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitNew}
              disabled={!formData.type_frais_id || !formData.montant || createMutation.isPending}
              leftIcon={createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal édition frais */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier le frais"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Type de frais *"
            options={[
              { value: '', label: 'Sélectionner un type' },
              ...((typesFrais || []) as any[]).map((t: any) => ({
                value: String(t.id),
                label: t.libelle,
              })),
            ]}
            value={formData.type_frais_id}
            onChange={(e) => setFormData({ ...formData, type_frais_id: e.target.value })}
          />
          <Input 
            label="Montant (FC) *"
            type="number"
            value={formData.montant || ''}
            onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
          />
          <Input 
            label="Date limite (optionnel)"
            type="date"
            value={formData.date_limite}
            onChange={(e) => setFormData({ ...formData, date_limite: e.target.value })}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitEdit}
              disabled={!formData.type_frais_id || updateMutation.isPending}
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
        title="Supprimer ce frais ?"
        message={
          <p>
            Êtes-vous sûr de vouloir supprimer ce frais
            de <strong>{formatCurrency(selectedFrais?.montant || 0)}</strong> ?
            <br />
            <span className="text-sm text-surface-500">
              Cette action est irréversible et pourrait affecter les paiements existants.
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

export { FraisScolairesPage }
