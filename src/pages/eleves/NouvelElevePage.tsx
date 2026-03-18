import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Save,
  User,
  Users,
  Phone,
  FileText,
  Check,
  Upload,
  X,
  Camera,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/stores/uiStore'
import { api } from '@/services/api'

// Schéma de validation
const eleveSchema = z.object({
  // Étape 1: Informations personnelles
  photo: z.string().optional(),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  postnom: z.string().optional(),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  dateNaissance: z.string().min(1, 'La date de naissance est requise'),
  lieuNaissance: z.string().optional(),
  sexe: z.enum(['M', 'F']),
  nationalite: z.string().optional(),
  
  // Étape 2: Informations scolaires (optionnel, informatif)
  classe: z.string().optional(),
  anneePrecedente: z.string().optional(),
  etablissementPrecedent: z.string().optional(),
  
  // Étape 3: Contacts
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  
  // Étape 4: Parents/Tuteurs
  nomPere: z.string().optional(),
  professionPere: z.string().optional(),
  telephonePere: z.string().optional(),
  nomMere: z.string().optional(),
  professionMere: z.string().optional(),
  telephoneMere: z.string().optional(),
  nomTuteur: z.string().optional(),
  telephoneTuteur: z.string().optional(),
  relationTuteur: z.string().optional(),
})

type EleveFormData = z.infer<typeof eleveSchema>

const steps = [
  { id: 1, title: 'Photo & Identité', icon: User },
  { id: 2, title: 'Scolarité', icon: FileText },
  { id: 3, title: 'Contact', icon: Phone },
  { id: 4, title: 'Parents', icon: Users },
]

const NouvelElevePage = () => {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    trigger,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<EleveFormData>({
    resolver: zodResolver(eleveSchema),
    defaultValues: {
      sexe: 'M',
      nationalite: 'Congolaise',
      photo: '',
    },
  })


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        addToast({
          type: 'error',
          title: 'Erreur',
          message: 'Format non autorisé. Utilisez JPG, PNG ou WebP',
        })
        return
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          type: 'error',
          title: 'Erreur',
          message: 'La photo ne doit pas dépasser 5MB',
        })
        return
      }

      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPhotoPreview(result)
        setValue('photo', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhotoPreview(null)
    setPhotoFile(null)
    setValue('photo', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof EleveFormData)[] = []
    
    switch (step) {
      case 1:
        fieldsToValidate = ['nom', 'prenom', 'dateNaissance', 'sexe']
        break
      case 2:
        break
      case 3:
        break
      case 4:
        break
    }
    
    if (fieldsToValidate.length === 0) return true
    return await trigger(fieldsToValidate)
  }

  const nextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleManualSubmit = async () => {
    const formValues = getValues()
    await onSubmit(formValues)
  }

  const onSubmit = async (data: EleveFormData) => {
    setIsSubmitting(true)
    
    try {
      // Créer FormData pour envoyer avec la photo
      const formData = new FormData()
      
      // Ajouter la photo si présente
      if (photoFile) {
        formData.append('photo', photoFile)
      }
      
      formData.append('nom', data.nom)
      formData.append('prenom', data.prenom)
      formData.append('sexe', data.sexe)
      formData.append('date_naissance', data.dateNaissance)
      if (data.postnom) formData.append('postnom', data.postnom)
      if (data.lieuNaissance) formData.append('lieu_naissance', data.lieuNaissance)
      if (data.nationalite) formData.append('nationalite', data.nationalite)
      if (data.adresse) formData.append('adresse', data.adresse)
      if (data.telephone) formData.append('telephone', data.telephone)
      if (data.email) formData.append('email', data.email)
      if (data.nomPere) formData.append('nom_pere', data.nomPere)
      if (data.telephonePere) formData.append('telephone_pere', data.telephonePere)
      if (data.professionPere) formData.append('profession_pere', data.professionPere)
      if (data.nomMere) formData.append('nom_mere', data.nomMere)
      if (data.telephoneMere) formData.append('telephone_mere', data.telephoneMere)
      if (data.professionMere) formData.append('profession_mere', data.professionMere)
      if (data.nomTuteur) formData.append('nom_tuteur', data.nomTuteur)
      if (data.telephoneTuteur) formData.append('telephone_tuteur', data.telephoneTuteur)
      
      const response = await api.post('/eleves', formData)
      
      if (response.data.success) {
        addToast({
          type: 'success',
          title: 'Succès',
          message: `Élève créé avec succès (Matricule: ${response.data.data.matricule})`,
        })
        
        navigate('/eleves')
      } else {
        throw new Error(response.data.message || 'Erreur lors de la création')
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.response?.data?.message || error?.message || 'Erreur lors de la création de l\'élève',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/eleves')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
          Nouvel élève
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Créer le profil complet de l'élève dans le système
        </p>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Après la création de l'élève, vous pourrez l'inscrire via le module <strong>Inscriptions</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progress steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                    isCompleted
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : isCurrent
                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-600 text-primary-600'
                        : 'bg-surface-100 dark:bg-surface-800 border-surface-300 dark:border-surface-600 text-surface-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center',
                    isCurrent ? 'text-primary-600' : 'text-surface-500'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-4 rounded',
                    isCompleted ? 'bg-primary-600' : 'bg-surface-200 dark:bg-surface-700'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      <div>
        {/* Étape 1: Photo & Identité */}
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <Card>
            <CardHeader>
              <CardTitle>Photo de profil & Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Photo */}
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                  Photo de profil *
                </label>
                
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-40 h-40 rounded-full object-cover border-4 border-primary-200 dark:border-primary-800 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'w-40 h-40 rounded-full border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all',
                      errors.photo 
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                        : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                    )}
                  >
                    <Camera className={cn(
                      'h-10 w-10 mb-2',
                      errors.photo ? 'text-red-400' : 'text-surface-400'
                    )} />
                    <span className={cn(
                      'text-sm',
                      errors.photo ? 'text-red-500' : 'text-surface-500'
                    )}>
                      Ajouter photo
                    </span>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                
                {errors.photo && (
                  <p className="text-sm text-red-500 mt-2">{errors.photo.message}</p>
                )}
                <p className="text-xs text-surface-500 mt-2">
                  Formats: JPG, PNG, WebP • Max 5MB
                </p>
              </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date de naissance *"
                  type="date"
                  error={errors.dateNaissance?.message}
                  {...register('dateNaissance')}
                />
                <Input
                  label="Lieu de naissance *"
                  placeholder="Ville de naissance"
                  error={errors.lieuNaissance?.message}
                  {...register('lieuNaissance')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  label="Nationalité *"
                  placeholder="Nationalité"
                  error={errors.nationalite?.message}
                  {...register('nationalite')}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Étape 2: Scolarité */}
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          <Card>
            <CardHeader>
              <CardTitle>Informations scolaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Classe souhaitée (indicatif)"
                error={errors.classe?.message}
                options={[
                  { value: '', label: 'Non renseignée' },
                  ...(classesData?.data || []).map((c: any) => ({
                    value: String(c.id),
                    label: c.libelle,
                  })),
                ]}
                {...register('classe')}
              />

              <Input
                label="Année scolaire précédente"
                placeholder="Ex: 2023-2024"
                {...register('anneePrecedente')}
              />

              <Input
                label="Établissement précédent"
                placeholder="Nom de l'ancien établissement"
                {...register('etablissementPrecedent')}
              />
            </CardContent>
          </Card>
        </div>

        {/* Étape 3: Contact */}
        <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
          <Card>
            <CardHeader>
              <CardTitle>Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Adresse complète *"
                placeholder="Quartier, rue, numéro..."
                error={errors.adresse?.message}
                {...register('adresse')}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Téléphone"
                  type="tel"
                  placeholder="6XXXXXXXX"
                  {...register('telephone')}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@exemple.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Étape 4: Parents */}
        <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
          <Card>
            <CardHeader>
              <CardTitle>Informations des parents / tuteur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Père */}
              <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <h3 className="font-medium mb-4">Père</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Nom complet"
                    placeholder="Nom du père"
                    {...register('nomPere')}
                  />
                  <Input
                    label="Profession"
                    placeholder="Profession"
                    {...register('professionPere')}
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    placeholder="6XXXXXXXX"
                    {...register('telephonePere')}
                  />
                </div>
              </div>

              {/* Mère */}
              <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <h3 className="font-medium mb-4">Mère</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Nom complet"
                    placeholder="Nom de la mère"
                    {...register('nomMere')}
                  />
                  <Input
                    label="Profession"
                    placeholder="Profession"
                    {...register('professionMere')}
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    placeholder="6XXXXXXXX"
                    {...register('telephoneMere')}
                  />
                </div>
              </div>

              {/* Tuteur */}
              <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <h3 className="font-medium mb-4">Tuteur (si différent des parents)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Nom complet"
                    placeholder="Nom du tuteur"
                    {...register('nomTuteur')}
                  />
                  <Input
                    label="Relation"
                    placeholder="Ex: Oncle, Grand-parent..."
                    {...register('relationTuteur')}
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    placeholder="6XXXXXXXX"
                    {...register('telephoneTuteur')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          {currentStep < steps.length ? (
            <Button type="button" onClick={nextStep}>
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="button" onClick={handleManualSubmit} isLoading={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              Créer l'élève
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export { NouvelElevePage }
