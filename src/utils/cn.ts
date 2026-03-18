import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function pour combiner des classes CSS de manière intelligente
 * Combine clsx (conditionals) avec tailwind-merge (résolution de conflits)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



