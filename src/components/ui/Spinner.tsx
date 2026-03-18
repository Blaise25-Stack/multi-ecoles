import { cn } from '@/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-3',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary-600 border-r-transparent',
        sizes[size],
        className
      )}
      role="status"
      aria-label="Chargement"
    />
  )
}

interface PageLoaderProps {
  message?: string
}

const PageLoader = ({ message = 'Chargement...' }: PageLoaderProps) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
    <Spinner size="lg" />
    <p className="text-surface-500 dark:text-surface-400">{message}</p>
  </div>
)

export { Spinner, PageLoader }



