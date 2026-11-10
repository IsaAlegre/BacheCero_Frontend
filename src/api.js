import { useEffect, useState, useSyncExternalStore } from 'react'
import { API_BASE, IA_BASE, CLASS_LABELS, UNKNOWN_HIERARCHY, UNKNOWN_SOCIAL } from './config'
import { reverseAddress } from './lib/geocode'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

let version = 0
const changeListeners = new Set()
function bump() {
  version += 1
  listCache.clear()
  changeListeners.forEach((l) => l())
}

/* ---------- Sesión ---------- */

const sessionKey = (role) => `bachecero:session:${role}`
const sessionListeners = new Set()

export const AUTH_ERROR = 'DNI o contraseña incorrectos'

const ALLOWED = {
  vecino: ['ciudadano', 'operador', 'administrador'],
  municipio: ['operador', 'administrador'],
}

function writeSession(role, session) {
  if (session) localStorage.setItem(sessionKey(role), JSON.stringify(session))
  else localStorage.removeItem(sessionKey(role))
  sessionListeners.forEach((l) => l())
}

const sessionCache = {}
export function readSession(role) {
  const raw = localStorage.getItem(sessionKey(role))
  if (sessionCache[role]?.raw !== raw) {
    let value = null
    try { value = raw ? JSON.parse(raw) : null } catch { value = null }
    sessionCache[role] = { raw, value }
  }
  const s = sessionCache[role].value
  if (s?.expiresAt && s.expiresAt < Date.now()) return null
  return s
}

function tokenPayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return {}
  }
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

/* ---------- HTTP ---------- */

async function request(path, { method = 'GET', body, form, role } = {}) {
  const headers = {}
  const token = role ? readSession(role)?.token : null
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (form) payload = form
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let r
  try {
    r = await fetch(`${API_BASE}${path}`, { method, headers, body: payload })
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Probá de nuevo en un rato.')
  }
  const data = await r.json().catch(() => null)
  if (!r.ok) {
    if (r.status === 401 && token) writeSession(role, null)
    throw new ApiError(r.status, data?.mensaje || `Error ${r.status}`)
  }
  return data
}

async function fetchAllPages(path, role) {
  const sep = path.includes('?') ? '&' : '?'
  const items = []
  for (let pagina = 1; pagina <= 50; pagina++) {
    const data = await request(`${path}${sep}pagina=${pagina}`, { role })
    items.push(...data.items)
    if (pagina >= data.totalPaginas) break
  }
  return items
}

/* ---------- Usuarios ---------- */

const cleanDni = (v) => String(v || '').replace(/[.\s]/g, '')

export async function register({ nombre, dni, password }) {
  await request('/auth/registro', { method: 'POST', body: { nombre: nombre.trim(), dni: cleanDni(dni), password } })
  return login({ dni, password, role: 'vecino' })
}

export async function login({ dni, password, role }) {
  const { accessToken, rol, nombre } = await request('/auth/login', {
    method: 'POST',
    body: { dni: cleanDni(dni), password },
  })
  if (!ALLOWED[role].includes(rol)) {
    throw new ApiError(403, 'Esta cuenta no tiene acceso al panel municipal.')
  }
  const { sub, exp } = tokenPayload(accessToken)
  const session = {
    userId: Number(sub),
    nombre,
    role,
    rol,
    token: accessToken,
    expiresAt: exp ? exp * 1000 : null,
  }
  writeSession(role, session)
  return session
}

export async function logout(role) {
  writeSession(role, null)
}

/* ---------- IA ---------- */

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

/* ---------- Traducción backend → front ---------- */

export const STATUS_FROM = { pendiente: 'Pendiente', programado: 'Programado', en_reparacion: 'En reparación', resuelto: 'Resuelto' }
const STATUS_TO = Object.fromEntries(Object.entries(STATUS_FROM).map(([k, v]) => [v, k]))
const SEVERITY_FROM = { leve: 'leve', moderada: 'moderado', grave: 'grave' }
const TYPE_LABELS = { pothole: 'Bache', crack: 'Grieta' }

const ts = (d) => (d ? new Date(d).getTime() : null)

// Con ALMACEN_IMAGENES=local el backend guarda "local://…", que el navegador no puede abrir.
function imageUrl(u) {
  if (!u || u.startsWith('local://')) return null
  return u
}

