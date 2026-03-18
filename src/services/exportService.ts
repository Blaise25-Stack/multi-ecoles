/**
 * ============================================
 * Export Service - Excel & PDF Export
 * ============================================
 * Service pour exporter les données en Excel et PDF
 * avec les informations de l'école
 */

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuthStore } from '@/stores/authStore'

// ============================================
// Types
// ============================================

export interface ExportColumn {
  key: string
  header: string
  width?: number
  format?: (value: any) => string
}

export interface ExportOptions {
  filename: string
  title: string
  subtitle?: string
  columns: ExportColumn[]
  data: Record<string, any>[]
  format: 'excel' | 'pdf'
  orientation?: 'portrait' | 'landscape'
  showSchoolInfo?: boolean
}

export interface SchoolInfo {
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  logo?: string
}

// ============================================
// Helpers
// ============================================

/**
 * Obtenir les informations de l'école courante
 */
function getSchoolInfo(): SchoolInfo {
  const { currentSchool } = useAuthStore.getState()
  return {
    name: currentSchool?.name || 'École',
    code: currentSchool?.code || '',
    address: 'Avenue de l\'Éducation, Kinshasa',
    phone: '+243 XX XXX XXXX',
    email: 'contact@ecole.cd',
  }
}

/**
 * Formater la date pour le nom de fichier
 */
