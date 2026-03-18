import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  DollarSign,
} from 'lucide-react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate, formatCurrency } from '@/utils/format'

interface Enseignant {
  id: number
  matricule: string
  nom: string
  postnom?: string
  prenom: string
  sexe: string
  date_naissance?: string
  lieu_naissance?: string
  nationalite?: string
  adresse?: string
  telephone?: string
  email?: string
  photo?: string
  qualite?: string
  specialite?: string
  diplome?: string
  statut: string
  date_embauche?: string
  type_contrat?: string
  salaire_base?: number
  affectations?: Array<{
    id: number
    matiere: string
    classe: string
  }>
}

const statutLabels: Record<string, string> = {
  actif: 'Actif',
  conge: 'En congé',
  suspendu: 'Suspendu',
  demission: 'Démissionné',
  licencie: 'Licencié',
}

const statutVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  actif: 'success',
  conge: 'info',
  suspendu: 'warning',
  demission: 'error',
  licencie: 'error',
}

const contratLabels: Record<string, string> = {
  cdi: 'CDI',
  cdd: 'CDD',
  vacation: 'Vacation',
  stage: 'Stage',
}

const EnseignantDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: enseignant, isLoading } = useQuery({
    queryKey: ['enseignant', id],
    queryFn: async () => {
      const response = await api.get<any>('/rh/enseignants/' + id)
      const raw = response.data?.data ?? response.data
      return {
        ...raw,
        type_contrat: raw.type_contrat || raw.typeContrat,
        statut: raw.statut || (raw.is_active === false ? 'suspendu' : raw.is_active !== undefined ? 'actif' : null),
        salaire_base: raw.salaire_base ?? raw.salaireBase,
        date_embauche: raw.date_embauche || raw.dateEmbauche,
        date_naissance: raw.date_naissance || raw.dateNaissance,
        lieu_naissance: raw.lieu_naissance || raw.lieuNaissance,
        affectations: raw.affectations || [],
      } as Enseignant
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="lg" />
        <p className="text-surface-500 dark:text-surface-400">Chargement...</p>
      </div>
    )
  }

  if (!enseignant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <User className="h-16 w-16 text-surface-300 dark:text-surface-600" />
        <p className="text-lg font-medium text-surface-700 dark:text-surface-300">
          Enseignant introuvable
        </p>
        <Button variant="outline" onClick={() => navigate('/enseignants')}>
          Retour à la liste
        </Button>
      </div>
    )
  }

  const fullName = `${enseignant.prenom} ${enseignant.postnom || ''} ${enseignant.nom}`.replace(/\s+/g, ' ').trim()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
                {fullName}
              </h1>
              {enseignant.statut && (
                <Badge
                  variant={statutVariants[enseignant.statut] || 'default'}
                  dot
                >
                  {statutLabels[enseignant.statut] || enseignant.statut}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-surface-500 dark:text-surface-400">
              Matricule :{' '}
              <code className="text-sm bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">
                {enseignant.matricule}
              </code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Edit className="h-4 w-4" />}
            onClick={() => navigate(`/enseignants/${id}/modifier`)}
          >
            Modifier
          </Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => navigate(`/enseignants/${id}/supprimer`)}
          >
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Photo + Identity */}
        <div className="space-y-6">
          {/* Photo & Identity */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Identité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <Avatar
                  src={enseignant.photo}
                  nom={enseignant.nom}
                  prenom={enseignant.prenom}
                  size="xl"
                  className="mb-3"
                />
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white text-center">
                  {fullName}
                </h3>
                {enseignant.specialite && (
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {enseignant.specialite}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Sexe"
                  value={enseignant.sexe === 'M' ? 'Masculin' : 'Féminin'}
                />
                {enseignant.date_naissance && (
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Date de naissance"
                    value={formatDate(enseignant.date_naissance)}
                  />
                )}
                {enseignant.lieu_naissance && (
                  <InfoRow
                    icon={<MapPin className="h-4 w-4" />}
                    label="Lieu de naissance"
                    value={enseignant.lieu_naissance}
                  />
                )}
                {enseignant.nationalite && (
                  <InfoRow
                    icon={<User className="h-4 w-4" />}
                    label="Nationalité"
                    value={enseignant.nationalite}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enseignant.telephone && (
                  <InfoRow
                    icon={<Phone className="h-4 w-4" />}
                    label="Téléphone"
                    value={enseignant.telephone}
                    href={`tel:${enseignant.telephone}`}
                  />
                )}
                {enseignant.email && (
                  <InfoRow
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={enseignant.email}
                    href={`mailto:${enseignant.email}`}
                  />
                )}
                {enseignant.adresse && (
                  <InfoRow
                    icon={<MapPin className="h-4 w-4" />}
                    label="Adresse"
                    value={enseignant.adresse}
                  />
                )}
                {!enseignant.telephone && !enseignant.email && !enseignant.adresse && (
                  <p className="text-sm text-surface-400 dark:text-surface-500 italic text-center py-2">
                    Aucune information de contact
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Professional info + Matieres */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional info */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Informations professionnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailCard
                  icon={<Briefcase className="h-5 w-5 text-primary-600" />}
                  label="Qualité"
                  value={enseignant.qualite || '-'}
                  bg="bg-primary-50 dark:bg-primary-900/20"
                />
                <DetailCard
                  icon={<GraduationCap className="h-5 w-5 text-blue-600" />}
                  label="Spécialité"
                  value={enseignant.specialite || '-'}
                  bg="bg-blue-50 dark:bg-blue-900/20"
                />
                <DetailCard
                  icon={<GraduationCap className="h-5 w-5 text-purple-600" />}
                  label="Diplôme"
                  value={enseignant.diplome || '-'}
                  bg="bg-purple-50 dark:bg-purple-900/20"
                />
                <DetailCard
                  icon={<Calendar className="h-5 w-5 text-green-600" />}
                  label="Date d'embauche"
                  value={enseignant.date_embauche ? formatDate(enseignant.date_embauche) : '-'}
                  bg="bg-green-50 dark:bg-green-900/20"
                />
                <DetailCard
                  icon={<Briefcase className="h-5 w-5 text-amber-600" />}
                  label="Type de contrat"
                  value={enseignant.type_contrat ? (contratLabels[enseignant.type_contrat] || enseignant.type_contrat) : '-'}
                  bg="bg-amber-50 dark:bg-amber-900/20"
                />
                <DetailCard
                  icon={<DollarSign className="h-5 w-5 text-green-600" />}
                  label="Salaire de base"
                  value={enseignant.salaire_base ? formatCurrency(enseignant.salaire_base) : '-'}
                  bg="bg-green-50 dark:bg-green-900/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Matieres enseignees */}
          {enseignant.affectations && enseignant.affectations.length > 0 && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Matières enseignées</CardTitle>
                <Badge variant="primary">{enseignant.affectations.length} matière(s)</Badge>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-50 dark:bg-surface-900/50">
                        <th className="px-4 py-3 text-left font-semibold border-b border-surface-200 dark:border-surface-700">
                          Matière
                        </th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-surface-200 dark:border-surface-700">
                          Classe
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enseignant.affectations.map((aff) => (
                        <tr
                          key={aff.id}
                          className="hover:bg-surface-50 dark:hover:bg-surface-800/50"
                        >
                          <td className="px-4 py-2.5 border-b border-surface-200 dark:border-surface-700 font-medium">
                            {aff.matiere}
                          </td>
                          <td className="px-4 py-2.5 border-b border-surface-200 dark:border-surface-700">
                            <Badge variant="default">{aff.classe}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty affectations state */}
          {(!enseignant.affectations || enseignant.affectations.length === 0) && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Matières enseignées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    Aucune affectation de matière pour le moment.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  const content = href ? (
    <a
      href={href}
      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
    >
      {value}
    </a>
  ) : (
    <span className="text-sm text-surface-900 dark:text-white">{value}</span>
  )

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-surface-400 dark:text-surface-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{label}</p>
        {content}
      </div>
    </div>
  )
}

function DetailCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bg: string
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-900/30 border border-surface-100 dark:border-surface-700">
      <div className={`p-2.5 rounded-lg ${bg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{label}</p>
        <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  )
}

export { EnseignantDetailPage }