function toAnalysis(detecciones = [], size = null) {
  const detections = detecciones.map((d) => ({
    type: d.tipo,
    model_class: d.claseModelo,
    label_es: CLASS_LABELS[d.claseModelo] || TYPE_LABELS[d.tipo] || d.claseModelo,
    confidence: d.confianza,
    bbox: d.bbox,
    area_pct: d.areaPct,
  }))
  const max = detections.reduce((m, d) => Math.max(m, d.confidence), 0)
  return {
    width: size?.width ?? null,
    height: size?.height ?? null,
    detections,
    summary: { damage_found: detections.length > 0, max_confidence: detections.length ? max : null },
    privacy: null,
  }
}

const BACKEND_WEIGHTS = { gravedad: 0.4, jerarquia: 0.25, reportes: 0.15, vulnerabilidad: 0.2 }
const BACKEND_SEVERITY = { leve: 0.3, moderada: 0.6, grave: 1 }
const HIERARCHY_LABELS = [[1, 'Avenida principal'], [0.7, 'Avenida secundaria'], [0.5, 'Calle colectora'], [0.3, 'Calle residencial'], [0.1, 'Pasaje o camino']]

// El backend no expone el peso de la calle: se despeja de la prioridad (barrio sin índice = 0,5).
function estimateHierarchy(t, reportCount) {
  const g = BACKEND_SEVERITY[t.gravedad] ?? 0
  const r = Math.min(reportCount / 5, 1)
  const raw = (t.prioridad - BACKEND_WEIGHTS.gravedad * g - BACKEND_WEIGHTS.reportes * r
    - BACKEND_WEIGHTS.vulnerabilidad * UNKNOWN_SOCIAL) / BACKEND_WEIGHTS.jerarquia
  const [weight, label] = HIERARCHY_LABELS.reduce((best, h) => (Math.abs(h[0] - raw) < Math.abs(best[0] - raw) ? h : best))
  return { weight, label }
}

function toHistory(creadoEn, historial = []) {
  return [
    { status: 'Pendiente', at: ts(creadoEn), by: 'Sistema' },
    ...historial.map((h) => ({ status: STATUS_FROM[h.estadoNuevo], at: ts(h.creadoEn), by: h.usuario || 'Municipio' })),
  ]
}

function reviewOf(t) {
  if (t.necesitaRevision) return 'pendiente'
  if (t.revisionDecision === 'rechazada') return 'descartado'
  if (t.revisionDecision === 'confirmada') return 'confirmado'
  return null
}

function toReport(r, caseId) {
  return {
    id: String(r.id),
    caseId: String(caseId),
    createdAt: ts(r.creadoEn),
    description: r.descripcion,
    imageUrl: imageUrl(r.imagenUrl),
    analysis: toAnalysis(r.detecciones),
    source: 'live',
  }
}

function caseView(t, d) {
  const reports = (d?.reportes ?? []).map((r) => toReport(r, t.id))
  const detections = reports.flatMap((r) => r.analysis.detections)
  const top = detections.filter((x) => x.type === t.tipo).sort((a, b) => b.confidence - a.confidence)[0]
  const hierarchy = estimateHierarchy(t, t.reportes)
  const rev = { necesitaRevision: d?.necesitaRevision ?? t.necesitaRevision, revisionDecision: d?.revisionDecision ?? null }
  return {
    id: String(t.id),
    lat: t.lat,
    lng: t.lng,
    street: t.calle || 'Calle sin identificar',
    barrio: d?.barrio || t.barrio || 'Sin barrio',
    status: STATUS_FROM[t.estado] ?? t.estado,
    severity: SEVERITY_FROM[t.gravedad] ?? null,
    typeLabel: t.tipo ? CLASS_LABELS[top?.model_class] || TYPE_LABELS[t.tipo] : 'Sin daño detectado',
    hierarchyLabel: `${hierarchy.label} (estimada)`,
    hierarchyWeight: hierarchy.weight ?? UNKNOWN_HIERARCHY,
    socialIndex: UNKNOWN_SOCIAL,
    socialKnown: false,
    backendPriority: t.prioridad,
    reportCount: t.reportes,
    pendingCount: 0,
    needsReview: rev.necesitaRevision,
    review: reviewOf(rev),
    reports,
    photo: [...reports].reverse().find((r) => r.imageUrl) || null,
    maxConfidence: Math.max(0, ...detections.map((x) => x.confidence)),
    history: toHistory(t.creadoEn, d?.historial),
    createdAt: ts(t.creadoEn),
    updatedAt: ts(t.actualizadoEn),
  }
}

