// "Backend de mentira": estado en localStorage.
// Se sincroniza entre pestañas del mismo navegador (evento 'storage'),
// así la vista vecino ve en vivo el cambio de estado que hace el municipio.
import { useSyncExternalStore } from 'react'
import { seedState, SEED_VERSION } from '../data/seed'

const KEY = 'bachecero:v1'
const listeners = new Set()

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    const s = raw && JSON.parse(raw)
    if (s?.version === SEED_VERSION) return s
  } catch { /* datos corruptos: se vuelve a sembrar */ }
  const s = seedState()
  save(s)
  return s
}

function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch (e) {
    console.warn('No se pudo guardar (¿localStorage lleno?). Usá "Reiniciar demo".', e)
  }
}

let state = load()
const emit = () => listeners.forEach((l) => l())

export const getState = () => state

export function setState(updater) {
  state = updater(state)
  save(state)
  emit()
}

export function resetState() {
  state = seedState()
  save(state)
  emit()
}

window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = load()
    emit()
  }
})

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore() {
  return useSyncExternalStore(subscribe, getState)
}
