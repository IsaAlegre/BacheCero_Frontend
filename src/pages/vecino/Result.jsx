import { useLocation, useParams } from 'react-router-dom'
import { getReport, useLive } from '../../api'
import AnalysisImage from '../../components/AnalysisImage'
import Notice from '../../components/Notice'
import { Button, Card, Icon, Spinner } from '../../components/ui'

export default function Result() {
  const { id } = useParams()
  const { state } = useLocation()
  const r = useLive(() => getReport(id), [id])
  if (!r) return <Spinner />

  const { detections, privacy } = r.analysis
  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-8">
      <div className="flex flex-col items-center pt-2 text-center lg:col-start-2 lg:items-start lg:pt-0 lg:text-left">
        <span className="grid size-16 place-items-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30">
          <Icon name="check" className="size-9" strokeWidth={3} />
        </span>
        <h1 className="mt-3 text-2xl font-extrabold">¡Reporte recibido!</h1>
        <p className="text-muted">Número de reporte</p>
        <p className="mt-1 rounded-xl bg-navy px-4 py-1.5 font-mono text-xl font-bold tracking-wider text-white dark:bg-navy-300 dark:text-navy-950">#{r.id}</p>
      </div>

      <div className="space-y-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <AnalysisImage imageUrl={r.imageUrl} analysis={r.analysis} source={r.source} />
        {r.source === 'offline' && !r.analysis.image && (
          <p className="text-sm text-muted">Foto sin procesar: el servicio de IA no estaba disponible.</p>
        )}
      </div>

      <div className="space-y-5 lg:col-start-2">
        <Card>
          <p className="mb-2 font-bold">Lo que encontró la IA</p>
          {detections.length === 0 && <p className="text-sm">No encontró daños en la foto.</p>}
          <ul className="space-y-1.5">
            {detections.map((d, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold">{d.label_es}</span>
                <span className="text-muted">{Math.round(d.confidence * 100)} % de confianza</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
            <Icon name="shield" className="mr-1 inline size-4 align-[-3px]" />
            Se difuminaron {privacy.faces_blurred} rostro(s) y {privacy.plates_blurred} patente(s).
          </p>
        </Card>

        {r.review === 'pendiente' && (
          <Notice icon="eye" tone="warn" title="Lo revisa una persona">
            La IA no está segura con esta foto, así que una persona del municipio la va a revisar.
          </Notice>
        )}
        {state?.joined && (
          <Notice icon="layers" title="Reporte agrupado">
            Ya había reportes en este lugar: sumamos el tuyo al caso #{r.caseId}. Más reportes, más prioridad.
          </Notice>
        )}

        <div className="space-y-2">
          <Button to={`/vecino/mis-reportes/${r.id}`} size="lg" block>Ver seguimiento</Button>
          <Button to="/vecino" variant="ghost" block>Volver al inicio</Button>
        </div>
      </div>
    </div>
  )
}