/* ---------- Tickets (municipio) ---------- */

const listCache = new Map()
function fetchTickets(estado) {
  const key = estado || 'abiertos'
  const hit = listCache.get(key)
  if (hit && Date.now() - hit.at < 2000) return hit.promise
  const promise = fetchAllPages(estado ? `/tickets?estado=${estado}` : '/tickets', 'municipio')
  promise.catch(() => listCache.delete(key))
  listCache.set(key, { at: Date.now(), promise })
  return promise
}

const detailCache = new Map()
async function ticketDetail(t) {
  const hit = detailCache.get(t.id)
  if (hit && hit.updatedAt === t.actualizadoEn) return hit.promise
  const promise = request(`/tickets/${t.id}`, { role: 'municipio' })
  promise.catch(() => detailCache.delete(t.id))
  detailCache.set(t.id, { updatedAt: t.actualizadoEn, promise })
  return promise
}

async function mapLimit(xs, limit, fn) {
  const out = new Array(xs.length)
  let i = 0
  const worker = async () => { while (i < xs.length) { const k = i++; out[k] = await fn(xs[k]) } }
  await Promise.all(Array.from({ length: Math.min(limit, xs.length) }, worker))
  return out
}

async function loadCases(includeResolved) {
  const [open, resolved] = await Promise.all([
    fetchTickets(null),
    includeResolved ? fetchTickets('resuelto') : [],
  ])
  const tickets = [...open, ...resolved]
  const details = await mapLimit(tickets, 6, ticketDetail)
  return tickets.map((t, i) => caseView(t, details[i]))
}

export async function listCases({ includeResolved = false } = {}) {
  return (await loadCases(includeResolved)).filter((c) => c.review !== 'descartado')
}

export async function getCase(id) {
  return (await listCases({ includeResolved: true })).find((c) => c.id === String(id)) || null
}

export async function listReviewQueue() {
  const cases = await loadCases(false)
  return cases
    .filter((c) => c.needsReview)
    .map((c) => {
      const last = c.reports[c.reports.length - 1]
      return {
        ...(last || { id: c.id, createdAt: c.createdAt, imageUrl: null, analysis: toAnalysis([]) }),
        caseId: c.id,
        case: c,
        review: 'pendiente',
      }
    })
}

export async function reviewCase(caseId, { action }) {
  const decision = { confirmar: 'confirmada', descartar: 'rechazada' }[action]
  await request(`/tickets/${caseId}/revision`, { method: 'POST', body: { decision }, role: 'municipio' })
  bump()
}

export async function updateCaseStatus(id, status) {
  await request(`/tickets/${id}/estado`, { method: 'PATCH', body: { estado: STATUS_TO[status] }, role: 'municipio' })
  bump()
}

const TRANSITIONS = {
  Pendiente: ['Programado', 'En reparación', 'Resuelto'],
  Programado: ['En reparación', 'Resuelto'],
  'En reparación': ['Resuelto'],
  Resuelto: [],
}
export const canTransition = (from, to) => TRANSITIONS[from]?.includes(to) ?? false

export function getStats() {
  return request('/estadisticas', { role: 'municipio' })
}

/* ---------- Reportes (vecino) ---------- */

// "Mis reportes" no trae detecciones: se guardan las que devuelve POST /reportes.
const SENT_KEY = 'bachecero:reportes-enviados'
const readSent = () => { try { return JSON.parse(localStorage.getItem(SENT_KEY)) || {} } catch { return {} } }
const previews = new Map()

async function imageSize(file) {
  try {
    const bmp = await createImageBitmap(file)
    const size = { width: bmp.width, height: bmp.height }
    bmp.close()
    return size
  } catch {
    return null
  }
}

