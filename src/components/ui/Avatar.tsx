import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/format'

const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

export interface AvatarProps {
  src?: string | null
  alt?: string
  nom?: string
  prenom?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const Avatar = ({
  src,
  alt,
  nom = '',
  prenom = '',
  size = 'md',
  className,
}: AvatarProps) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  const initials = getInitials(nom, prenom)

  // Générer une couleur de fond basée sur le nom
  const getColorClass = () => {
    const colors = [
      'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
      'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
      'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    ]
    
    const hash = (nom + prenom)
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    return colors[hash % colors.length]
  }

  if (src) {
    const imgSrc = src.startsWith('http') ? src : `${API_HOST}${src}`
    return (
      <img
        src={imgSrc}
        alt={alt || `${prenom} ${nom}`}
        className={cn(
          'rounded-full object-cover',
          sizes[size],
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold',
        sizes[size],
        getColorClass(),
        className
      )}
      title={`${prenom} ${nom}`}
    >
      {initials || '?'}
    </div>
  )
}

export { Avatar }



