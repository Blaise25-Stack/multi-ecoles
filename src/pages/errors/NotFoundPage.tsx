import { useNavigate } from 'react-router-dom'
import { FileQuestion, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-10 w-10 text-primary-600 dark:text-primary-400" />
        </div>
        
        <h1 className="text-6xl font-heading font-bold text-surface-900 dark:text-white mb-2">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold text-surface-700 dark:text-surface-300 mb-3">
          Page introuvable
        </h2>
        
        <p className="text-surface-500 dark:text-surface-400 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Retour
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            leftIcon={<Home className="h-4 w-4" />}
          >
            Tableau de bord
          </Button>
        </div>
      </div>
    </div>
  )
}

export { NotFoundPage }



