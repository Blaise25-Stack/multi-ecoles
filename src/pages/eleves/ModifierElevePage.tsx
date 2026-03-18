import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Users,
  Camera,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/stores/uiStore'
import { api } from '@/services/api'

const eleveSchema = z.object({
  photo: z.string().optional(),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  postnom: z.string().min(2, 'Le postnom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  dateNaissance: z.string().min(1, 'La date de naissance est requise'),
  lieuNaissance: z.string().min(2, 'Le lieu de naissance est requis'),
  sexe: z.enum(['M', 'F']),
  nationalite: z.string().min(1, 'La nationalité est requise'),
  adresse: z.string().min(5, "L'adresse est requise"),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
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

const ModifierElevePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    data: eleveResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['eleve', id],
    queryFn: async () => {
      const response = await api.get('/eleves/' + id)
      return response.data
    },
    enabled: !!id,
  })

  const eleve = eleveResponse?.data

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EleveFormData>({
    resolver: zodResolver(eleveSchema),
    defaultValues: {
      sexe: 'M',
      nationalite: '',
    },
  })

  useEffect(() => {
    if (!eleve) return

    reset({
      photo: eleve.photo || '',
      nom: eleve.nom || '',
      postnom: eleve.postnom || '',
      prenom: eleve.prenom || '',
      dateNaissance: eleve.date_naissance?.split('T')[0] || '',
      lieuNaissance: eleve.lieu_naissance || '',
      sexe: eleve.sexe || 'M',
      nationalite: eleve.nationalite || '',
      adresse: eleve.adresse || '',
      telephone: eleve.telephone || '',
      email: eleve.email || '',
      nomPere: eleve.nom_pere || '',
      professionPere: eleve.profession_pere || '',
      telephonePere: eleve.telephone_pere || '',
      nomMere: eleve.nom_mere || '',
      professionMere: eleve.profession_mere || '',
      telephoneMere: eleve.telephone_mere || '',
      nomTuteur: eleve.nom_tuteur || '',
      telephoneTuteur: eleve.telephone_tuteur || '',
      relationTuteur: eleve.relation_tuteur || '',
    })

    if (eleve.photo) {
      setPhotoPreview(eleve.photo)
    }
  }, [eleve, reset])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setPhotoPreview(result)
      setValue('photo', result)
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhotoPreview(null)
    setPhotoFile(null)
    setValue('photo', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: EleveFormData) => {
    setIsSubmitting(true)

    try {
      const formData = new FormData()

      if (photoFile) {
        formData.append('photo', photoFile)
      }

      formData.append('nom', data.nom)
      formData.append('postnom', data.postnom)
      formData.append('prenom', data.prenom)
      formData.append('sexe', data.sexe)
      formData.append('date_naissance', data.dateNaissance)
      formData.append('lieu_naissance', data.lieuNaissance)
      formData.append('nationalite', data.nationalite)
      formData.append('adresse', data.adresse)
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
      if (data.relationTuteur) formData.append('relation_tuteur', data.relationTuteur)

      const response = await api.put('/eleves/' + id, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (response.data.success) {
        addToast({
          type: 'success',
          title: 'Succès',
          message: 'Profil de l\'élève mis à jour avec succès',
        })
        navigate('/eleves/' + id)
      } else {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour')
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Erreur lors de la mise à jour de l'élève",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="lg" />
        <p className="text-surface-500 dark:text-surface-400">Chargement du profil...</p>
      </div>
    )
  }

  if (isError || !eleve) {
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/eleves/' + id)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au profil
        </Button>
      </div>

      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
          Modifier l'élève
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          {eleve.prenom} {eleve.nom} — {eleve.matricule}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo & Identité */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                Photo & Informations personnelles
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo upload */}
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                Photo de profil
              </label>

              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary-200 dark:border-primary-800 shadow-lg"
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
                  className="w-32 h-32 rounded-full border-4 border-dashed border-surface-300 dark:border-surface-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex flex-col items-center justify-center cursor-pointer transition-all"
                >
                  <Camera className="h-8 w-8 text-surface-400 mb-1" />
                  <span className="text-xs text-surface-500">Ajouter</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <p className="text-xs text-surface-500 mt-2">
                Formats : JPG, PNG, WebP — Max 5MB
              </p>
            </div>

            {/* Identity fields */}
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

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                Coordonnées
              </div>
            </CardTitle>
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

        {/* Parents / Tuteurs */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Parents / Tuteur
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Père */}
            <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <h3 className="font-medium text-surface-900 dark:text-white mb-4">Père</h3>
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
              <h3 className="font-medium text-surface-900 dark:text-white mb-4">Mère</h3>
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
              <h3 className="font-medium text-surface-900 dark:text-white mb-4">
                Tuteur (si différent des parents)
              </h3>
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

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/eleves/' + id)}
          >
            Annuler
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  )
}

export { ModifierElevePage }
