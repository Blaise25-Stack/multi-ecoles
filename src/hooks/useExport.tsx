/**
 * ============================================
 * useExport - Hook pour l'export de données
 * ============================================
 * Hook réutilisable pour gérer l'export Excel/PDF
 */

import { useState, useCallback } from 'react'
import { ExportModal } from '@/components/ui/ExportModal'
import { exportConfigs, type ExportColumn } from '@/services/exportService'

interface UseExportOptions {
  title: string
  filename: string
  columns: ExportColumn[]
  subtitle?: string
}

interface UseExportReturn {
  isModalOpen: boolean
  openExportModal: () => void
  closeExportModal: () => void
  ExportModalComponent: React.FC<{ data: Record<string, any>[] }>
}

/**
 * Hook pour gérer facilement l'export de données
 * 
 * @example
 * ```tsx
 * const { openExportModal, ExportModalComponent } = useExport({
 *   title: 'Liste des élèves',
 *   filename: 'eleves',
 *   columns: exportConfigs.eleves.columns,
 * })
 * 
 * return (
 *   <>
 *     <Button onClick={openExportModal}>Exporter</Button>
 *     <ExportModalComponent data={eleves} />
 *   </>
 * )
 * ```
 */
export function useExport(options: UseExportOptions): UseExportReturn {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openExportModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const closeExportModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const ExportModalComponent: React.FC<{ data: Record<string, any>[] }> = ({ data }) => (
    <ExportModal
      isOpen={isModalOpen}
      onClose={closeExportModal}
      title={options.title}
      filename={options.filename}
      columns={options.columns}
      data={data}
      subtitle={options.subtitle}
    />
  )

  return {
    isModalOpen,
    openExportModal,
    closeExportModal,
    ExportModalComponent,
  }
}

// Export des configurations prédéfinies
export { exportConfigs }

export default useExport



