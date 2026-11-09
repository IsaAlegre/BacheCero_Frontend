import { useState } from 'react'
import { listReviewQueue, reviewReport, useLive } from '../../api'
import { CLASS_LABELS, REVIEW_CONFIDENCE, SEVERITY_ORDER } from '../../config'
import AnalysisImage from '../../components/AnalysisImage'
import { Button, Card, Icon, Input, Spinner } from '../../components/ui'
import { formatDate } from '../../lib/format'
import PageHeader from './PageHeader'

export default function Review() {
  const queue = useLive(listReviewQueue)
  if (!queue) return <Spinner />

  return (
    <div>
      <PageHeader title="Revisión humana"
        subtitle={`Llegan acá las fotos sin detecciones o con confianza máxima menor a ${REVIEW_CONFIDENCE * 100} %. La IA propone; la persona decide.`} />
      {queue.length === 0 && (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <Icon name="checkCircle" className="size-10 text-st-resuelto" />
          <p className="font-bold">No hay reportes para revisar</p>
          <p className="text-sm text-muted">Cuando la IA tenga dudas con una foto, va a aparecer acá.</p>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {queue.map((r) => <ReviewCard key={r.id} r={r} />)}
      </div>
    </div>
  )
}

function ReviewCard({ r }) {
  const [fixing, setFixing] = useState(false)
  const [modelClass, setModelClass] = useState('pothole')
  const [severity, setSeverity] = useState('moderado')
  const { detections, summary } = r.analysis
  const conf = Math.round((summary?.max_confidence ?? 0) * 100)
  const reason = detections.length === 0
    ? 'La IA no encontró daños en la foto'
    : `Confianza máxima ${conf} % (menor a ${REVIEW_CONFIDENCE * 100} %)`
  const proposal = detections[0]?.label_es

  return (
    <Card className="flex flex-col gap-3">
      <AnalysisImage imageUrl={r.imageUrl} analysis={r.analysis} source={r.source} />

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono font-bold">#{r.id}</p>
          <p className="text-sm text-muted">Caso #{r.caseId} · {r.case?.street} · {formatDate(r.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold tabular-nums text-orange-dark dark:text-orange">{conf} %</p>
          <p className="text-xs text-muted">confianza IA</p>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <div className="h-full rounded-full bg-orange" style={{ width: `${conf}%` }} />
      </div>

      <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-400/10 dark:text-amber-100">
        <b>Motivo:</b> {reason}
        {proposal && <span className="block">Propuesta de la IA: {proposal}</span>}
      </div>
      {r.description && <p className="text-sm italic text-muted">“{r.description}”</p>}

      {fixing ? (
        <div className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-2">
          <Input as="select" label="Tipo de daño" value={modelClass} onChange={(e) => setModelClass(e.target.value)}>
            {Object.entries(CLASS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Input>
          <Input as="select" label="Gravedad" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {SEVERITY_ORDER.map((s) => <option key={s}>{s}</option>)}
          </Input>
          <Button variant="secondary" onClick={() => setFixing(false)}>Cancelar</Button>
          <Button onClick={() => reviewReport(r.id, { action: 'corregir', label: CLASS_LABELS[modelClass], severity })}>
            Guardar corrección
          </Button>
        </div>
      ) : (
        <div className="mt-auto grid grid-cols-3 gap-2">
          <Button variant="success" size="sm" disabled={!detections.length}
            title={!detections.length ? 'Sin detecciones: usá Corregir' : undefined}
            onClick={() => reviewReport(r.id, { action: 'confirmar' })}>
            <Icon name="check" className="size-4" /> Confirmar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setFixing(true)}>
            <Icon name="pencil" className="size-4" /> Corregir
          </Button>
          <Button variant="danger" size="sm" onClick={() => reviewReport(r.id, { action: 'descartar' })}>
            <Icon name="x" className="size-4" /> Descartar
          </Button>
        </div>
      )}
    </Card>
  )
}
