/**
 * ============================================
 * SuperAdmin Route Guard
 * ============================================
 * Protège les routes réservées au Super Administrateur
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface SuperAdminRouteProps {
  children?: React.ReactNode
}

const SuperAdminRoute = ({ children }: SuperAdminRouteProps) => {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuthStore()

  // Afficher loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  // Rediriger vers login si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Rediriger vers dashboard si pas SuperAdmin
  if (!isSuperAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  // Rendre le contenu ou Outlet pour routes imbriquées
  return children ? <>{children}</> : <Outlet />
}

export { SuperAdminRoute }



