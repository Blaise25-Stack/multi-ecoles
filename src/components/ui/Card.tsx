import type { ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = ({
  children,
  hover = false,
  padding = 'md',
  className,
  ...props
}: CardProps) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl',
        'border border-surface-200 dark:border-surface-700',
        'shadow-card',
        hover && 'transition-all duration-200 hover:shadow-soft hover:border-surface-300 dark:hover:border-surface-600',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const CardHeader = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center justify-between mb-4', className)}
    {...props}
  >
    {children}
  </div>
)

const CardTitle = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      'text-lg font-semibold text-surface-900 dark:text-surface-100',
      className
    )}
    {...props}
  >
    {children}
  </h3>
)

const CardDescription = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn('text-sm text-surface-500 dark:text-surface-400', className)}
    {...props}
  >
    {children}
  </p>
)

const CardContent = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
)

const CardFooter = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center justify-end gap-3 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }



