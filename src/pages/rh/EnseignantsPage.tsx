import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Users,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
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
import { rhService } from '@/services/rhService'
import { formatDate, formatFullName } from '@/utils/format'
import { exportData, exportConfigs } from '@/services/exportService'
import type { Enseignant, TypeContrat, StatutEmploye } from '@/types'

const contratLabels: Record<TypeContrat, string> = {
  cdi: 'CDI',
  cdd: 'CDD',
  vacation: 'Vacation',
  stage: 'Stage',
}

const statutLabels: Record<StatutEmploye, string> = {
  actif: 'Actif',
  conge: 'En congé',
  suspendu: 'Suspendu',
  demission: 'Démissionné',
  licencie: 'Licencié',
}

const statutVariants: Record<StatutEmploye, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  actif: 'success',
  conge: 'info',
  suspendu: 'warning',
  demission: 'error',
  licencie: 'error',
}

const EnseignantsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statut, setStatut] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEnseignant, setSelectedEnseignant] = useState<Enseignant | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['enseignants', page, debouncedSearch, statut],
    queryFn: () =>
      rhService.getEnseignants({
        page,
        perPage: 20,
        search: debouncedSearch,
        statut: statut || undefined,
      }),
  })

  // Mutation pour supprimer un enseignant
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return rhService.deleteEnseignant(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enseignants'] })
      addToast({ type: 'success', title: 'Succès', message: 'Enseignant supprimé avec succès' })
      setShowDeleteModal(false)
      setSelectedEnseignant(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'enseignant' })
    },
  })

  const handleDelete = (enseignant: Enseignant) => {
    setSelectedEnseignant(enseignant)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (!selectedEnseignant) return
    deleteMutation.mutate(selectedEnseignant.id)
  }

  const rawList = data?.data?.data || []
  const enseignants = rawList.map((e: any) => ({
    ...e,
    typeContrat: e.typeContrat || e.type_contrat || null,
    statut: e.statut || (e.is_active === false ? 'suspendu' : e.is_active !== undefined ? 'actif' : null),
    salaireBase: e.salaireBase ?? e.salaire_base,
    dateEmbauche: e.dateEmbauche || e.date_embauche,
  })) as Enseignant[]
  const meta = data?.data?.pagination || data?.data?.meta

  const totalActifs = enseignants.filter((e: Enseignant) => e.statut === 'actif').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Enseignants
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez le personnel enseignant
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
            <DropdownItem onClick={() => exportData({ ...exportConfigs.enseignants, data: enseignants, format: 'excel' })}>
              Export Excel
            </DropdownItem>
            <DropdownItem onClick={() => exportData({ ...exportConfigs.enseignants, data: enseignants, format: 'pdf' })}>
              Export PDF
            </DropdownItem>
          </Dropdown>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/enseignants/nouveau')}
          >
            Nouvel enseignant
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Total enseignants"
          value={meta?.total || enseignants.length}
          icon={<Users className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Actifs"
          value={totalActifs}
          icon={<Users className="h-6 w-6" />}
          color="success"
        />
        <StatCard
          title="En congé"
          value={enseignants.filter((e: Enseignant) => e.statut === 'conge').length}
          icon={<Users className="h-6 w-6" />}
          color="info"
        />
        <StatCard
          title="Vacataires"
          value={enseignants.filter((e: Enseignant) => e.typeContrat === 'vacation').length}
          icon={<Users className="h-6 w-6" />}
          color="warning"
        />
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom, matricule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'actif', label: 'Actif' },
              { value: 'conge', label: 'En congé' },
              { value: 'suspendu', label: 'Suspendu' },
            ]}
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="w-full lg:w-40"
          />
        </div>
      </Card>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Enseignant</TableTh>
              <TableTh>Matricule</TableTh>
              <TableTh>Contact</TableTh>
              <TableTh>Spécialité</TableTh>
              <TableTh>Contrat</TableTh>
              <TableTh>Statut</TableTh>
              <TableTh className="w-12">Actions</TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={7} rows={10} />
            ) : enseignants.length === 0 ? (
              <TableEmpty colSpan={7} message="Aucun enseignant trouvé" />
            ) : (
              enseignants.map((enseignant: Enseignant) => (
                <TableRow key={enseignant.id}>
                  <TableTd>
                    <div className="flex items-center gap-3">
                      <Avatar
                        nom={enseignant.nom}
                        prenom={enseignant.prenom}
                        src={enseignant.photo}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">
                          {formatFullName(enseignant.nom, enseignant.prenom)}
                        </p>
                        <p className="text-sm text-surface-500">
                          {enseignant.email || '-'}
                        </p>
                      </div>
                    </div>
                  </TableTd>
                  <TableTd>
                    <code className="text-sm bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">
                      {enseignant.matricule}
                    </code>
                  </TableTd>
                  <TableTd>
                    <div className="space-y-1">
                      {enseignant.telephone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-surface-400" />
                          <span>{enseignant.telephone}</span>
                        </div>
                      )}
                      {enseignant.email && (
                        <div className="flex items-center gap-1 text-sm text-surface-500">
                          <Mail className="h-3 w-3 text-surface-400" />
                          <span className="truncate max-w-[150px]">{enseignant.email}</span>
                        </div>
                      )}
                    </div>
                  </TableTd>
                  <TableTd>{enseignant.specialite || '-'}</TableTd>
                  <TableTd>
                    {enseignant.typeContrat && (
                      <Badge variant="default">
                        {contratLabels[enseignant.typeContrat] || enseignant.typeContrat}
                      </Badge>
                    )}
                  </TableTd>
                  <TableTd>
                    {enseignant.statut && (
                      <Badge variant={statutVariants[enseignant.statut] || 'default'} dot>
                        {statutLabels[enseignant.statut] || enseignant.statut}
                      </Badge>
                    )}
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
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => navigate(`/enseignants/${enseignant.id}`)}
                      >
                        Voir détails
                      </DropdownItem>
                      <DropdownItem
                        icon={<Edit className="h-4 w-4" />}
                        onClick={() => navigate(`/enseignants/${enseignant.id}/modifier`)}
                      >
                        Modifier
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        icon={<Trash2 className="h-4 w-4" />}
                        danger
                        onClick={() => handleDelete(enseignant)}
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

      {/* Pagination */}
      {meta && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          itemsPerPage={meta.perPage}
          onPageChange={setPage}
        />
      )}

      {/* Modal confirmation suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer cet enseignant ?"
        message={
          <p>
            Êtes-vous sûr de vouloir supprimer <strong>{selectedEnseignant?.prenom} {selectedEnseignant?.nom}</strong> ?
            <br />
            <span className="text-sm text-surface-500">
              Cette action est irréversible et supprimera toutes les données associées.
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

export { EnseignantsPage }
