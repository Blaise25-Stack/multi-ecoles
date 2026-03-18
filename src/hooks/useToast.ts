/**
 * ============================================
 * useToast - Hook pour les notifications toast
 * ============================================
 * Wrapper autour du store UI pour gérer les toasts
 */

import { useUIStore } from '@/stores/uiStore'

interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export function useToast() {
  const addToast = useUIStore((state) => state.addToast)
  const removeToast = useUIStore((state) => state.removeToast)
  const clearToasts = useUIStore((state) => state.clearToasts)
  const toasts = useUIStore((state) => state.toasts)

  return {
    addToast,
    removeToast,
    clearToasts,
    toasts,
    
    // Helpers
    success: (title: string, message?: string) => 
      addToast({ type: 'success', title, message }),
    
    error: (title: string, message?: string) => 
      addToast({ type: 'error', title, message }),
    
    warning: (title: string, message?: string) => 
      addToast({ type: 'warning', title, message }),
    
    info: (title: string, message?: string) => 
      addToast({ type: 'info', title, message }),
  }
}

export default useToast



