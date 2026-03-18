import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  TrendingDown,
  Calendar,
  Building,
  Loader2,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
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
import { Pagination } from '@/components/ui/Pagination'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { api } from '@/services/api'
import { formatCurrency, formatDate } from '@/utils/format'
import { exportData, exportConfigs } from '@/services/exportService'

interface Depense {
  id: number
  libelle: string
  categorie: string
  montant: number
  date: string
  beneficiaire: string
  mode: string
  description?: string
}

const categorieConfig: Record<string, { label: string; variant: 'primary' | 'secondary' | 'warning' | 'info' | 'default' }> = {
  fournitures: { label: 'Fournitures', variant: 'primary' },
  equipement: { label: 'Équipement', variant: 'info' },
  maintenance: { label: 'Maintenance', variant: 'warning' },
  services: { label: 'Services', variant: 'secondary' },
  salaires: { label: 'Salaires', variant: 'default' },
  autre: { label: 'Autre', variant: 'default' },
}

const DepensesPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [categorieFilter, setCategorieFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null)

  const [formData, setFormData] = useState({
    libelle: '',
    categorie: '',
    montant: 0,
    date: new Date().toISOString().split('T')[0],
    beneficiaire: '',
    mode: 'especes',
    description: '',
  })

  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: categoriesData } = useQuery({
    queryKey: ['depenses-categories'],
    queryFn: async () => {
      const res = await api.get<any>('/depenses/categories/list')
      return res.data?.data || res.data || []
    },
  })
  const categories: any[] = categoriesData || []

  const { data, isLoading } = useQuery({
    queryKey: ['depenses', page, debouncedSearch, categorieFilter],
    queryFn: async () => {
      const params: any = { page, perPage: 20 }
      if (debouncedSearch) params.search = debouncedSearch
      if (categorieFilter) params.categorie = categorieFilter
      const response = await api.get<any>('/comptabilite/depenses', { params })
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.post('/comptabilite/depenses', {
        libelle: data.libelle,
        categorie_id: data.categorie ? Number(data.categorie) : null,
        montant: data.montant,
        date_depense: data.date,
        beneficiaire: data.beneficiaire || null,
        mode_paiement: data.mode || 'especes',
        description: data.description || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] })
      addToast({ type: 'success', title: 'Succès', message: 'Dépense enregistrée avec succès' })
      setShowNewModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'enregistrer la dépense' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return api.put(`/comptabilite/depenses/${id}`, {
        libelle: data.libelle,
        categorie_id: data.categorie ? Number(data.categorie) : null,
        montant: data.montant,
        date_depense: data.date,
        beneficiaire: data.beneficiaire || null,
        mode_paiement: data.mode || 'especes',
        description: data.description || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] })
      addToast({ type: 'success', title: 'Succès', message: 'Dépense modifiée avec succès' })
      setShowEditModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de modifier la dépense' })
    },
  })

  // Mutation pour supprimer une dépense
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/comptabilite/depenses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] })
      addToast({ type: 'success', title: 'Succès', message: 'Dépense supprimée avec succès' })
      setShowDeleteModal(false)
      setSelectedDepense(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer la dépense' })
    },
  })

  const resetForm = () => {
    setFormData({
      libelle: '',
      categorie: '',
      montant: 0,
      date: new Date().toISOString().split('T')[0],
      beneficiaire: '',
      mode: 'especes',
      description: '',
    })
    setSelectedDepense(null)
  }

  const handleEdit = (depense: any) => {
    setSelectedDepense(depense)
    setFormData({
      libelle: depense.libelle,
      categorie: String(depense.categorie_id || ''),
      montant: depense.montant,
      date: (depense.date_depense || depense.date || '').split('T')[0],
      beneficiaire: depense.beneficiaire || '',
      mode: depense.mode_paiement || depense.mode || 'especes',
      description: depense.description || '',
    })
    setShowEditModal(true)
  }

  const handleDelete = (depense: Depense) => {
    setSelectedDepense(depense)
    setShowDeleteModal(true)
  }

  const handleSubmitNew = () => {
    if (!formData.libelle || !formData.montant) return
    createMutation.mutate(formData)
  }

  const handleSubmitEdit = () => {
    if (!selectedDepense || !formData.libelle) return
    updateMutation.mutate({ id: selectedDepense.id, data: formData })
  }

  const handleConfirmDelete = () => {
    if (!selectedDepense) return
    deleteMutation.mutate(selectedDepense.id)
  }

  const depenses = data?.data || []
  const meta = data?.meta || data?.pagination

  const totalDepenses = depenses.reduce((sum: number, d: Depense) => sum + d.montant, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Dépenses
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez les dépenses de l'établissement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            trigger={
              <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
                Exporter
              </Button>
            }
          >
            <DropdownItem onClick={() => exportData({ ...exportConfigs.depenses, data: depenses, format: 'excel' })}>
              Export Excel
            </DropdownItem>
            <DropdownItem onClick={() => exportData({ ...exportConfigs.depenses, data: depenses, format: 'pdf' })}>
              Export PDF
            </DropdownItem>
          </Dropdown>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => { resetForm(); setShowNewModal(true) }}
          >
            Nouvelle dépense
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Total dépenses"
          value={totalDepenses}
          icon={<TrendingDown className="h-6 w-6" />}
          suffix=" FC"
          color="warning"
        />
        <StatCard
          title="Nombre de dépenses"
          value={meta?.total || depenses.length}
          icon={<Receipt className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Fournitures"
          value={depenses.filter((d: Depense) => d.categorie === 'fournitures').reduce((s: number, d: Depense) => s + d.montant, 0)}
          icon={<Building className="h-6 w-6" />}
          suffix=" FC"
          color="info"
        />
        <StatCard
          title="Services"
          value={depenses.filter((d: Depense) => d.categorie === 'services').reduce((s: number, d: Depense) => s + d.montant, 0)}
          icon={<Calendar className="h-6 w-6" />}
          suffix=" FC"
          color="secondary"
        />
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par libellé ou bénéficiaire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Toutes les catégories' },
              ...categories.map((c: any) => ({ value: String(c.id), label: c.libelle })),
            ]}
            value={categorieFilter}
            onChange={(e) => setCategorieFilter(e.target.value)}
            className="w-full lg:w-48"
          />
        </div>
      </Card>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Date</TableTh>
              <TableTh>Libellé</TableTh>
              <TableTh>Catégorie</TableTh>
              <TableTh>Bénéficiaire</TableTh>
              <TableTh>Montant</TableTh>
              <TableTh>Mode</TableTh>
              <TableTh className="w-12">Actions</TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={7} rows={10} />
            ) : depenses.length === 0 ? (
              <TableEmpty colSpan={7} message="Aucune dépense trouvée" />
            ) : (
              depenses.map((depense: Depense) => (
                <TableRow key={depense.id}>
                  <TableTd>{formatDate(depense.date)}</TableTd>
                  <TableTd className="font-medium">{depense.libelle}</TableTd>
                  <TableTd>
                    <Badge variant={categorieConfig[depense.categorie]?.variant || 'default'}>
                      {categorieConfig[depense.categorie]?.label || depense.categorie}
                    </Badge>
                  </TableTd>
                  <TableTd>{depense.beneficiaire}</TableTd>
                  <TableTd className="font-semibold text-red-600 dark:text-red-400">
                    -{formatCurrency(depense.montant)}
                  </TableTd>
                  <TableTd>
                    <Badge variant="default">
                      {depense.mode === 'especes' ? 'Espèces' :
                       depense.mode === 'virement' ? 'Virement' :
                       depense.mode === 'cheque' ? 'Chèque' :
                       depense.mode === 'mobile_money' ? 'Mobile Money' : depense.mode}
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
                      <DropdownItem icon={<Eye className="h-4 w-4" />}>
                        Voir détails
                      </DropdownItem>
                      <DropdownItem 
                        icon={<Edit className="h-4 w-4" />}
                        onClick={() => handleEdit(depense)}
                      >
                        Modifier
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem 
                        icon={<Trash2 className="h-4 w-4" />} 
                        danger
                        onClick={() => handleDelete(depense)}
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

      {meta && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          itemsPerPage={meta.perPage || meta.limit}
          onPageChange={setPage}
        />
      )}

      {/* Modal nouvelle dépense */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nouvelle dépense"
        size="lg"
      >
        <div className="space-y-4">
          <Input 
            label="Libellé *"
            placeholder="Ex: Fournitures de bureau"
            value={formData.libelle}
            onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Catégorie *"
              options={[
                { value: '', label: 'Sélectionner' },
                ...categories.map((c: any) => ({ value: String(c.id), label: c.libelle })),
              ]}
              value={formData.categorie}
              onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
            />
            <Input 
              label="Montant (FC) *"
              type="number"
              placeholder="0"
              value={formData.montant || ''}
              onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <Select
              label="Mode de paiement"
              options={[
                { value: 'especes', label: 'Espèces' },
                { value: 'virement', label: 'Virement' },
                { value: 'cheque', label: 'Chèque' },
                { value: 'mobile_money', label: 'Mobile Money' },
              ]}
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
            />
          </div>
          <Input 
            label="Bénéficiaire"
            placeholder="Nom du fournisseur ou bénéficiaire"
            value={formData.beneficiaire}
            onChange={(e) => setFormData({ ...formData, beneficiaire: e.target.value })}
          />
          <Input 
            label="Description (optionnel)"
            placeholder="Détails supplémentaires..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitNew}
              disabled={!formData.libelle || !formData.montant || !formData.categorie || createMutation.isPending}
              leftIcon={createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal édition dépense */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier la dépense"
        size="lg"
      >
        <div className="space-y-4">
          <Input 
            label="Libellé *"
            value={formData.libelle}
            onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Catégorie *"
              options={[
                { value: '', label: 'Sélectionner' },
                ...categories.map((c: any) => ({ value: String(c.id), label: c.libelle })),
              ]}
              value={formData.categorie}
              onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
            />
            <Input 
              label="Montant (FC) *"
              type="number"
              value={formData.montant || ''}
              onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <Select
              label="Mode de paiement"
              options={[
                { value: 'especes', label: 'Espèces' },
                { value: 'virement', label: 'Virement' },
                { value: 'cheque', label: 'Chèque' },
                { value: 'mobile_money', label: 'Mobile Money' },
              ]}
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
            />
          </div>
          <Input 
            label="Bénéficiaire"
            value={formData.beneficiaire}
            onChange={(e) => setFormData({ ...formData, beneficiaire: e.target.value })}
          />
          <Input 
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitEdit}
              disabled={!formData.libelle || updateMutation.isPending}
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
        title="Supprimer cette dépense ?"
        message={
          <p>
            Êtes-vous sûr de vouloir supprimer la dépense <strong>{selectedDepense?.libelle}</strong> 
            de <strong>{formatCurrency(selectedDepense?.montant || 0)}</strong> ?
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

export { DepensesPage }
