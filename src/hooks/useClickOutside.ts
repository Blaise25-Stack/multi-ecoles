import { useEffect, useRef, type RefObject } from 'react'

/**
 * Hook pour détecter les clics en dehors d'un élément
 * Utile pour fermer les dropdowns, modals, etc.
 */
export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  enabled = true
): RefObject<T> {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current
      if (!el || el.contains(event.target as Node)) {
        return
      }
      handler()
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler, enabled])

  return ref as RefObject<T>
}



