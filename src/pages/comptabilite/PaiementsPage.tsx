import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Printer,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  AlertTriangle,
  PieChart,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
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
import { comptabiliteService } from '@/services/comptabiliteService'
import { exportConfigs } from '@/services/exportService'
import { formatCurrency, formatDate, formatFullName } from '@/utils/format'
import { api } from '@/services/api'
import type { Paiement, ModePaiement } from '@/types'

const modesPaiementLabels: Record<ModePaiement, string> = {
  especes: 'Espèces',
  cheque: 'Chèque',
  virement: 'Virement',
  mobile_money: 'Mobile Money',
  carte: 'Carte bancaire',
}

interface PaiementEtendu extends Paiement {
  eleve?: { nom: string; prenom: string }
  frais?: { libelle: string }
}

const PaiementsPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [modePaiement, setModePaiement] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPaiement, setSelectedPaiement] = useState<PaiementEtendu | null>(null)

  // Form state for new payment modal
  const [eleveSearch, setEleveSearch] = useState('')
  const [selectedEleveId, setSelectedEleveId] = useState<string | number | null>(null)
  const [selectedEleveLabel, setSelectedEleveLabel] = useState('')
  const [selectedFraisId, setSelectedFraisId] = useState('')
  const [formMontant, setFormMontant] = useState('')
  const [formModePaiement, setFormModePaiement] = useState<string>('especes')
  const [formReference, setFormReference] = useState('')
  const [formObservations, setFormObservations] = useState('')
  const [showEleveSuggestions, setShowEleveSuggestions] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)
  const debouncedEleveSearch = useDebounce(eleveSearch, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['paiements', page, debouncedSearch, modePaiement],
    queryFn: () =>
      comptabiliteService.getPaiements({
        page,
        perPage: 20,
        search: debouncedSearch,
        modePaiement: modePaiement || undefined,
      }),
  })

  const { data: statsData } = useQuery({
    queryKey: ['comptabilite-stats'],
    queryFn: () => comptabiliteService.getStatistiques(),
  })

  // Search students for the new payment modal
  const { data: elevesData } = useQuery({
    queryKey: ['eleves-search', debouncedEleveSearch],
    queryFn: () => api.get('/eleves', { params: { search: debouncedEleveSearch, limit: 5 } }),
    enabled: debouncedEleveSearch.length >= 2,
  })
  const eleveSuggestions: Array<{ id: string | number; nom: string; prenom: string; matricule?: string }> =
    elevesData?.data?.data || elevesData?.data || []

  // Load frais types for the select
  const { data: fraisData } = useQuery({
    queryKey: ['comptabilite-frais'],
    queryFn: () => api.get('/comptabilite/frais'),
  })
  const rawFrais: any[] = fraisData?.data?.data || fraisData?.data || []
  const fraisOptions = rawFrais.map((f: any) => ({
    id: f.id,
    libelle: f.libelle || f.type_frais_libelle || `Frais #${f.id}`,
    montant: f.montant,
  }))

  // Create payment mutation
  const createMutation = useMutation({
    mutationFn: () =>
      comptabiliteService.createPaiement({
        eleveId: selectedEleveId!,
        fraisId: selectedFraisId,
        montant: Number(formMontant),
        modePaiement: formModePaiement,
        reference: formReference || undefined,
        observations: formObservations || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] })
      queryClient.invalidateQueries({ queryKey: ['comptabilite-stats'] })
      addToast({ type: 'success', title: 'Succès', message: 'Paiement enregistré avec succès' })
      handleCloseNewModal()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: "Impossible d'enregistrer le paiement" })
    },
  })

  const handleCloseNewModal = () => {
    setShowNewModal(false)
    setEleveSearch('')
    setSelectedEleveId(null)
    setSelectedEleveLabel('')
    setSelectedFraisId('')
    setFormMontant('')
    setFormModePaiement('especes')
    setFormReference('')
    setFormObservations('')
    setShowEleveSuggestions(false)
  }

  const handleSelectEleve = (eleve: { id: string | number; nom: string; prenom: string }) => {
    setSelectedEleveId(eleve.id)
    setSelectedEleveLabel(`${eleve.prenom} ${eleve.nom}`)
    setEleveSearch(`${eleve.prenom} ${eleve.nom}`)
    setShowEleveSuggestions(false)
  }

  const handleSubmitPaiement = () => {
    if (!selectedEleveId || !formMontant) return
    createMutation.mutate()
  }

  // Mutation pour supprimer un paiement
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return api.delete(`/comptabilite/paiements/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] })
      queryClient.invalidateQueries({ queryKey: ['comptabilite-stats'] })
      addToast({ type: 'success', title: 'Succès', message: 'Paiement supprimé avec succès' })
      setShowDeleteModal(false)
      setSelectedPaiement(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer le paiement' })
    },
  })

  const handleDelete = (paiement: PaiementEtendu) => {
    setSelectedPaiement(paiement)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (!selectedPaiement) return
    deleteMutation.mutate(selectedPaiement.id)
  }

  const paiements = data?.data?.data || []
  const meta = data?.data?.meta
  const stats = statsData?.data

  // Préparer les données pour l'export
  const exportData = paiements.map((paiement: PaiementEtendu) => ({
    reference: paiement.reference || '-',
    date: formatDate(paiement.datePaiement),
    eleve: paiement.eleve ? formatFullName(paiement.eleve.nom, paiement.eleve.prenom) : '-',
    typeFrais: paiement.frais?.libelle || '-',
    montant: paiement.montant,
    mode: modesPaiementLabels[paiement.modePaiement],
    statut: 'Payé',
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Paiements
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez les paiements des élèves
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => setShowExportModal(true)}
            disabled={paiements.length === 0}
          >
            Exporter
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowNewModal(true)}
          >
            Nouveau paiement
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Total recettes"
          value={stats?.totalRecettes || 0}
          icon={<TrendingUp className="h-6 w-6" />}
          suffix=" FC"
          color="success"
          trend={{ value: 12.5, label: 'vs mois dernier' }}
        />
        <StatCard
          title="Paiements ce mois"
          value={meta?.total || paiements.length}
          icon={<Receipt className="h-6 w-6" />}
          color="info"
        />
        <StatCard
          title="Élèves impayés"
          value={stats?.elevesImpayes || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="warning"
        />
        <StatCard
          title="Taux recouvrement"
          value={stats?.tauxRecouvrement || 0}
          icon={<PieChart className="h-6 w-6" />}
          suffix="%"
          decimals={1}
          color="primary"
        />
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par élève ou référence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Tous les modes' },
              { value: 'especes', label: 'Espèces' },
              { value: 'mobile_money', label: 'Mobile Money' },
              { value: 'virement', label: 'Virement' },
              { value: 'cheque', label: 'Chèque' },
              { value: 'carte', label: 'Carte bancaire' },
            ]}
            value={modePaiement}
            onChange={(e) => setModePaiement(e.target.value)}
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
              <TableTh>Élève</TableTh>
              <TableTh>Type de frais</TableTh>
              <TableTh>Montant</TableTh>
              <TableTh>Mode</TableTh>
              <TableTh>Référence</TableTh>
              <TableTh className="w-12">Actions</TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={7} rows={10} />
            ) : paiements.length === 0 ? (
              <TableEmpty colSpan={7} message="Aucun paiement trouvé" />
            ) : (
              paiements.map((paiement: PaiementEtendu) => (
                <TableRow key={paiement.id}>
                  <TableTd>{formatDate(paiement.datePaiement)}</TableTd>
                  <TableTd>
                    {paiement.eleve
                      ? formatFullName(paiement.eleve.nom, paiement.eleve.prenom)
                      : '-'}
                  </TableTd>
                  <TableTd>{paiement.frais?.libelle || '-'}</TableTd>
                  <TableTd className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(paiement.montant)}
                  </TableTd>
                  <TableTd>
                    <Badge variant="default">
                      {modesPaiementLabels[paiement.modePaiement]}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <code className="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">
                      {paiement.reference || '-'}
                    </code>
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
                      <DropdownItem icon={<Printer className="h-4 w-4" />}>
                        Imprimer reçu
                      </DropdownItem>
                      <DropdownItem icon={<Edit className="h-4 w-4" />}>
                        Modifier
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem 
                        icon={<Trash2 className="h-4 w-4" />} 
                        danger
                        onClick={() => handleDelete(paiement)}
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
          itemsPerPage={meta.perPage}
          onPageChange={setPage}
        />
      )}

      {/* Modal nouveau paiement */}
      <Modal
        isOpen={showNewModal}
        onClose={handleCloseNewModal}
        title="Nouveau paiement"
        size="lg"
      >
        <div className="space-y-4">
          {/* Student search with autocomplete */}
          <div className="relative">
            <Input
              label="Rechercher un élève"
              placeholder="Nom, prénom ou matricule..."
              value={eleveSearch}
              onChange={(e) => {
                setEleveSearch(e.target.value)
                setShowEleveSuggestions(true)
                if (!e.target.value) {
                  setSelectedEleveId(null)
                  setSelectedEleveLabel('')
                }
              }}
              onFocus={() => eleveSearch.length >= 2 && setShowEleveSuggestions(true)}
              onBlur={() => setTimeout(() => setShowEleveSuggestions(false), 200)}
            />
            {selectedEleveLabel && selectedEleveId && (
              <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                Élève sélectionné : {selectedEleveLabel}
              </p>
            )}
            {showEleveSuggestions && eleveSuggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {eleveSuggestions.map((eleve) => (
                  <button
                    key={eleve.id}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-sm"
                    onMouseDown={() => handleSelectEleve(eleve)}
                  >
                    <span className="font-medium">{eleve.prenom} {eleve.nom}</span>
                    {eleve.matricule && (
                      <span className="ml-2 text-surface-500">({eleve.matricule})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {showEleveSuggestions && debouncedEleveSearch.length >= 2 && eleveSuggestions.length === 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-3 text-sm text-surface-500">
                Aucun élève trouvé
              </div>
            )}
          </div>

          <Select
            label="Type de frais"
            options={[
              { value: '', label: 'Sélectionner' },
              ...fraisOptions.map((f) => ({
                value: String(f.id),
                label: f.montant ? `${f.libelle} - ${formatCurrency(f.montant)}` : f.libelle,
              })),
            ]}
            value={selectedFraisId}
            onChange={(e) => setSelectedFraisId(e.target.value)}
          />
          <Input
            label="Montant"
            type="number"
            placeholder="0"
            value={formMontant}
            onChange={(e) => setFormMontant(e.target.value)}
          />
          <Select
            label="Mode de paiement"
            options={[
              { value: 'especes', label: 'Espèces' },
              { value: 'mobile_money', label: 'Mobile Money' },
              { value: 'virement', label: 'Virement' },
              { value: 'cheque', label: 'Chèque' },
            ]}
            value={formModePaiement}
            onChange={(e) => setFormModePaiement(e.target.value)}
          />
          <Input
            label="Référence"
            placeholder="Numéro de référence (optionnel)"
            value={formReference}
            onChange={(e) => setFormReference(e.target.value)}
          />
          <Input
            label="Observations"
            placeholder="Notes ou observations (optionnel)"
            value={formObservations}
            onChange={(e) => setFormObservations(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleCloseNewModal}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmitPaiement}
              disabled={!selectedEleveId || !formMontant || createMutation.isPending}
            >
              {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={exportConfigs.paiements.title}
        filename={exportConfigs.paiements.filename}
        columns={exportConfigs.paiements.columns}
        data={exportData}
        subtitle={`Année scolaire 2024-2025`}
      />

      {/* Modal confirmation suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer ce paiement ?"
        message={
          <p>
            Êtes-vous sûr de vouloir supprimer le paiement de{' '}
            <strong>{formatCurrency(selectedPaiement?.montant || 0)}</strong>
            {selectedPaiement?.eleve && (
              <> pour <strong>{formatFullName(selectedPaiement.eleve.nom, selectedPaiement.eleve.prenom)}</strong></>
            )}
            ?
            <br />
            <span className="text-sm text-surface-500">
              Cette action est irréversible.
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

export { PaiementsPage }
