import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Toasts
  toasts: Toast[]
  
  // Modal
  activeModal: string | null
  modalData: unknown
  
  // Loading
  globalLoading: boolean
  loadingMessage: string
  
  // Actions Sidebar
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapse: () => void
  
  // Actions Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Actions Toast
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // Actions Modal
  openModal: (modalId: string, data?: unknown) => void
  closeModal: () => void
  
  // Actions Loading
  setGlobalLoading: (loading: boolean, message?: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'light',
      toasts: [],
      activeModal: null,
      modalData: null,
      globalLoading: false,
      loadingMessage: '',
      
      // Sidebar
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Theme
      setTheme: (theme) => {
        set({ theme })
        
        // Appliquer le thème au document
        const root = document.documentElement
        root.classList.remove('light', 'dark')
        
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          root.classList.add(systemTheme)
        } else {
          root.classList.add(theme)
        }
      },
      
      // Toast
      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newToast = { ...toast, id }
        
        set((state) => ({
          toasts: [...state.toasts, newToast],
        }))
        
        // Auto-remove après duration (défaut 5s)
        const duration = toast.duration ?? 5000
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id)
          }, duration)
        }
      },
      
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      },
      
      clearToasts: () => set({ toasts: [] }),
      
      // Modal
      openModal: (modalId, data) => set({ activeModal: modalId, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
      
      // Loading
      setGlobalLoading: (loading, message = '') => {
        set({ globalLoading: loading, loadingMessage: message })
      },
    }),
    {
      name: 'sgs-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
)

// Helper pour afficher des toasts facilement
export const toast = {
  success: (title: string, message?: string) => {
    useUIStore.getState().addToast({ type: 'success', title, message })
  },
  error: (title: string, message?: string) => {
    useUIStore.getState().addToast({ type: 'error', title, message })
  },
  warning: (title: string, message?: string) => {
    useUIStore.getState().addToast({ type: 'warning', title, message })
  },
  info: (title: string, message?: string) => {
    useUIStore.getState().addToast({ type: 'info', title, message })
  },
}



