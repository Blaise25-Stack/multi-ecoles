/**
 * ============================================
 * ConfirmModal - Modal de confirmation
 * ============================================
 * Modal réutilisable pour confirmer des actions
 * (suppression, validation, etc.)
 */

import { ReactNode } from 'react'
import { AlertTriangle, Trash2, CheckCircle, Info, X, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

type ConfirmType = 'danger' | 'warning' | 'success' | 'info'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string | ReactNode
  confirmText?: string
  cancelText?: string
  type?: ConfirmType
  isLoading?: boolean
}

const typeConfig: Record<ConfirmType, { 
  icon: typeof AlertTriangle
  iconBg: string
  iconColor: string
  buttonVariant: 'danger' | 'primary' | 'outline'
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    buttonVariant: 'danger',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    buttonVariant: 'primary',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    buttonVariant: 'primary',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonVariant: 'primary',
  },
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const config = typeConfig[type]
  const Icon = config.icon

  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-surface-200 dark:border-surface-700">
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-surface-500" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8 text-center">
            {/* Icon */}
            <div className={cn('mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4', config.iconBg)}>
              <Icon className={cn('h-8 w-8', config.iconColor)} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
              {title}
            </h3>

            {/* Message */}
            <div className="text-surface-600 dark:text-surface-400 mb-6">
              {message}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {cancelText}
              </Button>
              <Button
                variant={config.buttonVariant}
                onClick={handleConfirm}
                disabled={isLoading}
                leftIcon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                className="min-w-[100px]"
              >
                {isLoading ? 'En cours...' : confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal



