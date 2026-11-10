// Mismos valores que el backend (src/domain/reglas.ts).

export const API_BASE = import.meta.env.VITE_API_URL || '/api'
export const IA_BASE = import.meta.env.VITE_IA_URL || '/ia'
export const MAP_CENTER = [-27.367, -55.896]

export const REVIEW_CONFIDENCE = 0.5

export const DUPLICATE_RADIUS_M = 15

export const STATUSES = ['Pendiente', 'Programado', 'En reparación', 'Resuelto']

export const SEVERITY_VALUE = { leve: 0.3, moderado: 0.6, grave: 1 }
export const UNKNOWN_HIERARCHY = 0.3
export const UNKNOWN_SOCIAL = 0.5
export const SEVERITY_ORDER = ['leve', 'moderado', 'grave']

export const REPORTS_CAP = 5

export const DEFAULT_WEIGHTS = { gravedad: 40, jerarquia: 25, reportes: 15, social: 20 }

export const WEIGHT_LABELS = {
  gravedad: 'Gravedad',
  jerarquia: 'Jerarquía de calle',
  reportes: 'Cantidad de reportes',
  social: 'Variables sociales',
}

export const LEVELS = {
  alta: { label: 'Alta', color: '#e03131', min: 70 },
  media: { label: 'Media', color: '#f28c28', min: 40 },
  baja: { label: 'Baja', color: '#f2c94c', min: 0 },
}

export const CLASS_LABELS = {
  pothole: 'Bache',
  longitudinal_crack: 'Grieta longitudinal',
  transverse_crack: 'Grieta transversal',
  alligator_crack: 'Piel de cocodrilo',
}
