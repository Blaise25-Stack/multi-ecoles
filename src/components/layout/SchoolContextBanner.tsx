/**
 * ============================================
 * School Context Banner
 * ============================================
 * Affiche le contexte école actuel pour SuperAdmin
 * Permet de revenir à la vue globale
 */

import { X, Building2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'

const SchoolContextBanner = () => {
  const navigate = useNavigate()
  const { user, currentSchool, setCurrentSchool, isSuperAdmin } = useAuthStore()

  // Ne pas afficher si pas SuperAdmin ou pas de contexte école
  if (!isSuperAdmin() || !currentSchool) {
    return null
  }

  const exitSchoolContext = () => {
    setCurrentSchool(null)
    navigate('/superadmin')
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Mode SuperAdmin :
              </span>
              <span className="text-sm font-bold text-amber-900 dark:text-amber-100">
                {currentSchool.name}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                ({currentSchool.code})
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={exitSchoolContext}
            className="text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            Retour console SuperAdmin
          </Button>
        </div>
      </div>
    </div>
  )
}

export { SchoolContextBanner }



