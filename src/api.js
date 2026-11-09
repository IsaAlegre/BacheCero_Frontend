// Interfaz única del front. Hoy: IA en vivo + backend simulado en localStorage.
// Cuando el backend NestJS esté listo, se reemplaza el cuerpo de cada función
// por un fetch y los componentes no cambian.
import { useEffect, useState, useSyncExternalStore } from 'react'
import { IA_BASE, DUPLICATE_RADIUS_M } from './config'
import { DEMO_USERS } from './data/demoUsers'
import { getState, setState, useStore } from './lib/store'
import { reportSeverity, needsReview, worst } from './lib/scoring'
import { distanceM } from './lib/geo'
import { fileToDataURL, downscale } from './lib/image'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

/* ---------- Sesión ---------- */
// LOGIN SIMULADO PARA LA DEMO, NO ES SEGURIDAD REAL.
// Las cuentas de vecinos se guardan en localStorage con la contraseña hasheada
// (SHA-256), pero cualquiera con acceso al navegador puede leerlas o borrarlas.
// Con el backend real, cada función pasa a ser un fetch y la sesión, un token.
//
// Se guarda una sesión por rol para poder abrir /vecino y /municipio a la vez
// en el mismo navegador durante la presentación.

const USERS_KEY = 'bachecero:users'
const sessionKey = (role) => `bachecero:session:${role}`
const sessionListeners = new Set()

export const AUTH_ERROR = 'Email o contraseña incorrectos'

const normEmail = (email) => String(email || '').trim().toLowerCase()

async function hashPassword(email, password) {
  const text = `${normEmail(email)}:${password}`
  // crypto.subtle solo existe en contextos seguros (https o localhost). Si se abre
  // por IP de la red local (http://192.168…), se usa un hash simple (FNV-1a).
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  let h = 0x811c9dc5
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0
  return `fnv-${h.toString(16)}`
}

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

function writeSession(role, session) {
  if (session) localStorage.setItem(sessionKey(role), JSON.stringify(session))
  else localStorage.removeItem(sessionKey(role))
  sessionListeners.forEach((l) => l())
}

const sessionCache = {}
// Lectura sincrónica (para rutas protegidas y para firmar acciones en el mock).
export function readSession(role) {
  const raw = localStorage.getItem(sessionKey(role))
  if (sessionCache[role]?.raw !== raw) sessionCache[role] = { raw, value: raw ? JSON.parse(raw) : null }
  return sessionCache[role].value
}

function toSession(user, role) {
  return { userId: user.userId, nombre: user.nombre, email: user.email, role, token: `demo-${user.userId}` }
}

export async function register({ nombre, email, password }) {
  const users = readJSON(USERS_KEY, [])
  const e = normEmail(email)
  if (users.some((u) => u.email === e) || e === DEMO_USERS.vecino.email || e === DEMO_USERS.municipio.email) {
    throw new ApiError(409, 'Ya hay una cuenta con ese email')
  }
  const user = {
    userId: `u-${Date.now().toString(36)}`,
    nombre: nombre.trim(),
    email: e,
    passwordHash: await hashPassword(e, password),
    createdAt: Date.now(),
  }
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]))
  const session = toSession(user, 'vecino')
  writeSession('vecino', session)
  return session
}

// role: 'vecino' | 'municipio'. Cada rol solo acepta sus propias cuentas.
export async function login({ email, password, role }) {
  const e = normEmail(email)
  const hash = await hashPassword(e, password)
  const demo = DEMO_USERS[role]
  let user = null
  if (demo && e === demo.email && hash === (await hashPassword(demo.email, demo.password))) {
    user = demo
  } else if (role === 'vecino') {
    user = readJSON(USERS_KEY, []).find((u) => u.email === e && u.passwordHash === hash) || null
  }
  if (!user) throw new ApiError(401, AUTH_ERROR)
  const session = toSession(user, role)
  writeSession(role, session)
  return session
}

export async function logout(role) {
  writeSession(role, null)
  return { ok: true }
}

export async function getSession(role) {
  return readSession(role)
}

window.addEventListener('storage', (e) => {
  if (e.key?.startsWith('bachecero:session:')) sessionListeners.forEach((l) => l())
})

