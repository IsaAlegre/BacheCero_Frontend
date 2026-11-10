import { useSyncExternalStore } from 'react'

const KEY = 'bachecero:theme'
const META_COLOR = { light: '#1f3b57', dark: '#0b1724' }
const listeners = new Set()
const media = window.matchMedia('(prefers-color-scheme: dark)')

function stored() {
  try { return localStorage.getItem(KEY) } catch { return null }
}

function current() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function apply(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[theme])
  listeners.forEach((l) => l())
}

export function setTheme(theme) {
  try { localStorage.setItem(KEY, theme) } catch { /* modo privado */ }
  apply(theme)
}

export const toggleTheme = () => setTheme(current() === 'dark' ? 'light' : 'dark')

media.addEventListener('change', (e) => {
  if (!stored()) apply(e.matches ? 'dark' : 'light')
})
apply(stored() || (media.matches ? 'dark' : 'light'))

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useTheme() {
  return useSyncExternalStore(subscribe, current)
}
