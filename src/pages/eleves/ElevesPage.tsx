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
  FileText,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
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
import { ExportModal } from '@/components/ui/ExportModal'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { eleveService } from '@/services/eleveService'
import { exportConfigs } from '@/services/exportService'
import { formatDate } from '@/utils/format'
import { api } from '@/services/api'
import type { Eleve, EleveFilters, StatutEleve } from '@/types'

const ElevesPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Partial<EleveFilters>>({})
  const [showExportModal, setShowExportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null)
  
  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['eleves', page, debouncedSearch, filters],
    queryFn: async () => {
      return eleveService.getEleves({
        page,
        perPage: 20,
        search: debouncedSearch,
        ...filters,
      })
    },
  })

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes')
      return response.data
    },
  })

  // Mutation pour supprimer un élève
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return eleveService.deleteEleve(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eleves'] })
      addToast({ type: 'success', title: 'Succès', message: 'Élève supprimé avec succès' })
      setShowDeleteModal(false)
      setSelectedEleve(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'élève' })
    },
  })

  const handleDelete = (eleve: Eleve, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEleve(eleve)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (!selectedEleve) return
    deleteMutation.mutate(selectedEleve.id)
  }

  const statutBadgeVariant = (statut: StatutEleve) => {
    const variants: Record<StatutEleve, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      inscrit: 'success',
      reinscrit: 'info',
      transfere: 'warning',
      abandonne: 'error',
      diplome: 'primary' as 'success',
    }
    return variants[statut] || 'default'
  }

  const statutLabels: Record<StatutEleve, string> = {
    inscrit: 'Inscrit',
    reinscrit: 'Réinscrit',
    transfere: 'Transféré',
    abandonne: 'Abandonné',
    diplome: 'Diplômé',
  }

  const eleves = data?.data || []
  const pagination = data?.pagination

  // Préparer les données pour l'export
  const exportData = eleves.map((eleve: any) => ({
    matricule: eleve.matricule,
    nom: eleve.nom,
    prenom: eleve.prenom,
    sexe: eleve.sexe === 'M' ? 'Masculin' : 'Féminin',
    dateNaissance: formatDate(eleve.date_naissance),
    classe: eleve.classe || '-',
    statut: eleve.is_active ? 'Actif' : 'Inactif',
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Élèves
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez les élèves de l'établissement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => setShowExportModal(true)}
            disabled={eleves.length === 0}
          >
            Exporter
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/eleves/nouveau')}
          >
            Nouvel élève
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Total élèves"
          value={pagination?.total || eleves.length}
          icon={<GraduationCap className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Garçons"
          value={eleves.filter((e: Eleve) => e.sexe === 'M').length}
          icon={<GraduationCap className="h-6 w-6" />}
          color="info"
        />
        <StatCard
          title="Filles"
          value={eleves.filter((e: Eleve) => e.sexe === 'F').length}
          icon={<GraduationCap className="h-6 w-6" />}
          color="secondary"
        />
        <StatCard
          title="Actifs"
          value={eleves.filter((e: any) => e.is_active).length}
          icon={<GraduationCap className="h-6 w-6" />}
          color="success"
        />
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom, prénom ou matricule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              options={[
                { value: '', label: 'Toutes les classes' },
                ...(classesData?.data || []).map((c: any) => ({
                  value: String(c.id),
                  label: c.libelle,
                })),
              ]}
              value={filters.classeId?.toString() || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  classeId: e.target.value || undefined,
                }))
              }
              className="w-full sm:w-40"
            />
            <Select
              options={[
                { value: '', label: 'Tous' },
                { value: 'true', label: 'Actifs' },
                { value: 'false', label: 'Inactifs' },
              ]}
              value={filters.isActive?.toString() || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  isActive: e.target.value || undefined,
                }))
              }
              className="w-full sm:w-36"
            />
            <Select
              options={[
                { value: '', label: 'Tous' },
                { value: 'M', label: 'Masculin' },
                { value: 'F', label: 'Féminin' },
              ]}
              value={filters.sexe || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sexe: (e.target.value as 'M' | 'F') || undefined,
                }))
              }
              className="w-full sm:w-32"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Élève</TableTh>
              <TableTh>Matricule</TableTh>
              <TableTh>Classe</TableTh>
              <TableTh>Date de naissance</TableTh>
              <TableTh>Sexe</TableTh>
              <TableTh>Statut</TableTh>
              <TableTh className="w-12">Actions</TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={7} rows={10} />
            ) : eleves.length === 0 ? (
              <TableEmpty colSpan={7} message="Aucun élève trouvé" />
            ) : (
              eleves.map((eleve: any) => (
                <TableRow
                  key={eleve.id}
                  clickable
                  onClick={() => navigate(`/eleves/${eleve.id}`)}
                >
                  <TableTd>
                    <div className="flex items-center gap-3">
                      <Avatar
                        nom={eleve.nom}
                        prenom={eleve.prenom}
                        src={eleve.photo}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">
                          {eleve.prenom} {eleve.nom}
                        </p>
                        <p className="text-sm text-surface-500">
                          {eleve.email || eleve.telephone || '-'}
                        </p>
                      </div>
                    </div>
                  </TableTd>
                  <TableTd>
                    <code className="text-sm bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">
                      {eleve.matricule}
                    </code>
                  </TableTd>
                  <TableTd>
                    {eleve.classe || '-'}
                  </TableTd>
                  <TableTd>{formatDate(eleve.date_naissance)}</TableTd>
                  <TableTd>
                    <Badge variant={eleve.sexe === 'M' ? 'info' : 'secondary'}>
                      {eleve.sexe === 'M' ? 'Masculin' : 'Féminin'}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <Badge variant={eleve.is_active ? 'success' : 'error'} dot>
                      {eleve.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <Dropdown
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <DropdownItem
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => navigate(`/eleves/${eleve.id}`)}
                      >
                        Voir détails
                      </DropdownItem>
                      <DropdownItem
                        icon={<Edit className="h-4 w-4" />}
                        onClick={() => navigate(`/eleves/${eleve.id}/modifier`)}
                      >
                        Modifier
                      </DropdownItem>
                      <DropdownItem
                        icon={<FileText className="h-4 w-4" />}
                        onClick={() => navigate(`/eleves/${eleve.id}/bulletin`)}
                      >
                        Voir bulletin
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        icon={<Trash2 className="h-4 w-4" />}
                        danger
                        onClick={(e) => handleDelete(eleve, e)}
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
      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={setPage}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={exportConfigs.eleves.title}
        filename={exportConfigs.eleves.filename}
        columns={exportConfigs.eleves.columns}
        data={exportData}
        subtitle={`Année scolaire 2024-2025`}
      />

      {/* Modal confirmation suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer cet élève ?"
        message={
          <p>
            Êtes-vous sûr de vouloir supprimer <strong>{selectedEleve?.prenom} {selectedEleve?.nom}</strong> ?
            <br />
            <span className="text-sm text-surface-500">
              Cette action est irréversible et supprimera toutes les données associées (inscriptions, notes, paiements...).
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

export { ElevesPage }
