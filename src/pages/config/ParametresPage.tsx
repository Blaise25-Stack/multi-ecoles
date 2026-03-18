import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Building,
  Calendar,
  Users,
  Shield,
  Bell,
  Database,
  Save,
  ChevronRight,
  Upload,
  Trash2,
  ImageIcon,
  Plus,
  Loader2,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/stores/uiStore'
import { api } from '@/services/api'

const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

type TabId = 'etablissement' | 'annee' | 'securite' | 'notifications' | 'sauvegardes'

interface EtablissementData {
  id?: number
  nom: string
  devise: string
  adresse: string
  telephone: string
  email: string
  site_web: string
  ministere: string
  province: string
  logo: string | null
}

interface AnneeScolaire {
  id: number
  libelle: string
  date_debut: string
  date_fin: string
  est_active: boolean
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'etablissement', label: 'Établissement', icon: Building },
  { id: 'annee', label: 'Année scolaire', icon: Calendar },
  { id: 'securite', label: 'Sécurité', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'sauvegardes', label: 'Sauvegardes', icon: Database },
]

const ParametresPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>('etablissement')
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [backupLoading, setBackupLoading] = useState(false)

  const [etablissement, setEtablissement] = useState({
    nom: '',
    devise: '',
    adresse: '',
    telephone: '',
    email: '',
    siteWeb: '',
    ministere: '',
    province: '',
  })

  const [showNewAnneeModal, setShowNewAnneeModal] = useState(false)
  const [newAnnee, setNewAnnee] = useState({
    libelle: '',
    date_debut: '',
    date_fin: '',
    est_active: false,
  })

  // --- API Queries ---

  const { data: etablissementData, isLoading: isLoadingEtab } = useQuery({
    queryKey: ['etablissement'],
    queryFn: async () => {
      const response = await api.get<any>('/etablissement')
      const d = response.data
      return (d?.data ?? d) as EtablissementData
    },
  })

  const { data: annees, isLoading: isLoadingAnnees } = useQuery({
    queryKey: ['annees-scolaires'],
    queryFn: async () => {
      const response = await api.get<any>('/etablissement/annees-scolaires')
      const d = response.data
      const list = d?.data ?? d
      return (Array.isArray(list) ? list : []) as AnneeScolaire[]
    },
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles-with-counts'],
    queryFn: async () => {
      const res = await api.get<any>('/utilisateurs/roles-stats')
      return (res.data?.data ?? res.data ?? []) as { role: string; description: string; count: number }[]
    },
    enabled: activeTab === 'securite',
  })

  const { data: backupsData, refetch: refetchBackups } = useQuery({
    queryKey: ['backups-list'],
    queryFn: async () => {
      const res = await api.get<any>('/backup/list')
      return (res.data?.data ?? []) as { filename: string; size: string; date: string }[]
    },
    enabled: activeTab === 'sauvegardes',
  })

  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      await api.post('/backup')
      addToast({ type: 'success', message: 'Sauvegarde créée avec succès' })
      refetchBackups()
    } catch {
      addToast({ type: 'error', message: 'Erreur lors de la sauvegarde' })
    } finally {
      setBackupLoading(false)
    }
  }

  const handleDownloadBackup = (filename: string) => {
    const stored = localStorage.getItem('sgs-auth')
    const parsed = stored ? JSON.parse(stored) : null
    const jwt = parsed?.state?.token
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    window.open(`${baseUrl}/backup/download/${filename}?token=${jwt}`, '_blank')
  }

  useEffect(() => {
    if (etablissementData) {
      setEtablissement({
        nom: etablissementData.nom || '',
        devise: etablissementData.devise || '',
        adresse: etablissementData.adresse || '',
        telephone: etablissementData.telephone || '',
        email: etablissementData.email || '',
        siteWeb: etablissementData.site_web || '',
        ministere: etablissementData.ministere || '',
        province: etablissementData.province || '',
      })
      if (etablissementData.logo) {
        const logoUrl = etablissementData.logo.startsWith('http') ? etablissementData.logo : `${API_HOST}${etablissementData.logo}`
        setLogoPreview(logoUrl)
      }
    }
  }, [etablissementData])

  // --- Mutations ---

  const saveEtablissementMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('nom', etablissement.nom)
      formData.append('devise', etablissement.devise)
      formData.append('adresse', etablissement.adresse)
      formData.append('telephone', etablissement.telephone)
      formData.append('email', etablissement.email)
      formData.append('site_web', etablissement.siteWeb)
      formData.append('ministere', etablissement.ministere)
      formData.append('province', etablissement.province)
      if (logoFile) {
        formData.append('logo', logoFile)
      }
      return api.put('/etablissement', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etablissement'] })
      setLogoFile(null)
      addToast({
        type: 'success',
        title: 'Succès',
        message: 'Informations de l\'établissement enregistrées avec succès !',
      })
    },
    onError: () => {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'enregistrer les modifications.',
      })
    },
  })

  const createAnneeMutation = useMutation({
    mutationFn: async (data: typeof newAnnee) => {
      return api.post('/etablissement/annees-scolaires', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annees-scolaires'] })
      setShowNewAnneeModal(false)
      setNewAnnee({ libelle: '', date_debut: '', date_fin: '', est_active: false })
      addToast({
        type: 'success',
        title: 'Succès',
        message: 'Année scolaire créée avec succès !',
      })
    },
    onError: () => {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de créer l\'année scolaire.',
      })
    },
  })

  // --- Handlers ---

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
        addToast({
          type: 'error',
          title: 'Erreur',
          message: 'Format de fichier invalide. Utilisez PNG, JPG ou WebP.',
        })
        return
      }

      if (file.size > 2 * 1024 * 1024) {
        addToast({
          type: 'error',
          title: 'Erreur',
          message: 'Le fichier est trop volumineux. Maximum 2MB.',
        })
        return
      }

      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      addToast({
        type: 'success',
        title: 'Succès',
        message: 'Logo sélectionné. Cliquez sur Enregistrer pour appliquer.',
      })
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setLogoFile(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
    addToast({
      type: 'info',
      title: 'Info',
      message: 'Logo supprimé. Le logo par défaut sera utilisé.',
    })
  }

  const handleSaveEtablissement = () => {
    saveEtablissementMutation.mutate()
  }

  const handleCreateAnnee = () => {
    if (!newAnnee.libelle || !newAnnee.date_debut || !newAnnee.date_fin) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez remplir tous les champs obligatoires.',
      })
      return
    }
    createAnneeMutation.mutate(newAnnee)
  }

  const anneeActive = annees?.find(a => a.est_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
          Paramètres
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Configurez votre système de gestion scolaire
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Card padding="sm">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      activeTab === tab.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                )
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Établissement */}
          {activeTab === 'etablissement' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations de l'établissement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingEtab ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    <span className="ml-3 text-surface-500">Chargement...</span>
                  </div>
                ) : (
                  <>
                    {/* Section Logo */}
                    <div className="p-4 border border-dashed border-surface-300 dark:border-surface-600 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                      <h3 className="font-medium text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary-600" />
                        Logo de l'école
                      </h3>

                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative">
                          <div className={cn(
                            'w-32 h-32 rounded-xl flex items-center justify-center overflow-hidden',
                            'border-2 border-surface-200 dark:border-surface-700',
                            'bg-white dark:bg-surface-900'
                          )}>
                            {logoPreview ? (
                              <img
                                src={logoPreview}
                                alt="Logo de l'école"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-center">
                                <span className="text-5xl font-bold text-primary-600">
                                  {etablissement.nom?.charAt(0) || 'S'}
                                </span>
                                <p className="text-xs text-surface-500 mt-1">Logo par défaut</p>
                              </div>
                            )}
                          </div>

                          {logoFile && (
                            <div className="absolute -top-2 -right-2">
                              <Badge variant="warning" size="sm">Nouveau</Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-3">
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={handleLogoChange}
                            className="hidden"
                            id="logo-upload"
                          />

                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Upload className="h-4 w-4" />}
                            onClick={() => logoInputRef.current?.click()}
                          >
                            {logoPreview ? 'Changer le logo' : 'Téléverser un logo'}
                          </Button>

                          {logoPreview && (
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Trash2 className="h-4 w-4" />}
                              onClick={handleRemoveLogo}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Supprimer le logo
                            </Button>
                          )}

                          <div className="text-xs text-surface-500 space-y-1">
                            <p>• Formats acceptés : PNG, JPG, WebP</p>
                            <p>• Taille maximale : 2 MB</p>
                            <p>• Dimensions recommandées : 200x200 px</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informations de l'établissement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nom de l'établissement"
                        value={etablissement.nom}
                        onChange={(e) => setEtablissement({ ...etablissement, nom: e.target.value })}
                      />
                      <Input
                        label="Devise"
                        value={etablissement.devise}
                        onChange={(e) => setEtablissement({ ...etablissement, devise: e.target.value })}
                      />
                      <Input
                        label="Adresse"
                        value={etablissement.adresse}
                        onChange={(e) => setEtablissement({ ...etablissement, adresse: e.target.value })}
                      />
                      <Input
                        label="Téléphone"
                        value={etablissement.telephone}
                        onChange={(e) => setEtablissement({ ...etablissement, telephone: e.target.value })}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={etablissement.email}
                        onChange={(e) => setEtablissement({ ...etablissement, email: e.target.value })}
                      />
                      <Input
                        label="Site web"
                        value={etablissement.siteWeb}
                        onChange={(e) => setEtablissement({ ...etablissement, siteWeb: e.target.value })}
                      />
                      <Input
                        label="Ministère de tutelle"
                        value={etablissement.ministere}
                        onChange={(e) => setEtablissement({ ...etablissement, ministere: e.target.value })}
                      />
                      <Input
                        label="Province"
                        value={etablissement.province}
                        onChange={(e) => setEtablissement({ ...etablissement, province: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-surface-200 dark:border-surface-700">
                      <Button
                        leftIcon={saveEtablissementMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        onClick={handleSaveEtablissement}
                        disabled={saveEtablissementMutation.isPending}
                      >
                        {saveEtablissementMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Année scolaire */}
          {activeTab === 'annee' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Année scolaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingAnnees ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    <span className="ml-3 text-surface-500">Chargement...</span>
                  </div>
                ) : (
                  <>
                    {anneeActive && (
                      <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">Année active</p>
                            <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">{anneeActive.libelle}</p>
                            <p className="text-xs text-primary-500 mt-1">
                              {new Date(anneeActive.date_debut).toLocaleDateString('fr-FR')} — {new Date(anneeActive.date_fin).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="font-medium">Historique des années</h3>
                      {annees && annees.length > 0 ? (
                        annees.map((annee) => (
                          <div
                            key={annee.id}
                            className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-surface-400" />
                              <div>
                                <span className="font-medium">{annee.libelle}</span>
                                <p className="text-xs text-surface-500">
                                  {new Date(annee.date_debut).toLocaleDateString('fr-FR')} — {new Date(annee.date_fin).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {annee.est_active ? (
                                <Badge variant="success">Active</Badge>
                              ) : (
                                <Badge variant="default">Clôturée</Badge>
                              )}
                              <Button variant="ghost" size="sm">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-surface-500 text-center py-4">Aucune année scolaire enregistrée.</p>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={() => setShowNewAnneeModal(true)}
                    >
                      Créer une nouvelle année scolaire
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sécurité */}
          {activeTab === 'securite' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité et accès
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Profils d'accès (RBAC)</h3>
                  {(rolesData || []).map((profil, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border border-surface-200 dark:border-surface-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{profil.role}</p>
                        <p className="text-sm text-surface-500">{profil.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="default">{profil.count} utilisateur{profil.count > 1 ? 's' : ''}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/utilisateurs')}>Configurer</Button>
                      </div>
                    </div>
                  ))}
                  {(!rolesData || rolesData.length === 0) && (
                    <p className="text-surface-500 text-center py-4">Chargement des rôles...</p>
                  )}
                </div>

                <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                  <h3 className="font-medium mb-4">Paramètres de sécurité</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                      <span>Expiration de session (minutes)</span>
                      <Input type="number" defaultValue="60" className="w-24" />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                      <span>Tentatives de connexion max</span>
                      <Input type="number" defaultValue="5" className="w-24" />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer">
                      <span>Double authentification (2FA)</span>
                      <input type="checkbox" className="w-5 h-5 rounded border-surface-300 text-primary-600" />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Paramètres de notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Nouveaux paiements', description: 'Notification lors d\'un paiement reçu', email: true, app: true },
                  { label: 'Paiements en retard', description: 'Alertes pour les échéances dépassées', email: true, app: true },
                  { label: 'Nouvelles inscriptions', description: 'Notification lors d\'une inscription', email: false, app: true },
                  { label: 'Demandes de congé', description: 'Alertes pour les demandes de congé', email: true, app: true },
                  { label: 'Rapports générés', description: 'Notification quand un rapport est prêt', email: true, app: false },
                ].map((notif, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-surface-200 dark:border-surface-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{notif.label}</p>
                      <p className="text-sm text-surface-500">{notif.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={notif.email}
                          className="w-4 h-4 rounded border-surface-300 text-primary-600"
                        />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={notif.app}
                          className="w-4 h-4 rounded border-surface-300 text-primary-600"
                        />
                        <span className="text-sm">App</span>
                      </label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sauvegardes */}
          {activeTab === 'sauvegardes' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Sauvegardes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {backupsData && backupsData.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <Database className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100">Dernière sauvegarde</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {new Date(backupsData[0].date).toLocaleString('fr-FR')} - {backupsData[0].size}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    leftIcon={backupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    onClick={handleBackup}
                    disabled={backupLoading}
                  >
                    {backupLoading ? 'Sauvegarde en cours...' : 'Sauvegarder la base de données'}
                  </Button>
                  {backupsData && backupsData.length > 0 && (
                    <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => handleDownloadBackup(backupsData[0].filename)}>
                      Télécharger la sauvegarde
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Historique des sauvegardes</h3>
                  {(!backupsData || backupsData.length === 0) && (
                    <p className="text-surface-500 text-center py-4">Aucune sauvegarde disponible</p>
                  )}
                  {(backupsData || []).map((backup, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-surface-400" />
                        <div>
                          <p className="font-medium">{new Date(backup.date).toLocaleString('fr-FR')}</p>
                          <p className="text-sm text-surface-500">{backup.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadBackup(backup.filename)}>
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Nouvelle Année Scolaire */}
      <Modal
        isOpen={showNewAnneeModal}
        onClose={() => setShowNewAnneeModal(false)}
        title="Créer une nouvelle année scolaire"
      >
        <div className="space-y-4">
          <Input
            label="Libellé *"
            placeholder="Ex: 2025-2026"
            value={newAnnee.libelle}
            onChange={(e) => setNewAnnee({ ...newAnnee, libelle: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début *"
              type="date"
              value={newAnnee.date_debut}
              onChange={(e) => setNewAnnee({ ...newAnnee, date_debut: e.target.value })}
            />
            <Input
              label="Date de fin *"
              type="date"
              value={newAnnee.date_fin}
              onChange={(e) => setNewAnnee({ ...newAnnee, date_fin: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={newAnnee.est_active}
              onChange={(e) => setNewAnnee({ ...newAnnee, est_active: e.target.checked })}
              className="w-5 h-5 rounded border-surface-300 text-primary-600"
            />
            <div>
              <span className="font-medium">Activer cette année scolaire</span>
              <p className="text-xs text-surface-500">Désactivera l'année scolaire actuellement active</p>
            </div>
          </label>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowNewAnneeModal(false)}>
              Annuler
            </Button>
            <Button
              leftIcon={createAnneeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              onClick={handleCreateAnnee}
              disabled={createAnneeMutation.isPending}
            >
              {createAnneeMutation.isPending ? 'Création...' : 'Créer l\'année scolaire'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { ParametresPage }
