import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, User, Phone, Briefcase, FileText } from 'lucide-react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { useUIStore } from '@/stores/uiStore'

const personnelSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  postnom: z.string().min(2, 'Le postnom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  sexe: z.enum(['M', 'F']),
  date_naissance: z.string().min(1, 'La date de naissance est requise'),
  lieu_naissance: z.string().min(2, 'Le lieu de naissance est requis'),
  nationalite: z.string().min(1, 'La nationalité est requise'),
  adresse: z.string().min(5, 'L\'adresse est requise'),
  telephone: z.string().min(9, 'Le numéro de téléphone est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  fonction: z.string().min(1, 'La fonction est requise'),
  departement: z.string().min(1, 'Le département est requis'),
  date_embauche: z.string().min(1, 'La date d\'embauche est requise'),
  type_contrat: z.enum(['cdi', 'cdd', 'vacation']),
  salaire_base: z.number().min(0, 'Le salaire doit être positif'),
})

type PersonnelFormData = z.infer<typeof personnelSchema>

const fonctionOptions = [
  { value: '', label: 'Sélectionner la fonction' },
  { value: 'secretaire', label: 'Secrétaire' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'gardien', label: 'Gardien' },
  { value: 'chauffeur', label: 'Chauffeur' },
  { value: 'cuisinier', label: 'Cuisinier(ère)' },
  { value: 'agent_entretien', label: 'Agent d\'entretien' },
  { value: 'autre', label: 'Autre' },
]

const departementOptions = [
  { value: '', label: 'Sélectionner le département' },
  { value: 'administration', label: 'Administration' },
  { value: 'comptabilite', label: 'Comptabilité' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'securite', label: 'Sécurité' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'autre', label: 'Autre' },
]

const NouveauPersonnelPage = () => {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonnelFormData>({
    resolver: zodResolver(personnelSchema),
    defaultValues: {
      sexe: 'M',
      nationalite: 'Congolaise',
      type_contrat: 'cdi',
      date_embauche: new Date().toISOString().split('T')[0],
      salaire_base: 150000,
    },
  })

  const onSubmit = async (data: PersonnelFormData) => {
    setIsSubmitting(true)

    try {
      const response = await api.post('/personnel', data)

      if (response.data.success) {
        addToast({
          type: 'success',
          title: 'Succès',
          message: 'Personnel créé avec succès',
        })
        navigate('/personnel')
      } else {
        throw new Error(response.data.message)
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err?.response?.data?.message || err?.message || 'Erreur lors de la création du personnel',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/personnel')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
          Nouveau personnel
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Enregistrez un nouveau membre du personnel administratif ou de service
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identité */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Identité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Nom *"
                  placeholder="Ex: Kabongo"
                  error={errors.nom?.message}
                  {...register('nom')}
                />
                <Input
                  label="Postnom *"
                  placeholder="Ex: Mukendi"
                  error={errors.postnom?.message}
                  {...register('postnom')}
                />
                <Input
                  label="Prénom *"
                  placeholder="Ex: Jean-Pierre"
                  error={errors.prenom?.message}
                  {...register('prenom')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Sexe *"
                  error={errors.sexe?.message}
                  options={[
                    { value: 'M', label: 'Masculin' },
                    { value: 'F', label: 'Féminin' },
                  ]}
                  {...register('sexe')}
                />
                <Input
                  label="Date de naissance *"
                  type="date"
                  error={errors.date_naissance?.message}
                  {...register('date_naissance')}
                />
                <Input
                  label="Lieu de naissance *"
                  placeholder="Ex: Kinshasa"
                  error={errors.lieu_naissance?.message}
                  {...register('lieu_naissance')}
                />
              </div>

              <Select
                label="Nationalité *"
                error={errors.nationalite?.message}
                options={[
                  { value: 'Congolaise', label: 'Congolaise (RDC)' },
                  { value: 'Autre', label: 'Autre' },
                ]}
                {...register('nationalite')}
              />
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Adresse *"
                placeholder="Quartier, avenue, n°"
                error={errors.adresse?.message}
                {...register('adresse')}
              />
              <Input
                label="Téléphone *"
                type="tel"
                placeholder="09X XXX XXXX"
                error={errors.telephone?.message}
                {...register('telephone')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="email@exemple.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </CardContent>
          </Card>

          {/* Poste */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Poste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Fonction *"
                  error={errors.fonction?.message}
                  options={fonctionOptions}
                  {...register('fonction')}
                />
                <Select
                  label="Département *"
                  error={errors.departement?.message}
                  options={departementOptions}
                  {...register('departement')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contrat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contrat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Date d'embauche *"
                type="date"
                error={errors.date_embauche?.message}
                {...register('date_embauche')}
              />
              <Select
                label="Type de contrat *"
                error={errors.type_contrat?.message}
                options={[
                  { value: 'cdi', label: 'CDI' },
                  { value: 'cdd', label: 'CDD' },
                  { value: 'vacation', label: 'Vacation' },
                ]}
                {...register('type_contrat')}
              />
              <Input
                label="Salaire de base (FC) *"
                type="number"
                error={errors.salaire_base?.message}
                {...register('salaire_base', { valueAsNumber: true })}
              />
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Le salaire peut être modifié ultérieurement via le menu Salaires.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/personnel')}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Enregistrer le personnel
          </Button>
        </div>
      </form>
    </div>
  )
}

export { NouveauPersonnelPage }
