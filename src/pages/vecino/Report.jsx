import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import { createReport, locate, ApiError } from '../../api'
import { getPosition } from '../../lib/geo'
import { searchAddress } from '../../lib/geocode'
import { COARSE, DESKTOP, useMediaQuery } from '../../lib/media'
import { MAP_CENTER } from '../../config'
import MapBase from '../../components/MapBase'
import Notice from '../../components/Notice'
import { Button, Card, Icon, Input } from '../../components/ui'
import PageTitle from './PageTitle'

const PHOTO_ERRORS = {
  413: 'La foto pesa más de 10 MB. Probá con otra.',
  415: 'Usá una foto JPG, PNG o WebP.',
  422: 'No pudimos leer la foto. Sacá otra.',
}

export default function Report() {
  const nav = useNavigate()
  const coarse = useMediaQuery(COARSE)
  const wide = useMediaQuery(DESKTOP)
  const [step, setStep] = useState('foto')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [pos, setPos] = useState(null)
  const [gps, setGps] = useState(coarse ? 'buscando' : 'manual')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  function locateMe() {
    setGps('buscando')
    getPosition()
      .then((p) => { setPos(p); setGps('ok') })
      .catch(() => setGps('error'))
  }

  useEffect(() => { if (coarse) locateMe() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  function onFile(f) {
    if (!f) return
    if (!f.type.startsWith('image/')) { setError(PHOTO_ERRORS[415]); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  async function send() {
    setSending(true)
    setError(null)
    try {
      const { report, joined } = await createReport({ file, lat: pos[0], lng: pos[1], description })
      nav(`/vecino/reporte/${report.id}`, { state: { joined } })
    } catch (e) {
      setError(!(e instanceof ApiError) || e.status >= 500
        ? 'No pudimos guardar el reporte. Probá de nuevo en un rato.'
        : PHOTO_ERRORS[e.status] || e.message)
      setSending(false)
    }
  }

  const details = (
    <>
      <Input as="textarea" rows={3} label="Descripción (opcional)" value={description}
        onChange={(e) => setDescription(e.target.value)} placeholder="Ej.: en la esquina, ocupa medio carril" />
      <Notice icon="shield" title="Difuminamos rostros y patentes">
        Antes de guardar la foto, la IA difumina caras y patentes y le borra la ubicación, la fecha y el modelo del celular.
      </Notice>
      {error && <div role="alert" className="rounded-xl bg-red-100 px-3 py-2.5 text-sm font-medium text-red-800 dark:bg-red-500/15 dark:text-red-200">{error}</div>}
      <Button variant="action" size="lg" block disabled={!file || !pos || sending} onClick={send}>
        {sending
          ? <><span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Analizando la foto…</>
          : 'Enviar reporte'}
      </Button>
      {(!file || !pos) && !sending && (
        <p className="text-center text-sm text-muted">
          {!file && !pos ? 'Falta la foto y la ubicación.' : !file ? 'Falta la foto.' : 'Falta marcar la ubicación en el mapa.'}
        </p>
      )}
    </>
  )

  if (wide) {
    return (
      <div>
        <PageTitle subtitle="Subí la foto, marcá dónde está y listo.">Reportar un bache</PageTitle>
        <div className="grid grid-cols-2 items-start gap-8">
          <div className="space-y-4">
            <PhotoPicker coarse={coarse} preview={preview} onFile={onFile} />
            {details}
          </div>
          <LocationPicker big pos={pos} onMove={setPos} gps={gps} onUseMyLocation={locateMe} />
        </div>
      </div>
    )
  }

  if (step === 'foto') {
    return (
      <div className="space-y-5">
        <Stepper step={1} />
        <PageTitle subtitle="Desde uno o dos metros, con el bache entero en la foto.">
          {coarse ? 'Tomá una foto' : 'Subí una foto'}
        </PageTitle>
        <PhotoPicker coarse={coarse} preview={preview} onFile={onFile} />
        {error && <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>}
        {coarse && <GpsStatus gps={gps} />}
        <Button variant="action" size="lg" block disabled={!file} onClick={() => setStep('confirmar')}>
          Continuar <Icon name="chevronRight" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Stepper step={2} />
      <div>
        <button type="button" onClick={() => setStep('foto')}
          className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-navy dark:text-navy-200">
          <Icon name="chevronLeft" className="size-4" /> Volver
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight">Confirmá tu reporte</h1>
      </div>
      <img src={preview} alt="Foto del bache" className="aspect-[4/3] w-full rounded-2xl object-cover ring-1 ring-line" />
      <LocationPicker pos={pos} onMove={setPos} gps={gps} onUseMyLocation={locateMe} />
      {details}
    </div>
  )
}

function Stepper({ step }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Paso ${step} de 2`}>
      {[1, 2].map((n) => (
        <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-orange' : 'bg-line'}`} />
      ))}
      <span className="ml-1 text-xs font-semibold text-muted">Paso {step} de 2</span>
    </div>
  )
}

function GpsStatus({ gps }) {
  const v = {
    ok: ['Ubicación detectada', 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'],
    buscando: ['Buscando tu ubicación…', 'bg-surface-2 text-ink'],
    error: ['Sin GPS: la marcás en el mapa en el paso siguiente', 'bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200'],
    manual: ['Marcá en el mapa dónde está el bache', 'bg-surface-2 text-ink'],
  }[gps]
  return (
    <p role="status" className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold ${v[1]}`}>
      <Icon name="pin" className="size-4" /> {v[0]}
    </p>
  )
}

function PhotoPicker({ coarse, preview, onFile }) {
  const [dragging, setDragging] = useState(false)
  const dropProps = coarse ? {} : {
    onDragOver: (e) => { e.preventDefault(); setDragging(true) },
    onDragLeave: () => setDragging(false),
    onDrop: (e) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files?.[0]) },
  }
  return (
    <label {...dropProps}
      className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed p-4 text-center transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-orange ${
        preview ? 'border-transparent p-0' : 'aspect-[4/3] border-navy-300 bg-navy-50 text-navy hover:bg-navy-100 dark:border-navy-500 dark:bg-navy-500/15 dark:text-navy-100'
      } ${dragging ? '!border-orange !bg-orange/10' : ''}`}>
      {preview ? (
        <>
          <img src={preview} alt="Vista previa de la foto" className="block max-h-[60vh] w-full object-cover" />
          <span className="absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-black/65 px-3 text-sm font-semibold text-white">
            <Icon name={coarse ? 'camera' : 'image'} className="size-4" /> Cambiar foto
          </span>
        </>
      ) : (
        <>
          <span className="grid size-20 place-items-center rounded-full bg-orange text-navy-950 shadow-lg">
            <Icon name={coarse ? 'camera' : 'image'} className="size-9" />
          </span>
          <span className="mt-4 text-lg font-bold">{coarse ? 'Tocá para sacar la foto' : 'Subí una foto del bache'}</span>
          <span className="text-sm opacity-80">
            {coarse ? 'o elegila de la galería' : dragging ? 'Soltala acá' : 'Arrastrala acá o hacé clic para elegirla'}
          </span>
        </>
      )}
      <input type="file" accept="image/*"
        onChange={(e) => onFile(e.target.files?.[0])} className="sr-only" aria-label="Foto del bache" />
    </label> 
  )
}

function ClickToMove({ enabled, onClick }) {
  useMapEvents({ click: (e) => enabled && onClick([e.latlng.lat, e.latlng.lng]) })
  return null
}

function FocusOn({ focus }) {
  const map = useMap()
  useEffect(() => { if (focus) map.setView(focus, Math.max(map.getZoom(), 17)) }, [focus, map])
  return null
}

