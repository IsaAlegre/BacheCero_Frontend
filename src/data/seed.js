// DATOS DE PRUEBA. Todo lo de este archivo es simulado y la UI lo rotula así.
// - Coordenadas aproximadas alrededor del centro de Posadas (ajustar si hace falta).
// - socialIndex: índice SIMULADO de vulnerabilidad de la zona (0 a 1).
// - Los reportes no tienen foto: representan reclamos previos simulados.

import { detectionSeverity, worst } from '../lib/scoring'
import { CLASS_LABELS } from '../config'
import { DEMO_USERS } from './demoUsers'

// Si cambia la forma de los datos, se sube la versión y el store vuelve a sembrar.
export const SEED_VERSION = 3

// Casos donde el primer reporte es de la vecina de demo, para que "Mis reportes" no arranque vacío.
const DEMO_OWNED = ['T-0204', 'T-0212']

const DAY = 86400000
const now = Date.now()

const CASES = [
  // id, lat, lng, calle, jerarquía, barrio, socialIndex, estado, [clase, area_pct, confianza], cantidad de reportes
  ['T-0201', -27.3672, -55.8961, 'Av. Mitre', 'avenida', 'Centro', 0.2, 'Pendiente', ['pothole', 7.5, 0.83], 8],
  ['T-0202', -27.3641, -55.8928, 'Calle Colón', 'colectora', 'Centro', 0.2, 'Programado', ['pothole', 3.1, 0.77], 4],
  ['T-0203', -27.3711, -55.9012, 'Av. Corrientes', 'avenida', 'Centro', 0.25, 'Pendiente', ['alligator_crack', 12.0, 0.62], 3],
  ['T-0204', -27.3768, -55.9047, 'Calle Santa Fe', 'colectora', 'Villa Sarita', 0.45, 'En reparación', ['pothole', 9.2, 0.81], 6],
  ['T-0205', -27.3829, -55.9105, 'Calle 147', 'local', 'Villa Cabello', 0.75, 'Pendiente', ['pothole', 4.4, 0.71], 2],
  ['T-0206', -27.3875, -55.9168, 'Av. Blas Parera', 'avenida', 'Villa Cabello', 0.7, 'Pendiente', ['pothole', 11.3, 0.88], 5],
  ['T-0207', -27.3930, -55.9001, 'Calle 59', 'local', 'Itaembé Miní', 0.85, 'Pendiente', ['pothole', 6.0, 0.66], 1],
  ['T-0208', -27.3598, -55.9079, 'Calle Bolívar', 'local', 'Centro', 0.15, 'Pendiente', ['longitudinal_crack', 6.1, 0.55], 2],
  ['T-0209', -27.3745, -55.8893, 'Av. Uruguay', 'avenida', 'Villa Sarita', 0.4, 'Programado', ['transverse_crack', 2.0, 0.48], 3],
  ['T-0210', -27.3801, -55.8962, 'Av. López Torres', 'avenida', 'Villa Sarita', 0.5, 'Pendiente', ['pothole', 2.4, 0.74], 2],
  ['T-0211', -27.3961, -55.9132, 'Calle 115', 'colectora', 'Itaembé Miní', 0.9, 'Pendiente', ['pothole', 0.8, 0.58], 1],
  ['T-0212', -27.3690, -55.9105, 'Calle Junín', 'local', 'Centro', 0.2, 'Resuelto', ['pothole', 5.5, 0.79], 4],
  ['T-0213', -27.3655, -55.8990, 'Calle Buenos Aires', 'colectora', 'Centro', 0.2, 'Resuelto', ['alligator_crack', 8.0, 0.74], 3],
  ['T-0214', -27.3902, -55.9210, 'Av. Santa Catalina', 'avenida', 'Villa Cabello', 0.65, 'Resuelto', ['pothole', 6.8, 0.86], 5],
]

// Fotos que la IA no pudo clasificar con seguridad: arrancan en la cola de revisión humana.
// [caso, clase o null (sin detecciones), area_pct, confianza]
const REVIEW = [
  ['T-0208', 'transverse_crack', 1.4, 0.31],
  ['T-0205', null, 0, 0],
]

function fakeAnalysis([modelClass, area, conf]) {
  if (!modelClass) {
    return {
      width: 1280, height: 960, detections: [],
      summary: { damage_found: false, max_confidence: 0 },
      privacy: { faces_blurred: 0, plates_blurred: 0 },
    }
  }
  return {
    width: 1280,
    height: 960,
    detections: [{
      type: modelClass === 'pothole' ? 'pothole' : 'crack',
      label_es: CLASS_LABELS[modelClass],
      model_class: modelClass,
      confidence: conf,
      bbox: [400, 480, 800, 760],
      area_pct: area,
    }],
    summary: { damage_found: true, max_confidence: conf },
    privacy: { faces_blurred: 0, plates_blurred: 0 },
  }
}

export function seedState() {
  const cases = []
  const reports = []
  let reportNo = 400

  CASES.forEach(([id, lat, lng, street, hierarchy, barrio, socialIndex, status, det, n], i) => {
    // Todas las fechas quedan en el pasado; los cambios de estado tardan entre 1 y 3 días.
    const createdAt = now - (25 - i) * DAY
    const step = (1 + (i % 3)) * DAY
    const history = [{ status: 'Pendiente', at: createdAt, by: 'Sistema' }]
    STATUS_PATH[status].forEach((s, k) =>
      history.push({ status: s, at: createdAt + (k + 1) * step, by: 'Personal municipal (demo)' }))
    cases.push({ id, lat, lng, street, hierarchy, barrio, socialIndex, status, history, createdAt, seed: true })

    for (let k = 0; k < n; k++) {
      const analysis = fakeAnalysis(det)
      reports.push({
        id: `BC-0${reportNo++}`,
        caseId: id,
        lat: lat + (Math.random() - 0.5) * 0.0002,
        lng: lng + (Math.random() - 0.5) * 0.0002,
        description: '',
        createdAt: createdAt + k * 3600000,
        imageUrl: null,
        analysis,
        severity: worst(analysis.detections.map(detectionSeverity)),
        review: null,
        userId: k === 0 && DEMO_OWNED.includes(id) ? DEMO_USERS.vecino.userId : null,
        source: 'simulado',
      })
    }
  })

  REVIEW.forEach(([caseId, modelClass, area, conf], k) => {
    const c = cases.find((x) => x.id === caseId)
    const analysis = fakeAnalysis([modelClass, area, conf])
    reports.push({
      id: `BC-0${reportNo++}`,
      caseId,
      lat: c.lat + 0.00005,
      lng: c.lng - 0.00005,
      description: k === 0 ? 'Rajadura cruzando la calle' : '',
      createdAt: now - (k + 1) * 3 * 3600000,
      imageUrl: null,
      analysis,
      severity: worst(analysis.detections.map(detectionSeverity)),
      review: 'pendiente',
      userId: null,
      source: 'simulado',
    })
  })

  return {
    version: SEED_VERSION,
    mode: 'live',
    counters: { BC: reportNo, T: 215 },
    cases,
    reports,
  }
}

const STATUS_PATH = {
  Pendiente: [],
  Programado: ['Programado'],
  'En reparación': ['Programado', 'En reparación'],
  Resuelto: ['Programado', 'En reparación', 'Resuelto'],
}
