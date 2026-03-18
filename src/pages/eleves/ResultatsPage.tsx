import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ExportModal } from '@/components/ui/ExportModal'
import { cn } from '@/utils/cn'
import { api } from '@/services/api'
import { useUIStore } from '@/stores/uiStore'

interface ClasseItem {
  id: number
  code: string
  libelle: string
  niveau?: string
  effectif?: number
}

interface PeriodeItem {
  id: number
  libelle: string
  code?: string
}

interface NoteRecord {
  id: number
  eleve_id: number
  nom: string
  prenom: string
  matiere_id: number
  matiere: string
  coefficient: number
  note: number
  note_max: number
}

interface StudentResult {
  eleve_id: number
  eleve: string
  moyenne: number
  rang: number
  mention: string
  decision: string
  totalCoef: number
  totalPoints: number
}

const MENTION_CONFIG = [
  { min: 16, label: 'Très Bien', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { min: 14, label: 'Bien', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { min: 12, label: 'Assez Bien', color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
  { min: 10, label: 'Passable', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  { min: 0, label: 'Insuffisant', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
]

function getMention(moyenne: number): string {
  if (moyenne >= 16) return 'Très Bien'
  if (moyenne >= 14) return 'Bien'
  if (moyenne >= 12) return 'Assez Bien'
  if (moyenne >= 10) return 'Passable'
  return '-'
}

function getDecision(moyenne: number): string {
  if (moyenne >= 10) return 'Admis'
  if (moyenne >= 8) return 'Redouble'
  return 'Exclu'
}

function getMentionConfig(moyenne: number) {
  return MENTION_CONFIG.find(m => moyenne >= m.min) || MENTION_CONFIG[MENTION_CONFIG.length - 1]
}

const RESULTATS_EXPORT_COLUMNS = [
  { key: 'rang', header: 'Rang', width: 8 },
  { key: 'eleve', header: 'Élève', width: 25 },
  { key: 'moyenne', header: 'Moyenne', width: 12, format: (v: number) => v?.toFixed(2) + '/20' },
  { key: 'mention', header: 'Mention', width: 15 },
  { key: 'decision', header: 'Décision', width: 12 },
]

const ResultatsPage = () => {
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()

  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedPeriode, setSelectedPeriode] = useState('')
  const [showDeliberationModal, setShowDeliberationModal] = useState(false)
  const [showBulletinModal, setShowBulletinModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [deliberationSeuilAdmis, setDeliberationSeuilAdmis] = useState('10')
  const [deliberationSeuilExclusion, setDeliberationSeuilExclusion] = useState('8')
  const [bulletinClasse, setBulletinClasse] = useState('')
  const [bulletinPeriode, setBulletinPeriode] = useState('')
  const [bulletinFormat, setBulletinFormat] = useState('pdf')
  const [isGeneratingBulletins, setIsGeneratingBulletins] = useState(false)

  // --- API Queries ---

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get<any>('/classes')
      const d = response.data
      const list = d?.data ?? d
      return (Array.isArray(list) ? list : []) as ClasseItem[]
    },
  })

  const { data: periodes } = useQuery({
    queryKey: ['periodes'],
    queryFn: async () => {
      const response = await api.get<any>('/notes/periodes/list')
      const d = response.data
      const list = d?.data ?? d
      return (Array.isArray(list) ? list : []) as PeriodeItem[]
    },
  })

  const { data: rawNotes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ['notes-resultats', selectedClasse, selectedPeriode],
    queryFn: async () => {
      const response = await api.get<any>('/notes', {
        params: { classe_id: selectedClasse, periode_id: selectedPeriode },
      })
      const d = response.data
      const list = d?.data ?? d
      return (Array.isArray(list) ? list : []) as NoteRecord[]
    },
    enabled: !!selectedClasse && !!selectedPeriode,
  })

  // --- Compute results from raw notes ---

  const resultats: StudentResult[] = useMemo(() => {
    if (!rawNotes || rawNotes.length === 0) return []

    const grouped = new Map<number, { eleve: string; notes: NoteRecord[] }>()

    for (const note of rawNotes) {
      const key = note.eleve_id
      if (!grouped.has(key)) {
        grouped.set(key, {
          eleve: `${note.prenom || ''} ${note.nom || ''}`.trim() || 'Élève inconnu',
          notes: [],
        })
      }
      grouped.get(key)!.notes.push(note)
    }

    const unsorted: Omit<StudentResult, 'rang'>[] = []

    for (const [eleve_id, { eleve, notes }] of grouped) {
      const matNotes = new Map<number, { totalNote: number; totalMax: number; count: number; coef: number }>()
      for (const n of notes) {
        const existing = matNotes.get(n.matiere_id)
        const noteVal = parseFloat(String(n.note)) || 0
        const maxVal = parseFloat(String(n.note_max)) || 20
        const coef = parseFloat(String(n.coefficient)) || 1
        if (existing) {
          existing.totalNote += noteVal
          existing.totalMax += maxVal
          existing.count += 1
        } else {
          matNotes.set(n.matiere_id, { totalNote: noteVal, totalMax: maxVal, count: 1, coef })
        }
      }

      let totalPoints = 0
      let totalCoef = 0
      for (const [, agg] of matNotes) {
        const avgNote = agg.totalNote / agg.count
        const avgMax = agg.totalMax / agg.count
        if (avgMax <= 0) continue
        const normalised = avgMax !== 20 ? (avgNote / avgMax) * 20 : avgNote
        totalPoints += normalised * agg.coef
        totalCoef += agg.coef
      }

      const moyenne = totalCoef > 0 ? totalPoints / totalCoef : 0

      unsorted.push({
        eleve_id,
        eleve,
        moyenne: Math.round(moyenne * 100) / 100,
        mention: getMention(moyenne),
        decision: getDecision(moyenne),
        totalCoef,
        totalPoints,
      })
    }

    unsorted.sort((a, b) => b.moyenne - a.moyenne)

    return unsorted.map((s, idx) => ({
      ...s,
      rang: idx + 1,
    }))
  }, [rawNotes])

  // --- Stats ---

  const stats = useMemo(() => {
    const total = resultats.length
    const admis = resultats.filter(r => r.decision === 'Admis').length
    const redoublants = resultats.filter(r => r.decision === 'Redouble').length
    const exclus = resultats.filter(r => r.decision === 'Exclu').length
    const moyenneClasse = total > 0
      ? (resultats.reduce((sum, r) => sum + r.moyenne, 0) / total).toFixed(2)
      : '0.00'
    return { total, admis, redoublants, exclus, moyenneClasse }
  }, [resultats])

  // --- Mutations ---

  const deliberationMutation = useMutation({
    mutationFn: async (decisions: Array<{ eleve_id: number; decision: string; moyenne: number }>) => {
      return api.post('/notes/deliberation', {
        classe_id: Number(selectedClasse),
        periode_id: Number(selectedPeriode),
        seuil_admis: Number(deliberationSeuilAdmis),
        seuil_exclusion: Number(deliberationSeuilExclusion),
        decisions,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-resultats'] })
      setShowDeliberationModal(false)
      addToast({
        type: 'success',
        title: 'Succès',
        message: 'Délibération validée avec succès !',
      })
    },
    onError: () => {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de valider la délibération.',
      })
    },
  })

  // --- Handlers ---

  const handleDeliberation = () => {
    const decisions = resultats.map(r => ({
      eleve_id: r.eleve_id,
      decision: r.decision,
      moyenne: r.moyenne,
    }))
    deliberationMutation.mutate(decisions)
  }

  const generateBulletinPdf = useCallback(async (bulletinData: any, periodeLabel: string) => {
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()

    for (let i = 0; i < bulletinData.length; i++) {
      const b = bulletinData[i]
      if (i > 0) doc.addPage()

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('BULLETIN SCOLAIRE', pw / 2, 20, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(periodeLabel, pw / 2, 27, { align: 'center' })
      doc.line(20, 32, pw - 20, 32)

      doc.setFontSize(11)
      const eleve = b.eleve
      doc.text(`Nom : ${eleve.nom || ''} ${eleve.postnom || ''}`, 20, 40)
      doc.text(`Prénom : ${eleve.prenom || ''}`, 20, 47)
      doc.text(`Matricule : ${eleve.matricule || ''}`, pw / 2, 40)
      doc.text(`Classe : ${eleve.classe || ''}`, pw / 2, 47)

      const tableData = b.notes
        .filter((n: any) => n.moyenne !== null)
        .map((n: any, idx: number) => [
          idx + 1,
          n.matiere,
          parseFloat(String(n.coefficient)).toFixed(1),
          parseFloat(String(n.moyenne)).toFixed(2) + ' / 20',
        ])

      autoTable(doc, {
        startY: 55,
        head: [['N°', 'Matière', 'Coef.', 'Moyenne / 20']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9, cellPadding: 3 },
      })

      const finalY = (doc as any).lastAutoTable?.finalY || 120
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(`Moyenne Générale : ${b.moyenneGenerale.toFixed(2)} / 20`, 20, finalY + 12)
      if (b.rang) {
        doc.text(`Rang : ${b.rang}${b.rang === 1 ? 'er' : 'e'} / ${b.totalEleves || ''}`, pw / 2, finalY + 12)
      }
    }

    return doc
  }, [])

  const handleGenerateBulletins = async () => {
    const cId = bulletinClasse || selectedClasse
    const pId = bulletinPeriode || selectedPeriode
    if (!cId || !pId) {
      addToast({ type: 'error', title: 'Erreur', message: 'Veuillez sélectionner une classe et une période.' })
      return
    }

    setIsGeneratingBulletins(true)
    try {
      const response = await api.get<any>('/notes/bulletins/generate', {
        params: { classe_id: cId, periode_id: pId },
      })
      const d = response.data?.data ?? response.data
      if (!d?.bulletins || d.bulletins.length === 0) {
        addToast({ type: 'error', title: 'Erreur', message: 'Aucun bulletin à générer.' })
        return
      }

      const pLabel = periodes?.find(p => String(p.id) === String(pId))?.libelle || ''
      const doc = await generateBulletinPdf(d.bulletins, pLabel)
      doc.save(`bulletins_${d.classe || 'classe'}.pdf`)

      addToast({ type: 'success', title: 'Succès', message: `${d.bulletins.length} bulletin(s) générés avec succès !` })
      setShowBulletinModal(false)
    } catch {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de générer les bulletins.' })
    } finally {
      setIsGeneratingBulletins(false)
    }
  }

  const handleDownloadBulletin = async (eleveId: number) => {
    if (!selectedPeriode) return
    try {
      const response = await api.get<any>(`/notes/bulletin/${eleveId}/${selectedPeriode}`)
      const d = response.data?.data ?? response.data
      if (!d?.eleve) {
        addToast({ type: 'error', title: 'Erreur', message: 'Données du bulletin introuvables.' })
        return
      }

      const pLabel = periodes?.find(p => String(p.id) === String(selectedPeriode))?.libelle || ''
      const doc = await generateBulletinPdf([d], pLabel)
      doc.save(`bulletin_${d.eleve.prenom || ''}_${d.eleve.nom || ''}.pdf`)
    } catch {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de télécharger le bulletin.' })
    }
  }

  // --- Export data ---

  const exportData = useMemo(() => {
    return resultats.map(r => ({
      rang: `${r.rang}${r.rang === 1 ? 'er' : 'e'}`,
      eleve: r.eleve,
      moyenne: r.moyenne,
      mention: r.mention,
      decision: r.decision,
    }))
  }, [resultats])

  const selectedClasseLabel = classes?.find(c => String(c.id) === String(selectedClasse))?.libelle || ''
  const selectedPeriodeLabel = periodes?.find(p => String(p.id) === String(selectedPeriode))?.libelle || ''
  const hasSelection = !!selectedClasse && !!selectedPeriode

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Résultats & Délibérations
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Consultez les résultats, délibérez et générez les bulletins
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => setShowExportModal(true)}
            disabled={resultats.length === 0}
          >
            Exporter
          </Button>
          <Button
            variant="secondary"
            leftIcon={<FileText className="h-4 w-4" />}
            onClick={() => {
              setBulletinClasse(selectedClasse)
              setBulletinPeriode(selectedPeriode)
              setShowBulletinModal(true)
            }}
            disabled={!hasSelection}
          >
            Générer bulletins
          </Button>
          <Button
            leftIcon={<CheckCircle className="h-4 w-4" />}
            onClick={() => setShowDeliberationModal(true)}
            disabled={resultats.length === 0}
          >
            Délibérer
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <Select
            label="Classe"
            placeholder="Sélectionner une classe"
            options={
              classes?.map(c => ({ value: String(c.id), label: c.libelle || c.code })) || []
            }
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="w-full lg:w-48"
          />
          <Select
            label="Période"
            placeholder="Sélectionner une période"
            options={
              periodes?.map(p => ({ value: String(p.id), label: p.libelle })) || []
            }
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="w-full lg:w-48"
          />
          {hasSelection && (
            <div className="flex items-end">
              <Badge variant="primary" className="mb-2">
                {selectedClasseLabel} — {selectedPeriodeLabel}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-surface-500">Effectif</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.moyenneClasse}</p>
              <p className="text-xs text-surface-500">Moyenne classe</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admis}</p>
              <p className="text-xs text-surface-500">Admis</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.redoublants}</p>
              <p className="text-xs text-surface-500">Redoublants</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.exclus}</p>
              <p className="text-xs text-surface-500">Exclus</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tableau des résultats */}
      <Card padding="none">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
          <h2 className="font-semibold">
            {hasSelection
              ? `Résultats - ${selectedClasseLabel} - ${selectedPeriodeLabel}`
              : 'Résultats'}
          </h2>
          {resultats.length > 0 && (
            <Badge variant="success">Résultats calculés</Badge>
          )}
        </div>

        {!hasSelection ? (
          <div className="p-12 text-center text-surface-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-surface-300" />
            <p className="font-medium">Sélectionnez une classe et une période</p>
            <p className="text-sm mt-1">Les résultats s'afficheront automatiquement.</p>
          </div>
        ) : isLoadingNotes ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <span className="ml-3 text-surface-500">Chargement des résultats...</span>
          </div>
        ) : resultats.length === 0 ? (
          <div className="p-12 text-center text-surface-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-surface-300" />
            <p className="font-medium">Aucune note trouvée</p>
            <p className="text-sm mt-1">Aucune note n'a été saisie pour cette classe et cette période.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-900/50">
                  <th className="px-4 py-3 text-left font-semibold border-b">Rang</th>
                  <th className="px-4 py-3 text-left font-semibold border-b">Élève</th>
                  <th className="px-4 py-3 text-center font-semibold border-b">Moyenne</th>
                  <th className="px-4 py-3 text-center font-semibold border-b">Mention</th>
                  <th className="px-4 py-3 text-center font-semibold border-b">Décision</th>
                  <th className="px-4 py-3 text-center font-semibold border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resultats.map((resultat) => {
                  const mentionConfig = getMentionConfig(resultat.moyenne)
                  return (
                    <tr key={resultat.eleve_id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                      <td className="px-4 py-3 border-b">
                        <Badge
                          variant={resultat.rang <= 3 ? 'success' : 'default'}
                          className="font-bold"
                        >
                          {resultat.rang}{resultat.rang === 1 ? 'er' : 'e'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 border-b font-medium">{resultat.eleve}</td>
                      <td className="px-4 py-3 border-b text-center">
                        <span className={cn(
                          'text-lg font-bold',
                          resultat.moyenne >= 10 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {resultat.moyenne.toFixed(2)}
                        </span>
                        <span className="text-surface-400">/20</span>
                      </td>
                      <td className="px-4 py-3 border-b text-center">
                        {resultat.moyenne >= 10 && (
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', mentionConfig.color)}>
                            {mentionConfig.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b text-center">
                        <Badge
                          variant={
                            resultat.decision === 'Admis' ? 'success' :
                            resultat.decision === 'Redouble' ? 'warning' : 'error'
                          }
                        >
                          {resultat.decision}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 border-b text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadBulletin(resultat.eleve_id)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Bulletin
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Délibération */}
      <Modal
        isOpen={showDeliberationModal}
        onClose={() => setShowDeliberationModal(false)}
        title={`Délibération - ${selectedClasseLabel || 'Classe'}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              La délibération est définitive. Vérifiez les décisions avant de valider.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Critères de passage</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Moyenne minimale d'admission"
                type="number"
                value={deliberationSeuilAdmis}
                onChange={(e) => setDeliberationSeuilAdmis(e.target.value)}
              />
              <Input
                label="Moyenne d'exclusion"
                type="number"
                value={deliberationSeuilExclusion}
                onChange={(e) => setDeliberationSeuilExclusion(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Décisions automatiques</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.admis}</p>
                <p className="text-sm text-green-700">Admis</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{stats.redoublants}</p>
                <p className="text-sm text-amber-700">Redoublants</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.exclus}</p>
                <p className="text-sm text-red-700">Exclus</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowDeliberationModal(false)}>
              Annuler
            </Button>
            <Button
              leftIcon={deliberationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              onClick={handleDeliberation}
              disabled={deliberationMutation.isPending}
            >
              {deliberationMutation.isPending ? 'Validation...' : 'Valider la délibération'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Bulletin */}
      <Modal
        isOpen={showBulletinModal}
        onClose={() => setShowBulletinModal(false)}
        title="Générer les bulletins"
      >
        <div className="space-y-4">
          <Select
            label="Classe"
            placeholder="Sélectionner une classe"
            options={[
              ...(classes?.map(c => ({ value: String(c.id), label: c.libelle || c.code })) || []),
              { value: 'all', label: 'Toutes les classes' },
            ]}
            value={bulletinClasse}
            onChange={(e) => setBulletinClasse(e.target.value)}
          />
          <Select
            label="Période"
            placeholder="Sélectionner une période"
            options={
              periodes?.map(p => ({ value: String(p.id), label: p.libelle })) || []
            }
            value={bulletinPeriode}
            onChange={(e) => setBulletinPeriode(e.target.value)}
          />
          <Select
            label="Format"
            options={[
              { value: 'pdf', label: 'PDF (recommandé)' },
              { value: 'excel', label: 'Excel' },
            ]}
            value={bulletinFormat}
            onChange={(e) => setBulletinFormat(e.target.value)}
          />

          <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
            <p className="text-sm text-surface-600 dark:text-surface-400">
              {resultats.length > 0
                ? `${resultats.length} bulletin(s) seront générés pour la classe sélectionnée.`
                : 'Sélectionnez une classe et une période pour générer les bulletins.'}
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowBulletinModal(false)}>
              Annuler
            </Button>
            <Button
              leftIcon={isGeneratingBulletins ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              onClick={handleGenerateBulletins}
              disabled={isGeneratingBulletins || !bulletinClasse || !bulletinPeriode}
            >
              {isGeneratingBulletins ? 'Génération...' : 'Générer et télécharger'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={`Résultats - ${selectedClasseLabel}`}
        filename={`resultats_${selectedClasseLabel.replace(/\s+/g, '_') || 'classe'}`}
        columns={RESULTATS_EXPORT_COLUMNS}
        data={exportData}
        subtitle={selectedPeriodeLabel}
      />
    </div>
  )
}

export { ResultatsPage }
