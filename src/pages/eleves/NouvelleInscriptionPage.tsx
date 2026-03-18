import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Save,
  UserPlus,
  Hash,
  Calendar,
  Wallet,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useUIStore } from '@/stores/uiStore'
import { api } from '@/services/api'

// Schéma de validation
const inscriptionSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  postnom: z.string().min(2, 'Le postnom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  classeSouhaitee: z.string().min(1, 'Veuillez sélectionner une classe'),
  dateInscription: z.string().min(1, 'La date est requise'),
  typeInscription: z.enum(['nouveau', 'reinscrit', 'transfere']),
  montantFrais: z.number().min(0, 'Le montant doit être positif'),
  montantPaye: z.number().min(0, 'Le montant doit être positif'),
  statut: z.enum(['en_attente', 'validee', 'refusee']),
})

type InscriptionFormData = z.infer<typeof inscriptionSchema>

// Générer un ID unique d'inscription
const generateInscriptionId = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `INS${year}${random}`
}

const NouvelleInscriptionPage = () => {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const [inscriptionId, setInscriptionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Récupérer les classes depuis l'API
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes')
      return response.data
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InscriptionFormData>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      dateInscription: new Date().toISOString().split('T')[0],
      typeInscription: 'nouveau',
      montantFrais: 50000,
      montantPaye: 0,
      statut: 'en_attente',
    },
  })

  const montantFrais = watch('montantFrais')
  const montantPaye = watch('montantPaye')
  const reste = montantFrais - montantPaye

  const onSubmit = async (data: InscriptionFormData) => {
    setIsSubmitting(true)
    
    try {
      // Envoyer à l'API
      const response = await api.post('/inscriptions', {
        classe_id: data.classeSouhaitee,
        type_inscription: data.typeInscription === 'nouveau' ? 'nouvelle' : data.typeInscription === 'reinscrit' ? 'reinscription' : 'transfert',
        montant_inscription: data.montantFrais,
        statut: data.statut,
        observations: `Montant payé: ${data.montantPaye} FC`,
      })
      
      if (response.data.success) {
        const newId = response.data.data.numero
        setInscriptionId(newId)
        
        // Stocker l'ID dans localStorage pour liaison avec le nouvel élève
        localStorage.setItem('lastInscriptionId', newId)
        localStorage.setItem('lastInscriptionData', JSON.stringify({
          ...data,
          id: newId,
        }))
        
        addToast({
          type: 'success',
          title: 'Succès',
          message: `Inscription ${newId} créée avec succès`,
        })
        
        navigate('/inscriptions')
      } else {
        throw new Error(response.data.message)
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.response?.data?.message || error?.message || 'Erreur lors de la création de l\'inscription',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/inscriptions')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
          Nouvelle inscription
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Enregistrement administratif d'un nouvel élève
        </p>
      </div>

      {/* ID Inscription */}
      <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-surface-800 shadow-sm">
              <Hash className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                ID Inscription (auto-généré)
              </p>
              <p className="text-3xl font-bold text-primary-900 dark:text-primary-100 font-mono">
                {inscriptionId || 'Sera généré à l\'enregistrement'}
              </p>
              <p className="text-xs text-primary-600/70 dark:text-primary-400/70 mt-1">
                Cet identifiant sera utilisé pour lier l'élève au système
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations personnelles */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Informations de l'élève
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Nom *"
                  placeholder="Nom de famille"
                  error={errors.nom?.message}
                  {...register('nom')}
                />
                <Input
                  label="Postnom *"
                  placeholder="Postnom"
                  error={errors.postnom?.message}
                  {...register('postnom')}
                />
                <Input
                  label="Prénom *"
                  placeholder="Prénom"
                  error={errors.prenom?.message}
                  {...register('prenom')}
                />
              </div>

              <Select
                label="Classe souhaitée *"
                error={errors.classeSouhaitee?.message}
                options={[
                  { value: '', label: 'Sélectionner une classe' },
                  ...(classesData?.data || []).map((c: any) => ({
                    value: String(c.id),
                    label: c.libelle,
                  })),
                ]}
                {...register('classeSouhaitee')}
              />
            </CardContent>
          </Card>

          {/* Informations inscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Détails inscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Date d'inscription *"
                type="date"
                error={errors.dateInscription?.message}
                {...register('dateInscription')}
              />

              <Select
                label="Type d'inscription *"
                error={errors.typeInscription?.message}
                options={[
                  { value: 'nouveau', label: '🆕 Nouveau inscrit' },
                  { value: 'reinscrit', label: '🔄 Réinscrit' },
                  { value: 'transfere', label: '➡️ Transféré' },
                ]}
                {...register('typeInscription')}
              />

              <Select
                label="Statut *"
                error={errors.statut?.message}
                options={[
                  { value: 'en_attente', label: '⏳ En attente' },
                  { value: 'validee', label: '✅ Validée' },
                  { value: 'refusee', label: '❌ Refusée' },
                ]}
                {...register('statut')}
              />
            </CardContent>
          </Card>

          {/* Paiement */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Frais d'inscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Montant des frais (XAF) *"
                  type="number"
                  error={errors.montantFrais?.message}
                  {...register('montantFrais', { valueAsNumber: true })}
                />
                <Input
                  label="Montant payé (XAF)"
                  type="number"
                  error={errors.montantPaye?.message}
                  {...register('montantPaye', { valueAsNumber: true })}
                />
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Reste à payer
                  </label>
                  <div className={`px-4 py-2.5 rounded-lg border ${
                    reste > 0 
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400' 
                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                  } font-semibold`}>
                    {reste.toLocaleString('fr-FR')} XAF
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Progression
                  </label>
                  <div className="px-4 py-2.5">
                    <div className="w-full h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min((montantPaye / montantFrais) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-center mt-1 text-surface-500">
                      {((montantPaye / montantFrais) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inscriptions')}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Enregistrer l'inscription
          </Button>
        </div>
      </form>
    </div>
  )
}

export { NouvelleInscriptionPage }

