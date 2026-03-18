import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Bell,
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
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { api } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { useDebounce } from '@/hooks/useDebounce'

const statutConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
  approuve: { label: 'Approuvé', variant: 'success' },
  en_attente: { label: 'En attente', variant: 'warning' },
  rejete: { label: 'Rejeté', variant: 'error' },
  annule: { label: 'Annulé', variant: 'info' },
}

const CongesPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedConge, setSelectedConge] = useState<any>(null)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const [form, setForm] = useState({
    employe_type: '',
    employe_id: '',
    type_conge_id: '',
    date_debut: '',
    date_fin: '',
    motif: '',
  })

  const { data: congesData, isLoading } = useQuery({
    queryKey: ['conges', page, statutFilter],
    queryFn: async () => {
      const params: any = { page, limit: 20 }
      if (statutFilter) params.statut = statutFilter
      const res = await api.get<any>('/rh/conges', { params })
      return res.data
    },
  })

  const { data: typesConges } = useQuery({
    queryKey: ['types-conges'],
    queryFn: async () => {
      const res = await api.get<any>('/rh/conges/types/list')
      return res.data?.data || res.data || []
    },
  })

  const { data: enseignantsList } = useQuery({
    queryKey: ['conges-enseignants'],
    queryFn: async () => {
      const res = await api.get<any>('/rh/enseignants', { params: { limit: 200 } })
      return (res.data?.data || []).map((e: any) => ({
        id: e.id, type: 'enseignant', label: `${e.prenom} ${e.nom} (Enseignant)`,
      }))
    },
  })

  const { data: personnelList } = useQuery({
    queryKey: ['conges-personnel'],
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
      return api.post('/rh/conges', {
        employe_type: sel.type,
        employe_id: sel.id,
        type_conge_id: parseInt(form.type_conge_id),
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        motif: form.motif,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conges'] })
      addToast({ type: 'success', title: 'Succès', message: 'Demande de congé soumise' })
      setShowNewModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de soumettre la demande' })
    },
  })

  const traiterMutation = useMutation({
    mutationFn: async ({ id, statut, commentaire }: { id: number; statut: string; commentaire?: string }) => {
      return api.put(`/rh/conges/${id}/traiter`, { statut, commentaire })
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['conges'] })
      addToast({
        type: 'success',
        title: 'Succès',
        message: vars.statut === 'approuve' ? 'Congé approuvé' : 'Congé rejeté',
      })
      setShowDetailModal(false)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de traiter la demande' })
    },
  })

  const resetForm = () => {
    setForm({ employe_type: '', employe_id: '', type_conge_id: '', date_debut: '', date_fin: '', motif: '' })
  }

  const handleSubmit = () => {
    if (!form.employe_id || !form.type_conge_id || !form.date_debut || !form.date_fin) {
      addToast({ type: 'error', title: 'Erreur', message: 'Veuillez remplir tous les champs obligatoires' })
      return
    }
    createMutation.mutate()
  }

  const conges = congesData?.data || []
  const meta = congesData?.pagination

  const filteredConges = debouncedSearch
    ? conges.filter((c: any) =>
        (c.employe_nom || '').toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : conges

  const stats = {
    total: meta?.total || conges.length,
    enAttente: conges.filter((c: any) => c.statut === 'en_attente').length,
    approuves: conges.filter((c: any) => c.statut === 'approuve').length,
    rejetes: conges.filter((c: any) => c.statut === 'rejete').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Gestion des congés
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Demandes et validation des congés du personnel
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => { resetForm(); setShowNewModal(true) }}
        >
          Nouvelle demande
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-surface-500">Total demandes</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.enAttente}</p>
              <p className="text-sm text-surface-500">En attente</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.approuves}</p>
              <p className="text-sm text-surface-500">Approuvés</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.rejetes}</p>
              <p className="text-sm text-surface-500">Rejetés</p>
            </div>
          </div>
        </Card>
      </div>

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
              { value: '', label: 'Tous les statuts' },
              { value: 'en_attente', label: 'En attente' },
              { value: 'approuve', label: 'Approuvé' },
              { value: 'rejete', label: 'Rejeté' },
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
              <TableTh>Employé</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Période</TableTh>
              <TableTh>Jours</TableTh>
              <TableTh>Statut</TableTh>
              <TableTh className="w-12"></TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={6} rows={5} />
            ) : filteredConges.length === 0 ? (
              <TableEmpty colSpan={6} message="Aucune demande de congé" />
            ) : (
              filteredConges.map((conge: any) => {
                const nameParts = (conge.employe_nom || '').split(' ')
                const dateD = conge.date_debut?.split('T')[0] || conge.date_debut
                const dateF = conge.date_fin?.split('T')[0] || conge.date_fin
                const jours = dateD && dateF ? Math.ceil((new Date(dateF).getTime() - new Date(dateD).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0
                const sc = statutConfig[conge.statut] || statutConfig.en_attente

                return (
                  <TableRow key={conge.id}>
                    <TableTd>
                      <div className="flex items-center gap-3">
                        <Avatar nom={nameParts[0] || ''} prenom={nameParts[1] || ''} size="sm" />
                        <div>
                          <p className="font-medium">{conge.employe_nom || 'Employé'}</p>
                          <p className="text-xs text-surface-500 capitalize">{conge.employe_type}</p>
                        </div>
                      </div>
                    </TableTd>
                    <TableTd>
                      <Badge variant="info">{conge.type_conge || '-'}</Badge>
                    </TableTd>
                    <TableTd>
                      <div className="text-sm">
                        <p>{formatDate(dateD)} - {formatDate(dateF)}</p>
                      </div>
                    </TableTd>
                    <TableTd>
                      <span className="font-medium">{jours} jours</span>
                    </TableTd>
                    <TableTd>
                      <Badge variant={sc.variant} dot>
                        {sc.label}
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
                          icon={<Eye className="h-4 w-4" />}
                          onClick={() => { setSelectedConge(conge); setShowDetailModal(true) }}
                        >
                          Voir détails
                        </DropdownItem>
                        {conge.statut === 'en_attente' && (
                          <>
                            <DropdownDivider />
                            <DropdownItem
                              icon={<CheckCircle className="h-4 w-4" />}
                              onClick={() => traiterMutation.mutate({ id: conge.id, statut: 'approuve' })}
                            >
                              Approuver
                            </DropdownItem>
                            <DropdownItem
                              icon={<XCircle className="h-4 w-4" />}
                              danger
                              onClick={() => traiterMutation.mutate({ id: conge.id, statut: 'rejete' })}
                            >
                              Rejeter
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

      {/* Modal nouvelle demande */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nouvelle demande de congé"
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
          <Select
            label="Type de congé *"
            options={[
              { value: '', label: 'Sélectionner le type' },
              ...(typesConges || []).map((t: any) => ({
                value: String(t.id),
                label: `${t.libelle} (max ${t.jours_max} jours)`,
              })),
            ]}
            value={form.type_conge_id}
            onChange={(e) => setForm({ ...form, type_conge_id: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début *"
              type="date"
              value={form.date_debut}
              onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
            />
            <Input
              label="Date de fin *"
              type="date"
              value={form.date_fin}
              onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
            />
          </div>
          <Input
            label="Motif"
            placeholder="Raison de la demande"
            value={form.motif}
            onChange={(e) => setForm({ ...form, motif: e.target.value })}
          />

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Bell className="h-4 w-4" />
              <span className="text-sm">La demande sera soumise pour validation.</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              leftIcon={createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {createMutation.isPending ? 'Soumission...' : 'Soumettre la demande'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal détail */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Détail de la demande"
      >
        {selectedConge && (() => {
          const nameParts = (selectedConge.employe_nom || '').split(' ')
          const dateD = selectedConge.date_debut?.split('T')[0] || selectedConge.date_debut
          const dateF = selectedConge.date_fin?.split('T')[0] || selectedConge.date_fin
          const jours = dateD && dateF ? Math.ceil((new Date(dateF).getTime() - new Date(dateD).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0
          const sc = statutConfig[selectedConge.statut] || statutConfig.en_attente

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <Avatar nom={nameParts[0] || ''} prenom={nameParts[1] || ''} size="lg" />
                <div>
                  <p className="font-semibold text-lg">{selectedConge.employe_nom || 'Employé'}</p>
                  <p className="text-sm text-surface-500 capitalize">{selectedConge.employe_type}</p>
                </div>
                <Badge variant={sc.variant} className="ml-auto">{sc.label}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-surface-500">Type de congé</p>
                  <p className="font-medium">{selectedConge.type_conge || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">Durée</p>
                  <p className="font-medium">{jours} jours</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">Date de début</p>
                  <p className="font-medium">{formatDate(dateD)}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">Date de fin</p>
                  <p className="font-medium">{formatDate(dateF)}</p>
                </div>
              </div>

              {selectedConge.motif && (
                <div>
                  <p className="text-sm text-surface-500">Motif</p>
                  <p className="font-medium">{selectedConge.motif}</p>
                </div>
              )}

              {selectedConge.commentaire_approbation && (
                <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border">
                  <p className="text-sm">
                    <strong>Commentaire :</strong> {selectedConge.commentaire_approbation}
                  </p>
                </div>
              )}

              {selectedConge.statut === 'en_attente' && (
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                  <Button
                    variant="danger"
                    leftIcon={<XCircle className="h-4 w-4" />}
                    onClick={() => traiterMutation.mutate({ id: selectedConge.id, statut: 'rejete' })}
                    disabled={traiterMutation.isPending}
                  >
                    Rejeter
                  </Button>
                  <Button
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                    onClick={() => traiterMutation.mutate({ id: selectedConge.id, statut: 'approuve' })}
                    disabled={traiterMutation.isPending}
                  >
                    Approuver
                  </Button>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

export { CongesPage }
