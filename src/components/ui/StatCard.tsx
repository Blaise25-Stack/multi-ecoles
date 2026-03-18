/**
 * ============================================
 * StatCard - Carte de statistiques améliorée
 * ============================================
 * Avec animations, sparkline et tendances
 */

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { AnimatedCounter } from './AnimatedCounter'

interface StatCardProps {
  title: string
  value: number | string
  icon: ReactNode
  prefix?: string
  suffix?: string
  decimals?: number
  trend?: {
    value: number
    label?: string
    isPositiveGood?: boolean
  }
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
  onClick?: () => void
  sparkline?: number[]
  className?: string
}

const colorStyles = {
  primary: {
    bg: 'bg-primary-100 dark:bg-primary-900/40',
    icon: 'text-primary-600 dark:text-primary-400',
    gradient: 'from-primary-500/10 to-primary-600/5',
    sparkline: '#6366f1',
  },
  secondary: {
    bg: 'bg-secondary-100 dark:bg-secondary-900/40',
    icon: 'text-secondary-600 dark:text-secondary-400',
    gradient: 'from-secondary-500/10 to-secondary-600/5',
    sparkline: '#14b8a6',
  },
  accent: {
    bg: 'bg-accent-100 dark:bg-accent-900/40',
    icon: 'text-accent-600 dark:text-accent-400',
    gradient: 'from-accent-500/10 to-accent-600/5',
    sparkline: '#f59e0b',
  },
  success: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    icon: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    sparkline: '#10b981',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    icon: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500/10 to-amber-600/5',
    sparkline: '#f59e0b',
  },
  danger: {
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    icon: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500/10 to-rose-600/5',
    sparkline: '#ef4444',
  },
  info: {
    bg: 'bg-sky-100 dark:bg-sky-900/40',
    icon: 'text-sky-600 dark:text-sky-400',
    gradient: 'from-sky-500/10 to-sky-600/5',
    sparkline: '#0ea5e9',
  },
}

// Mini sparkline component
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-12 opacity-60"
    >
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polygon
        fill={`url(#gradient-${color})`}
        points={`0,100 ${points} 100,100`}
      />
    </svg>
  )
}

export function StatCard({
  title,
  value,
  icon,
  prefix = '',
  suffix = '',
  decimals = 0,
  trend,
  color = 'primary',
  onClick,
  sparkline,
  className,
}: StatCardProps) {
  const styles = colorStyles[color]

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return <TrendingUp className="h-4 w-4" />
    if (trend.value < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (!trend) return ''
    const isPositive = trend.value > 0
    const isGood = trend.isPositiveGood !== false ? isPositive : !isPositive
    return isGood
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40'
      : 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40'
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-white dark:bg-surface-800',
        'border border-surface-200/50 dark:border-surface-700/50',
        'p-6',
        'transition-all duration-300',
        onClick && [
          'cursor-pointer',
          'hover:shadow-lg hover:shadow-primary-500/5',
          'hover:border-primary-200 dark:hover:border-primary-800',
          'hover:-translate-y-0.5',
          'active:translate-y-0',
          'group',
        ],
        className
      )}
    >
      {/* Background gradient */}
      <div
        className={cn(
          'absolute top-0 right-0 w-40 h-40 rounded-full',
          'bg-gradient-to-br',
          styles.gradient,
          '-translate-y-1/2 translate-x-1/4',
          'transition-transform duration-500',
          onClick && 'group-hover:scale-110'
        )}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-3 rounded-xl', styles.bg)}>
            <div className={cn('h-6 w-6', styles.icon)}>{icon}</div>
          </div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold',
                getTrendColor()
              )}
            >
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-1">
          {typeof value === 'number' ? (
            <AnimatedCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
              className="text-3xl font-bold text-surface-900 dark:text-white"
            />
          ) : (
            <span className="text-3xl font-bold text-surface-900 dark:text-white">
              {prefix}{value}{suffix}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
          {title}
        </p>

        {/* Trend label */}
        {trend?.label && (
          <p className="text-xs text-surface-400 mt-1">{trend.label}</p>
        )}

        {/* Sparkline */}
        {sparkline && sparkline.length > 0 && (
          <div className="mt-4 -mx-2 -mb-2">
            <Sparkline data={sparkline} color={styles.sparkline} />
          </div>
        )}

        {/* Click indicator */}
        {onClick && (
          <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-5 w-5 text-primary-500" />
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard

