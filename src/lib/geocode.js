// Búsqueda de direcciones con Nominatim (OpenStreetMap), limitada a Posadas.
// Política de uso (https://operations.osmfoundation.org/policies/nominatim/):
// - como máximo 1 consulta por segundo → se espera entre consultas;
// - NO se permite autocompletar del lado del cliente → se busca solo al enviar
//   (Enter o "Buscar"), nunca mientras se escribe;
// - resultados en caché para no repetir consultas.
const ENDPOINT = 'https://nominatim.openstreetmap.org/search'
const POSADAS_VIEWBOX = '-56.02,-27.32,-55.82,-27.48' // oeste, norte, este, sur
const MIN_INTERVAL_MS = 1000

let lastRequest = 0
const cache = new Map()

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Cancelada', 'AbortError')) })
  })
}

export async function searchAddress(query, { signal } = {}) {
  const q = query.trim()
  if (q.length < 3) return []
  const key = q.toLowerCase()
  if (cache.has(key)) return cache.get(key)

  // Se reserva el turno antes de esperar, así dos búsquedas seguidas nunca salen juntas.
  const slot = Math.max(Date.now(), lastRequest + MIN_INTERVAL_MS)
  lastRequest = slot
  if (slot > Date.now()) await wait(slot - Date.now(), signal)

  const params = new URLSearchParams({
    q, format: 'jsonv2', limit: '5', countrycodes: 'ar',
    viewbox: POSADAS_VIEWBOX, bounded: '1', 'accept-language': 'es',
  })
  const r = await fetch(`${ENDPOINT}?${params}`, { signal })
  if (!r.ok) throw new Error(`Nominatim respondió ${r.status}`)
  const results = (await r.json()).map((x) => ({
    id: x.place_id,
    label: x.display_name.split(', ').slice(0, 3).join(', '),
    lat: Number(x.lat),
    lng: Number(x.lon),
  }))
  cache.set(key, results)
  return results
}

export async function reverseAddress(lat, lng) {
  const key = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`
  if (cache.has(key)) return cache.get(key)

  const slot = Math.max(Date.now(), lastRequest + MIN_INTERVAL_MS)
  lastRequest = slot
  if (slot > Date.now()) await wait(slot - Date.now())

  const params = new URLSearchParams({
    lat: String(lat), lon: String(lng), format: 'jsonv2', zoom: '17', addressdetails: '1', 'accept-language': 'es',
  })
  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`)
  if (!r.ok) throw new Error(`Nominatim respondió ${r.status}`)
  const a = (await r.json()).address || {}
  const street = a.road ? `${a.road}${a.house_number ? ` ${a.house_number}` : ''}` : 'Ubicación marcada en el mapa'
  const place = { street, barrio: a.neighbourhood || a.suburb || null }
  cache.set(key, place)
  return place
}