export function useSession(role) {
  return useSyncExternalStore(
    (l) => { sessionListeners.add(l); return () => sessionListeners.delete(l) },
    () => readSession(role),
  )
}

const agentName = () => readSession('municipio')?.nombre || 'Personal municipal'

/* ---------- Modo de la IA ---------- */

export const getMode = () => getState().mode
export const setMode = (mode) => setState((s) => ({ ...s, mode }))

export async function checkIA() {
  try {
    const r = await fetch(`${IA_BASE}/health`, { signal: AbortSignal.timeout(3000) })
    if (!r.ok) return false
    const data = await r.json()
    return data.status === 'ok' && data.models_loaded
  } catch {
    return false
  }
}

/* ---------- Servicio de visión ---------- */

export async function analyzeImage(file) {
  if (getMode() === 'offline') return offlineAnalysis(file)
  try {
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch(`${IA_BASE}/v1/analyze`, { method: 'POST', body: fd })
    if (!r.ok) throw new ApiError(r.status, await r.text())
    return { ...(await r.json()), source: 'live' }
  } catch (e) {
    // 413/415/422 son errores de la foto: hay que mostrárselos al vecino, no taparlos.
    if (e instanceof ApiError && [413, 415, 422].includes(e.status)) throw e
    console.warn('IA no disponible, uso la respuesta guardada', e)
    return offlineAnalysis(file)
  }
}

// Plan B: respuesta real guardada del servicio (public/fixtures/analyze-demo.json).
async function offlineAnalysis(file) {
  const fx = await fetch('/fixtures/analyze-demo.json').then((r) => r.json())
  // Si el fixture no trae imagen, se muestra la foto local (rotulada como no procesada).
  const localPreview = fx.image ? null : await fileToDataURL(file)
  return { ...fx, source: 'offline', localPreview }
}

/* ---------- Reportes (simula el backend) ---------- */

export async function createReport({ file, lat, lng, description }) {
  const analysis = await analyzeImage(file)
  const raw = analysis.image ? `data:image/jpeg;base64,${analysis.image}` : analysis.localPreview
  const imageUrl = raw ? await downscale(raw) : null
  // eslint-disable-next-line no-unused-vars
  const { image, localPreview, source, ...meta } = analysis

  let result
  setState((s) => {
    const now = Date.now()
    const reportId = `BC-${String(s.counters.BC).padStart(4, '0')}`
    const near = findNearCase(s, lat, lng)
    let cases = s.cases
    let tNext = s.counters.T
    let caseId

    if (near) {
      caseId = near.id
    } else {
      caseId = `T-${String(tNext++).padStart(4, '0')}`
      const ctx = nearestContext(s, lat, lng)
      cases = [...cases, {
        id: caseId, lat, lng, ...ctx,
        status: 'Pendiente',
        history: [{ status: 'Pendiente', at: now, by: 'Sistema' }],
        createdAt: now,
      }]
    }

    const report = {
      id: reportId, caseId, lat, lng, description, createdAt: now, imageUrl,
      analysis: meta,
      severity: reportSeverity(meta),
      review: needsReview(meta) ? 'pendiente' : null,
      userId: readSession('vecino')?.userId ?? null,
      source,
    }
    result = { report, caseId, joined: Boolean(near) }
    return { ...s, cases, reports: [...s.reports, report], counters: { BC: s.counters.BC + 1, T: tNext } }
  })
  return result
}

// Duplicados: SOLO por cercanía geográfica (no hay similitud de imagen).
function findNearCase(s, lat, lng) {
  let best = null
  for (const c of s.cases) {
    if (c.status === 'Resuelto' || c.discarded) continue
    const d = distanceM(lat, lng, c.lat, c.lng)
    if (d <= DUPLICATE_RADIUS_M && (!best || d < best.d)) best = { ...c, d }
  }
  return best
}

// Sin OpenStreetMap en la demo: copia calle/jerarquía del caso cargado más cercano
// (si está a menos de 150 m) y barrio/índice social simulados del más cercano.
function nearestContext(s, lat, lng) {
  const sorted = s.cases
    .filter((c) => c.seed)
    .map((c) => ({ c, d: distanceM(lat, lng, c.lat, c.lng) }))
    .sort((a, b) => a.d - b.d)
  const n = sorted[0]
  if (!n) return { street: 'Calle sin identificar', hierarchy: 'local', barrio: '—', socialIndex: 0.5 }
  const close = n.d < 150
  return {
    street: close ? n.c.street : 'Calle sin identificar',
    hierarchy: close ? n.c.hierarchy : 'local',
    barrio: n.c.barrio,
    socialIndex: n.c.socialIndex,
  }
}