function LocationPicker({ pos, onMove, gps, onUseMyLocation, big = false }) {
  const [editing, setEditing] = useState(false)
  const [focus, setFocus] = useState(pos)
  const [place, setPlace] = useState(null)
  const fromClick = useRef(false)
  const searchLabel = useRef(null)
  const canClick = big || editing || !pos

  useEffect(() => {
    if (!pos) return
    if (!fromClick.current) setFocus(pos)
    fromClick.current = false
    if (searchLabel.current) { setPlace({ street: searchLabel.current, barrio: null }); searchLabel.current = null; return }
    // La búsqueda tarda (Nominatim, 1 por segundo): si el punto cambia antes, se ignora la respuesta vieja.
    let alive = true
    setPlace(null)
    locate(pos[0], pos[1]).then((p) => alive && setPlace(p))
    return () => { alive = false }
  }, [pos])

  const click = (p) => { fromClick.current = true; onMove(p) }
  const pick = (r) => { searchLabel.current = r.label; onMove([r.lat, r.lng]) }

  return (
    <Card padded={false} className="overflow-hidden">
      {big && (
        <div className="space-y-3 border-b border-line p-4">
          <AddressSearch onPick={pick} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Icon name="pin" className="size-4 text-orange-dark dark:text-orange" /> Marcá en el mapa dónde está el bache
            </p>
            <Button variant="secondary" size="sm" onClick={onUseMyLocation} disabled={gps === 'buscando'}>
              <Icon name="pin" className="size-4" /> {gps === 'buscando' ? 'Buscando…' : 'Usar mi ubicación'}
            </Button>
          </div>
          {gps === 'error' && <p role="status" className="text-sm text-amber-800 dark:text-amber-200">No pudimos obtener tu ubicación. Marcala en el mapa.</p>}
        </div>
      )}
      <div className={`relative ${!big && canClick ? 'ring-4 ring-inset ring-orange' : ''}`}>
        <MapBase center={pos || MAP_CENTER} zoom={pos ? 17 : 14} className={`w-full ${big ? 'h-[450px] cursor-crosshair' : 'h-52'}`}
          scrollWheelZoom={big}>
          {pos && <CircleMarker center={pos} radius={11} pathOptions={{ color: '#fff', weight: 3, fillColor: '#f28c28', fillOpacity: 1 }} />}
          <ClickToMove enabled={canClick} onClick={click} />
          <FocusOn focus={focus} />
        </MapBase>
        {!big && canClick && (
          <span className="pointer-events-none absolute left-1/2 top-2 z-[400] -translate-x-1/2 whitespace-nowrap rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white shadow">
            Tocá el mapa donde está el bache
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 p-3">
        <Icon name="pin" className="size-5 text-orange-dark dark:text-orange" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{pos ? place?.street || '…' : 'Todavía no marcaste la ubicación'}</p>
          <p className="text-xs text-muted">
            {pos ? `${place?.barrio && place.barrio !== '—' ? `${place.barrio} · ` : ''}Dirección aproximada` : 'Hacé clic en el mapa o buscá la dirección'}
          </p>
        </div>
        {!big && pos && (
          <Button variant={editing ? 'primary' : 'secondary'} size="sm" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Listo' : 'Corregir ubicación'}
          </Button>
        )}
      </div>
    </Card>
  )
}

// Búsqueda al enviar (Enter o "Buscar"), no mientras se escribe: Nominatim no permite autocompletar.
function AddressSearch({ onPick }) {
  const [q, setQ] = useState('')
  const [state, setState] = useState({ status: 'idle', results: [] })
  const ctrl = useRef(null)
  const debounce = useRef(null)

  function submit(e) {
    e.preventDefault()
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      ctrl.current?.abort()
      ctrl.current = new AbortController()
      setState({ status: 'loading', results: [] })
      try {
        const results = await searchAddress(q, { signal: ctrl.current.signal })
        setState({ status: results.length ? 'done' : 'empty', results })
      } catch (err) {
        if (err.name !== 'AbortError') setState({ status: 'error', results: [] })
      }
    }, 500)
  }

  useEffect(() => () => { clearTimeout(debounce.current); ctrl.current?.abort() }, [])

  return (
    <div>
      <form role="search" onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input type="search" aria-label="Buscar dirección en Posadas" placeholder="Ej.: Av. Mitre 1500"
            value={q} onChange={(e) => setQ(e.target.value)} className="[&_input]:pl-9" />
        </div>
        <Button type="submit" disabled={q.trim().length < 3 || state.status === 'loading'}>Buscar</Button>
      </form>
      <div aria-live="polite">
        {state.status === 'loading' && <p className="mt-2 text-sm text-muted">Buscando…</p>}
        {state.status === 'empty' && <p className="mt-2 text-sm text-muted">No encontramos esa dirección en Posadas. Probá con otra o marcala en el mapa.</p>}
        {state.status === 'error' && <p className="mt-2 text-sm text-red-700 dark:text-red-300">No pudimos buscar ahora. Marcá el punto en el mapa.</p>}
        {state.status === 'done' && (
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
            {state.results.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => { onPick(r); setState({ status: 'idle', results: [] }); setQ(r.label) }}
                  className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2">
                  <Icon name="pin" className="size-4 text-muted" /> {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted">Búsqueda: © OpenStreetMap (Nominatim)</p>
    </div>
  )
}
