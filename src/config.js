// Todas las reglas de negocio en un solo lugar, para poder mostrarlas y defenderlas.

export const IA_BASE = '/ia'
export const MAP_CENTER = [-27.367, -55.896]

// PRD §5.1: revisión humana si no hay detecciones o si max_confidence < 0.4.
export const REVIEW_CONFIDENCE = 0.4

// PRD §5.1: límites de area_pct [desde_moderado, desde_grave] por clase.
// VALORES INICIALES SIN VALIDAR (sin referencia de escala en la foto).
export const SEVERITY_RULES = {
  pothole: [1, 5],
  alligator_crack: [3, 10],
  longitudinal_crack: [5, null],
  transverse_crack: [5, null],
}

// Decisión del front para la demo (acordar con backend: en PostGIS es ST_DWithin).
export const DUPLICATE_RADIUS_M = 25

export const STATUSES = ['Pendiente', 'Programado', 'En reparación', 'Resuelto']

export const HIERARCHY = {
  avenida: { label: 'Avenida', value: 1 },
  colectora: { label: 'Calle colectora', value: 0.6 },
  local: { label: 'Calle local', value: 0.3 },
}

export const SEVERITY_VALUE = { leve: 0.33, moderado: 0.66, grave: 1 }
export const SEVERITY_ORDER = ['leve', 'moderado', 'grave']

// Con 5 reportes o más, el componente "cantidad de reportes" llega al máximo.
export const REPORTS_CAP = 5

export const DEFAULT_WEIGHTS = { gravedad: 40, jerarquia: 25, reportes: 20, social: 15 }

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
