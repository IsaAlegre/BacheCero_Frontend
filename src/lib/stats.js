// Estadísticas calculadas con los datos que hay (casos + historial). Nada escrito a mano.
import { STATUSES } from '../config'

const DAY = 86400000

export const lastAt = (c, status) => [...c.history].reverse().find((h) => h.status === status)?.at

export function countBy(items, key) {
  const m = new Map()
  items.forEach((it) => m.set(key(it), (m.get(key(it)) || 0) + 1))
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

export const byStatus = (cases) => STATUSES.map((s) => ({ label: s, value: cases.filter((c) => c.status === s).length }))

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

// Días promedio desde que se crea el caso hasta que se marca Resuelto.
export function avgResolutionDays(cases) {
  const xs = cases.filter((c) => c.status === 'Resuelto').map((c) => (lastAt(c, 'Resuelto') - c.createdAt) / DAY)
  return { days: avg(xs), n: xs.length }
}

// Días promedio de cada tramo (Pendiente → Programado → En reparación → Resuelto).
export function avgStageDays(cases) {
  return STATUSES.slice(1).map((to, i) => {
    const from = STATUSES[i]
    const xs = cases
      .map((c) => {
        const a = from === 'Pendiente' ? c.createdAt : lastAt(c, from)
        const b = lastAt(c, to)
        return a && b && b >= a ? (b - a) / DAY : null
      })
      .filter((x) => x != null)
    return { label: `${from} → ${to}`, days: avg(xs), n: xs.length }
  })
}

export function isThisMonth(ts, now = new Date()) {
  const d = new Date(ts)
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export const resolvedThisMonth = (cases) =>
  cases.filter((c) => c.status === 'Resuelto' && isThisMonth(lastAt(c, 'Resuelto'))).length

export const formatDays = (d) => (d == null ? '—' : `${d.toFixed(1).replace('.', ',')} días`)
