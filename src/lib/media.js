import { useSyncExternalStore } from 'react'

export const DESKTOP = '(min-width: 1024px)'
// Pantalla táctil (celular/tablet): cámara con capture y GPS automático.
export const COARSE = '(pointer: coarse)'

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (l) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', l)
      return () => mq.removeEventListener('change', l)
    },
    () => window.matchMedia(query).matches,
  )
}
