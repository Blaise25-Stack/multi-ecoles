import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Download,
  Printer,
  Calendar,
  Edit,
  Trash2,
  X,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import { api } from '@/services/api'
import { cn } from '@/utils/cn'

const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const creneaux = [
  { id: 1, debut: '07:30', fin: '08:30' },
  { id: 2, debut: '08:30', fin: '09:30' },
  { id: 3, debut: '09:45', fin: '10:45' },
  { id: 4, debut: '10:45', fin: '11:45' },
  { id: 5, debut: '12:30', fin: '13:30' },
  { id: 6, debut: '13:30', fin: '14:30' },
  { id: 7, debut: '14:45', fin: '15:45' },
  { id: 8, debut: '15:45', fin: '16:45' },
]

const colorMap: Record<string, string> = {
  'Mathématiques': 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  'Français': 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  'Anglais': 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
  'Physique-Chimie': 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  'SVT': 'bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700',
  'Histoire-Géo': 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
  'EPS': 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
  'Informatique': 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700',
  'ECM': 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700',
  'default': 'bg-surface-100 dark:bg-surface-800 border-surface-300 dark:border-surface-600',
}

interface Seance {
  id: number
  jour: string
  creneauId: number
  matiere: string
  matiereId?: number
  enseignant: string
  enseignantId?: number
  salle: string
  salleId?: number
}

interface FormData {
  matiereId: string
  enseignantId: string
  salleId: string
}

const EmploiDuTempsPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [selectedClasse, setSelectedClasse] = useState('')
  const [viewMode, setViewMode] = useState<'classe' | 'enseignant'>('classe')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showNewSalleModal, setShowNewSalleModal] = useState(false)
  const [newSalleLibelle, setNewSalleLibelle] = useState('')
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null)
  const [newSeanceInfo, setNewSeanceInfo] = useState<{ jour: string; creneauId: number } | null>(null)
  const [formData, setFormData] = useState<FormData>({ matiereId: '', enseignantId: '', salleId: '' })

  const { data: classes } = useQuery({
    queryKey: ['classes-emploi'],
    queryFn: async () => {
      const response = await api.get<any>('/classes')
      const d = response.data
      const list = d?.data ?? d
      return (Array.isArray(list) ? list : []) as { id: number; code: string; libelle: string }[]
    },
  })

  const { data: emploiDuTemps, isLoading } = useQuery({
    queryKey: ['emploi-du-temps', selectedClasse],
    queryFn: async () => {
      const response = await api.get<any>('/emploi-temps', { params: { classe_id: selectedClasse } })
      const data = response.data
      if (Array.isArray(data)) return data
      if (data?.data && Array.isArray(data.data)) return data.data
      return []
    },
    enabled: !!selectedClasse,
  })

  const { data: matieres } = useQuery({
    queryKey: ['matieres-select'],
    queryFn: async () => {
      const response = await api.get<any>('/matieres')
      const data = response.data
      if (Array.isArray(data)) return data
      if (data?.data && Array.isArray(data.data)) return data.data
      return []
    },
  })

  const { data: enseignants } = useQuery({
    queryKey: ['enseignants-select'],
    queryFn: async () => {
      const response = await api.get<any>('/rh/enseignants')
      const data = response.data
      if (Array.isArray(data)) return data
      if (data?.data && Array.isArray(data.data)) return data.data
      return []
    },
  })

  const { data: salles } = useQuery({
    queryKey: ['salles-select'],
    queryFn: async () => {
      const response = await api.get<any>('/salles')
      const data = response.data
      if (Array.isArray(data)) return data
      if (data?.data && Array.isArray(data.data)) return data.data
      return []
    },
  })

  const createSalleMutation = useMutation({
    mutationFn: async (libelle: string) => {
      return api.post('/salles', { libelle, code: `SALLE-${Date.now()}` })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salles-select'] })
      addToast({ type: 'success', title: 'Succès', message: 'Salle ajoutée avec succès' })
      setShowNewSalleModal(false)
      setNewSalleLibelle('')
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'ajouter la salle' })
    },
  })

  // Mutation pour créer une séance
  const createMutation = useMutation({
    mutationFn: async (data: { jour: string; creneauId: number } & FormData) => {
      return api.post('/emploi-temps', { ...data, classeId: selectedClasse })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emploi-du-temps'] })
      addToast({ type: 'success', title: 'Succès', message: 'Séance ajoutée avec succès' })
      setShowNewModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible d\'ajouter la séance' })
    },
  })

  // Mutation pour modifier une séance
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      return api.put(`/emploi-temps/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emploi-du-temps'] })
      addToast({ type: 'success', title: 'Succès', message: 'Séance modifiée avec succès' })
      setShowEditModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de modifier la séance' })
    },
  })

  // Mutation pour supprimer une séance
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/emploi-temps/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emploi-du-temps'] })
      addToast({ type: 'success', title: 'Succès', message: 'Séance supprimée avec succès' })
      setShowDeleteModal(false)
      setSelectedSeance(null)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer la séance' })
    },
  })

  const resetForm = () => {
    setFormData({ matiereId: '', enseignantId: '', salleId: '' })
    setSelectedSeance(null)
    setNewSeanceInfo(null)
  }

  const handleSeanceClick = (seance: Seance) => {
    setSelectedSeance(seance)
    setFormData({
      matiereId: seance.matiereId?.toString() || '',
      enseignantId: seance.enseignantId?.toString() || '',
      salleId: seance.salleId?.toString() || '',
    })
    setShowEditModal(true)
  }

  const handleEmptyClick = (jour: string, creneauId: number) => {
    resetForm()
    setNewSeanceInfo({ jour, creneauId })
    setShowNewModal(true)
  }

  const handleDelete = () => {
    setShowEditModal(false)
    setShowDeleteModal(true)
  }

  const handleSubmitNew = () => {
    if (!newSeanceInfo || !formData.matiereId) return
    createMutation.mutate({ ...newSeanceInfo, ...formData })
  }

  const handleSubmitEdit = () => {
    if (!selectedSeance) return
    updateMutation.mutate({ id: selectedSeance.id, data: formData })
  }

  const handleConfirmDelete = () => {
    if (!selectedSeance) return
    deleteMutation.mutate(selectedSeance.id)
  }

  // Organiser l'emploi du temps par jour et créneau
  const emploiParJour: Record<string, Record<number, Seance | null>> = {}
  jours.forEach(jour => {
    emploiParJour[jour] = {}
    creneaux.forEach(c => {
      emploiParJour[jour][c.id] = null
    })
  })

  emploiDuTemps?.forEach(seance => {
    if (emploiParJour[seance.jour]) {
      emploiParJour[seance.jour][seance.creneauId] = seance
    }
  })

  const getSeanceColor = (matiere: string) => {
    return colorMap[matiere] || colorMap['default']
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Emploi du temps
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Planification des cours et des salles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Imprimer
          </Button>
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => window.print()}>
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <Select
            label="Vue par"
            options={[
              { value: 'classe', label: 'Classe' },
              { value: 'enseignant', label: 'Enseignant' },
            ]}
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'classe' | 'enseignant')}
            className="w-full sm:w-40"
          />
          {viewMode === 'classe' ? (
            <Select
              label="Classe"
              placeholder="Sélectionner une classe"
              options={
                classes?.map(c => ({ value: String(c.id), label: c.libelle || c.code })) || []
              }
              value={selectedClasse}
              onChange={(e) => setSelectedClasse(e.target.value)}
              className="w-full sm:w-48"
            />
          ) : (
            <Select
              label="Enseignant"
              options={[
                { value: '', label: 'Sélectionner' },
                ...(enseignants || []).map((e: any) => ({ value: e.id.toString(), label: `${e.prenom} ${e.nom}` }))
              ]}
              className="w-full sm:w-48"
            />
          )}
          <Badge variant="primary" className="mb-2">
            Année 2024-2025
          </Badge>
        </div>
      </Card>

      {/* Emploi du temps grid */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Emploi du temps
            <span className="text-surface-500 font-normal text-sm">
              (Cliquez sur une case pour modifier)
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-900/50">
                <th className="p-3 text-left font-semibold border-b border-r border-surface-200 dark:border-surface-700 w-24">
                  Horaires
                </th>
                {jours.map(jour => (
                  <th key={jour} className="p-3 text-center font-semibold border-b border-surface-200 dark:border-surface-700">
                    {jour}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
                    <p className="mt-2 text-surface-500">Chargement...</p>
                  </td>
                </tr>
              ) : (
                creneaux.map(creneau => (
                  <tr key={creneau.id}>
                    <td className="p-2 text-sm font-medium border-r border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
                      <div>{creneau.debut}</div>
                      <div className="text-surface-400">{creneau.fin}</div>
                    </td>
                    {jours.map(jour => {
                      const seance = emploiParJour[jour]?.[creneau.id]
                      return (
                        <td key={`${jour}-${creneau.id}`} className="p-1 border-b border-surface-200 dark:border-surface-700 h-20">
                          {seance ? (
                            <div 
                              className={cn(
                                'h-full p-2 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity group relative',
                                getSeanceColor(seance.matiere)
                              )}
                              onClick={() => handleSeanceClick(seance)}
                            >
                              <p className="font-medium text-sm truncate">{seance.matiere}</p>
                              <p className="text-xs text-surface-600 dark:text-surface-400 truncate">{seance.enseignant}</p>
                              <p className="text-xs text-surface-500 truncate">{seance.salle}</p>
                              {/* Actions au survol */}
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button 
                                  className="p-1 bg-white dark:bg-surface-800 rounded shadow-sm hover:bg-surface-100"
                                  onClick={(e) => { e.stopPropagation(); handleSeanceClick(seance) }}
                                >
                                  <Edit className="h-3 w-3 text-surface-600" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="h-full p-2 rounded-lg border border-dashed border-surface-200 dark:border-surface-700 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors flex items-center justify-center"
                              onClick={() => handleEmptyClick(jour, creneau.id)}
                            >
                              <Plus className="h-4 w-4 text-surface-300 dark:text-surface-600" />
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Légende */}
      <Card padding="md">
        <h3 className="font-semibold mb-3">Légende des matières</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(colorMap).filter(([key]) => key !== 'default').map(([nom, color]) => (
            <div key={nom} className="flex items-center gap-2">
              <div className={cn('w-4 h-4 rounded border', color)} />
              <span className="text-sm">{nom}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal nouvelle séance */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Ajouter une séance"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
            <p className="text-sm text-surface-600 dark:text-surface-400">
              <strong>{newSeanceInfo?.jour}</strong> - Créneau {newSeanceInfo?.creneauId}
            </p>
          </div>
          <Select
            label="Matière *"
            options={[
              { value: '', label: 'Sélectionner' },
              ...(matieres || []).map((m: any) => ({ value: m.id.toString(), label: m.libelle }))
            ]}
            value={formData.matiereId}
            onChange={(e) => setFormData({ ...formData, matiereId: e.target.value })}
          />
          <Select
            label="Enseignant"
            options={[
              { value: '', label: 'Sélectionner' },
              ...(enseignants || []).map((e: any) => ({ value: e.id.toString(), label: `${e.prenom} ${e.nom}` }))
            ]}
            value={formData.enseignantId}
            onChange={(e) => setFormData({ ...formData, enseignantId: e.target.value })}
          />
          <div>
            <div className="flex items-end gap-2">
              <Select
                label="Salle"
                options={[
                  { value: '', label: 'Sélectionner' },
                  ...(salles || []).map((s: any) => ({ value: s.id.toString(), label: s.libelle }))
                ]}
                value={formData.salleId}
                onChange={(e) => setFormData({ ...formData, salleId: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewSalleModal(true)}
                className="mb-0.5"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitNew}
              disabled={!formData.matiereId || createMutation.isPending}
              leftIcon={createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {createMutation.isPending ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal édition séance */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier la séance"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
            <p className="text-sm text-surface-600 dark:text-surface-400">
              <strong>{selectedSeance?.jour}</strong> - {selectedSeance?.matiere}
            </p>
          </div>
          <Select
            label="Matière"
            options={[
              { value: '', label: 'Sélectionner' },
              ...(matieres || []).map((m: any) => ({ value: m.id.toString(), label: m.libelle }))
            ]}
            value={formData.matiereId}
            onChange={(e) => setFormData({ ...formData, matiereId: e.target.value })}
          />
          <Select
            label="Enseignant"
            options={[
              { value: '', label: 'Sélectionner' },
              ...(enseignants || []).map((e: any) => ({ value: e.id.toString(), label: `${e.prenom} ${e.nom}` }))
            ]}
            value={formData.enseignantId}
            onChange={(e) => setFormData({ ...formData, enseignantId: e.target.value })}
          />
          <div>
            <div className="flex items-end gap-2">
              <Select
                label="Salle"
                options={[
                  { value: '', label: 'Sélectionner' },
                  ...(salles || []).map((s: any) => ({ value: s.id.toString(), label: s.libelle }))
                ]}
                value={formData.salleId}
                onChange={(e) => setFormData({ ...formData, salleId: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewSalleModal(true)}
                className="mb-0.5"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button 
              variant="danger" 
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={handleDelete}
            >
              Supprimer
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSubmitEdit}
                disabled={updateMutation.isPending}
                leftIcon={updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
              >
                {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal confirmation suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer cette séance ?"
        message={
          <p>
            Êtes-vous sûr de vouloir supprimer la séance de{' '}
            <strong>{selectedSeance?.matiere}</strong> du {selectedSeance?.jour} ?
          </p>
        }
        confirmText="Supprimer"
        type="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Modal nouvelle salle */}
      <Modal
        isOpen={showNewSalleModal}
        onClose={() => setShowNewSalleModal(false)}
        title="Ajouter une salle"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nom de la salle *"
            placeholder="Ex: Laboratoire A1, Salle Informatique..."
            value={newSalleLibelle}
            onChange={(e) => setNewSalleLibelle(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowNewSalleModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => newSalleLibelle.trim() && createSalleMutation.mutate(newSalleLibelle.trim())}
              disabled={!newSalleLibelle.trim() || createSalleMutation.isPending}
              leftIcon={createSalleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {createSalleMutation.isPending ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { EmploiDuTempsPage }
