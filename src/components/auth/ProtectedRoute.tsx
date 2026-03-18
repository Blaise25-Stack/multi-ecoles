import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { PageLoader } from '@/components/ui/Spinner'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requiredModule?: string
}

const ProtectedRoute = ({
  children,
  requiredRoles,
  requiredModule,
}: ProtectedRouteProps) => {
  const location = useLocation()
  const { isAuthenticated, isLoading, user, hasRole, canAccess } = useAuthStore()

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return <PageLoader message="Vérification de l'authentification..." />
  }

  // Rediriger vers login si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Vérifier les rôles requis
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasRole(requiredRoles)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Vérifier l'accès au module
  if (requiredModule && !canAccess(requiredModule)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export { ProtectedRoute }



