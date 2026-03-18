import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react'
import { loginSchema, type LoginFormData } from '@/utils/validation'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const { addToast } = useUIStore()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.login(data)
      
      if (response.success && response.data) {
        // Formater l'utilisateur pour le store
        const user = {
          id: String(response.data.user.id),
          email: response.data.user.email,
          nom: response.data.user.nom,
          prenom: response.data.user.prenom,
          telephone: response.data.user.telephone,
          avatar: response.data.user.avatar,
          role: response.data.user.role as any,
          permissions: response.data.user.permissions,
          isActive: response.data.user.isActive,
          lastLogin: response.data.user.lastLogin,
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.createdAt,
          schoolId: response.data.user.schoolId,
        }
        
        // Récupérer les infos de l'école (si présentes)
        const school = response.data.school || null
        
        // Stocker l'authentification avec le contexte école
        setAuth(user, response.data.token, response.data.refreshToken, school)
        addToast({ type: 'success', title: 'Connexion réussie', message: `Bienvenue ${response.data.user.prenom} !` })
        
        // Redirection basée sur le rôle
        if (user.role === 'super_admin') {
          // SuperAdmin → Console SuperAdmin
          navigate('/superadmin', { replace: true })
        } else {
          // Autres rôles → Dashboard de l'école
          navigate(from, { replace: true })
        }
      } else {
        addToast({ type: 'error', title: 'Erreur', message: response.message || 'Erreur de connexion' })
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Une erreur est survenue'
      addToast({ type: 'error', title: 'Erreur de connexion', message: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
              <span className="text-white font-bold text-3xl">S</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-heading font-bold text-white mb-4">
              Système de Gestion Scolaire
            </h1>
            <p className="text-xl text-primary-100 max-w-md">
              Une solution complète pour gérer votre établissement scolaire de manière efficace et moderne.
            </p>
          </div>

          <div className="space-y-4 text-primary-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-white">✓</span>
              </div>
              <span>Gestion des élèves et inscriptions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-white">✓</span>
              </div>
              <span>Comptabilité et paiements</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-white">✓</span>
              </div>
              <span>Notes, bulletins et emploi du temps</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-white">✓</span>
              </div>
              <span>Gestion des ressources humaines</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-12 xl:left-20 text-primary-200 text-sm">
          © 2024 SGS - Tous droits réservés
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20 bg-white dark:bg-surface-900">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">S</span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-surface-900 dark:text-white">
              SGS
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-heading font-bold text-surface-900 dark:text-white">
              Connexion
            </h2>
            <p className="mt-2 text-surface-500 dark:text-surface-400">
              Entrez vos identifiants pour accéder à votre espace
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              placeholder="votre@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-surface-400 hover:text-surface-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                {...register('password')}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-600 dark:text-surface-400">
                  Se souvenir de moi
                </span>
              </label>

              <button
                type="button"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              leftIcon={!isLoading && <LogIn className="h-5 w-5" />}
            >
              Se connecter
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au site vitrine
            </Link>
          </div>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
              Compte Super Administrateur :
            </p>
            <div className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
              <div className="flex justify-between">
                <span>Email :</span>
                <code className="text-primary-600 dark:text-primary-400">admin@sgs-rdc.edu</code>
              </div>
              <div className="flex justify-between">
                <span>Mot de passe :</span>
                <code className="text-primary-600 dark:text-primary-400">admin123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { LoginPage }

