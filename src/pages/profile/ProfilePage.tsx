import { useState, useRef } from 'react'
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Save,
  Shield,
  Bell,
  Palette,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  Key,
  LogOut,
  Clock,
  MapPin,
  Calendar,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import { useAuthStore, roleLabels } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { formatDate } from '@/utils/format'

type TabId = 'informations' | 'securite' | 'notifications' | 'apparence'

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'informations', label: 'Informations', icon: User },
  { id: 'securite', label: 'Sécurité', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'apparence', label: 'Apparence', icon: Palette },
]

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuthStore()
  const { addToast, theme, setTheme } = useUIStore()
  const [activeTab, setActiveTab] = useState<TabId>('informations')
  
  // État pour la photo de profil
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.avatar || null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  
  // État pour les informations personnelles
  const [profileData, setProfileData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
  })
  
  // État pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  
  // État pour les notifications
  const [notifications, setNotifications] = useState({
    emailPaiements: true,
    emailInscriptions: false,
    emailConges: true,
    emailRapports: true,
    appPaiements: true,
    appInscriptions: true,
    appConges: true,
    appRapports: false,
    sonNotifications: true,
  })
  
  // État pour la déconnexion de toutes les sessions
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false)

  // Gestion du changement de photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
        addToast({
          type: 'success',
          title: 'Succès',
          message: 'Photo de profil mise à jour !',
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Supprimer la photo
  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    if (photoInputRef.current) {
      photoInputRef.current.value = ''
    }
    addToast({
      type: 'info',
      title: 'Info',
      message: 'Photo de profil supprimée.',
    })
  }

  // Enregistrer les informations personnelles
  const handleSaveProfile = () => {
    updateUser({
      nom: profileData.nom,
      prenom: profileData.prenom,
      email: profileData.email,
      telephone: profileData.telephone,
    })
    addToast({
      type: 'success',
      title: 'Succès',
      message: 'Informations personnelles mises à jour !',
    })
  }

  // Changer le mot de passe
  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Les mots de passe ne correspondent pas.',
      })
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Le mot de passe doit contenir au moins 8 caractères.',
      })
      return
    }
    
    // Simulation de changement de mot de passe
    addToast({
      type: 'success',
      title: 'Succès',
      message: 'Mot de passe modifié avec succès !',
    })
    setShowPasswordModal(false)
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  // Enregistrer les préférences de notifications
  const handleSaveNotifications = () => {
    addToast({
      type: 'success',
      title: 'Succès',
      message: 'Préférences de notifications enregistrées !',
    })
  }

  // Déconnecter toutes les sessions
  const handleLogoutAll = () => {
    addToast({
      type: 'success',
      title: 'Succès',
      message: 'Toutes les sessions ont été déconnectées.',
    })
    setShowLogoutAllModal(false)
    logout()
  }

  // Force du mot de passe
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]/)) strength++
    if (password.match(/[A-Z]/)) strength++
    if (password.match(/[0-9]/)) strength++
    if (password.match(/[^a-zA-Z0-9]/)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword)
  const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
          Mon profil
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-400"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16">
            {/* Photo de profil */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl border-4 border-white dark:border-surface-900 overflow-hidden bg-white dark:bg-surface-800 shadow-lg">
                {photoPreview ? (
                  <img src={photoPreview} alt="Photo de profil" className="w-full h-full object-cover" />
                ) : (
                  <Avatar nom={user?.nom} prenom={user?.prenom} size="xl" className="w-full h-full text-4xl" />
                )}
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-lg"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            
            {/* Infos utilisateur */}
            <div className="flex-1 pt-4 sm:pt-0">
              <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
                {user?.prenom} {user?.nom}
              </h2>
              <p className="text-surface-500 dark:text-surface-400">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="primary">{roleLabels[user?.role || 'eleve']}</Badge>
                <Badge variant="success" dot>Actif</Badge>
              </div>
            </div>
            
            {/* Statistiques rapides */}
            <div className="flex gap-6 pt-4 sm:pt-0">
              <div className="text-center">
                <p className="text-2xl font-bold text-surface-900 dark:text-white">
                  {user?.lastLogin ? formatDate(user.lastLogin, 'dd/MM') : '-'}
                </p>
                <p className="text-xs text-surface-500">Dernière connexion</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
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
                  </button>
                )
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Informations personnelles */}
          {activeTab === 'informations' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo de profil */}
                <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white dark:bg-surface-900">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <Avatar nom={user?.nom} prenom={user?.prenom} size="lg" className="w-full h-full" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      leftIcon={<Camera className="h-4 w-4" />}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      Changer la photo
                    </Button>
                    {photoPreview && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleRemovePhoto}
                        className="text-red-600"
                      >
                        Supprimer
                      </Button>
                    )}
                    <p className="text-xs text-surface-500">PNG, JPG, WebP • Max 2MB</p>
                  </div>
                </div>

                {/* Formulaire */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nom"
                    leftIcon={<User className="h-4 w-4" />}
                    value={profileData.nom}
                    onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                  />
                  <Input
                    label="Prénom"
                    leftIcon={<User className="h-4 w-4" />}
                    value={profileData.prenom}
                    onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    leftIcon={<Phone className="h-4 w-4" />}
                    value={profileData.telephone}
                    onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                    placeholder="+243 XX XXX XXXX"
                  />
                </div>

                {/* Informations non modifiables */}
                <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg space-y-3">
                  <h4 className="font-medium text-surface-700 dark:text-surface-300">Informations du compte</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-surface-400" />
                      <span className="text-surface-500">Rôle :</span>
                      <span className="font-medium">{roleLabels[user?.role || 'eleve']}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-surface-400" />
                      <span className="text-surface-500">Membre depuis :</span>
                      <span className="font-medium">{user?.createdAt ? formatDate(user.createdAt, 'MMMM yyyy') : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-surface-400" />
                      <span className="text-surface-500">Dernière connexion :</span>
                      <span className="font-medium">{user?.lastLogin ? formatDate(user.lastLogin, 'dd/MM/yyyy HH:mm') : '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-surface-200 dark:border-surface-700">
                  <Button leftIcon={<Save className="h-4 w-4" />} onClick={handleSaveProfile}>
                    Enregistrer les modifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sécurité */}
          {activeTab === 'securite' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Mot de passe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-surface-500">
                    Nous vous recommandons d'utiliser un mot de passe fort et unique.
                  </p>
                  <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-surface-400" />
                      <div>
                        <p className="font-medium">Mot de passe actuel</p>
                        <p className="text-sm text-surface-500">Dernière modification : il y a 30 jours</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sessions actives
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Session actuelle */}
                  <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <Monitor className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-100">Session actuelle</p>
                          <p className="text-sm text-green-700 dark:text-green-300">Windows • Chrome • Kinshasa, RDC</p>
                        </div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>

                  {/* Autres sessions */}
                  <div className="space-y-3">
                    {[
                      { device: 'Android', browser: 'Chrome Mobile', location: 'Lubumbashi, RDC', date: '01/12/2024' },
                      { device: 'iPhone', browser: 'Safari', location: 'Kinshasa, RDC', date: '28/11/2024' },
                    ].map((session, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700">
                            <Monitor className="h-5 w-5 text-surface-500" />
                          </div>
                          <div>
                            <p className="font-medium">{session.device} • {session.browser}</p>
                            <p className="text-sm text-surface-500">{session.location} • {session.date}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          Déconnecter
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    leftIcon={<LogOut className="h-4 w-4" />}
                    onClick={() => setShowLogoutAllModal(true)}
                  >
                    Déconnecter toutes les sessions
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Préférences de notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-surface-500" />
                    Notifications par email
                  </h4>
                  <div className="space-y-3">
                    {[
                      { key: 'emailPaiements', label: 'Paiements', desc: 'Recevoir un email lors d\'un nouveau paiement' },
                      { key: 'emailInscriptions', label: 'Inscriptions', desc: 'Recevoir un email lors d\'une nouvelle inscription' },
                      { key: 'emailConges', label: 'Demandes de congé', desc: 'Recevoir un email pour les demandes de congé' },
                      { key: 'emailRapports', label: 'Rapports', desc: 'Recevoir un email quand un rapport est généré' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-surface-500">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications] as boolean}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* App */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-surface-500" />
                    Notifications dans l'application
                  </h4>
                  <div className="space-y-3">
                    {[
                      { key: 'appPaiements', label: 'Paiements', desc: 'Notification pour les nouveaux paiements' },
                      { key: 'appInscriptions', label: 'Inscriptions', desc: 'Notification pour les nouvelles inscriptions' },
                      { key: 'appConges', label: 'Demandes de congé', desc: 'Notification pour les demandes de congé' },
                      { key: 'appRapports', label: 'Rapports', desc: 'Notification quand un rapport est prêt' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-surface-500">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications] as boolean}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Son */}
                <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                  <label className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg cursor-pointer">
                    <div>
                      <p className="font-medium">Son des notifications</p>
                      <p className="text-sm text-surface-500">Jouer un son lors des notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.sonNotifications}
                      onChange={(e) => setNotifications({ ...notifications, sonNotifications: e.target.checked })}
                      className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                </div>

                <div className="flex justify-end pt-4 border-t border-surface-200 dark:border-surface-700">
                  <Button leftIcon={<Save className="h-4 w-4" />} onClick={handleSaveNotifications}>
                    Enregistrer les préférences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apparence */}
          {activeTab === 'apparence' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Apparence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Thème de l'interface</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Light */}
                    <button
                      onClick={() => setTheme('light')}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        theme === 'light'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                      )}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white border border-surface-200 flex items-center justify-center">
                        <Sun className="h-6 w-6 text-amber-500" />
                      </div>
                      <p className="font-medium">Clair</p>
                      <p className="text-sm text-surface-500">Interface lumineuse</p>
                      {theme === 'light' && (
                        <Badge variant="primary" className="mt-2">Actif</Badge>
                      )}
                    </button>

                    {/* Dark */}
                    <button
                      onClick={() => setTheme('dark')}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        theme === 'dark'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                      )}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center">
                        <Moon className="h-6 w-6 text-blue-400" />
                      </div>
                      <p className="font-medium">Sombre</p>
                      <p className="text-sm text-surface-500">Interface sombre</p>
                      {theme === 'dark' && (
                        <Badge variant="primary" className="mt-2">Actif</Badge>
                      )}
                    </button>

                    {/* System */}
                    <button
                      onClick={() => setTheme('system')}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        theme === 'system'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                      )}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-white to-surface-800 border border-surface-300 flex items-center justify-center">
                        <Monitor className="h-6 w-6 text-surface-600" />
                      </div>
                      <p className="font-medium">Système</p>
                      <p className="text-sm text-surface-500">Suivre le système</p>
                      {theme === 'system' && (
                        <Badge variant="primary" className="mt-2">Actif</Badge>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                  <p className="text-sm text-surface-500">
                    💡 Le thème "Système" s'adapte automatiquement aux préférences de votre appareil.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Changement de mot de passe */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Modifier le mot de passe"
      >
        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Mot de passe actuel"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-9 text-surface-400 hover:text-surface-600"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Nouveau mot de passe"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-9 text-surface-400 hover:text-surface-600"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Indicateur de force */}
          {passwordData.newPassword && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-surface-200 dark:bg-surface-700'
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-surface-500">
                Force : {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Entrez un mot de passe'}
              </p>
            </div>
          )}

          <div className="relative">
            <Input
              label="Confirmer le nouveau mot de passe"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              leftIcon={<Lock className="h-4 w-4" />}
              error={
                passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                  ? 'Les mots de passe ne correspondent pas'
                  : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-surface-400 hover:text-surface-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 Un bon mot de passe contient au moins 8 caractères, des majuscules, des minuscules, des chiffres et des caractères spéciaux.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleChangePassword}
              disabled={!passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
            >
              Modifier le mot de passe
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Déconnecter toutes les sessions */}
      <Modal
        isOpen={showLogoutAllModal}
        onClose={() => setShowLogoutAllModal(false)}
        title="Déconnecter toutes les sessions"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Êtes-vous sûr ?
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Toutes vos sessions actives seront déconnectées, y compris celle-ci.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowLogoutAllModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleLogoutAll}>
              Tout déconnecter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { ProfilePage }

