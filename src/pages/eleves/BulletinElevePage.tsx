import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Printer, FileText } from 'lucide-react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'

interface Periode {
  id: number
  libelle: string
  ordre: number
}

interface NoteMatiere {
  matiere_id: number
  matiere: string
  coefficient: number
  moyenne: number
  nb_evaluations: number
}

interface BulletinData {
  eleve: {
    id: number
    matricule: string
    nom: string
    postnom?: string
    prenom: string
    sexe: string
    classe: string
    niveau: string
    photo?: string
  }
  notes: NoteMatiere[]
  moyenneGenerale: number
  rang?: number
  totalEleves?: number
  appreciationGenerale?: string
}

function getAppreciation(moyenne: number): string {
  if (moyenne >= 18) return 'Excellent'
  if (moyenne >= 16) return 'Très Bien'
  if (moyenne >= 14) return 'Bien'
  if (moyenne >= 12) return 'Assez Bien'
  if (moyenne >= 10) return 'Passable'
  if (moyenne >= 8) return 'Insuffisant'
  return 'Très Insuffisant'
}

function getAppreciationColor(moyenne: number): string {
  if (moyenne >= 16) return 'text-green-600 dark:text-green-400'
  if (moyenne >= 14) return 'text-blue-600 dark:text-blue-400'
  if (moyenne >= 12) return 'text-cyan-600 dark:text-cyan-400'
  if (moyenne >= 10) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getGeneralAppreciation(moyenne: number): string {
  if (moyenne >= 16) return 'Félicitations du conseil de classe. Continuez ainsi !'
  if (moyenne >= 14) return 'Encouragements du conseil de classe. Bon travail.'
  if (moyenne >= 12) return 'Tableau d\'honneur. Travail satisfaisant.'
  if (moyenne >= 10) return 'Résultats acceptables. Peut mieux faire.'
  if (moyenne >= 8) return 'Résultats insuffisants. Des efforts soutenus sont nécessaires.'
  return 'Résultats très insuffisants. Un travail sérieux et régulier s\'impose.'
}

const BulletinElevePage = () => {
  const { id: eleveId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedPeriode, setSelectedPeriode] = useState('')

  const { data: etablissementData } = useQuery({
    queryKey: ['etablissement-bulletin'],
    queryFn: async () => {
      const response = await api.get<any>('/etablissement')
      return response.data?.data || response.data || null
    },
  })
  const nomEtablissement = etablissementData?.nom || 'Établissement Scolaire'

  const { data: periodes, isLoading: isLoadingPeriodes } = useQuery({
    queryKey: ['periodes'],
    queryFn: async () => {
      const response = await api.get<any>('/notes/periodes/list')
      const d = response.data
      const list = d?.data ?? d
      return (Array.isArray(list) ? list : []) as Periode[]
    },
  })

  const { data: bulletin, isLoading: isLoadingBulletin } = useQuery({
    queryKey: ['bulletin', eleveId, selectedPeriode],
    queryFn: async () => {
      const response = await api.get<any>('/notes/bulletin/' + eleveId + '/' + selectedPeriode)
      const d = response.data
      return (d?.data ?? d) as BulletinData
    },
    enabled: !!eleveId && !!selectedPeriode,
  })

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!bulletin) {
      window.print()
      return
    }
    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF()
      const pw = doc.internal.pageSize.getWidth()

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('République Démocratique du Congo', pw / 2, 15, { align: 'center' })
      doc.setFontSize(8)
      doc.text('Ministère de l\'Enseignement Primaire, Secondaire et Technique', pw / 2, 20, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(nomEtablissement, pw / 2, 27, { align: 'center' })
      doc.setFontSize(14)
      doc.text('BULLETIN SCOLAIRE', pw / 2, 35, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(selectedPeriodeLabel, pw / 2, 42, { align: 'center' })
      doc.line(20, 46, pw - 20, 46)

      doc.setFontSize(11)
      doc.text(`Nom : ${bulletin.eleve.nom || ''} ${bulletin.eleve.postnom || ''}`, 20, 54)
      doc.text(`Prénom : ${bulletin.eleve.prenom || ''}`, 20, 61)
      doc.text(`Matricule : ${bulletin.eleve.matricule || ''}`, pw / 2, 54)
      doc.text(`Classe : ${bulletin.eleve.classe || ''}`, pw / 2, 61)

      const tableData = bulletin.notes
        .filter((n) => n.moyenne !== null)
        .map((n, idx) => [
          idx + 1,
          n.matiere,
          parseFloat(String(n.coefficient)).toFixed(1),
          parseFloat(String(n.moyenne)).toFixed(2) + ' / 20',
          getAppreciation(parseFloat(String(n.moyenne)) || 0),
        ])

      autoTable(doc, {
        startY: 69,
        head: [['N°', 'Matière', 'Coef.', 'Moyenne / 20', 'Appréciation']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9, cellPadding: 3 },
      })

      const finalY = (doc as any).lastAutoTable?.finalY || 120
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(`Moyenne Générale : ${bulletin.moyenneGenerale.toFixed(2)} / 20`, 20, finalY + 12)
      doc.text(`Appréciation : ${getAppreciation(bulletin.moyenneGenerale)}`, 20, finalY + 20)

      doc.save(`bulletin_${bulletin.eleve.prenom}_${bulletin.eleve.nom}.pdf`)
    } catch {
      window.print()
    }
  }

  const selectedPeriodeLabel = periodes?.find(p => String(p.id) === selectedPeriode)?.libelle || ''
  const totalCoefficients = bulletin?.notes?.reduce((sum, n) => sum + n.coefficient, 0) || 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Retour
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
              Bulletin de l'élève
            </h1>
            <p className="mt-1 text-surface-500 dark:text-surface-400">
              Consultez et imprimez le bulletin scolaire
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={handlePrint}
            disabled={!bulletin}
          >
            Imprimer
          </Button>
          <Button
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleDownloadPDF}
            disabled={!bulletin}
          >
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Periode selector (hidden on print) */}
      <Card padding="md" className="print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <Select
            label="Période"
            placeholder="Sélectionner une période"
            options={
              periodes?.sort((a, b) => a.ordre - b.ordre).map(p => ({
                value: String(p.id),
                label: p.libelle,
              })) || []
            }
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="w-full sm:w-64"
          />
          {selectedPeriode && bulletin && (
            <Badge variant="primary" size="lg">
              <FileText className="h-3.5 w-3.5" />
              {selectedPeriodeLabel}
            </Badge>
          )}
        </div>
      </Card>

      {/* Loading state */}
      {isLoadingPeriodes && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!selectedPeriode && !isLoadingPeriodes && (
        <Card padding="lg">
          <div className="text-center py-8">
            <FileText className="h-16 w-16 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
            <p className="text-lg font-medium text-surface-700 dark:text-surface-300">
              Sélectionnez une période
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              Choisissez une période pour afficher le bulletin de l'élève.
            </p>
          </div>
        </Card>
      )}

      {/* Loading bulletin */}
      {selectedPeriode && isLoadingBulletin && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="ml-3 text-surface-500">Chargement du bulletin...</span>
        </div>
      )}

      {/* Bulletin content */}
      {bulletin && !isLoadingBulletin && (
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-card print:shadow-none print:border-none print:rounded-none">
          {/* School header */}
          <div className="border-b border-surface-200 dark:border-surface-700 p-6 sm:p-8 print:border-b-2 print:border-black">
            <div className="text-center space-y-1">
              <p className="text-xs sm:text-sm font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider print:text-black">
                République Démocratique du Congo
              </p>
              <p className="text-xs text-surface-400 dark:text-surface-500 print:text-black">
                Ministère de l'Enseignement Primaire, Secondaire et Technique
              </p>
              <p className="text-sm sm:text-base font-bold text-primary-700 dark:text-primary-400 mt-2 print:text-black">
                {nomEtablissement}
              </p>
              <div className="py-3">
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-primary-700 dark:text-primary-400 print:text-black">
                  BULLETIN SCOLAIRE
                </h2>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 print:text-black">
                  {selectedPeriodeLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Student info */}
          <div className="border-b border-surface-200 dark:border-surface-700 p-6 sm:p-8 print:border-b print:border-black">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-surface-500 dark:text-surface-400 min-w-[100px] print:text-black">
                    Nom :
                  </span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white print:text-black">
                    {bulletin.eleve.nom} {bulletin.eleve.postnom || ''}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-surface-500 dark:text-surface-400 min-w-[100px] print:text-black">
                    Prénom :
                  </span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white print:text-black">
                    {bulletin.eleve.prenom}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-surface-500 dark:text-surface-400 min-w-[100px] print:text-black">
                    Sexe :
                  </span>
                  <span className="text-sm text-surface-900 dark:text-white print:text-black">
                    {bulletin.eleve.sexe === 'M' ? 'Masculin' : 'Féminin'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-surface-500 dark:text-surface-400 min-w-[100px] print:text-black">
                    Matricule :
                  </span>
                  <code className="text-sm bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded print:bg-transparent print:text-black">
                    {bulletin.eleve.matricule}
                  </code>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-surface-500 dark:text-surface-400 min-w-[100px] print:text-black">
                    Classe :
                  </span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white print:text-black">
                    {bulletin.eleve.classe}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-surface-500 dark:text-surface-400 min-w-[100px] print:text-black">
                    Niveau :
                  </span>
                  <span className="text-sm text-surface-900 dark:text-white print:text-black">
                    {bulletin.eleve.niveau}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes table */}
          <div className="p-6 sm:p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-900/50 print:bg-gray-100">
                    <th className="px-4 py-3 text-left font-semibold border border-surface-200 dark:border-surface-700 print:border-black">
                      N°
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border border-surface-200 dark:border-surface-700 print:border-black">
                      Matière
                    </th>
                    <th className="px-4 py-3 text-center font-semibold border border-surface-200 dark:border-surface-700 print:border-black">
                      Coeff.
                    </th>
                    <th className="px-4 py-3 text-center font-semibold border border-surface-200 dark:border-surface-700 print:border-black">
                      Moyenne / 20
                    </th>
                    <th className="px-4 py-3 text-center font-semibold border border-surface-200 dark:border-surface-700 print:border-black">
                      Appréciation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bulletin.notes.map((note, index) => (
                    <tr
                      key={note.matiere_id}
                      className="hover:bg-surface-50 dark:hover:bg-surface-800/50 print:hover:bg-transparent"
                    >
                      <td className="px-4 py-2.5 border border-surface-200 dark:border-surface-700 text-surface-500 print:border-black print:text-black">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2.5 border border-surface-200 dark:border-surface-700 font-medium text-surface-900 dark:text-white print:border-black print:text-black">
                        {note.matiere}
                      </td>
                      <td className="px-4 py-2.5 border border-surface-200 dark:border-surface-700 text-center text-surface-700 dark:text-surface-300 print:border-black print:text-black">
                        {note.coefficient}
                      </td>
                      <td className="px-4 py-2.5 border border-surface-200 dark:border-surface-700 text-center print:border-black print:text-black">
                        <span className={`font-bold ${note.moyenne >= 10 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} print:text-black`}>
                          {note.moyenne.toFixed(2)}
                        </span>
                        <span className="text-surface-400 print:text-black"> / 20</span>
                      </td>
                      <td className={`px-4 py-2.5 border border-surface-200 dark:border-surface-700 text-center text-xs font-medium print:border-black print:text-black ${getAppreciationColor(note.moyenne)}`}>
                        {getAppreciation(note.moyenne)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Summary row */}
                <tfoot>
                  <tr className="bg-surface-50 dark:bg-surface-900/50 font-semibold print:bg-gray-100">
                    <td colSpan={2} className="px-4 py-3 border border-surface-200 dark:border-surface-700 text-right print:border-black">
                      Total coefficients / Moyenne générale
                    </td>
                    <td className="px-4 py-3 border border-surface-200 dark:border-surface-700 text-center print:border-black">
                      {totalCoefficients}
                    </td>
                    <td className="px-4 py-3 border border-surface-200 dark:border-surface-700 text-center print:border-black">
                      <span className={`text-lg font-bold ${bulletin.moyenneGenerale >= 10 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} print:text-black`}>
                        {bulletin.moyenneGenerale.toFixed(2)}
                      </span>
                      <span className="text-surface-400 print:text-black"> / 20</span>
                    </td>
                    <td className={`px-4 py-3 border border-surface-200 dark:border-surface-700 text-center font-bold print:border-black print:text-black ${getAppreciationColor(bulletin.moyenneGenerale)}`}>
                      {getAppreciation(bulletin.moyenneGenerale)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {/* Moyenne */}
              <div className={`p-4 rounded-xl border-2 text-center ${
                bulletin.moyenneGenerale >= 10
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
              } print:border-black print:bg-transparent`}>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase print:text-black">
                  Moyenne Générale
                </p>
                <p className={`text-3xl font-bold mt-1 ${
                  bulletin.moyenneGenerale >= 10
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                } print:text-black`}>
                  {bulletin.moyenneGenerale.toFixed(2)}
                  <span className="text-base font-normal text-surface-400 print:text-black"> / 20</span>
                </p>
              </div>

              {/* Rang */}
              {bulletin.rang && (
                <div className="p-4 rounded-xl border-2 border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20 text-center print:border-black print:bg-transparent">
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase print:text-black">
                    Rang
                  </p>
                  <p className="text-3xl font-bold mt-1 text-primary-600 dark:text-primary-400 print:text-black">
                    {bulletin.rang}<sup className="text-sm">{bulletin.rang === 1 ? 'er' : 'e'}</sup>
                    {bulletin.totalEleves && (
                      <span className="text-base font-normal text-surface-400 print:text-black">
                        {' '} / {bulletin.totalEleves}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Decision */}
              <div className={`p-4 rounded-xl border-2 text-center ${
                bulletin.moyenneGenerale >= 10
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
              } print:border-black print:bg-transparent`}>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase print:text-black">
                  Décision
                </p>
                <p className={`text-xl font-bold mt-1 ${
                  bulletin.moyenneGenerale >= 10
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400'
                } print:text-black`}>
                  {bulletin.moyenneGenerale >= 10 ? 'Admis(e)' : 'Non admis(e)'}
                </p>
              </div>
            </div>

            {/* Appreciation generale */}
            <div className="mt-6 p-4 rounded-xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 print:border-black print:bg-transparent">
              <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase mb-2 print:text-black">
                Appréciation générale du conseil de classe
              </p>
              <p className="text-sm text-surface-700 dark:text-surface-300 italic print:text-black">
                {bulletin.appreciationGenerale || getGeneralAppreciation(bulletin.moyenneGenerale)}
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-surface-200 dark:border-surface-700 print:border-black">
              <div className="text-center">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase print:text-black">
                  Le Titulaire de classe
                </p>
                <div className="h-16" />
                <div className="border-t border-surface-300 dark:border-surface-600 mx-8 print:border-black" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase print:text-black">
                  Le Chef d'Établissement
                </p>
                <div className="h-16" />
                <div className="border-t border-surface-300 dark:border-surface-600 mx-8 print:border-black" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { BulletinElevePage }