export async function createReport({ file, lat, lng, description }) {
  const fd = new FormData()
  fd.append('foto', file)
  fd.append('lat', String(lat))
  fd.append('lng', String(lng))
  if (description?.trim()) fd.append('descripcion', description.trim())
  const res = await request('/reportes', { method: 'POST', form: fd, role: 'vecino' })

  const id = String(res.reporteId)
  localStorage.setItem(SENT_KEY, JSON.stringify({
    ...readSent(),
    [id]: { detecciones: res.detecciones, necesitaRevision: res.necesitaRevision },
  }))
  const size = await imageSize(file)
  previews.set(id, { url: URL.createObjectURL(file), ...size })
  bump()
  return { report: { id }, caseId: String(res.ticketId), joined: !res.nuevoTicket }
}

export async function listMyReports() {
  const session = readSession('vecino')
  if (!session) return []
  const items = await fetchAllPages('/reportes/mios', 'vecino')
  const sent = readSent()
  return items.map((r) => {
    const id = String(r.id)
    const extra = sent[id]
    const preview = previews.get(id)
    const url = imageUrl(r.imagenUrl)
    const status = STATUS_FROM[r.ticket.estado] ?? r.ticket.estado
    return {
      id,
      caseId: String(r.ticket.id),
      createdAt: ts(r.creadoEn),
      description: r.descripcion,
      imageUrl: url || preview?.url || null,
      analysis: toAnalysis(extra?.detecciones, !url && preview ? preview : null),
      source: 'live',
      localPhoto: !url && Boolean(preview),
      userId: session.userId,
      review: null,
      reviewAtCreation: Boolean(extra?.necesitaRevision),
      case: {
        id: String(r.ticket.id),
        status,
        street: r.ticket.calle || 'Calle sin identificar',
        barrio: r.ticket.barrio || 'Sin barrio',
        history: [
          { status: 'Pendiente', at: ts(r.creadoEn), by: 'Sistema' },
          ...(status !== 'Pendiente' ? [{ status, at: null, by: 'Municipio' }] : []),
        ],
      },
    }
  })
}

export async function getReport(id) {
  return (await listMyReports()).find((r) => r.id === String(id)) || null
}

export async function locate(lat, lng) {
  try {
    return await reverseAddress(lat, lng)
  } catch {
    return { street: 'Ubicación marcada en el mapa', barrio: null }
  }
}

/* ---------- Novedades ---------- */

const toNews = (n) => ({ id: String(n.id), title: n.titulo, text: n.contenido, at: ts(n.publicadoEn) })

export async function listNews(role = 'vecino') {
  return (await fetchAllPages('/novedades', role)).map(toNews)
}

export async function listNewsAdmin() {
  const items = await fetchAllPages('/novedades/gestion', 'municipio')
  return items.map((n) => ({
    ...toNews(n),
    status: n.estado,
    origin: n.origen,
    author: n.autor,
    approvedBy: n.aprobadoPor,
    createdAt: ts(n.creadoEn),
  }))
}

async function newsAction(path, options) {
  const res = await request(path, { ...options, role: 'municipio' })
  bump()
  return res
}

export const generateNews = (anio, mes) => newsAction('/novedades/generar', { method: 'POST', body: { anio, mes } })
export const createNews = (titulo, contenido) => newsAction('/novedades', { method: 'POST', body: { titulo, contenido } })
export const editNews = (id, titulo, contenido) => newsAction(`/novedades/${id}`, { method: 'PATCH', body: { titulo, contenido } })
export const publishNews = (id) => newsAction(`/novedades/${id}/publicar`, { method: 'POST' })
export const deleteNews = (id) => newsAction(`/novedades/${id}`, { method: 'DELETE' })

/* ---------- Hook ---------- */

// Vuelve a pedir los datos cada 5 s y después de cada cambio hecho desde esta pestaña.
export function useLiveState(fn, deps = []) {
  const v = useSyncExternalStore(
    (l) => { changeListeners.add(l); return () => changeListeners.delete(l) },
    () => version,
  )
  const [tick, setTick] = useState(0)
  const [state, setState] = useState({ data: null, error: null })
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    let alive = true
    fn()
      .then((data) => alive && setState({ data, error: null }))
      .catch((error) => alive && setState((s) => ({ data: s.data, error })))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, tick, ...deps])
  return state
}

export const useLive = (fn, deps) => useLiveState(fn, deps).data
