import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Download, FileSpreadsheet, FileText, Award, CheckCircle, UserCheck, Star, Plus, Printer, Eye } from 'lucide-react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { TableContainer, Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { exportData, exportConfigs } from '@/services/exportService'

interface Eleve {
  id: string
  nom: string
  postnom?: string
  prenom: string
  classe?: string
  classe_nom?: string
}

interface AttestationRecord {
  id: string
  eleve: string
  classe: string
  type: string
  date: string
  numero: string
}

const typesAttestations = [
  {
    id: 'reussite',
    label: 'Attestation de réussite',
    icon: Award,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    description: 'Certifie la réussite scolaire de l\'élève',
  },
  {
    id: 'frequentation',
    label: 'Attestation de fréquentation',
    icon: UserCheck,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Certifie la fréquentation régulière de l\'établissement',
  },
  {
    id: 'bonne_conduite',
    label: 'Attestation de bonne conduite',
    icon: Star,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    description: 'Certifie le bon comportement de l\'élève',
  },
  {
    id: 'scolarite',
    label: 'Certificat de scolarité',
    icon: CheckCircle,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    description: 'Confirme l\'inscription de l\'élève dans l\'établissement',
  },
] as const

interface ClasseItem {
  id: number
  code: string
  libelle: string
}

const AttestationsPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedEleve, setSelectedEleve] = useState('')
  const [attestations, setAttestations] = useState<AttestationRecord[]>([])

  const [anneeScolaire, setAnneeScolaire] = useState('2024-2025')
  const [mention, setMention] = useState('')
  const [moyenne, setMoyenne] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [appreciation, setAppreciation] = useState('excellent')
  const [observations, setObservations] = useState('')

  const { data: etablissementData } = useQuery({
    queryKey: ['etablissement-attestations'],
    queryFn: async () => {
      const response = await api.get<any>('/etablissement')
      return response.data?.data || response.data || null
    },
  })
  const nomEtablissement = etablissementData?.nom || 'Établissement Scolaire'

  const { data: classesData } = useQuery({
    queryKey: ['classes-attestations'],
    queryFn: async () => {
      const response = await api.get<any>('/classes')
      const d = response.data
      const list = d?.data ?? d
      return (Array.isArray(list) ? list : []) as ClasseItem[]
    },
  })

  const { data: elevesData } = useQuery({
    queryKey: ['eleves-attestations'],
    queryFn: async () => {
      const response = await api.get<{ data: Eleve[] }>('/eleves', { params: { limit: 500 } })
      return response.data
    },
  })

  const eleves: Eleve[] = Array.isArray(elevesData)
    ? elevesData
    : (elevesData as unknown as { data: Eleve[] })?.data ?? []

  const filteredEleves = selectedClasse
    ? eleves.filter(e => {
        const classeLabel = classesData?.find(c => String(c.id) === selectedClasse)?.libelle || ''
        return (e.classe_nom || e.classe || '') === classeLabel
      })
    : eleves

  const getTypeConfig = (typeId: string) => {
    return typesAttestations.find(t => t.id === typeId)
  }

  const filteredAttestations = attestations.filter(att => {
    const matchSearch = !searchQuery ||
      att.eleve.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.numero.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = !typeFilter || att.type === typeFilter
    return matchSearch && matchType
  })

  const selectedEleveData = eleves.find(e => String(e.id) === String(selectedEleve))
  const selectedTypeData = typesAttestations.find(t => t.id === selectedType)

  const resetExtraFields = () => {
    setAnneeScolaire('2024-2025')
    setMention('')
    setMoyenne('')
    setDateDebut('')
    setDateFin('')
    setAppreciation('excellent')
    setObservations('')
  }

  const handleGenerate = () => {
    if (selectedType && selectedEleve && selectedEleveData) {
      setShowNewModal(false)
      setShowPreviewModal(true)
    }
  }

  const generateNumero = () => {
    const idx = attestations.length + 1
    return `ATT-${new Date().getFullYear()}-${String(idx).padStart(3, '0')}`
  }

  const addAttestationRecord = () => {
    if (!selectedEleveData || !selectedTypeData) return
    const eleveClasse = selectedEleveData.classe_nom || selectedEleveData.classe || '-'
    const record: AttestationRecord = {
      id: crypto.randomUUID(),
      eleve: `${selectedEleveData.prenom} ${selectedEleveData.nom}`,
      classe: eleveClasse,
      type: selectedType,
      date: new Date().toISOString().split('T')[0],
      numero: generateNumero(),
    }
    setAttestations(prev => [record, ...prev])
  }

  const buildPdfBody = (): string[] => {
    const lines: string[] = []
    if (!selectedEleveData || !selectedTypeData) return lines

    const eleveClasse = selectedEleveData.classe_nom || selectedEleveData.classe || '-'

    lines.push('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO')
    lines.push('Justice - Paix - Travail')
    lines.push('MINISTÈRE DE L\'ENSEIGNEMENT PRIMAIRE, SECONDAIRE ET TECHNIQUE')
    lines.push(nomEtablissement)
    lines.push('')
    lines.push(selectedTypeData.label.toUpperCase())
    lines.push(`N° ${generateNumero()}`)
    lines.push('')
    lines.push(`Le Directeur de ${nomEtablissement} soussigné, certifie que :`)
    lines.push('')
    lines.push(`Nom et prénom : ${selectedEleveData.prenom} ${selectedEleveData.nom.toUpperCase()}`)
    lines.push(`Classe : ${eleveClasse}`)
    lines.push(`Année scolaire : ${anneeScolaire}`)
    lines.push('')

    if (selectedType === 'reussite') {
      lines.push(`A été déclaré(e) ADMIS(E) à l'issue de l'année scolaire ${anneeScolaire}${mention ? ` avec la mention ${mention}` : ''}.`)
      if (moyenne) lines.push(`Moyenne annuelle : ${moyenne}`)
    } else if (selectedType === 'frequentation') {
      const periodStr = dateDebut && dateFin
        ? `du ${formatDate(dateDebut)} au ${formatDate(dateFin)}`
        : `durant l'année scolaire ${anneeScolaire}`
      lines.push(`A fréquenté régulièrement notre établissement ${periodStr}.`)
    } else if (selectedType === 'bonne_conduite') {
      const appreciationLabels: Record<string, string> = {
        excellent: 'excellente conduite',
        tres_bien: 'très bonne conduite',
        bien: 'bonne conduite',
        assez_bien: 'conduite assez bonne',
      }
      lines.push(`A fait preuve d'une ${appreciationLabels[appreciation] || 'bonne conduite'} et d'un comportement exemplaire durant son séjour dans notre établissement.`)
      if (observations) lines.push(`Observations : ${observations}`)
    } else if (selectedType === 'scolarite') {
      lines.push(`Est régulièrement inscrit(e) dans notre établissement pour l'année scolaire ${anneeScolaire} en classe de ${eleveClasse}.`)
    }

    lines.push('')
    lines.push('En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.')
    lines.push('')
    lines.push(`Fait à Kinshasa, le ${formatDate(new Date().toISOString())}`)
    lines.push('')
    lines.push('Le Préfet des Études')
    lines.push('[Signature et cachet]')

    return lines
  }

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const lines = buildPdfBody()
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(lines[0], pageWidth / 2, 20, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(lines[1], pageWidth / 2, 27, { align: 'center' })

    doc.setFontSize(11)
    doc.text(lines[2], pageWidth / 2, 34, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(lines[3], pageWidth / 2, 42, { align: 'center' })

    doc.setLineWidth(0.5)
    doc.line(20, 48, pageWidth - 20, 48)

    const titleLine = lines[5]
    doc.setFontSize(16)
    doc.text(titleLine, pageWidth / 2, 62, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(lines[6], pageWidth / 2, 70, { align: 'center' })

    let y = 86
    doc.setFontSize(11)
    for (let i = 8; i < lines.length; i++) {
      const line = lines[i]
      if (!line) {
        y += 6
        continue
      }
      const splitLines = doc.splitTextToSize(line, pageWidth - 40)
      doc.text(splitLines, 20, y)
      y += splitLines.length * 6
    }

    const eleveNom = selectedEleveData
      ? `${selectedEleveData.prenom}_${selectedEleveData.nom}`
      : 'attestation'
    doc.save(`${selectedType}_${eleveNom}.pdf`)

    addAttestationRecord()
    setShowPreviewModal(false)
    resetExtraFields()
    setSelectedType('')
    setSelectedEleve('')
  }

  const handlePrint = () => {
    window.print()
  }

  const handlePreviewFromTable = (att: AttestationRecord) => {
    const eleve = eleves.find(e => `${e.prenom} ${e.nom}` === att.eleve)
    if (eleve) {
      setSelectedEleve(String(eleve.id))
      setSelectedType(att.type)
      setShowPreviewModal(true)
    }
  }

  const handleDownloadFromTable = async (att: AttestationRecord) => {
    const eleve = eleves.find(e => `${e.prenom} ${e.nom}` === att.eleve)
    if (!eleve) return
    const eleveData = eleve
    const typeData = typesAttestations.find(t => t.id === att.type)
    if (!typeData) return

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const eleveClasse = eleveData.classe_nom || eleveData.classe || '-'

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('REPUBLIQUE DEMOCRATIQUE DU CONGO', pageWidth / 2, 20, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Justice - Paix - Travail', pageWidth / 2, 27, { align: 'center' })
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(typeData.label.toUpperCase(), pageWidth / 2, 50, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    let y = 70
    doc.text(`Nom et prenom : ${eleveData.prenom} ${eleveData.nom.toUpperCase()}`, 20, y); y += 8
    doc.text(`Classe : ${eleveClasse}`, 20, y); y += 12
    doc.text('En foi de quoi, la presente attestation lui est delivree', 20, y); y += 7
    doc.text('pour servir et valoir ce que de droit.', 20, y)
    doc.save(`${att.type}_${eleveData.prenom}_${eleveData.nom}.pdf`)
  }

  const exportExcel = () => {
    exportData({
      ...exportConfigs.attestations,
      data: attestations,
      format: 'excel',
    })
  }
  const exportPDF = () => {
    exportData({
      ...exportConfigs.attestations,
      data: attestations,
      format: 'pdf',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Attestations & Certificats
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Générez et gérez les attestations scolaires
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
            <DropdownItem icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportExcel}>
              Export Excel
            </DropdownItem>
            <DropdownItem icon={<FileText className="h-4 w-4" />} onClick={exportPDF}>
              Export PDF
            </DropdownItem>
          </Dropdown>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowNewModal(true)}
          >
            Générer attestation
          </Button>
        </div>
      </div>

      {/* Types d'attestations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {typesAttestations.map((type) => {
          const Icon = type.icon
          const count = attestations.filter(a => a.type === type.id).length
          return (
            <Card
              key={type.id}
              hover
              padding="md"
              className="cursor-pointer"
              onClick={() => {
                setSelectedType(type.id)
                setShowNewModal(true)
              }}
            >
              <div className="flex items-start gap-4">
                <div className={cn('p-3 rounded-xl', type.color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{type.label}</h3>
                  <p className="text-xs text-surface-500 mt-1">{type.description}</p>
                  <p className="text-lg font-bold mt-2">{count} générée(s)</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Filtres */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par élève ou numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Tous les types' },
              ...typesAttestations.map(t => ({ value: t.id, label: t.label })),
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full lg:w-56"
          />
        </div>
      </Card>

      {/* Historique des attestations */}
      <Card padding="none">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h2 className="font-semibold">Attestations générées</h2>
        </div>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>N° Attestation</TableTh>
                <TableTh>Élève</TableTh>
                <TableTh>Classe</TableTh>
                <TableTh>Type</TableTh>
                <TableTh>Date</TableTh>
                <TableTh>Actions</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttestations.length === 0 ? (
                <TableRow>
                  <TableTd colSpan={6}>
                    <div className="text-center py-8 text-surface-500">
                      Aucune attestation générée pour le moment
                    </div>
                  </TableTd>
                </TableRow>
              ) : (
                filteredAttestations.map((att) => {
                  const typeConfig = getTypeConfig(att.type)
                  const Icon = typeConfig?.icon || Award
                  return (
                    <TableRow key={att.id}>
                      <TableTd>
                        <code className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded text-sm font-mono">
                          {att.numero}
                        </code>
                      </TableTd>
                      <TableTd className="font-medium">{att.eleve}</TableTd>
                      <TableTd>{att.classe}</TableTd>
                      <TableTd>
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', typeConfig?.color)}>
                          <Icon className="h-3 w-3" />
                          {typeConfig?.label}
                        </span>
                      </TableTd>
                      <TableTd>{formatDate(att.date)}</TableTd>
                      <TableTd>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handlePreviewFromTable(att)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadFromTable(att)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableTd>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal génération */}
      <Modal
        isOpen={showNewModal}
        onClose={() => {
          setShowNewModal(false)
          setSelectedType('')
          setSelectedClasse('')
          setSelectedEleve('')
          resetExtraFields()
        }}
        title="Générer une attestation"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Type d'attestation *"
            options={[
              { value: '', label: 'Sélectionner le type' },
              ...typesAttestations.map(t => ({ value: t.id, label: t.label })),
            ]}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          />

          <Select
            label="Classe"
            options={[
              { value: '', label: 'Toutes les classes' },
              ...(classesData?.map(c => ({ value: String(c.id), label: c.libelle || c.code })) || []),
            ]}
            value={selectedClasse}
            onChange={(e) => { setSelectedClasse(e.target.value); setSelectedEleve('') }}
          />

          <Select
            label="Élève *"
            options={[
              { value: '', label: 'Sélectionner un élève' },
              ...filteredEleves.map(e => ({
                value: String(e.id),
                label: `${e.prenom} ${e.nom}${e.classe_nom ? ` - ${e.classe_nom}` : e.classe ? ` - ${e.classe}` : ''}`,
              })),
            ]}
            value={selectedEleve}
            onChange={(e) => setSelectedEleve(e.target.value)}
          />

          {selectedType && (
            <div className={cn(
              'p-4 rounded-lg border',
              getTypeConfig(selectedType)?.color
            )}>
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = getTypeConfig(selectedType)?.icon || Award
                  return <Icon className="h-5 w-5" />
                })()}
                <div>
                  <p className="font-medium">{getTypeConfig(selectedType)?.label}</p>
                  <p className="text-sm opacity-80">{getTypeConfig(selectedType)?.description}</p>
                </div>
              </div>
            </div>
          )}

          {selectedType === 'reussite' && (
            <div className="space-y-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <h4 className="font-medium text-sm">Informations complémentaires</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Année scolaire"
                  options={[
                    { value: '2024-2025', label: '2024-2025' },
                    { value: '2023-2024', label: '2023-2024' },
                  ]}
                  value={anneeScolaire}
                  onChange={(e) => setAnneeScolaire(e.target.value)}
                />
                <Input
                  label="Mention obtenue"
                  placeholder="Ex: Très Bien"
                  value={mention}
                  onChange={(e) => setMention(e.target.value)}
                />
              </div>
              <Input
                label="Moyenne annuelle"
                type="number"
                step="0.01"
                placeholder="15.50"
                value={moyenne}
                onChange={(e) => setMoyenne(e.target.value)}
              />
            </div>
          )}

          {selectedType === 'frequentation' && (
            <div className="space-y-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <h4 className="font-medium text-sm">Période de fréquentation</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date de début"
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                />
                <Input
                  label="Date de fin"
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                />
              </div>
            </div>
          )}

          {selectedType === 'bonne_conduite' && (
            <div className="space-y-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <h4 className="font-medium text-sm">Évaluation du comportement</h4>
              <Select
                label="Appréciation"
                options={[
                  { value: 'excellent', label: 'Excellent' },
                  { value: 'tres_bien', label: 'Très bien' },
                  { value: 'bien', label: 'Bien' },
                  { value: 'assez_bien', label: 'Assez bien' },
                ]}
                value={appreciation}
                onChange={(e) => setAppreciation(e.target.value)}
              />
              <Input
                label="Observations (optionnel)"
                placeholder="Remarques particulières..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedType || !selectedEleve}
              leftIcon={<FileText className="h-4 w-4" />}
            >
              Prévisualiser
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal prévisualisation */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Prévisualisation de l'attestation"
        size="lg"
      >
        {selectedEleveData && selectedTypeData && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-lg p-8 text-center print:border-0 print:shadow-none">
              <div className="border-b-2 border-primary-600 pb-4 mb-6">
                <h2 className="text-xl font-bold text-primary-900 dark:text-primary-100">
                  RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                </h2>
                <p className="text-sm text-surface-600">Justice - Paix - Travail</p>
                <p className="mt-2 font-semibold">MINISTÈRE DE L'ENSEIGNEMENT PRIMAIRE, SECONDAIRE ET TECHNIQUE</p>
                <p className="text-primary-600 font-bold mt-2">{nomEtablissement}</p>
              </div>

              <div className="my-8">
                <h1 className="text-2xl font-bold uppercase tracking-wide text-primary-800 dark:text-primary-200">
                  {selectedTypeData.label}
                </h1>
                <p className="text-sm text-surface-500 mt-2">
                  N° {generateNumero()}
                </p>
              </div>

              <div className="text-left space-y-4 my-8">
                <p className="text-surface-700 dark:text-surface-300">
                  Le Directeur de {nomEtablissement} soussigné, certifie que :
                </p>

                <div className="p-4 bg-surface-50 dark:bg-surface-700 rounded-lg">
                  <p className="text-lg">
                    <span className="text-surface-500">Nom et prénom :</span>{' '}
                    <strong>{selectedEleveData.prenom} {selectedEleveData.nom.toUpperCase()}</strong>
                  </p>
                  <p className="text-lg mt-2">
                    <span className="text-surface-500">Classe :</span>{' '}
                    <strong>{selectedEleveData.classe_nom || selectedEleveData.classe || '-'}</strong>
                  </p>
                  <p className="text-lg mt-2">
                    <span className="text-surface-500">Année scolaire :</span>{' '}
                    <strong>{anneeScolaire}</strong>
                  </p>
                </div>

                {selectedType === 'reussite' && (
                  <p className="text-surface-700 dark:text-surface-300">
                    A été déclaré(e) <strong>ADMIS(E)</strong> à l'issue de l'année scolaire {anneeScolaire}
                    {mention ? <> avec la mention <strong>{mention}</strong></> : ''}.
                    {moyenne && (
                      <> Moyenne annuelle : <strong>{moyenne}</strong>.</>
                    )}
                  </p>
                )}
                {selectedType === 'frequentation' && (
                  <p className="text-surface-700 dark:text-surface-300">
                    A fréquenté régulièrement notre établissement{' '}
                    {dateDebut && dateFin
                      ? <>du <strong>{formatDate(dateDebut)}</strong> au <strong>{formatDate(dateFin)}</strong></>
                      : <>durant l'année scolaire <strong>{anneeScolaire}</strong></>
                    }.
                  </p>
                )}
                {selectedType === 'bonne_conduite' && (
                  <p className="text-surface-700 dark:text-surface-300">
                    A fait preuve d'une{' '}
                    <strong>
                      {appreciation === 'excellent' && 'excellente conduite'}
                      {appreciation === 'tres_bien' && 'très bonne conduite'}
                      {appreciation === 'bien' && 'bonne conduite'}
                      {appreciation === 'assez_bien' && 'conduite assez bonne'}
                    </strong>{' '}
                    et d'un comportement exemplaire durant son séjour dans notre établissement.
                    {observations && (
                      <> Observations : {observations}.</>
                    )}
                  </p>
                )}
                {selectedType === 'scolarite' && (
                  <p className="text-surface-700 dark:text-surface-300">
                    Est régulièrement inscrit(e) dans notre établissement pour l'année scolaire {anneeScolaire}{' '}
                    en classe de <strong>{selectedEleveData.classe_nom || selectedEleveData.classe || '-'}</strong>.
                  </p>
                )}

                <p className="text-surface-700 dark:text-surface-300">
                  En foi de quoi, la présente attestation lui est délivrée pour servir et valoir
                  ce que de droit.
                </p>
              </div>

              <div className="text-right mt-8">
                <p className="text-surface-600">
                  Fait à Kinshasa, le {formatDate(new Date().toISOString())}
                </p>
                <p className="mt-4 font-semibold">Le Préfet des Études</p>
                <p className="text-sm text-surface-500 mt-8">[Signature et cachet]</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                Retour
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Printer className="h-4 w-4" />}
                onClick={handlePrint}
              >
                Imprimer
              </Button>
              <Button
                leftIcon={<Download className="h-4 w-4" />}
                onClick={handleDownloadPDF}
              >
                Télécharger PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export { AttestationsPage }
