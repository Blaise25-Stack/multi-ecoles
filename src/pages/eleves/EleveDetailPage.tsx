import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Edit,
  FileText,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  CreditCard,
} from 'lucide-react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
  TableEmpty,
} from '@/components/ui/Table'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useUIStore } from '@/stores/uiStore'
import { formatDate, formatCurrency } from '@/utils/format'

const statutBadgeVariant = (statut: string) => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary'> = {
    inscrit: 'success',
    reinscrit: 'info',
    actif: 'success',
    transfere: 'warning',
    abandonne: 'error',
    diplome: 'primary',
    inactif: 'default',
  }
  return map[statut?.toLowerCase()] || 'default'
}

const statutLabel = (statut: string) => {
  const map: Record<string, string> = {
    inscrit: 'Inscrit',
    reinscrit: 'Réinscrit',
    actif: 'Actif',
    transfere: 'Transféré',
    abandonne: 'Abandonné',
    diplome: 'Diplômé',
    inactif: 'Inactif',
  }
  return map[statut?.toLowerCase()] || statut
}

const paiementStatutVariant = (statut: string) => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    paye: 'success',
    payé: 'success',
    partiel: 'warning',
    en_attente: 'info',
    annule: 'error',
    annulé: 'error',
  }
  return map[statut?.toLowerCase()] || 'default'
}

const inscriptionStatutVariant = (statut: string) => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    validee: 'success',
    validée: 'success',
    en_attente: 'warning',
    rejetee: 'error',
    rejetée: 'error',
  }
  return map[statut?.toLowerCase()] || 'default'
}

const EleveDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const {
    data: eleveResponse,
    isLoading: eleveLoading,
    isError: eleveError,
  } = useQuery({
    queryKey: ['eleve', id],
    queryFn: async () => {
      const response = await api.get('/eleves/' + id)
      return response.data
    },
    enabled: !!id,
  })

  const { data: inscriptionsResponse, isLoading: inscriptionsLoading } = useQuery({
    queryKey: ['inscriptions', { eleve_id: id }],
    queryFn: async () => {
      const response = await api.get('/inscriptions', { params: { eleve_id: id } })
      return response.data
    },
    enabled: !!id,
  })

  const { data: paiementsResponse, isLoading: paiementsLoading } = useQuery({
    queryKey: ['paiements', { eleve_id: id }],
    queryFn: async () => {
      const response = await api.get('/comptabilite/paiements', { params: { eleve_id: id } })
      return response.data
    },
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete('/eleves/' + id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eleves'] })
      addToast({ type: 'success', title: 'Succès', message: 'Élève supprimé avec succès' })
      navigate('/eleves')
    },
    onError: () => {
      addToast({ type: 'error', title: 'Erreur', message: "Impossible de supprimer l'élève" })
    },
  })

  const eleve = eleveResponse?.data
  const inscriptions = inscriptionsResponse?.data || []
  const paiements = paiementsResponse?.data || []

  if (eleveLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="lg" />
        <p className="text-surface-500 dark:text-surface-400">Chargement du profil...</p>
      </div>
    )
  }

  if (eleveError || !eleve) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-surface-500 dark:text-surface-400">Élève introuvable</p>
        <Button variant="outline" onClick={() => navigate('/eleves')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/eleves')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white truncate">
              {eleve.prenom} {eleve.nom} {eleve.postnom || ''}
            </h1>
            <Badge variant={statutBadgeVariant(eleve.statut)} dot>
              {statutLabel(eleve.statut)}
            </Badge>
          </div>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Matricule : <code className="text-sm bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">{eleve.matricule}</code>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/eleves/${id}/modifier`)}
            leftIcon={<Edit className="h-4 w-4" />}
          >
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/eleves/${id}/bulletin`)}
            leftIcon={<FileText className="h-4 w-4" />}
          >
            Bulletin
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo + Identité */}
        <Card padding="none" className="lg:col-span-1">
          <div className="p-6 flex flex-col items-center text-center border-b border-surface-200 dark:border-surface-700">
            <Avatar
              src={eleve.photo}
              nom={eleve.nom}
              prenom={eleve.prenom}
              size="xl"
              className="mb-4"
            />
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
              {eleve.prenom} {eleve.nom}
            </h2>
            {eleve.postnom && (
              <p className="text-sm text-surface-500 dark:text-surface-400">{eleve.postnom}</p>
            )}
            <Badge variant={statutBadgeVariant(eleve.statut)} className="mt-2" dot>
              {statutLabel(eleve.statut)}
            </Badge>
          </div>

          <div className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
              Identité
            </h3>

            <div className="space-y-3">
              <InfoRow icon={<User className="h-4 w-4" />} label="Nom" value={eleve.nom} />
              <InfoRow icon={<User className="h-4 w-4" />} label="Postnom" value={eleve.postnom || '-'} />
              <InfoRow icon={<User className="h-4 w-4" />} label="Prénom" value={eleve.prenom} />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Date de naissance"
                value={eleve.date_naissance ? formatDate(eleve.date_naissance) : '-'}
              />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Lieu de naissance" value={eleve.lieu_naissance || '-'} />
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Sexe"
                value={eleve.sexe === 'M' ? 'Masculin' : eleve.sexe === 'F' ? 'Féminin' : '-'}
              />
              <InfoRow icon={<User className="h-4 w-4" />} label="Nationalité" value={eleve.nationalite || '-'} />
              <InfoRow
                icon={<GraduationCap className="h-4 w-4" />}
                label="Matricule"
                value={
                  <code className="text-sm bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">
                    {eleve.matricule}
                  </code>
                }
              />
            </div>
          </div>
        </Card>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Coordonnées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-900/50">
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Adresse</p>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {eleve.adresse || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-900/50">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Téléphone</p>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {eleve.telephone || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-900/50">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Email</p>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {eleve.email || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inscriptions */}
          <Card padding="none">
            <div className="p-6 pb-0">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Historique des inscriptions
                  </div>
                </CardTitle>
              </CardHeader>
            </div>
            <TableContainer className="border-0 shadow-none rounded-none rounded-b-xl">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableTh>Date</TableTh>
                    <TableTh>Classe</TableTh>
                    <TableTh>Type</TableTh>
                    <TableTh>Statut</TableTh>
                    <TableTh>Montant</TableTh>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inscriptionsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center">
                        <Spinner size="sm" className="mx-auto" />
                      </td>
                    </tr>
                  ) : inscriptions.length === 0 ? (
                    <TableEmpty colSpan={5} message="Aucune inscription enregistrée" />
                  ) : (
                    inscriptions.map((insc: any) => (
                      <TableRow key={insc.id}>
                        <TableTd>{insc.date ? formatDate(insc.date) : insc.created_at ? formatDate(insc.created_at) : '-'}</TableTd>
                        <TableTd>
                          <span className="font-medium">{insc.classe?.libelle || insc.classe_nom || '-'}</span>
                        </TableTd>
                        <TableTd>{insc.type || '-'}</TableTd>
                        <TableTd>
                          <Badge variant={inscriptionStatutVariant(insc.statut)} size="sm">
                            {insc.statut || '-'}
                          </Badge>
                        </TableTd>
                        <TableTd>{insc.montant != null ? formatCurrency(insc.montant) : '-'}</TableTd>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Paiements */}
          <Card padding="none">
            <div className="p-6 pb-0">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Historique des paiements
                  </div>
                </CardTitle>
              </CardHeader>
            </div>
            <TableContainer className="border-0 shadow-none rounded-none rounded-b-xl">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableTh>Date</TableTh>
                    <TableTh>Référence</TableTh>
                    <TableTh>Montant</TableTh>
                    <TableTh>Mode</TableTh>
                    <TableTh>Statut</TableTh>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paiementsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center">
                        <Spinner size="sm" className="mx-auto" />
                      </td>
                    </tr>
                  ) : paiements.length === 0 ? (
                    <TableEmpty colSpan={5} message="Aucun paiement enregistré" />
                  ) : (
                    paiements.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableTd>{p.date ? formatDate(p.date) : p.created_at ? formatDate(p.created_at) : '-'}</TableTd>
                        <TableTd>
                          <code className="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">
                            {p.reference || '-'}
                          </code>
                        </TableTd>
                        <TableTd className="font-semibold">{p.montant != null ? formatCurrency(p.montant) : '-'}</TableTd>
                        <TableTd>{p.mode_paiement || p.mode || '-'}</TableTd>
                        <TableTd>
                          <Badge variant={paiementStatutVariant(p.statut)} size="sm">
                            {p.statut || '-'}
                          </Badge>
                        </TableTd>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3">
            <Link to={`/eleves/${id}/bulletin`}>
              <Button variant="outline" leftIcon={<FileText className="h-4 w-4" />}>
                Voir bulletin
              </Button>
            </Link>
            <Link to={`/eleves/${id}/modifier`}>
              <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>
                Modifier
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer cet élève ?"
        message={
          <p>
            Êtes-vous sûr de vouloir supprimer <strong>{eleve.prenom} {eleve.nom}</strong> ?
            <br />
            <span className="text-sm text-surface-500">
              Cette action est irréversible et supprimera toutes les données associées.
            </span>
          </p>
        }
        confirmText="Supprimer"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-surface-400 dark:text-surface-500 flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-surface-500 dark:text-surface-400">{label}</p>
        <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  )
}

export { EleveDetailPage }
