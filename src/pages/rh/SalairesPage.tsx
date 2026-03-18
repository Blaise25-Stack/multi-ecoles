import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Download,
  Banknote,
  Calculator,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Eye,
  Printer,
  AlertCircle,
  CheckCircle,
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
import { formatCurrency } from '@/utils/format'
import { api } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { useDebounce } from '@/hooks/useDebounce'

const now = new Date()
const currentMois = now.getMonth() + 1
const currentAnnee = now.getFullYear()

const moisLabels: Record<number, string> = {
  1: 'Janvier', 2: 'Février', 3: 'Mars', 4: 'Avril', 5: 'Mai', 6: 'Juin',
  7: 'Juillet', 8: 'Août', 9: 'Septembre', 10: 'Octobre', 11: 'Novembre', 12: 'Décembre',
}

const SalairesPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const [selectedMois, setSelectedMois] = useState(currentMois)
  const [selectedAnnee, setSelectedAnnee] = useState(currentAnnee)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAcompteModal, setShowAcompteModal] = useState(false)
  const [showDetteModal, setShowDetteModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedEmploye, setSelectedEmploye] = useState<any>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const [acompteForm, setAcompteForm] = useState({ salaire_id: '', montant: '', motif: '' })
  const [detteForm, setDetteForm] = useState({ salaire_id: '', action: 'ajouter', montant: '', description: '' })

  const { data: allEnseignants } = useQuery({
    queryKey: ['salaires-enseignants'],
    queryFn: async () => {
      const res = await api.get<any>('/rh/enseignants', { params: { limit: 200 } })
      return (res.data?.data || []).map((e: any) => ({
        id: e.id, type: 'enseignant', label: `${e.prenom} ${e.nom}`,
      }))
    },
  })

  const { data: allPersonnel } = useQuery({
    queryKey: ['salaires-personnel'],
    queryFn: async () => {
      const res = await api.get<any>('/rh/personnel', { params: { limit: 200 } })
      return (res.data?.data || []).map((p: any) => ({
        id: p.id, type: 'personnel', label: `${p.prenom} ${p.nom}`,
      }))
    },
  })

  const allEmployes = [...(allEnseignants || []), ...(allPersonnel || [])]

  const { data: salairesData, isLoading } = useQuery({
    queryKey: ['salaires', selectedMois, selectedAnnee],
    queryFn: async () => {
      const res = await api.get<any>('/rh/salaires', {
        params: { mois: selectedMois, annee: selectedAnnee, limit: 100 },
      })
      return res.data
    },
  })

  const genererMutation = useMutation({
    mutationFn: async () => {
      await api.post('/rh/salaires/generer', { mois: selectedMois, annee: selectedAnnee, employe_type: 'enseignant' })
      await api.post('/rh/salaires/generer', { mois: selectedMois, annee: selectedAnnee, employe_type: 'personnel' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaires'] })
      addToast({ type: 'success', title: 'Succès', message: 'Salaires générés avec succès' })
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors de la génération' })
    },
  })

  const acompteMutation = useMutation({
    mutationFn: async () => {
      const montant = parseFloat(acompteForm.montant)
      if (!acompteForm.salaire_id || !montant) throw new Error('Champs requis')

      const salMatch = salaires.find((s: any) => String(s.id) === acompteForm.salaire_id)
      if (salMatch) {
        const newAvance = (parseFloat(salMatch.avance || 0) + montant)
        return api.put(`/rh/salaires/${salMatch.id}`, {
          avance: newAvance,
          observations: acompteForm.motif ? `Acompte: ${acompteForm.motif}` : undefined,
        })
      }

      const [empType, empIdStr] = acompteForm.salaire_id.split('-')
      await api.post('/rh/salaires/generer', { mois: selectedMois, annee: selectedAnnee, employe_type: empType })
      const freshRes = await api.get<any>('/rh/salaires', { params: { mois: selectedMois, annee: selectedAnnee, limit: 200 } })
      const freshSal = (freshRes.data?.data || []).find((s: any) => String(s.employe_id) === empIdStr && s.employe_type === empType)
      if (!freshSal) throw new Error('Salaire introuvable')
      return api.put(`/rh/salaires/${freshSal.id}`, {
        avance: parseFloat(freshSal.avance || 0) + montant,
        observations: acompteForm.motif ? `Acompte: ${acompteForm.motif}` : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaires'] })
      addToast({ type: 'success', title: 'Succès', message: 'Acompte enregistré' })
      setShowAcompteModal(false)
      setAcompteForm({ salaire_id: '', montant: '', motif: '' })
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'enregistrer l\'acompte' })
    },
  })

  const detteMutation = useMutation({
    mutationFn: async () => {
      const montant = parseFloat(detteForm.montant)
      if (!detteForm.salaire_id || !montant) throw new Error('Champs requis')

      let salId = detteForm.salaire_id
      let currentDette = 0

      const salMatch = salaires.find((s: any) => String(s.id) === detteForm.salaire_id)
      if (salMatch) {
        currentDette = parseFloat(salMatch.dette_anterieure || 0)
      } else {
        const [empType, empIdStr] = detteForm.salaire_id.split('-')
        await api.post('/rh/salaires/generer', { mois: selectedMois, annee: selectedAnnee, employe_type: empType })
        const freshRes = await api.get<any>('/rh/salaires', { params: { mois: selectedMois, annee: selectedAnnee, limit: 200 } })
        const freshSal = (freshRes.data?.data || []).find((s: any) => String(s.employe_id) === empIdStr && s.employe_type === empType)
        if (!freshSal) throw new Error('Salaire introuvable')
        salId = String(freshSal.id)
        currentDette = parseFloat(freshSal.dette_anterieure || 0)
      }
      const newDette = detteForm.action === 'ajouter'
        ? currentDette + montant
        : Math.max(0, currentDette - montant)
      return api.put(`/rh/salaires/${salId}`, {
        dette_anterieure: newDette,
        observations: detteForm.description || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaires'] })
      addToast({ type: 'success', title: 'Succès', message: 'Dette mise à jour' })
      setShowDetteModal(false)
      setDetteForm({ salaire_id: '', action: 'ajouter', montant: '', description: '' })
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de mettre à jour la dette' })
    },
  })

  const payerMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.put(`/rh/salaires/${id}`, {
        statut: 'paye',
        date_paiement: new Date().toISOString().split('T')[0],
        mode_paiement: 'especes',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaires'] })
      addToast({ type: 'success', title: 'Succès', message: 'Salaire marqué comme payé' })
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Erreur lors du paiement' })
    },
  })

  const salaires = salairesData?.data || []

  const filteredSalaires = useMemo(() => {
    if (!debouncedSearch) return salaires
    const q = debouncedSearch.toLowerCase()
    return salaires.filter((s: any) =>
      (s.employe_nom || '').toLowerCase().includes(q) ||
      (s.employe_matricule || '').toLowerCase().includes(q)
    )
  }, [salaires, debouncedSearch])

  const totalBrut = salaires.reduce((sum: number, s: any) => sum + (parseFloat(s.salaire_base) || 0) + (parseFloat(s.primes) || 0), 0)
  const totalNet = salaires.reduce((sum: number, s: any) => sum + (parseFloat(s.net_a_payer) || 0), 0)
  const totalAcomptes = salaires.reduce((sum: number, s: any) => sum + (parseFloat(s.avance) || 0), 0)
  const totalDettes = salaires.reduce((sum: number, s: any) => sum + (parseFloat(s.dette_anterieure) || 0), 0)

  const moisOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: moisLabels[i + 1],
  }))

  const anneeOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentAnnee - 2 + i),
    label: String(currentAnnee - 2 + i),
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Gestion des salaires
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Calcul et paiement des salaires du personnel
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={genererMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          onClick={() => genererMutation.mutate()}
          disabled={genererMutation.isPending}
        >
          {genererMutation.isPending ? 'Génération...' : 'Générer les salaires'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <Banknote className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(totalBrut)}</p>
              <p className="text-sm text-surface-500">Masse salariale brute</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(totalNet)}</p>
              <p className="text-sm text-surface-500">Total net à payer</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <TrendingDown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(totalAcomptes)}</p>
              <p className="text-sm text-surface-500">Acomptes versés</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(totalDettes)}</p>
              <p className="text-sm text-surface-500">Dettes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => { setAcompteForm({ salaire_id: '', montant: '', motif: '' }); setShowAcompteModal(true) }}
        >
          Enregistrer un acompte
        </Button>
        <Button
          variant="outline"
          leftIcon={<AlertCircle className="h-4 w-4" />}
          onClick={() => { setDetteForm({ salaire_id: '', action: 'ajouter', montant: '', description: '' }); setShowDetteModal(true) }}
        >
          Gérer les dettes
        </Button>
      </div>

      {/* Filtres */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <Select
            label="Mois"
            options={moisOptions}
            value={String(selectedMois)}
            onChange={(e) => setSelectedMois(parseInt(e.target.value))}
            className="w-full lg:w-40"
          />
          <Select
            label="Année"
            options={anneeOptions}
            value={String(selectedAnnee)}
            onChange={(e) => setSelectedAnnee(parseInt(e.target.value))}
            className="w-full lg:w-32"
          />
          <div className="flex-1">
            <Input
              label="Recherche"
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Employé</TableTh>
              <TableTh>Salaire base</TableTh>
              <TableTh>Primes</TableTh>
              <TableTh>Acompte</TableTh>
              <TableTh>Dette</TableTh>
              <TableTh>Net à payer</TableTh>
              <TableTh>Statut</TableTh>
              <TableTh className="w-12"></TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={8} rows={5} />
            ) : filteredSalaires.length === 0 ? (
              <TableEmpty colSpan={8} message="Aucun salaire pour cette période. Cliquez sur 'Générer les salaires'." />
            ) : (
              filteredSalaires.map((salaire: any) => {
                const nameParts = (salaire.employe_nom || '').split(' ')
                return (
                  <TableRow key={salaire.id}>
                    <TableTd>
                      <div className="flex items-center gap-3">
                        <Avatar nom={nameParts[0] || ''} prenom={nameParts[1] || ''} size="sm" />
                        <div>
                          <p className="font-medium">{salaire.employe_nom || 'Employé'}</p>
                          <p className="text-xs text-surface-500">{salaire.employe_matricule || salaire.employe_type}</p>
                        </div>
                      </div>
                    </TableTd>
                    <TableTd>{formatCurrency(parseFloat(salaire.salaire_base) || 0)}</TableTd>
                    <TableTd className="text-green-600">{formatCurrency(parseFloat(salaire.primes) || 0)}</TableTd>
                    <TableTd>
                      {parseFloat(salaire.avance) > 0 ? (
                        <span className="text-amber-600">-{formatCurrency(parseFloat(salaire.avance))}</span>
                      ) : '-'}
                    </TableTd>
                    <TableTd>
                      {parseFloat(salaire.dette_anterieure) > 0 ? (
                        <span className="text-red-600">-{formatCurrency(parseFloat(salaire.dette_anterieure))}</span>
                      ) : '-'}
                    </TableTd>
                    <TableTd>
                      <span className="font-bold text-primary-600">{formatCurrency(parseFloat(salaire.net_a_payer) || 0)}</span>
                    </TableTd>
                    <TableTd>
                      <Badge variant={salaire.statut === 'paye' ? 'success' : 'warning'} dot>
                        {salaire.statut === 'paye' ? 'Payé' : 'En attente'}
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
                          onClick={() => { setSelectedEmploye(salaire); setShowDetailModal(true) }}
                        >
                          Voir détail
                        </DropdownItem>
                        {salaire.statut !== 'paye' && (
                          <>
                            <DropdownDivider />
                            <DropdownItem
                              icon={<CheckCircle className="h-4 w-4" />}
                              onClick={() => payerMutation.mutate(salaire.id)}
                            >
                              Marquer payé
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

      {/* Modal Acompte */}
      <Modal
        isOpen={showAcompteModal}
        onClose={() => setShowAcompteModal(false)}
        title="Enregistrer un acompte"
      >
        <div className="space-y-4">
          <Select
            label="Employé *"
            options={[
              { value: '', label: 'Sélectionner un employé' },
              ...(salaires.length > 0
                ? salaires.map((s: any) => ({
                    value: String(s.id),
                    label: `${s.employe_nom || 'Employé'} (${s.employe_matricule || s.employe_type})`,
                  }))
                : allEmployes.map((e: any) => ({
                    value: `${e.type}-${e.id}`,
                    label: `${e.label} (${e.type})`,
                  }))
              ),
            ]}
            value={acompteForm.salaire_id}
            onChange={(e) => setAcompteForm({ ...acompteForm, salaire_id: e.target.value })}
          />
          <Input
            label="Montant (FC) *"
            type="number"
            placeholder="50000"
            value={acompteForm.montant}
            onChange={(e) => setAcompteForm({ ...acompteForm, montant: e.target.value })}
          />
          <Input
            label="Motif"
            placeholder="Raison de l'acompte"
            value={acompteForm.motif}
            onChange={(e) => setAcompteForm({ ...acompteForm, motif: e.target.value })}
          />

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              L'acompte sera déduit automatiquement du salaire net.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAcompteModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => acompteMutation.mutate()}
              disabled={acompteMutation.isPending}
              leftIcon={acompteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {acompteMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Dette */}
      <Modal
        isOpen={showDetteModal}
        onClose={() => setShowDetteModal(false)}
        title="Gérer les dettes"
      >
        <div className="space-y-4">
          <Select
            label="Employé *"
            options={[
              { value: '', label: 'Sélectionner un employé' },
              ...(salaires.length > 0
                ? salaires.map((s: any) => ({
                    value: String(s.id),
                    label: `${s.employe_nom || 'Employé'} (Dette: ${formatCurrency(parseFloat(s.dette_anterieure) || 0)})`,
                  }))
                : allEmployes.map((e: any) => ({
                    value: `${e.type}-${e.id}`,
                    label: `${e.label} (${e.type})`,
                  }))
              ),
            ]}
            value={detteForm.salaire_id}
            onChange={(e) => setDetteForm({ ...detteForm, salaire_id: e.target.value })}
          />
          <Select
            label="Action *"
            options={[
              { value: 'ajouter', label: 'Ajouter une dette' },
              { value: 'rembourser', label: 'Enregistrer un remboursement' },
            ]}
            value={detteForm.action}
            onChange={(e) => setDetteForm({ ...detteForm, action: e.target.value })}
          />
          <Input
            label="Montant (FC) *"
            type="number"
            placeholder="50000"
            value={detteForm.montant}
            onChange={(e) => setDetteForm({ ...detteForm, montant: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="Détails de la dette ou du remboursement"
            value={detteForm.description}
            onChange={(e) => setDetteForm({ ...detteForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowDetteModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => detteMutation.mutate()}
              disabled={detteMutation.isPending}
              leftIcon={detteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {detteMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Détail */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Bulletin de salaire"
        size="lg"
      >
        {selectedEmploye && (() => {
          const nameParts = (selectedEmploye.employe_nom || '').split(' ')
          const sBase = parseFloat(selectedEmploye.salaire_base) || 0
          const primes = parseFloat(selectedEmploye.primes) || 0
          const deductions = parseFloat(selectedEmploye.deductions) || 0
          const avance = parseFloat(selectedEmploye.avance) || 0
          const dette = parseFloat(selectedEmploye.dette_anterieure) || 0
          const net = parseFloat(selectedEmploye.net_a_payer) || 0

          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar nom={nameParts[0] || ''} prenom={nameParts[1] || ''} size="lg" />
                  <div>
                    <p className="font-semibold text-lg">{selectedEmploye.employe_nom || 'Employé'}</p>
                    <p className="text-sm text-surface-500">{selectedEmploye.employe_matricule}</p>
                  </div>
                </div>
                <Badge variant="info">
                  {moisLabels[selectedEmploye.mois]} {selectedEmploye.annee}
                </Badge>
              </div>

              <div className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-50 dark:bg-surface-800">
                      <th className="px-4 py-2 text-left font-semibold">Libellé</th>
                      <th className="px-4 py-2 text-right font-semibold">Gains</th>
                      <th className="px-4 py-2 text-right font-semibold">Retenues</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-surface-200 dark:border-surface-700">
                      <td className="px-4 py-2">Salaire de base</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(sBase)}</td>
                      <td className="px-4 py-2 text-right">-</td>
                    </tr>
                    {primes > 0 && (
                      <tr className="border-t border-surface-200 dark:border-surface-700">
                        <td className="px-4 py-2">Primes</td>
                        <td className="px-4 py-2 text-right text-green-600">{formatCurrency(primes)}</td>
                        <td className="px-4 py-2 text-right">-</td>
                      </tr>
                    )}
                    {deductions > 0 && (
                      <tr className="border-t border-surface-200 dark:border-surface-700">
                        <td className="px-4 py-2">Déductions</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right text-red-600">{formatCurrency(deductions)}</td>
                      </tr>
                    )}
                    {avance > 0 && (
                      <tr className="border-t border-surface-200 dark:border-surface-700">
                        <td className="px-4 py-2">Acompte</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right text-amber-600">{formatCurrency(avance)}</td>
                      </tr>
                    )}
                    {dette > 0 && (
                      <tr className="border-t border-surface-200 dark:border-surface-700">
                        <td className="px-4 py-2">Dette antérieure</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right text-red-600">{formatCurrency(dette)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-surface-300 dark:border-surface-600 bg-primary-50 dark:bg-primary-900/20">
                      <td className="px-4 py-3 font-bold">NET À PAYER</td>
                      <td colSpan={2} className="px-4 py-3 text-right font-bold text-xl text-primary-600">
                        {formatCurrency(net)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end gap-3">
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

export { SalairesPage }
