import {
  SEVERITY_VALUE, REPORTS_CAP, WEIGHT_LABELS, LEVELS, UNKNOWN_HIERARCHY, UNKNOWN_SOCIAL,
} from '../config'

export function components(c) {
  return {
    gravedad: SEVERITY_VALUE[c.severity] ?? 0,
    jerarquia: c.hierarchyWeight ?? UNKNOWN_HIERARCHY,
    reportes: Math.min(c.reportCount, REPORTS_CAP) / REPORTS_CAP,
    social: c.socialIndex ?? UNKNOWN_SOCIAL,
  }
}

export function score(c, weights) {
  const comp = components(c)
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1
  const parts = Object.keys(weights).map((key) => ({
    key,
    label: WEIGHT_LABELS[key],
    value: comp[key],
    points: (weights[key] * comp[key] * 100) / total,
    max: (weights[key] * 100) / total,
  }))
  return { total: Math.round(parts.reduce((a, p) => a + p.points, 0)), parts }
}

export function level(total) {
  if (total >= LEVELS.alta.min) return 'alta'
  if (total >= LEVELS.media.min) return 'media'
  return 'baja'
}
