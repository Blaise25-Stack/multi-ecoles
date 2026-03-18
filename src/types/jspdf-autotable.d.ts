/**
 * Type declarations for jspdf-autotable
 */

import { jsPDF } from 'jspdf'

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number
    }
  }
}

declare module 'jspdf-autotable' {
  export interface UserOptions {
    head?: any[][]
    body?: any[][]
    foot?: any[][]
    startY?: number
    margin?: {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }
    styles?: {
      fontSize?: number
      cellPadding?: number
      overflow?: string
      font?: string
      fontStyle?: string
      halign?: 'left' | 'center' | 'right'
      valign?: 'top' | 'middle' | 'bottom'
      fillColor?: number[] | string
      textColor?: number[] | string
      lineColor?: number[] | string
      lineWidth?: number
      cellWidth?: 'auto' | 'wrap' | number
    }
    headStyles?: {
      fillColor?: number[] | string
      textColor?: number[] | string
      fontStyle?: string
      halign?: 'left' | 'center' | 'right'
    }
    bodyStyles?: {
      fillColor?: number[] | string
      textColor?: number[] | string
    }
    footStyles?: {
      fillColor?: number[] | string
      textColor?: number[] | string
    }
    alternateRowStyles?: {
      fillColor?: number[] | string
    }
    columnStyles?: Record<
      number | string,
      {
        cellWidth?: 'auto' | 'wrap' | number
        halign?: 'left' | 'center' | 'right'
        valign?: 'top' | 'middle' | 'bottom'
        fontSize?: number
        fontStyle?: string
        overflow?: string
      }
    >
    didDrawPage?: (data: any) => void
    didDrawCell?: (data: any) => void
    willDrawCell?: (data: any) => void
    didParseCell?: (data: any) => void
  }

  export default function autoTable(
    doc: jsPDF,
    options: UserOptions
  ): jsPDF
}



