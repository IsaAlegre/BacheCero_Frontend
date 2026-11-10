import { useState } from 'react'
import { listReviewQueue, reviewCase, useLive } from '../../api'
import { REVIEW_CONFIDENCE } from '../../config'
import AnalysisImage from '../../components/AnalysisImage'
import { Button, Card, Icon, Spinner } from '../../components/ui'
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const { detections, summary } = r.analysis
  const conf = Math.round((summary?.max_confidence ?? 0) * 100)
  const reason = detections.length === 0
    ? 'La IA no encontró daños en la foto'
    : `Confianza máxima ${conf} % (menor a ${REVIEW_CONFIDENCE * 100} %)`
  const proposal = detections[0]?.label_es

  async function decide(action) {
    setBusy(true)
    setError(null)
    try {
      await reviewCase(r.caseId, { action })
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <AnalysisImage imageUrl={r.imageUrl} analysis={r.analysis} />

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

      {error && <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-auto grid grid-cols-2 gap-2">
        <Button variant="success" size="sm" disabled={busy}
          title={!detections.length ? 'La IA no vio daño, pero hay un bache: el ticket sigue abierto' : undefined}
          onClick={() => decide('confirmar')}>
          <Icon name="check" className="size-4" /> Confirmar daño
        </Button>
        <Button variant="danger" size="sm" disabled={busy} onClick={() => decide('descartar')}>
          <Icon name="x" className="size-4" /> Descartar
        </Button>
      </div>
    </Card>
  )
}
