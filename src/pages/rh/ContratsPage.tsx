import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Download,
  FileCheck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
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
import { formatDate, formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import { differenceInDays, parseISO } from 'date-fns'
import { api } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { useDebounce } from '@/hooks/useDebounce'

const typeContratConfig: Record<string, { label: string; color: string }> = {
  CDI: { label: 'CDI', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CDD: { label: 'CDD', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  Vacation: { label: 'Vacation', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  Stage: { label: 'Stage', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

const statutContratConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
  actif: { label: 'Actif', variant: 'success' },
  termine: { label: 'Terminé', variant: 'error' },
  renouvele: { label: 'Renouvelé', variant: 'info' },
  resilie: { label: 'Résilié', variant: 'error' },
}

const ContratsPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [selectedContrat, setSelectedContrat] = useState<any>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const [form, setForm] = useState({
    employe_id: '',
    type_contrat: 'CDI',
    poste: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    salaire: '',
  })

  const [renewForm, setRenewForm] = useState({
    nouvelle_date_fin: '',
    nouveau_salaire: '',
  })

  const { data: contratsData, isLoading } = useQuery({
    queryKey: ['contrats', typeFilter],
    queryFn: async () => {
      const params: any = { limit: 100 }
      if (typeFilter) params.type_contrat = typeFilter
      const res = await api.get<any>('/contrats', { params })
      return res.data
    },
  })

  const { data: enseignantsList } = useQuery({
    queryKey: ['contrats-enseignants'],
    queryFn: async () => {
      const res = await api.get<any>('/rh/enseignants', { params: { limit: 200 } })
      return (res.data?.data || []).map((e: any) => ({
        id: e.id, type: 'enseignant', label: `${e.prenom} ${e.nom} (Enseignant)`,
      }))
    },
  })

  const { data: personnelList } = useQuery({
    queryKey: ['contrats-personnel'],
    queryFn: async () => {
      const res = await api.get<any>('/rh/personnel', { params: { limit: 200 } })
      return (res.data?.data || []).map((p: any) => ({
        id: p.id, type: 'personnel', label: `${p.prenom} ${p.nom} (Personnel)`,
      }))
    },
  })

  const allEmployes = [...(enseignantsList || []), ...(personnelList || [])]

  const createMutation = useMutation({
    mutationFn: async () => {
      const sel = allEmployes.find(e => `${e.type}-${e.id}` === form.employe_id)
      if (!sel) throw new Error('Employé non sélectionné')
      return api.post('/contrats', {
        employe_type: sel.type,
        employe_id: sel.id,
        type_contrat: form.type_contrat,
        date_debut: form.date_debut,
        date_fin: form.date_fin || null,
        salaire: form.salaire ? parseFloat(form.salaire) : null,
        poste: form.poste || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] })
      addToast({ type: 'success', title: 'Succès', message: 'Contrat créé avec succès' })
      setShowNewModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer le contrat' })
    },
  })

  const renewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContrat) throw new Error('Contrat non sélectionné')
      return api.put(`/contrats/${selectedContrat.id}/renouveler`, {
        nouvelle_date_fin: renewForm.nouvelle_date_fin || null,
        nouveau_salaire: renewForm.nouveau_salaire ? parseFloat(renewForm.nouveau_salaire) : null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] })
      addToast({ type: 'success', title: 'Succès', message: 'Contrat renouvelé' })
      setShowRenewModal(false)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de renouveler le contrat' })
    },
  })

  const resetForm = () => {
    setForm({ employe_id: '', type_contrat: 'CDI', poste: '', date_debut: new Date().toISOString().split('T')[0], date_fin: '', salaire: '' })
  }

  const handleSubmit = () => {
    if (!form.employe_id || !form.type_contrat || !form.date_debut) {
      addToast({ type: 'error', title: 'Erreur', message: 'Veuillez remplir les champs obligatoires' })
      return
    }
    createMutation.mutate()
  }

  const contrats = contratsData?.data || []

  const filteredContrats = useMemo(() => {
    if (!debouncedSearch) return contrats
    const q = debouncedSearch.toLowerCase()
    return contrats.filter((c: any) =>
      (c.employe_nom || '').toLowerCase().includes(q) ||
      (c.employe_matricule || '').toLowerCase().includes(q) ||
      (c.numero || '').toLowerCase().includes(q)
    )
  }, [contrats, debouncedSearch])

  const stats = {
    total: contrats.length,
    actifs: contrats.filter((c: any) => c.statut === 'actif').length,
    expireBientot: contrats.filter((c: any) => {
      if (!c.date_fin) return false
      const jours = differenceInDays(parseISO(c.date_fin.split('T')[0]), new Date())
      return jours > 0 && jours <= 30
    }).length,
    expires: contrats.filter((c: any) => {
      if (!c.date_fin) return false
      return differenceInDays(parseISO(c.date_fin.split('T')[0]), new Date()) < 0
    }).length,
  }

  const getJoursRestants = (dateFin: string | null) => {
    if (!dateFin) return null
    return differenceInDays(parseISO(dateFin.split('T')[0]), new Date())
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Suivi des contrats
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez les contrats de travail du personnel
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => { resetForm(); setShowNewModal(true) }}
        >
          Nouveau contrat
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <FileCheck className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-surface-500">Total contrats</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.actifs}</p>
              <p className="text-sm text-surface-500">Actifs</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expireBientot}</p>
              <p className="text-sm text-surface-500">Expire bientôt</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <Calendar className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expires}</p>
              <p className="text-sm text-surface-500">Expirés</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alertes */}
      {stats.expireBientot > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" padding="md">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-amber-700 dark:text-amber-400">
              <strong>{stats.expireBientot} contrat(s)</strong> expire(nt) dans les 30 prochains jours.
            </p>
          </div>
        </Card>
      )}

      {/* Filtres */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Tous les types' },
              { value: 'CDI', label: 'CDI' },
              { value: 'CDD', label: 'CDD' },
              { value: 'Vacation', label: 'Vacation' },
              { value: 'Stage', label: 'Stage' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full lg:w-40"
          />
        </div>
      </Card>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Employé</TableTh>
              <TableTh>N° Contrat</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Poste</TableTh>
              <TableTh>Période</TableTh>
              <TableTh>Salaire</TableTh>
              <TableTh>Statut</TableTh>
              <TableTh className="w-12"></TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={8} rows={5} />
            ) : filteredContrats.length === 0 ? (
              <TableEmpty colSpan={8} message="Aucun contrat trouvé" />
            ) : (
              filteredContrats.map((contrat: any) => {
                const nameParts = (contrat.employe_nom || '').split(' ')
                const dateFin = contrat.date_fin?.split('T')[0] || contrat.date_fin
                const dateDebut = contrat.date_debut?.split('T')[0] || contrat.date_debut
                const joursRestants = getJoursRestants(dateFin)
                const sc = statutContratConfig[contrat.statut] || statutContratConfig.actif
                const tc = typeContratConfig[contrat.type_contrat] || { label: contrat.type_contrat, color: 'bg-gray-100 text-gray-700' }

                return (
                  <TableRow key={contrat.id}>
                    <TableTd>
                      <div className="flex items-center gap-3">
                        <Avatar nom={nameParts[0] || ''} prenom={nameParts[1] || ''} size="sm" />
                        <div>
                          <p className="font-medium">{contrat.employe_nom || 'Employé'}</p>
                          <p className="text-xs text-surface-500">{contrat.employe_matricule}</p>
                        </div>
                      </div>
                    </TableTd>
                    <TableTd>
                      <code className="text-sm bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">
                        {contrat.numero}
                      </code>
                    </TableTd>
                    <TableTd>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', tc.color)}>
                        {tc.label}
                      </span>
                    </TableTd>
                    <TableTd>{contrat.poste || '-'}</TableTd>
                    <TableTd>
                      <div className="text-sm">
                        <p>{formatDate(dateDebut)}</p>
                        {dateFin ? (
                          <p className="text-surface-500">→ {formatDate(dateFin)}</p>
                        ) : (
                          <p className="text-surface-500">Indéterminée</p>
                        )}
                        {joursRestants !== null && joursRestants <= 30 && joursRestants > 0 && (
                          <p className="text-xs text-amber-600 font-medium mt-1">
                            {joursRestants} jours restants
                          </p>
                        )}
                      </div>
                    </TableTd>
                    <TableTd className="font-medium">
                      {contrat.salaire ? formatCurrency(parseFloat(contrat.salaire)) : '-'}
                    </TableTd>
                    <TableTd>
                      <Badge variant={sc.variant} dot>{sc.label}</Badge>
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
                          onClick={() => { setSelectedContrat(contrat); setShowDetailModal(true) }}
                        >
                          Voir détail
                        </DropdownItem>
                        {contrat.statut === 'actif' && (contrat.type_contrat === 'CDD' || contrat.type_contrat === 'Vacation') && (
                          <>
                            <DropdownDivider />
                            <DropdownItem
                              icon={<RefreshCw className="h-4 w-4" />}
                              onClick={() => {
                                setSelectedContrat(contrat)
                                setRenewForm({ nouvelle_date_fin: '', nouveau_salaire: String(contrat.salaire || '') })
                                setShowRenewModal(true)
                              }}
                            >
                              Renouveler
                            </DropdownItem>
                          </>
                        )}
                      </Dropdown>
                    </TableTd>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal nouveau contrat */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nouveau contrat"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Employé *"
            options={[
              { value: '', label: 'Sélectionner un employé' },
              ...allEmployes.map(e => ({ value: `${e.type}-${e.id}`, label: e.label })),
            ]}
            value={form.employe_id}
            onChange={(e) => setForm({ ...form, employe_id: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type de contrat *"
              options={[
                { value: 'CDI', label: 'CDI' },
                { value: 'CDD', label: 'CDD' },
                { value: 'Vacation', label: 'Vacation' },
                { value: 'Stage', label: 'Stage' },
              ]}
              value={form.type_contrat}
              onChange={(e) => setForm({ ...form, type_contrat: e.target.value })}
            />
            <Input
              label="Poste"
              placeholder="Ex: Enseignant titulaire"
              value={form.poste}
              onChange={(e) => setForm({ ...form, poste: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début *"
              type="date"
              value={form.date_debut}
              onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
            />
            <Input
              label="Date de fin (CDD)"
              type="date"
              value={form.date_fin}
              onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
            />
          </div>
          <Input
            label="Salaire de base (FC)"
            type="number"
            placeholder="200000"
            value={form.salaire}
            onChange={(e) => setForm({ ...form, salaire: e.target.value })}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              leftIcon={createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {createMutation.isPending ? 'Création...' : 'Créer le contrat'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal renouvellement */}
      <Modal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        title="Renouveler le contrat"
      >
        {selectedContrat && (
          <div className="space-y-4">
            <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <p className="font-medium">{selectedContrat.employe_nom || 'Employé'}</p>
              <p className="text-sm text-surface-500">
                Contrat actuel : {formatDate(selectedContrat.date_debut?.split('T')[0])}
                {selectedContrat.date_fin ? ` → ${formatDate(selectedContrat.date_fin.split('T')[0])}` : ''}
              </p>
            </div>

            <Input
              label="Nouvelle date de fin"
              type="date"
              value={renewForm.nouvelle_date_fin}
              onChange={(e) => setRenewForm({ ...renewForm, nouvelle_date_fin: e.target.value })}
            />
            <Input
              label="Nouveau salaire (FC)"
              type="number"
              value={renewForm.nouveau_salaire}
              onChange={(e) => setRenewForm({ ...renewForm, nouveau_salaire: e.target.value })}
            />

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowRenewModal(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => renewMutation.mutate()}
                disabled={renewMutation.isPending}
                leftIcon={renewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              >
                {renewMutation.isPending ? 'Renouvellement...' : 'Renouveler'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal détail */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détail du contrat"
        size="lg"
      >
        {selectedContrat && (() => {
          const nameParts = (selectedContrat.employe_nom || '').split(' ')
          const dateFin = selectedContrat.date_fin?.split('T')[0] || selectedContrat.date_fin
          const dateDebut = selectedContrat.date_debut?.split('T')[0] || selectedContrat.date_debut
          const sc = statutContratConfig[selectedContrat.statut] || statutContratConfig.actif
          const tc = typeContratConfig[selectedContrat.type_contrat] || { label: selectedContrat.type_contrat }

          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <Avatar nom={nameParts[0] || ''} prenom={nameParts[1] || ''} size="lg" />
                <div>
                  <p className="font-semibold text-lg">{selectedContrat.employe_nom || 'Employé'}</p>
                  <p className="text-sm text-surface-500">{selectedContrat.employe_matricule} — {selectedContrat.numero}</p>
                </div>
                <Badge variant={sc.variant} className="ml-auto">{sc.label}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-surface-500">Type de contrat</p>
                  <p className="font-medium">{tc.label}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">Poste</p>
                  <p className="font-medium">{selectedContrat.poste || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">Date de début</p>
                  <p className="font-medium">{formatDate(dateDebut)}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">Date de fin</p>
                  <p className="font-medium">
                    {dateFin ? formatDate(dateFin) : 'Indéterminée'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">Salaire</p>
                  <p className="font-medium text-primary-600">
                    {selectedContrat.salaire ? formatCurrency(parseFloat(selectedContrat.salaire)) : '-'}
                  </p>
                </div>
                {dateDebut && (
                  <div>
                    <p className="text-sm text-surface-500">Ancienneté</p>
                    <p className="font-medium">
                      {Math.floor(differenceInDays(new Date(), parseISO(dateDebut)) / 365)} an(s)
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

export { ContratsPage }
