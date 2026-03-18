import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Formate une date au format français
 */
export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsedDate)) return '-'
  return format(parsedDate, pattern, { locale: fr })
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

/**
 * Formate une date en texte relatif (ex: "il y a 2 heures")
 */
export function formatRelativeTime(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsedDate)) return '-'
  return formatDistanceToNow(parsedDate, { addSuffix: true, locale: fr })
}

/**
 * Formate un montant en Franc Congolais (FC)
 */
export function formatCurrency(
  amount: number,
  currency: 'FC' | 'USD' | 'EUR' = 'FC',
  locale = 'fr-CD'
): string {
  if (currency === 'FC') {
    // Format personnalisé pour le Franc Congolais
    return `${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)} FC`
  }
  
  // Pour USD et EUR, utiliser le format standard
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Convertit FC en USD (taux approximatif)
 */
export function convertFCtoUSD(amountFC: number, rate = 2800): number {
  return amountFC / rate
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(num: number, locale = 'fr-CD'): string {
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * Formate un pourcentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Formate un nom complet
 */
export function formatFullName(nom: string, prenom: string): string {
  return `${prenom} ${nom}`.trim()
}

/**
 * Obtient les initiales d'un nom
 */
export function getInitials(nom: string, prenom: string): string {
  const initNom = nom?.charAt(0)?.toUpperCase() || ''
  const initPrenom = prenom?.charAt(0)?.toUpperCase() || ''
  return `${initPrenom}${initNom}`
}

/**
 * Formate un numéro de téléphone RDC
 */
export function formatPhone(phone: string): string {
  // Nettoie le numéro
  const cleaned = phone.replace(/\D/g, '')
  
  // Format: 09X XXX XXXX (10 chiffres)
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
  }
  
  // Format avec indicatif: +243 9X XXX XXXX
  if (cleaned.length === 12 && cleaned.startsWith('243')) {
    return `+243 ${cleaned.slice(3).replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3')}`
  }
  
  return phone
}

/**
 * Formate la taille d'un fichier
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Tronque un texte avec ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return `${text.slice(0, length)}...`
}

/**
 * Génère un matricule
 */
export function generateMatricule(prefix: string, numero: number, annee?: number): string {
  const year = annee || new Date().getFullYear()
  return `${prefix}${year}${String(numero).padStart(5, '0')}`
}