function getDateString(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

/**
 * Formater les données selon les colonnes
 */
function formatDataForExport(
  data: Record<string, any>[],
  columns: ExportColumn[]
): any[][] {
  return data.map((row) =>
    columns.map((col) => {
      const value = row[col.key]
      return col.format ? col.format(value) : value ?? ''
    })
  )
}

// ============================================
// Excel Export
// ============================================

export function exportToExcel(options: ExportOptions): void {
  const { filename, title, subtitle, columns, data, showSchoolInfo = true } = options
  const schoolInfo = getSchoolInfo()

  // Créer le workbook
  const workbook = XLSX.utils.book_new()

  // Préparer les données avec en-tête
  const worksheetData: any[][] = []

  // Informations de l'école
  if (showSchoolInfo) {
    worksheetData.push([schoolInfo.name])
    worksheetData.push([`Code: ${schoolInfo.code}`])
    worksheetData.push([schoolInfo.address])
    worksheetData.push([`Tél: ${schoolInfo.phone} | Email: ${schoolInfo.email}`])
    worksheetData.push([]) // Ligne vide
  }

  // Titre du document
  worksheetData.push([title])
  if (subtitle) {
    worksheetData.push([subtitle])
  }
  worksheetData.push([`Généré le: ${new Date().toLocaleString('fr-FR')}`])
  worksheetData.push([]) // Ligne vide

  // En-têtes des colonnes
  worksheetData.push(columns.map((col) => col.header))

  // Données
  const formattedData = formatDataForExport(data, columns)
  formattedData.forEach((row) => worksheetData.push(row))

  // Ligne de total si applicable
  worksheetData.push([])
  worksheetData.push([`Total: ${data.length} enregistrement(s)`])

  // Créer la feuille
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Définir les largeurs de colonnes
  const colWidths = columns.map((col) => ({
    wch: col.width || 15,
  }))
  worksheet['!cols'] = colWidths

  // Fusionner les cellules pour l'en-tête
  const mergeRanges: XLSX.Range[] = []
  let headerRows = 0
  
  if (showSchoolInfo) {
    // Fusionner les cellules d'info école
    for (let i = 0; i < 4; i++) {
      mergeRanges.push({ s: { r: i, c: 0 }, e: { r: i, c: columns.length - 1 } })
    }
    headerRows = 5
  }
  
  // Fusionner le titre
  mergeRanges.push({ 
    s: { r: headerRows, c: 0 }, 
    e: { r: headerRows, c: columns.length - 1 } 
  })
  
  worksheet['!merges'] = mergeRanges

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Données')

  // Générer et télécharger le fichier
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  
  saveAs(blob, `${filename}_${getDateString()}.xlsx`)
}

// ============================================
// PDF Export
// ============================================

export function exportToPDF(options: ExportOptions): void {
  const {
    filename,
    title,
    subtitle,
    columns,
    data,
    orientation = 'portrait',
    showSchoolInfo = true,
  } = options
  
  const schoolInfo = getSchoolInfo()

  // Créer le document PDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  // ===== En-tête avec informations de l'école =====
  if (showSchoolInfo) {
    // Nom de l'école (titre principal)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(79, 70, 229) // Primary color
    doc.text(schoolInfo.name, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 7

    // Code école
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Code: ${schoolInfo.code}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 5

    // Adresse
    doc.text(schoolInfo.address || '', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 5

    // Contact
    doc.text(
      `Tél: ${schoolInfo.phone} | Email: ${schoolInfo.email}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    )
    yPosition += 8

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10
  }

  // ===== Titre du document =====
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 7

  // Sous-titre
  if (subtitle) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 6
  }

  // Date de génération
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(
    `Généré le: ${new Date().toLocaleString('fr-FR')}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  )
  yPosition += 10

  // ===== Tableau des données =====
  const tableHeaders = columns.map((col) => col.header)
  const tableData = formatDataForExport(data, columns)

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: yPosition,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [79, 70, 229], // Primary color
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 255],
    },
    columnStyles: columns.reduce((acc, col, index) => {
      acc[index] = { cellWidth: col.width ? col.width * 0.35 : 'auto' }
      return acc
    }, {} as Record<number, any>),
    didDrawPage: (data) => {
      // Pied de page sur chaque page
      const pageNumber = doc.internal.getCurrentPageInfo().pageNumber
      const totalPages = doc.internal.getNumberOfPages()
      
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      
      // Numéro de page
      doc.text(
        `Page ${pageNumber} / ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      )
      
      // Nom de l'école en bas
      doc.text(
        schoolInfo.name,
        margin,
        pageHeight - 10
      )
    },
  })

  // ===== Résumé en bas =====
  const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50
  
  if (finalY < pageHeight - 30) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text(`Total: ${data.length} enregistrement(s)`, margin, finalY + 10)
  }

  // Sauvegarder le PDF
  doc.save(`${filename}_${getDateString()}.pdf`)
}

// ============================================
// Export principal
// ============================================

export function exportData(options: ExportOptions): void {
  if (options.format === 'excel') {
    exportToExcel(options)
  } else {
    exportToPDF(options)
  }
}

// ============================================
// Exports prédéfinis pour chaque module
// ============================================

export const exportConfigs = {
  eleves: {
    filename: 'liste_eleves',
    title: 'Liste des Élèves',
    columns: [
      { key: 'matricule', header: 'Matricule', width: 15 },
      { key: 'nom', header: 'Nom', width: 20 },
      { key: 'prenom', header: 'Prénom', width: 20 },
      { key: 'sexe', header: 'Sexe', width: 8 },
      { key: 'dateNaissance', header: 'Date de naissance', width: 15 },
      { key: 'classe', header: 'Classe', width: 15 },
      { key: 'statut', header: 'Statut', width: 12 },
    ],
  },
  
  paiements: {
    filename: 'liste_paiements',
    title: 'Liste des Paiements',
    columns: [
      { key: 'reference', header: 'Référence', width: 15 },
      { key: 'date', header: 'Date', width: 12 },
      { key: 'eleve', header: 'Élève', width: 25 },
      { key: 'typeFrais', header: 'Type de frais', width: 20 },
      { key: 'montant', header: 'Montant', width: 15, format: (v: number) => `${v?.toLocaleString()} FC` },
      { key: 'mode', header: 'Mode', width: 12 },
      { key: 'statut', header: 'Statut', width: 10 },
    ],
  },
  
  enseignants: {
    filename: 'liste_enseignants',
    title: 'Liste des Enseignants',
    columns: [
      { key: 'matricule', header: 'Matricule', width: 15 },
      { key: 'nom', header: 'Nom', width: 20 },
      { key: 'prenom', header: 'Prénom', width: 20 },
      { key: 'telephone', header: 'Téléphone', width: 15 },
      { key: 'email', header: 'Email', width: 25 },
      { key: 'matieres', header: 'Matières', width: 25 },
      { key: 'statut', header: 'Statut', width: 10 },
    ],
  },
  
  classes: {
    filename: 'liste_classes',
    title: 'Liste des Classes',
    columns: [
      { key: 'code', header: 'Code', width: 10 },
      { key: 'nom', header: 'Nom', width: 20 },
      { key: 'niveau', header: 'Niveau', width: 15 },
      { key: 'filiere', header: 'Filière', width: 15 },
      { key: 'effectif', header: 'Effectif', width: 10 },
      { key: 'titulaire', header: 'Titulaire', width: 25 },
    ],
  },

  notes: {
    filename: 'releve_notes',
    title: 'Relevé de Notes',
    columns: [
      { key: 'eleve', header: 'Élève', width: 25 },
      { key: 'classe', header: 'Classe', width: 15 },
      { key: 'matiere', header: 'Matière', width: 20 },
      { key: 'note', header: 'Note', width: 10 },
      { key: 'coefficient', header: 'Coef.', width: 8 },
      { key: 'periode', header: 'Période', width: 15 },
    ],
  },

  depenses: {
    filename: 'liste_depenses',
    title: 'Liste des Dépenses',
    columns: [
      { key: 'reference', header: 'Référence', width: 15 },
      { key: 'date', header: 'Date', width: 12 },
      { key: 'categorie', header: 'Catégorie', width: 18 },
      { key: 'description', header: 'Description', width: 30 },
      { key: 'montant', header: 'Montant', width: 15, format: (v: number) => `${v?.toLocaleString()} FC` },
      { key: 'statut', header: 'Statut', width: 10 },
    ],
  },

  caisse: {
    filename: 'mouvements_caisse',
    title: 'Mouvements de Caisse',
    columns: [
      { key: 'date', header: 'Date', width: 12 },
      { key: 'type', header: 'Type', width: 10 },
      { key: 'libelle', header: 'Libellé', width: 30 },
      { key: 'montant', header: 'Montant', width: 15, format: (v: number) => `${v?.toLocaleString()} FC` },
      { key: 'solde', header: 'Solde', width: 15, format: (v: number) => `${v?.toLocaleString()} FC` },
    ],
  },

  inscriptions: {
    filename: 'liste_inscriptions',
    title: 'Liste des Inscriptions',
    columns: [
      { key: 'matricule', header: 'Matricule', width: 15 },
      { key: 'nom', header: 'Nom', width: 20 },
      { key: 'prenom', header: 'Prénom', width: 20 },
      { key: 'classe', header: 'Classe', width: 15 },
      { key: 'date_inscription', header: 'Date', width: 12 },
      { key: 'statut', header: 'Statut', width: 10 },
    ],
  },

  personnel: {
    filename: 'liste_personnel',
    title: 'Liste du Personnel',
    columns: [
      { key: 'matricule', header: 'Matricule', width: 15 },
      { key: 'nom', header: 'Nom', width: 20 },
      { key: 'prenom', header: 'Prénom', width: 20 },
      { key: 'poste', header: 'Poste', width: 20 },
      { key: 'telephone', header: 'Téléphone', width: 15 },
      { key: 'statut', header: 'Statut', width: 10 },
    ],
  },

  salaires: {
    filename: 'liste_salaires',
    title: 'Liste des Salaires',
    columns: [
      { key: 'employe_nom', header: 'Employé', width: 25 },
      { key: 'employe_type', header: 'Type', width: 12 },
      { key: 'salaire_base', header: 'Salaire base', width: 15, format: (v: number) => `${v?.toLocaleString()} FC` },
      { key: 'primes', header: 'Primes', width: 12, format: (v: number) => `${v?.toLocaleString()} FC` },
      { key: 'dette_anterieure', header: 'Dette', width: 12, format: (v: number) => `${v?.toLocaleString()} FC` },
      { key: 'net_a_payer', header: 'Net à payer', width: 15, format: (v: number) => `${v?.toLocaleString()} FC` },
      { key: 'statut', header: 'Statut', width: 10 },
    ],
  },

  attestations: {
    filename: 'liste_attestations',
    title: 'Attestations Générées',
    columns: [
      { key: 'eleve', header: 'Élève', width: 25 },
      { key: 'classe', header: 'Classe', width: 15 },
      { key: 'type', header: 'Type', width: 20 },
      { key: 'date', header: 'Date', width: 12 },
    ],
  },
}

export default {
  exportData,
  exportToExcel,
  exportToPDF,
  exportConfigs,
}



