import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Save,
  User,
  Briefcase,
  Phone,
  Camera,
  X,
  BookOpen,
  Calendar,
  MapPin,
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
const enseignantSchema = z.object({
  photo: z.string().min(1, 'La photo de profil est obligatoire'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  postnom: z.string().min(2, 'Le postnom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  sexe: z.enum(['M', 'F']),
  dateNaissance: z.string().min(1, 'La date de naissance est requise'),
  lieuNaissance: z.string().min(2, 'Le lieu de naissance est requis'),
  nationalite: z.string().min(1, 'La nationalité est requise'),
  etatCivil: z.enum(['celibataire', 'marie', 'divorce', 'veuf']),
  adresse: z.string().min(5, 'L\'adresse est requise'),
  telephone: z.string().min(9, 'Le numéro de téléphone est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  qualite: z.string().min(1, 'La qualité/poste est requis'),
  dateEmbauche: z.string().min(1, 'La date d\'embauche est requise'),
  typeContrat: z.enum(['cdi', 'cdd', 'vacation']),
  salaireBase: z.number().min(0, 'Le salaire doit être positif'),
  diplome: z.string().optional(),
  specialite: z.string().optional(),
})

type EnseignantFormData = z.infer<typeof enseignantSchema>

// Liste des matières disponibles
const matieresDisponibles = [
  { id: 'math', nom: 'Mathématiques' },
  { id: 'francais', nom: 'Français' },
  { id: 'anglais', nom: 'Anglais' },
  { id: 'physique', nom: 'Physique' },
  { id: 'chimie', nom: 'Chimie' },
  { id: 'biologie', nom: 'Biologie' },
  { id: 'histoire', nom: 'Histoire' },
  { id: 'geographie', nom: 'Géographie' },
  { id: 'education_civique', nom: 'Éducation civique' },
  { id: 'eps', nom: 'Éducation physique' },
  { id: 'informatique', nom: 'Informatique' },
  { id: 'philosophie', nom: 'Philosophie' },
  { id: 'latin', nom: 'Latin' },
  { id: 'arts', nom: 'Arts plastiques' },
  { id: 'musique', nom: 'Musique' },
]

// Classes disponibles
const classesDisponibles = [
  '6ème A', '6ème B', '5ème A', '5ème B', '4ème A', '4ème B',
  '3ème A', '3ème B', '2nde A', '2nde B', '1ère S', '1ère L', 'Tle S', 'Tle L'
]

// Générer un matricule enseignant
const generateMatricule = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ENS${year}${random}`
}

const NouvelEnseignantPage = () => {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const [matricule] = useState(generateMatricule())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedMatieres, setSelectedMatieres] = useState<string[]>([])
  const [classeTitulaire, setClasseTitulaire] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EnseignantFormData>({
    resolver: zodResolver(enseignantSchema),
    defaultValues: {
      sexe: 'M',
      nationalite: 'Congolaise',
      etatCivil: 'celibataire',
      typeContrat: 'cdi',
      dateEmbauche: new Date().toISOString().split('T')[0],
      salaireBase: 150000,
      photo: '',
    },
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        addToast({
          type: 'error',
          title: 'Erreur',
          message: 'Format non autorisé. Utilisez JPG, PNG ou WebP',
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        addToast({
          type: 'error',
          title: 'Erreur',
          message: 'La photo ne doit pas dépasser 5MB',
        })
        return
      }

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
    setValue('photo', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleMatiere = (matiereId: string) => {
    setSelectedMatieres(prev =>
      prev.includes(matiereId)
        ? prev.filter(m => m !== matiereId)
        : [...prev, matiereId]
    )
  }

  const onSubmit = async (data: EnseignantFormData) => {
    setIsSubmitting(true)

    try {
      // Envoyer à l'API
      const response = await api.post('/enseignants', {
        matricule,
        nom: data.nom,
        postnom: data.postnom,
        prenom: data.prenom,
        sexe: data.sexe,
        date_naissance: data.dateNaissance,
        lieu_naissance: data.lieuNaissance,
        nationalite: data.nationalite,
        etat_civil: data.etatCivil,
        adresse: data.adresse,
        telephone: data.telephone,
        email: data.email,
        qualite: data.qualite,
        specialite: data.specialite,
        diplome: data.diplome,
        type_contrat: data.typeContrat,
        date_embauche: data.dateEmbauche,
        salaire_base: data.salaireBase,
        matieres: selectedMatieres,
        classe_titulaire: classeTitulaire || null,
      })

      if (response.data.success) {
        addToast({
          type: 'success',
          title: 'Succès',
          message: `Enseignant ${response.data.data.matricule} créé avec succès`,
        })
        navigate('/enseignants')
      } else {
        throw new Error(response.data.message)
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error?.response?.data?.message || error?.message || 'Erreur lors de la création de l\'enseignant',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/enseignants')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
          Nouvel enseignant
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Enregistrez un nouvel enseignant dans le système
        </p>
      </div>

      {/* Matricule */}
      <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white dark:bg-surface-800 shadow-sm">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                Matricule (auto-généré)
              </p>
              <p className="text-2xl font-bold text-primary-900 dark:text-primary-100 font-mono">
                {matricule}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photo et identité */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Identité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo */}
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Photo *
                  </label>
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-32 h-32 rounded-xl object-cover border-4 border-primary-200 dark:border-primary-800 shadow-lg"
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
                        'w-32 h-32 rounded-xl border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all',
                        errors.photo
                          ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                          : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      )}
                    >
                      <Camera className={cn('h-8 w-8 mb-1', errors.photo ? 'text-red-400' : 'text-surface-400')} />
                      <span className={cn('text-xs', errors.photo ? 'text-red-500' : 'text-surface-500')}>
                        Ajouter
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
                    <p className="text-xs text-red-500 mt-1">{errors.photo.message}</p>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  error={errors.dateNaissance?.message}
                  {...register('dateNaissance')}
                />
                <Input
                  label="Lieu de naissance *"
                  placeholder="Ex: Kinshasa"
                  error={errors.lieuNaissance?.message}
                  {...register('lieuNaissance')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Nationalité *"
                  error={errors.nationalite?.message}
                  options={[
                    { value: 'Congolaise', label: 'Congolaise (RDC)' },
                    { value: 'Autre', label: 'Autre' },
                  ]}
                  {...register('nationalite')}
                />
                <Select
                  label="État civil *"
                  error={errors.etatCivil?.message}
                  options={[
                    { value: 'celibataire', label: 'Célibataire' },
                    { value: 'marie', label: 'Marié(e)' },
                    { value: 'divorce', label: 'Divorcé(e)' },
                    { value: 'veuf', label: 'Veuf/Veuve' },
                  ]}
                  {...register('etatCivil')}
                />
              </div>
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
                leftIcon={<MapPin className="h-4 w-4" />}
                {...register('adresse')}
              />
              <Input
                label="Téléphone *"
                type="tel"
                placeholder="09X XXX XXXX"
                error={errors.telephone?.message}
                leftIcon={<Phone className="h-4 w-4" />}
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

          {/* Poste et qualité */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Poste et qualifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Qualité / Poste *"
                  error={errors.qualite?.message}
                  options={[
                    { value: '', label: 'Sélectionner' },
                    { value: 'titulaire', label: 'Enseignant titulaire' },
                    { value: 'titulaire_classe', label: 'Titulaire de classe' },
                    { value: 'assistant', label: 'Assistant' },
                    { value: 'vacataire', label: 'Vacataire' },
                    { value: 'surveillant', label: 'Surveillant général' },
                    { value: 'prefet', label: 'Préfet des études' },
                  ]}
                  {...register('qualite')}
                />
                <Select
                  label="Titulaire de la classe"
                  options={[
                    { value: '', label: 'Non titulaire' },
                    ...classesDisponibles.map(c => ({ value: c, label: c })),
                  ]}
                  value={classeTitulaire}
                  onChange={(e) => setClasseTitulaire(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Diplôme le plus élevé"
                  placeholder="Ex: Licence en Sciences"
                  {...register('diplome')}
                />
                <Input
                  label="Spécialité"
                  placeholder="Ex: Mathématiques"
                  {...register('specialite')}
                />
              </div>

              {/* Matières assignées */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Matières assignées *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg max-h-48 overflow-y-auto">
                  {matieresDisponibles.map(matiere => (
                    <label
                      key={matiere.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                        selectedMatieres.includes(matiere.id)
                          ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700'
                          : 'bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 hover:border-primary-300'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMatieres.includes(matiere.id)}
                        onChange={() => toggleMatiere(matiere.id)}
                        className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm">{matiere.nom}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-surface-500 mt-2">
                  {selectedMatieres.length} matière(s) sélectionnée(s)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contrat et salaire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Contrat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Date d'embauche *"
                type="date"
                error={errors.dateEmbauche?.message}
                {...register('dateEmbauche')}
              />
              <Select
                label="Type de contrat *"
                error={errors.typeContrat?.message}
                options={[
                  { value: 'cdi', label: 'CDI' },
                  { value: 'cdd', label: 'CDD' },
                  { value: 'vacation', label: 'Vacation' },
                ]}
                {...register('typeContrat')}
              />
              <Input
                label="Salaire de base (FC) *"
                type="number"
                error={errors.salaireBase?.message}
                {...register('salaireBase', { valueAsNumber: true })}
              />
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-400">
                  💡 Le salaire peut être modifié ultérieurement via le menu Salaires.
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
            onClick={() => navigate('/enseignants')}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Enregistrer l'enseignant
          </Button>
        </div>
      </form>
    </div>
  )
}

export { NouvelEnseignantPage }

