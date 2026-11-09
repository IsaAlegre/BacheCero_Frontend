import {
  SEVERITY_RULES, SEVERITY_VALUE, SEVERITY_ORDER, REVIEW_CONFIDENCE,
  HIERARCHY, REPORTS_CAP, WEIGHT_LABELS, LEVELS,
} from '../config'

// Gravedad de UNA detección según PRD §5.1.
export function detectionSeverity(det) {
  const rule = SEVERITY_RULES[det.model_class]
  if (!rule) return 'leve'
  const [moderate, severe] = rule
  if (severe != null && det.area_pct > severe) return 'grave'
  return det.area_pct >= moderate ? 'moderado' : 'leve'
}

export function worst(severities) {
  return severities.reduce(
    (acc, s) => (s && (!acc || SEVERITY_ORDER.indexOf(s) > SEVERITY_ORDER.indexOf(acc)) ? s : acc),
    null,
  )
}

// La gravedad del reporte es la peor de sus detecciones.
export function reportSeverity(analysis) {
  return worst(analysis.detections.map(detectionSeverity))
}

export function needsReview(analysis) {
  if (!analysis.detections.length) return true
  return (analysis.summary?.max_confidence ?? 0) < REVIEW_CONFIDENCE
}

// Cada componente queda entre 0 y 1. El backend debería devolver estos valores;
// el front aplica los pesos para que los deslizadores respondan en vivo.
export function components(c) {
  return {
    gravedad: SEVERITY_VALUE[c.severity] ?? 0,
    jerarquia: HIERARCHY[c.hierarchy]?.value ?? 0,
    reportes: Math.min(c.reportCount, REPORTS_CAP) / REPORTS_CAP,
    social: c.socialIndex ?? 0,
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
