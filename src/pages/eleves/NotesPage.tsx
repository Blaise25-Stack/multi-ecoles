import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Download,
  Save,
  Loader2,
} from 'lucide-react'
import { notesService } from '@/services/notesService'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { exportData, exportConfigs } from '@/services/exportService'
import type { ID } from '@/types'

interface NoteRecord {
  id: ID
  eleve_id: ID
  matiere_id: ID
  note: number
  note_max: number
  nom: string
  prenom: string
  matricule: string
  matiere: string
  periode: string
  type_evaluation: string
  classe: string
  coefficient?: number
}

interface ClasseItem {
  id: ID
  libelle: string
  niveau_id?: ID
}

interface MatiereItem {
  id: ID
  libelle: string
  coefficient: number
}

interface PeriodeItem {
  id: ID
  libelle: string
}

interface TypeEvaluationItem {
  id: ID
  libelle: string
}

interface StudentRow {
  eleve_id: ID
  nom: string
  prenom: string
  matricule: string
  notesByMatiere: Record<string, { note: number; note_max: number; id: ID }>
  moyenne: number
}

interface EditedNote {
  eleve_id: ID
  matiere_id: ID
  note: number
}

interface ModalStudentNote {
  eleve_id: ID
  nom: string
  prenom: string
  note: string
}

