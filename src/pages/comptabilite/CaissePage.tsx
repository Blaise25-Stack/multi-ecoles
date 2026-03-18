import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  Download,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
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
import { useToast } from '@/hooks/useToast'
import { api } from '@/services/api'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import { exportData, exportConfigs } from '@/services/exportService'

const CaissePage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [typeFilter, setTypeFilter] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newMouvementType, setNewMouvementType] = useState<'entree' | 'sortie'>('entree')

  const [form, setForm] = useState({
    libelle: '',
    montant: '',
    reference: '',
    source: '',
  })

  const { data: soldeData } = useQuery({
    queryKey: ['caisse-solde'],
    queryFn: async () => {
      const res = await api.get<any>('/comptabilite/caisse/solde')
      return res.data?.data || res.data || { solde: 0, totalEntrees: 0, totalSorties: 0 }
    },
  })

  const { data: mouvementsData, isLoading } = useQuery({
    queryKey: ['caisse-mouvements', typeFilter, dateDebut, dateFin],
    queryFn: async () => {
      const params: any = { per_page: 100 }
      if (typeFilter) params.type = typeFilter
      if (dateDebut) params.date_debut = dateDebut
      if (dateFin) params.date_fin = dateFin
      const res = await api.get<any>('/comptabilite/caisse/mouvements', { params })
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.libelle || !form.montant) throw new Error('Champs requis')
      return api.post('/comptabilite/caisse/mouvements', {
        type: newMouvementType,
        montant: parseFloat(form.montant),
        libelle: form.libelle,
        reference: form.reference || null,
        source: newMouvementType === 'entree' ? form.source : undefined,
        motif: newMouvementType === 'sortie' ? form.source : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caisse-mouvements'] })
      queryClient.invalidateQueries({ queryKey: ['caisse-solde'] })
      addToast({
        type: 'success',
        title: 'Succès',
        message: `${newMouvementType === 'entree' ? 'Entrée' : 'Sortie'} enregistrée`,
      })
      setShowNewModal(false)
      setForm({ libelle: '', montant: '', reference: '', source: '' })
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: "Impossible d'enregistrer le mouvement" })
    },
  })

  const mouvements: any[] = mouvementsData?.data || []
  const solde = soldeData?.solde || 0
  const totalEntrees = soldeData?.totalEntrees || 0
  const totalSorties = soldeData?.totalSorties || 0

  const openNewModal = (type: 'entree' | 'sortie') => {
    setNewMouvementType(type)
    setForm({ libelle: '', montant: '', reference: '', source: '' })
    setShowNewModal(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Gestion de la caisse
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Suivi des entrées et sorties de caisse
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
            <DropdownItem onClick={() => exportData({ ...exportConfigs.caisse, data: mouvements, format: 'excel' })}>
              Export Excel
            </DropdownItem>
            <DropdownItem onClick={() => exportData({ ...exportConfigs.caisse, data: mouvements, format: 'pdf' })}>
              Export PDF
            </DropdownItem>
          </Dropdown>
          <Button
            variant="success"
            leftIcon={<ArrowDownLeft className="h-4 w-4" />}
            onClick={() => openNewModal('entree')}
          >
            Entrée
          </Button>
          <Button
            variant="danger"
            leftIcon={<ArrowUpRight className="h-4 w-4" />}
            onClick={() => openNewModal('sortie')}
          >
            Sortie
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="none" className="overflow-hidden">
          <div className="p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20">
                <Wallet className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm opacity-80">Solde actuel</p>
                <p className="text-3xl font-bold">{formatCurrency(solde)}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Total entrées</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEntrees)}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Total sorties</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSorties)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            options={[
              { value: '', label: 'Tous les mouvements' },
              { value: 'entree', label: 'Entrées seulement' },
              { value: 'sortie', label: 'Sorties seulement' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-48"
          />
          <Input
            type="date"
            className="w-full sm:w-40"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            placeholder="Date début"
          />
          <Input
            type="date"
            className="w-full sm:w-40"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            placeholder="Date fin"
          />
        </div>
      </Card>

      {/* Table des mouvements */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Date & Heure</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Libellé</TableTh>
              <TableTh>Référence</TableTh>
              <TableTh>Montant</TableTh>
              <TableTh>Solde après</TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={6} rows={10} />
            ) : mouvements.length === 0 ? (
              <TableEmpty colSpan={6} message="Aucun mouvement de caisse" />
            ) : (
              mouvements.map((mouvement: any) => (
                <TableRow key={mouvement.id}>
                  <TableTd className="whitespace-nowrap">
                    {formatDateTime(mouvement.date_mouvement)}
                  </TableTd>
                  <TableTd>
                    <Badge
                      variant={mouvement.type === 'entree' ? 'success' : 'error'}
                      className="flex items-center gap-1 w-fit"
                    >
                      {mouvement.type === 'entree' ? (
                        <ArrowDownLeft className="h-3 w-3" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3" />
                      )}
                      {mouvement.type === 'entree' ? 'Entrée' : 'Sortie'}
                    </Badge>
                  </TableTd>
                  <TableTd className="font-medium">{mouvement.libelle}</TableTd>
                  <TableTd>
                    {mouvement.reference_type ? (
                      <code className="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">
                        {mouvement.reference_type}
                      </code>
                    ) : '-'}
                  </TableTd>
                  <TableTd>
                    <span className={cn(
                      'font-semibold',
                      mouvement.type === 'entree'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}>
                      {mouvement.type === 'entree' ? '+' : '-'}{formatCurrency(mouvement.montant)}
                    </span>
                  </TableTd>
                  <TableTd className="font-medium">
                    {mouvement.solde_apres != null ? formatCurrency(mouvement.solde_apres) : '-'}
                  </TableTd>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal nouveau mouvement */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title={newMouvementType === 'entree' ? 'Nouvelle entrée de caisse' : 'Nouvelle sortie de caisse'}
      >
        <div className="space-y-4">
          <div className={cn(
            'p-4 rounded-lg',
            newMouvementType === 'entree'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          )}>
            <p className="text-sm font-medium">
              Solde actuel : <span className="text-lg">{formatCurrency(solde)}</span>
            </p>
          </div>

          <Input
            label="Libellé *"
            placeholder="Description du mouvement"
            value={form.libelle}
            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
          />
          <Input
            label="Montant (FC) *"
            type="number"
            placeholder="50000"
            value={form.montant}
            onChange={(e) => setForm({ ...form, montant: e.target.value })}
          />
          <Input
            label="Référence (optionnel)"
            placeholder="N° de reçu ou facture"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />

          {newMouvementType === 'entree' && (
            <Select
              label="Source"
              options={[
                { value: '', label: 'Sélectionner' },
                { value: 'paiements', label: 'Paiements élèves' },
                { value: 'autre', label: 'Autre' },
              ]}
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          )}

          {newMouvementType === 'sortie' && (
            <Select
              label="Motif"
              options={[
                { value: '', label: 'Sélectionner' },
                { value: 'depense', label: 'Dépense' },
                { value: 'virement', label: 'Virement bancaire' },
                { value: 'autre', label: 'Autre' },
              ]}
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button
              variant={newMouvementType === 'entree' ? 'success' : 'danger'}
              onClick={() => createMutation.mutate()}
              disabled={!form.libelle || !form.montant || createMutation.isPending}
              leftIcon={createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { CaissePage }
