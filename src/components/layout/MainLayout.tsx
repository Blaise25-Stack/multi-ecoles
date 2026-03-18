import { Outlet } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/stores/uiStore'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toast } from '@/components/ui/Toast'
import { SchoolContextBanner } from './SchoolContextBanner'

const MainLayout = () => {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Banner SuperAdmin - Contexte école */}
      <SchoolContextBanner />

      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <Header />

      {/* Main content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        )}
      >
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      {/* Toast notifications */}
      <Toast />
    </div>
  )
}

export { MainLayout }