const NotesPage = () => {
  const queryClient = useQueryClient()

  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedPeriode, setSelectedPeriode] = useState('')
  const [selectedMatiereFilter, setSelectedMatiereFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedNotes, setEditedNotes] = useState<EditedNote[]>([])

  const [modalClasse, setModalClasse] = useState('')
  const [modalPeriode, setModalPeriode] = useState('')
  const [modalMatiere, setModalMatiere] = useState('')
  const [modalTypeEval, setModalTypeEval] = useState('')
  const [modalDate, setModalDate] = useState('')
  const [modalNoteMax, setModalNoteMax] = useState('20')
  const [modalStudentNotes, setModalStudentNotes] = useState<ModalStudentNote[]>([])

  const { data: classesRes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes'),
  })

  const { data: matieresRes } = useQuery({
    queryKey: ['matieres'],
    queryFn: () => api.get('/matieres'),
  })

  const { data: periodesRes } = useQuery({
    queryKey: ['periodes'],
    queryFn: () => notesService.getPeriodes(),
  })

  const { data: typesEvalRes } = useQuery({
    queryKey: ['types-evaluations'],
    queryFn: () => notesService.getTypesEvaluations(),
  })

  const classes: ClasseItem[] = classesRes?.data?.data ?? []
  const matieres: MatiereItem[] = matieresRes?.data?.data ?? []
  const periodes: PeriodeItem[] = periodesRes?.data?.data ?? []
  const typesEval: TypeEvaluationItem[] = typesEvalRes?.data?.data ?? []

  const notesEnabled = !!selectedClasse && !!selectedPeriode
  const { data: notesRes, isLoading: notesLoading } = useQuery({
    queryKey: ['notes', selectedClasse, selectedPeriode],
    queryFn: () => notesService.getNotes({ classe_id: selectedClasse, periode_id: selectedPeriode }),
    enabled: notesEnabled,
  })

  const allNotes: NoteRecord[] = notesRes?.data?.data ?? []

  const { data: modalElevesRes } = useQuery({
    queryKey: ['classe-eleves', modalClasse],
    queryFn: () => api.get('/eleves', { params: { classe_id: modalClasse, limit: 200 } }),
    enabled: !!modalClasse && showAddModal,
  })

  const saveMutation = useMutation({
    mutationFn: (notes: Parameters<typeof notesService.saveNotes>[0]) => notesService.saveNotes(notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setEditMode(false)
      setEditedNotes([])
    },
  })

  const modalSaveMutation = useMutation({
    mutationFn: (notes: Parameters<typeof notesService.saveNotes>[0]) => notesService.saveNotes(notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setShowAddModal(false)
      resetModal()
    },
  })

  const visibleMatieres = useMemo(() => {
    if (selectedMatiereFilter) {
      return matieres.filter(m => String(m.id) === selectedMatiereFilter)
    }
    const matiereIdsInNotes = new Set(allNotes.map(n => String(n.matiere_id)))
    if (matiereIdsInNotes.size === 0) return matieres
    return matieres.filter(m => matiereIdsInNotes.has(String(m.id)))
  }, [matieres, allNotes, selectedMatiereFilter])

  const studentRows: StudentRow[] = useMemo(() => {
    if (allNotes.length === 0) return []

    const grouped = new Map<string, { nom: string; prenom: string; matricule: string; notes: NoteRecord[] }>()

    for (const n of allNotes) {
      const key = String(n.eleve_id)
      if (!grouped.has(key)) {
        grouped.set(key, { nom: n.nom, prenom: n.prenom, matricule: n.matricule, notes: [] })
      }
      grouped.get(key)!.notes.push(n)
    }

    const rows: StudentRow[] = []
    for (const [eleveId, data] of grouped) {
      const notesByMatiere: Record<string, { note: number; note_max: number; id: ID }> = {}

      const matNotes = new Map<string, { totalNote: number; totalMax: number; count: number; lastId: ID }>()
      for (const n of data.notes) {
        const mKey = String(n.matiere_id)
        const noteVal = parseFloat(String(n.note)) || 0
        const maxVal = parseFloat(String(n.note_max)) || 20
        const existing = matNotes.get(mKey)
        if (existing) {
          existing.totalNote += noteVal
          existing.totalMax += maxVal
          existing.count += 1
          existing.lastId = n.id
        } else {
          matNotes.set(mKey, { totalNote: noteVal, totalMax: maxVal, count: 1, lastId: n.id })
        }
      }

      for (const [mKey, agg] of matNotes) {
        notesByMatiere[mKey] = {
          note: agg.totalNote / agg.count,
          note_max: agg.totalMax / agg.count,
          id: agg.lastId,
        }
      }

      let totalWeighted = 0
      let totalCoef = 0
      for (const m of visibleMatieres) {
        const entry = notesByMatiere[String(m.id)]
        if (entry && entry.note_max > 0) {
          const coef = parseFloat(String(m.coefficient)) || 1
          const normalized = (entry.note / entry.note_max) * 20
          totalWeighted += normalized * coef
          totalCoef += coef
        }
      }
      const moyenne = totalCoef > 0 ? totalWeighted / totalCoef : 0

      rows.push({
        eleve_id: eleveId,
        nom: data.nom,
        prenom: data.prenom,
        matricule: data.matricule,
        notesByMatiere,
        moyenne,
      })
    }

    rows.sort((a, b) => b.moyenne - a.moyenne)
    return rows
  }, [allNotes, visibleMatieres])

  const stats = useMemo(() => {
    if (studentRows.length === 0) {
      return { moyenneClasse: 0, best: 0, worst: 0, tauxReussite: 0 }
    }
    const moyennes = studentRows.map(s => s.moyenne)
    const sum = moyennes.reduce((a, b) => a + b, 0)
    const passing = moyennes.filter(m => m >= 10).length
    return {
      moyenneClasse: sum / moyennes.length,
      best: Math.max(...moyennes),
      worst: Math.min(...moyennes),
      tauxReussite: Math.round((passing / moyennes.length) * 100),
    }
  }, [studentRows])

  const getNoteColor = (note: number) => {
    if (note >= 16) return 'text-green-600 dark:text-green-400'
    if (note >= 14) return 'text-blue-600 dark:text-blue-400'
    if (note >= 10) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const handleEditNote = useCallback((eleveId: ID, matiereId: ID, value: number) => {
    setEditedNotes(prev => {
      const idx = prev.findIndex(e => String(e.eleve_id) === String(eleveId) && String(e.matiere_id) === String(matiereId))
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], note: value }
        return copy
      }
      return [...prev, { eleve_id: eleveId, matiere_id: matiereId, note: value }]
    })
  }, [])

  const handleSaveEdited = () => {
    if (editedNotes.length === 0) {
      setEditMode(false)
      return
    }

    const defaultPeriode = selectedPeriode
    const defaultTypeEval = typesEval[0]?.id ?? ''

    const payload = editedNotes.map(en => ({
      eleve_id: en.eleve_id,
      matiere_id: en.matiere_id,
      classe_id: selectedClasse as ID,
      periode_id: defaultPeriode as ID,
      type_evaluation_id: defaultTypeEval,
      note: en.note,
      note_max: 20,
    }))

    saveMutation.mutate(payload)
  }

  const resetModal = () => {
    setModalClasse('')
    setModalPeriode('')
    setModalMatiere('')
    setModalTypeEval('')
    setModalDate('')
    setModalNoteMax('20')
    setModalStudentNotes([])
  }

  const handleModalClasseChange = (classeId: string) => {
    setModalClasse(classeId)
    setModalStudentNotes([])
  }

  useMemo(() => {
    if (!modalClasse || !showAddModal) return
    const elevesData = modalElevesRes?.data?.data as Array<{ id: ID; nom: string; prenom: string; postnom?: string }> | undefined
    if (!elevesData || elevesData.length === 0) return

    if (modalStudentNotes.length === 0) {
      setModalStudentNotes(
        elevesData.map(e => ({
          eleve_id: String(e.id),
          nom: e.nom,
          prenom: e.prenom,
          note: '',
        }))
      )
    }
  }, [modalClasse, modalElevesRes, showAddModal, modalStudentNotes.length])

  const handleModalSave = () => {
    const noteMax = parseFloat(modalNoteMax) || 20
    const periodeToUse = modalPeriode || selectedPeriode
    const notesToSave = modalStudentNotes
      .filter(s => s.note !== '' && !isNaN(parseFloat(s.note)))
      .map(s => ({
        eleve_id: s.eleve_id as ID,
        matiere_id: modalMatiere as ID,
        classe_id: modalClasse as ID,
        periode_id: periodeToUse as ID,
        type_evaluation_id: modalTypeEval as ID,
        note: parseFloat(s.note),
        note_max: noteMax,
        date_evaluation: modalDate || undefined,
      }))

    if (notesToSave.length > 0) {
      modalSaveMutation.mutate(notesToSave)
    }
  }

  const selectedClasseLabel = classes.find(c => String(c.id) === selectedClasse)?.libelle ?? ''
  const selectedPeriodeLabel = periodes.find(p => String(p.id) === selectedPeriode)?.libelle ?? ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Notes & Bulletins
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Saisie et gestion des notes des élèves
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
            <DropdownItem onClick={() => exportData({
              ...exportConfigs.notes,
              data: allNotes.map(n => ({
                eleve: `${n.prenom} ${n.nom}`,
                classe: n.classe || '',
                matiere: n.matiere || '',
                note: n.note,
                coefficient: n.coefficient || 1,
                periode: n.periode || selectedPeriodeLabel,
              })),
              format: 'excel',
            })}>
              Export Excel
            </DropdownItem>
            <DropdownItem onClick={() => exportData({
              ...exportConfigs.notes,
              data: allNotes.map(n => ({
                eleve: `${n.prenom} ${n.nom}`,
                classe: n.classe || '',
                matiere: n.matiere || '',
                note: n.note,
                coefficient: n.coefficient || 1,
                periode: n.periode || selectedPeriodeLabel,
              })),
              format: 'pdf',
            })}>
              Export PDF
            </DropdownItem>
          </Dropdown>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Saisir notes
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <Select
            label="Classe"
            options={[
              { value: '', label: 'Sélectionner une classe' },
              ...classes.map(c => ({ value: String(c.id), label: c.libelle })),
            ]}
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="w-full lg:w-40"
          />
          <Select
            label="Période"
            options={[
              { value: '', label: 'Sélectionner une période' },
              ...periodes.map(p => ({ value: String(p.id), label: p.libelle })),
            ]}
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="w-full lg:w-44"
          />
          <Select
            label="Matière (filtrer)"
            options={[
              { value: '', label: 'Toutes les matières' },
              ...matieres.map(m => ({ value: String(m.id), label: m.libelle })),
            ]}
            value={selectedMatiereFilter}
            onChange={(e) => setSelectedMatiereFilter(e.target.value)}
            className="w-full lg:w-48"
          />
          <div className="flex items-end">
            {editMode ? (
              <Button
                variant="primary"
                leftIcon={saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                onClick={handleSaveEdited}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
                disabled={!notesEnabled || studentRows.length === 0}
              >
                Mode édition
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">
              {studentRows.length > 0 ? stats.moyenneClasse.toFixed(1) : '-'}
            </p>
            <p className="text-sm text-surface-500">Moyenne de classe</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {studentRows.length > 0 ? stats.best.toFixed(1) : '-'}
            </p>
            <p className="text-sm text-surface-500">Meilleure moyenne</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">
              {studentRows.length > 0 ? stats.worst.toFixed(1) : '-'}
            </p>
            <p className="text-sm text-surface-500">Plus faible moyenne</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <p className="text-3xl font-bold text-secondary-600">
              {studentRows.length > 0 ? `${stats.tauxReussite}%` : '-'}
            </p>
            <p className="text-sm text-surface-500">Taux de réussite</p>
          </div>
        </Card>
      </div>

      {/* Table des notes */}
      <Card padding="none">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h2 className="font-semibold">
            {selectedClasseLabel && selectedPeriodeLabel
              ? `Relevé de notes - ${selectedClasseLabel} - ${selectedPeriodeLabel}`
              : 'Sélectionnez une classe et une période'}
          </h2>
        </div>

        {notesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : !notesEnabled ? (
          <div className="text-center py-16 text-surface-400">
            Veuillez sélectionner une classe et une période pour afficher les notes.
          </div>
        ) : studentRows.length === 0 ? (
          <div className="text-center py-16 text-surface-400">
            Aucune note trouvée pour cette sélection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-900/50">
                  <th className="px-4 py-3 text-left font-semibold border-b border-surface-200 dark:border-surface-700 sticky left-0 bg-surface-50 dark:bg-surface-900/50">
                    Rang
                  </th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-surface-200 dark:border-surface-700 sticky left-12 bg-surface-50 dark:bg-surface-900/50 min-w-[180px]">
                    Élève
                  </th>
                  {visibleMatieres.map(m => (
                    <th key={String(m.id)} className="px-4 py-3 text-center font-semibold border-b border-surface-200 dark:border-surface-700 min-w-[100px]">
                      <div>{m.libelle}</div>
                      <div className="text-xs text-surface-400 font-normal">Coef. {m.coefficient}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold border-b border-surface-200 dark:border-surface-700 bg-primary-50 dark:bg-primary-900/20 min-w-[100px]">
                    Moyenne
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentRows.map((student, index) => (
                  <tr key={String(student.eleve_id)} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                    <td className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 sticky left-0 bg-white dark:bg-surface-800">
                      <Badge variant={index < 3 ? 'success' : 'default'}>
                        {index + 1}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 sticky left-12 bg-white dark:bg-surface-800">
                      <span className="font-medium">{student.prenom} {student.nom}</span>
                    </td>
                    {visibleMatieres.map(m => {
                      const entry = student.notesByMatiere[String(m.id)]
                      const displayNote = entry ? (entry.note / entry.note_max) * 20 : null

                      const edited = editedNotes.find(
                        e => String(e.eleve_id) === String(student.eleve_id) && String(e.matiere_id) === String(m.id)
                      )
                      const currentValue = edited ? edited.note : (entry?.note ?? '')

                      return (
                        <td key={String(m.id)} className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 text-center">
                          {editMode ? (
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.25"
                              defaultValue={currentValue}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value)
                                if (!isNaN(val)) {
                                  handleEditNote(student.eleve_id, m.id, val)
                                }
                              }}
                              className="w-16 px-2 py-1 text-center border border-surface-300 dark:border-surface-600 rounded bg-white dark:bg-surface-700"
                            />
                          ) : displayNote !== null ? (
                            <span className={cn('font-medium', getNoteColor(displayNote))}>
                              {displayNote % 1 === 0 ? displayNote : displayNote.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-surface-300">-</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 text-center bg-primary-50 dark:bg-primary-900/20">
                      <span className={cn('font-bold text-lg', getNoteColor(student.moyenne))}>
                        {student.moyenne.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal saisie notes */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetModal() }}
        title="Saisir des notes"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Classe"
              options={[
                { value: '', label: 'Choisir...' },
                ...classes.map(c => ({ value: String(c.id), label: c.libelle })),
              ]}
              value={modalClasse}
              onChange={(e) => handleModalClasseChange(e.target.value)}
            />
            <Select
              label="Période"
              options={[
                { value: '', label: 'Choisir...' },
                ...periodes.map(p => ({ value: String(p.id), label: p.libelle })),
              ]}
              value={modalPeriode}
              onChange={(e) => setModalPeriode(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Matière"
              options={[
                { value: '', label: 'Choisir...' },
                ...matieres.map(m => ({ value: String(m.id), label: m.libelle })),
              ]}
              value={modalMatiere}
              onChange={(e) => setModalMatiere(e.target.value)}
            />
            <Select
              label="Type d'évaluation"
              options={[
                { value: '', label: 'Choisir...' },
                ...typesEval.map(t => ({ value: String(t.id), label: t.libelle })),
              ]}
              value={modalTypeEval}
              onChange={(e) => setModalTypeEval(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Note maximale"
              type="number"
              value={modalNoteMax}
              onChange={(e) => setModalNoteMax(e.target.value)}
            />
            <Input
              label="Date de l'évaluation"
              type="date"
              value={modalDate}
              onChange={(e) => setModalDate(e.target.value)}
            />
          </div>

          <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mt-4">
            <p className="text-sm font-medium mb-3">Notes des élèves</p>
            {modalStudentNotes.length === 0 ? (
              <p className="text-sm text-surface-400 py-4 text-center">
                {modalClasse ? 'Chargement des élèves...' : 'Sélectionnez une classe pour voir les élèves'}
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {modalStudentNotes.map((student, idx) => (
                  <div key={student.eleve_id} className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-800 rounded">
                    <span>{student.prenom} {student.nom}</span>
                    <Input
                      type="number"
                      min="0"
                      max={modalNoteMax}
                      step="0.25"
                      placeholder={`/ ${modalNoteMax}`}
                      className="w-24"
                      value={student.note}
                      onChange={(e) => {
                        setModalStudentNotes(prev => {
                          const copy = [...prev]
                          copy[idx] = { ...copy[idx], note: e.target.value }
                          return copy
                        })
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetModal() }}>
              Annuler
            </Button>
            <Button
              leftIcon={modalSaveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              onClick={handleModalSave}
              disabled={!modalClasse || !modalMatiere || !modalTypeEval || !(modalPeriode || selectedPeriode) || modalSaveMutation.isPending}
            >
              {modalSaveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { NotesPage }
