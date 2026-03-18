/**
 * ============================================
 * ExportModal - Modal de choix d'export
 * ============================================
 * Permet de choisir le format (Excel/PDF) et options d'export
 */

import { useState } from 'react'
import {
  FileSpreadsheet,
  FileText,
  Download,
  X,
  CheckCircle,
  Loader2,
  Building2,
  Calendar,
  FileDown,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import { useAuthStore } from '@/stores/authStore'
import { exportData, type ExportColumn } from '@/services/exportService'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  filename: string
  columns: ExportColumn[]
  data: Record<string, any>[]
  subtitle?: string
}

type ExportFormat = 'excel' | 'pdf'
type Orientation = 'portrait' | 'landscape'

export function ExportModal({
  isOpen,
  onClose,
  title,
  filename,
  columns,
  data,
  subtitle,
}: ExportModalProps) {
  const { currentSchool } = useAuthStore()
  const [format, setFormat] = useState<ExportFormat>('excel')
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [includeSchoolInfo, setIncludeSchoolInfo] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    setExportSuccess(false)

    try {
      // Simuler un petit délai pour le feedback visuel
      await new Promise((resolve) => setTimeout(resolve, 500))

      exportData({
        filename,
        title,
        subtitle,
        columns,
        data,
        format,
        orientation,
        showSchoolInfo: includeSchoolInfo,
      })

      setExportSuccess(true)
      
      // Fermer après succès
      setTimeout(() => {
        setExportSuccess(false)
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Erreur export:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-surface-200 dark:border-surface-700">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/40">
                <FileDown className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-white">
                  Exporter les données
                </h2>
                <p className="text-sm text-surface-500">{data.length} enregistrement(s)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <X className="h-5 w-5 text-surface-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Format selection */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                Format d'export
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormat('excel')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    format === 'excel'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                  )}
                >
                  <div
                    className={cn(
                      'p-3 rounded-xl',
                      format === 'excel'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40'
                        : 'bg-surface-100 dark:bg-surface-700'
                    )}
                  >
                    <FileSpreadsheet
                      className={cn(
                        'h-8 w-8',
                        format === 'excel'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-surface-500'
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      'font-medium',
                      format === 'excel'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-surface-700 dark:text-surface-300'
                    )}
                  >
                    Excel (.xlsx)
                  </span>
                  <span className="text-xs text-surface-500">
                    Idéal pour l'analyse
                  </span>
                </button>

                <button
                  onClick={() => setFormat('pdf')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    format === 'pdf'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                      : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                  )}
                >
                  <div
                    className={cn(
                      'p-3 rounded-xl',
                      format === 'pdf'
                        ? 'bg-rose-100 dark:bg-rose-900/40'
                        : 'bg-surface-100 dark:bg-surface-700'
                    )}
                  >
                    <FileText
                      className={cn(
                        'h-8 w-8',
                        format === 'pdf'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-surface-500'
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      'font-medium',
                      format === 'pdf'
                        ? 'text-rose-700 dark:text-rose-300'
                        : 'text-surface-700 dark:text-surface-300'
                    )}
                  >
                    PDF (.pdf)
                  </span>
                  <span className="text-xs text-surface-500">
                    Idéal pour imprimer
                  </span>
                </button>
              </div>
            </div>

            {/* PDF Orientation (only for PDF) */}
            {format === 'pdf' && (
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                  Orientation
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all',
                      orientation === 'portrait'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-surface-200 dark:border-surface-700'
                    )}
                  >
                    <div className="w-4 h-6 border-2 border-current rounded-sm" />
                    <span className="font-medium">Portrait</span>
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all',
                      orientation === 'landscape'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-surface-200 dark:border-surface-700'
                    )}
                  >
                    <div className="w-6 h-4 border-2 border-current rounded-sm" />
                    <span className="font-medium">Paysage</span>
                  </button>
                </div>
              </div>
            )}

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                Options
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSchoolInfo}
                  onChange={(e) => setIncludeSchoolInfo(e.target.checked)}
                  className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-surface-500" />
                  <span className="text-sm text-surface-700 dark:text-surface-300">
                    Inclure les informations de l'école
                  </span>
                </div>
              </label>
            </div>

            {/* School info preview */}
            {includeSchoolInfo && currentSchool && (
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/30 border border-surface-200 dark:border-surface-600">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-primary-500" />
                  <span className="text-sm font-medium text-surface-900 dark:text-white">
                    Aperçu en-tête
                  </span>
                </div>
                <p className="text-sm text-surface-700 dark:text-surface-300 font-semibold">
                  {currentSchool.name}
                </p>
                <p className="text-xs text-surface-500">
                  Code: {currentSchool.code}
                </p>
              </div>
            )}

            {/* Export info */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-primary-700 dark:text-primary-300">
                Le fichier sera nommé: <strong>{filename}_{new Date().toISOString().split('T')[0]}.{format === 'excel' ? 'xlsx' : 'pdf'}</strong>
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Annuler
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || data.length === 0}
              leftIcon={
                isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : exportSuccess ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )
              }
              className={cn(
                exportSuccess && 'bg-emerald-600 hover:bg-emerald-700'
              )}
            >
              {isExporting
                ? 'Export en cours...'
                : exportSuccess
                ? 'Exporté !'
                : `Exporter en ${format === 'excel' ? 'Excel' : 'PDF'}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportModal



