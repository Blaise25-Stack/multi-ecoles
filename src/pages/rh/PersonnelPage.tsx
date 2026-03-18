import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  Users,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
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
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import { rhService } from '@/services/rhService'
import { formatCurrency } from '@/utils/format'
import { exportData, exportConfigs } from '@/services/exportService'
import { useDebounce } from '@/hooks/useDebounce'

const fonctionOptions = [
  'Secrétaire',
  'Agent de sécurité',
  'Cuisinier(ère)',
  'Technicien informatique',
  'Femme/Homme de ménage',
  'Gardien',
  'Bibliothécaire',
  'Comptable',
  'Chauffeur',
]

const departementOptions = [
  'Administration',
  'Services Généraux',
  'Cantine',
  'IT',
  'Comptabilité',
  'Sécurité',
]

const PersonnelPage = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [departementFilter, setDepartementFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    sexe: 'M',
    email: '',
    telephone: '',
    fonction: '',
    departement: '',
    type_contrat: 'CDI',
    date_embauche: new Date().toISOString().split('T')[0],
    salaire_base: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['personnel', page, debouncedSearch, departementFilter],
    queryFn: () =>
      rhService.getPersonnel({
        page,
        perPage: 20,
        search: debouncedSearch,
        departement: departementFilter || undefined,
      }),
  })

  const createMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      return rhService.createPersonnel({
        nom: formData.nom,
        prenom: formData.prenom,
        sexe: formData.sexe as any,
        email: formData.email,
        telephone: formData.telephone,
        fonction: formData.fonction,
        departement: formData.departement,
        type_contrat: formData.type_contrat,
        date_embauche: formData.date_embauche,
        salaire_base: parseFloat(formData.salaire_base) || 0,
      } as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personnel'] })
      addToast({ type: 'success', title: 'Succès', message: 'Personnel créé avec succès' })
      setShowNewModal(false)
      resetForm()
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer le personnel' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => rhService.deletePersonnel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personnel'] })
      addToast({ type: 'success', title: 'Succès', message: 'Personnel supprimé' })
      setShowDeleteModal(false)
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer' })
    },
  })

  const resetForm = () => {
    setForm({
      nom: '',
      prenom: '',
      sexe: 'M',
      email: '',
      telephone: '',
      fonction: '',
      departement: '',
      type_contrat: 'CDI',
      date_embauche: new Date().toISOString().split('T')[0],
      salaire_base: '',
    })
  }

  const handleSubmit = () => {
    if (!form.nom || !form.prenom || !form.fonction || !form.sexe) {
      addToast({ type: 'error', title: 'Erreur', message: 'Veuillez remplir tous les champs obligatoires' })
      return
    }
    createMutation.mutate(form)
  }

  const rawList = data?.data?.data || []
  const personnel = rawList.map((p: any) => ({
    ...p,
    type_contrat: p.type_contrat || p.typeContrat || '-',
    salaire_base: p.salaire_base ?? p.salaireBase ?? 0,
    departement: p.departement || '-',
    fonction: p.fonction || '-',
  }))
  const meta = data?.data?.pagination || data?.data?.meta

  const totalActifs = personnel.filter((p: any) => p.is_active !== false).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
            Personnel
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez le personnel administratif et de service
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
            <DropdownItem onClick={() => exportData({ ...exportConfigs.personnel, data: personnel, format: 'excel' })}>
              Export Excel
            </DropdownItem>
            <DropdownItem onClick={() => exportData({ ...exportConfigs.personnel, data: personnel, format: 'pdf' })}>
              Export PDF
            </DropdownItem>
          </Dropdown>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => { resetForm(); setShowNewModal(true) }}
          >
            Nouveau personnel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total personnel"
          value={meta?.total || personnel.length}
          icon={<Users className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Actifs"
          value={totalActifs}
          icon={<Users className="h-6 w-6" />}
          color="success"
        />
        <StatCard
          title="Départements"
          value={[...new Set(personnel.map((p: any) => p.departement))].length}
          icon={<Building className="h-6 w-6" />}
          color="info"
        />
        <StatCard
          title="Masse salariale"
          value={formatCurrency(personnel.reduce((sum: number, p: any) => sum + (parseFloat(p.salaire_base) || 0), 0))}
          icon={<Users className="h-6 w-6" />}
          color="warning"
        />
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom ou fonction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Tous les départements' },
              ...departementOptions.map(d => ({ value: d, label: d })),
            ]}
            value={departementFilter}
            onChange={(e) => setDepartementFilter(e.target.value)}
            className="w-full lg:w-48"
          />
        </div>
      </Card>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Personnel</TableTh>
              <TableTh>Matricule</TableTh>
              <TableTh>Fonction</TableTh>
              <TableTh>Département</TableTh>
              <TableTh>Contrat</TableTh>
              <TableTh>Statut</TableTh>
              <TableTh className="w-12"></TableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={7} rows={10} />
            ) : personnel.length === 0 ? (
              <TableEmpty colSpan={7} message="Aucun personnel trouvé" />
            ) : (
              personnel.map((personne: any) => (
                <TableRow key={personne.id}>
                  <TableTd>
                    <div className="flex items-center gap-3">
                      <Avatar nom={personne.nom} prenom={personne.prenom} size="sm" />
                      <div>
                        <p className="font-medium">{personne.prenom} {personne.nom}</p>
                        <p className="text-xs text-surface-500">{personne.email || '-'}</p>
                      </div>
                    </div>
                  </TableTd>
                  <TableTd>
                    <code className="text-sm bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">
                      {personne.matricule}
                    </code>
                  </TableTd>
                  <TableTd>{personne.fonction}</TableTd>
                  <TableTd>
                    <Badge variant="info">
                      <Building className="h-3 w-3 mr-1" />
                      {personne.departement}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <Badge variant={personne.type_contrat === 'CDI' ? 'success' : 'warning'}>
                      {personne.type_contrat}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <Badge variant={personne.is_active !== false ? 'success' : 'error'} dot>
                      {personne.is_active !== false ? 'Actif' : 'Inactif'}
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
                      <DropdownItem icon={<Eye className="h-4 w-4" />}>
                        Voir profil
                      </DropdownItem>
                      <DropdownItem icon={<Edit className="h-4 w-4" />}>
                        Modifier
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        icon={<Trash2 className="h-4 w-4" />}
                        danger
                        onClick={() => { setSelectedPersonnel(personne); setShowDeleteModal(true) }}
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

      {/* Modal création */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nouveau personnel"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nom *"
              placeholder="Nom de famille"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
            <Input
              label="Prénom *"
              placeholder="Prénom"
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
            />
          </div>
          <Select
            label="Sexe *"
            options={[
              { value: 'M', label: 'Masculin' },
              { value: 'F', label: 'Féminin' },
            ]}
            value={form.sexe}
            onChange={(e) => setForm({ ...form, sexe: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="email@ecole.cd"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Téléphone"
              type="tel"
              placeholder="09XXXXXXXX"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Fonction *"
              options={[
                { value: '', label: 'Sélectionner' },
                ...fonctionOptions.map(f => ({ value: f, label: f })),
              ]}
              value={form.fonction}
              onChange={(e) => setForm({ ...form, fonction: e.target.value })}
            />
            <Select
              label="Département"
              options={[
                { value: '', label: 'Sélectionner' },
                ...departementOptions.map(d => ({ value: d, label: d })),
              ]}
              value={form.departement}
              onChange={(e) => setForm({ ...form, departement: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type de contrat"
              options={[
                { value: 'CDI', label: 'CDI' },
                { value: 'CDD', label: 'CDD' },
                { value: 'Stage', label: 'Stage' },
              ]}
              value={form.type_contrat}
              onChange={(e) => setForm({ ...form, type_contrat: e.target.value })}
            />
            <Input
              label="Date d'embauche"
              type="date"
              value={form.date_embauche}
              onChange={(e) => setForm({ ...form, date_embauche: e.target.value })}
            />
          </div>
          <Input
            label="Salaire de base (FC)"
            type="number"
            placeholder="150000"
            value={form.salaire_base}
            onChange={(e) => setForm({ ...form, salaire_base: e.target.value })}
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
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => selectedPersonnel && deleteMutation.mutate(selectedPersonnel.id)}
        title="Supprimer ce personnel ?"
        message={`Voulez-vous vraiment supprimer ${selectedPersonnel?.prenom} ${selectedPersonnel?.nom} ?`}
        confirmText="Supprimer"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

export { PersonnelPage }