// Dirección aproximada para mostrar al vecino. En la demo no hay geocodificación:
// se usa la calle cargada más cercana (el backend lo resolvería con OpenStreetMap).
export async function locate(lat, lng) {
  return nearestContext(getState(), lat, lng)
}

function bestDetection(r) {
  return [...(r.analysis.detections || [])].sort((a, b) => b.confidence - a.confidence)[0]
}

function caseView(s, c) {
  const all = s.reports.filter((r) => r.caseId === c.id)
  const valid = all.filter((r) => r.review !== 'descartado')
  const confirmed = valid.filter((r) => r.review !== 'pendiente')
  const severity = worst(confirmed.map((r) => r.severity))
  const top = confirmed.find((r) => r.severity === severity)
  return {
    ...c,
    reports: confirmed,
    reportCount: confirmed.length,
    pendingCount: valid.length - confirmed.length,
    severity,
    typeLabel: top ? top.manualLabel || bestDetection(top)?.label_es || '—' : '—',
    photo: [...confirmed].reverse().find((r) => r.imageUrl) || null,
    maxConfidence: Math.max(0, ...confirmed.map((r) => r.analysis.summary?.max_confidence ?? 0)),
  }
}

/* ---------- Lecturas ---------- */

// Un caso entra a la lista solo si tiene al menos un reporte confirmado.
export async function listCases({ includeResolved = false } = {}) {
  const s = getState()
  return s.cases
    .map((c) => caseView(s, c))
    .filter((c) => c.reportCount > 0 && (includeResolved || c.status !== 'Resuelto'))
}

export async function getCase(id) {
  const s = getState()
  const c = s.cases.find((x) => x.id === id)
  return c ? caseView(s, c) : null
}

export async function getReport(id) {
  const s = getState()
  const r = s.reports.find((x) => x.id === id)
  if (!r) return null
  return { ...r, case: s.cases.find((c) => c.id === r.caseId) }
}

export async function listReviewQueue() {
  const s = getState()
  return s.reports
    .filter((r) => r.review === 'pendiente')
    .map((r) => ({ ...r, case: s.cases.find((c) => c.id === r.caseId) }))
}

// "Mis reportes": los del usuario logueado (el backend lo sacaría del token).
export async function listMyReports() {
  const s = getState()
  const userId = readSession('vecino')?.userId
  if (!userId) return []
  return s.reports
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((r) => ({ ...r, case: s.cases.find((c) => c.id === r.caseId) }))
}

/* ---------- Acciones del municipio ---------- */

// decision: { action: 'confirmar' | 'corregir' | 'descartar', modelClass?, label?, severity? }
export async function reviewReport(id, decision) {
  setState((s) => ({
    ...s,
    reports: s.reports.map((r) => {
      if (r.id !== id) return r
      const base = { ...r, reviewedAt: Date.now(), reviewedBy: agentName() }
      if (decision.action === 'confirmar') return { ...base, review: 'confirmado' }
      if (decision.action === 'descartar') return { ...base, review: 'descartado' }
      return { ...base, review: 'corregido', severity: decision.severity, manualLabel: decision.label }
    }),
  }))
}

export async function updateCaseStatus(id, status) {
  setState((s) => ({
    ...s,
    cases: s.cases.map((c) =>
      c.id === id && c.status !== status
        ? { ...c, status, history: [...c.history, { status, at: Date.now(), by: agentName() }] }
        : c),
  }))
}

/* ---------- Hook para los componentes ---------- */

// Vuelve a pedir los datos cuando cambia el estado (mock) o cada 5 s (backend real).
export function useLive(fn, deps = []) {
  const s = useStore()
  const [tick, setTick] = useState(0)
  const [data, setData] = useState(null)
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    let alive = true
    fn().then((d) => alive && setData(d))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, tick, ...deps])
  return data
}
