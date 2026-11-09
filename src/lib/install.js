// Instalación de la PWA.
// - Android/Chrome: se guarda el evento beforeinstallprompt para dispararlo desde un botón.
//   Se escucha acá (al cargar la app) porque el evento puede llegar antes de que exista el botón.
// - iPhone/iPad: Safari no tiene ese evento; se muestran los pasos a mano.
import { useSyncExternalStore } from 'react'

let deferred = null
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e
  emit()
})
window.addEventListener('appinstalled', () => {
  deferred = null
  emit()
})

const standaloneQuery = window.matchMedia('(display-mode: standalone)')
standaloneQuery.addEventListener('change', emit)

export const isStandalone = () => standaloneQuery.matches || window.navigator.standalone === true

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPad con iPadOS

// 'installed' | 'prompt' (Android/Chrome) | 'ios' | null (no se puede instalar desde acá)
function snapshot() {
  if (isStandalone()) return 'installed'
  if (deferred) return 'prompt'
  if (isIOS()) return 'ios'
  return null
}

export function useInstall() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, snapshot)
}

export async function promptInstall() {
  if (!deferred) return false
  deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  emit()
  return outcome === 'accepted'
}
