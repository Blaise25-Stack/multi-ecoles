import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
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
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { StatCard } from '@/components/ui/StatCard'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { eleveService } from '@/services/eleveService'
import { useToast } from '@/hooks/useToast'
import { api } from '@/services/api'
import { formatDate, formatCurrency } from '@/utils/format'
import { exportData, exportConfigs } from '@/services/exportService'
import type { StatutInscription, Inscription } from '@/types'

const InscriptionsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [showValidateModal, setShowValidateModal] = useState(false)
  const [showRefuseModal, setShowRefuseModal] = useState(false)
  const [selectedInscription, setSelectedInscription] = useState<any>(null)
  const [refuseMotif, setRefuseMotif] = useState('')

  // Récupérer les inscriptions depuis l'API
  const { data, isLoading } = useQuery({
    queryKey: ['inscriptions', page, searchQuery, statutFilter],
    queryFn: async () => {
      const response = await api.get('/inscriptions', {
        params: {
          page,
          limit: 15,
          search: searchQuery || undefined,
          statut: statutFilter || undefined,
        },
      })
      return response.data
    },
  })

  const inscriptions = data?.data || []
  const pagination = data?.pagination

  const statutConfig: Record<StatutInscription, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
    validee: { label: 'Validée', variant: 'success' },
    en_attente: { label: 'En attente', variant: 'warning' },
    refusee: { label: 'Refusée', variant: 'error' },
    annulee: { label: 'Annulée', variant: 'info' },
  }

  // Calculer les stats à partir des données réelles
  const stats = {
    total: pagination?.total || inscriptions.length,
    validees: inscriptions.filter((i: any) => i.statut === 'validee').length,
    enAttente: inscriptions.filter((i: any) => i.statut === 'en_attente').length,
    nouveaux: inscriptions.filter((i: any) => i.type_inscription === 'nouvelle').length,
  }

  const validateMutation = useMutation({
    mutationFn: (id: string | number) =>
      api.put(`/inscriptions/${id}`, { statut: 'validee' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscriptions'] })
      addToast({ type: 'success', title: 'Succès', message: 'Inscription validée avec succès' })
      setShowValidateModal(false)
      setSelectedInscription(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: "Impossible de valider l'inscription" })
    },
  })

  const refuseMutation = useMutation({
    mutationFn: ({ id, motif }: { id: string | number; motif: string }) =>
      api.put(`/inscriptions/${id}`, { statut: 'refusee', observations: motif }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscriptions'] })
      addToast({ type: 'success', title: 'Succès', message: 'Inscription refusée' })
      setShowRefuseModal(false)
      setSelectedInscription(null)
      setRefuseMotif('')
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: "Impossible de refuser l'inscription" })
    },
  })

  const handleOpenValidate = (inscription: any) => {
    setSelectedInscription(inscription)
    setShowValidateModal(true)
  }

  const handleOpenRefuse = (inscription: any) => {
    setSelectedInscription(inscription)
    setRefuseMotif('')
    setShowRefuseModal(true)
  }

  const handleConfirmValidate = () => {
    if (!selectedInscription) return
    validateMutation.mutate(selectedInscription.id)
  }

  const handleConfirmRefuse = () => {
    if (!selectedInscription) return
    refuseMutation.mutate({ id: selectedInscription.id, motif: refuseMotif })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Inscriptions
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez les inscriptions et réinscriptions des élèves
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
            <DropdownItem onClick={() => exportData({ ...exportConfigs.inscriptions, data: inscriptions, format: 'excel' })}>
              Export Excel
            </DropdownItem>
            <DropdownItem onClick={() => exportData({ ...exportConfigs.inscriptions, data: inscriptions, format: 'pdf' })}>
              Export PDF
            </DropdownItem>
          </Dropdown>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/inscriptions/nouvelle')}
          >
            Nouvelle inscription
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Total inscriptions"
          value={stats.total}
          icon={<Users className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Validées"
          value={stats.validees}
          icon={<CheckCircle className="h-6 w-6" />}
          color="success"
        />
        <StatCard
          title="En attente"
          value={stats.enAttente}
          icon={<Clock className="h-6 w-6" />}
          color="warning"
        />
        <StatCard
          title="Nouveaux élèves"
          value={stats.nouveaux}
          icon={<Plus className="h-6 w-6" />}
          color="info"
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
          <Select
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'validee', label: 'Validée' },
              { value: 'en_attente', label: 'En attente' },
              { value: 'refusee', label: 'Refusée' },
            ]}
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="w-full lg:w-44"
          />
        </div>
      </Card>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Élève</TableTh>
              <TableTh>Classe</TableTh>
              <TableTh>Date</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Statut</TableTh>
              <TableTh className="w-12"></TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={6} rows={10} />
            ) : inscriptions.length === 0 ? (
              <TableEmpty colSpan={6} message="Aucune inscription trouvée" />
            ) : (
              inscriptions.map((inscription: any) => (
                <TableRow key={inscription.id}>
                  <TableTd>
                    <div className="flex items-center gap-3">
                      <Avatar
                        nom={inscription.nom || ''}
                        prenom={inscription.prenom || ''}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">
                          {inscription.prenom} {inscription.nom}
                        </p>
                        <p className="text-xs text-surface-500">
                          {inscription.matricule || inscription.numero}
                        </p>
                      </div>
                    </div>
                  </TableTd>
                  <TableTd>{inscription.classe || '-'}</TableTd>
                  <TableTd>{formatDate(inscription.date_inscription)}</TableTd>
                  <TableTd>
                    <Badge variant={inscription.type_inscription === 'nouvelle' ? 'info' : 'default'}>
                      {inscription.type_inscription === 'nouvelle' ? 'Nouveau' : 'Réinscription'}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <Badge 
                      variant={statutConfig[inscription.statut as StatutInscription]?.variant || 'default'} 
                      dot
                    >
                      {statutConfig[inscription.statut as StatutInscription]?.label || inscription.statut}
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
                      {inscription.statut === 'en_attente' && (
                        <>
                          <DropdownItem
                            icon={<CheckCircle className="h-4 w-4" />}
                            onClick={() => handleOpenValidate(inscription)}
                          >
                            Valider
                          </DropdownItem>
                          <DropdownItem
                            icon={<XCircle className="h-4 w-4" />}
                            danger
                            onClick={() => handleOpenRefuse(inscription)}
                          >
                            Refuser
                          </DropdownItem>
                        </>
                      )}
                    </Dropdown>
                  </TableTd>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={setPage}
        />
      )}

      {/* Modal de validation */}
      <ConfirmModal
        isOpen={showValidateModal}
        onClose={() => { setShowValidateModal(false); setSelectedInscription(null) }}
        onConfirm={handleConfirmValidate}
        title="Valider cette inscription ?"
        message={
          selectedInscription ? (
            <p>
              Confirmez-vous la validation de l'inscription de{' '}
              <strong>{selectedInscription.prenom} {selectedInscription.nom}</strong> ?
            </p>
          ) : ''
        }
        confirmText="Valider"
        type="success"
        isLoading={validateMutation.isPending}
      />

      {/* Modal de refus */}
      <ConfirmModal
        isOpen={showRefuseModal}
        onClose={() => { setShowRefuseModal(false); setSelectedInscription(null); setRefuseMotif('') }}
        onConfirm={handleConfirmRefuse}
        title="Refuser cette inscription ?"
        message={
          <div className="space-y-3">
            {selectedInscription && (
              <p>
                Êtes-vous sûr de vouloir refuser l'inscription de{' '}
                <strong>{selectedInscription.prenom} {selectedInscription.nom}</strong> ?
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 text-left">
                Motif du refus
              </label>
              <textarea
                className="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Indiquez le motif du refus..."
                value={refuseMotif}
                onChange={(e) => setRefuseMotif(e.target.value)}
              />
            </div>
          </div>
        }
        confirmText="Refuser"
        type="danger"
        isLoading={refuseMutation.isPending}
      />
    </div>
  )
}

export { InscriptionsPage }
