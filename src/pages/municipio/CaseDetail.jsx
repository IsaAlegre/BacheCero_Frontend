import { updateCaseStatus } from '../../api'
import { STATUSES, DUPLICATE_RADIUS_M } from '../../config'
import AnalysisImage from '../../components/AnalysisImage'
import ScoreBreakdown from '../../components/ScoreBreakdown'
import { Card, Icon, PriorityBadge, StatusBadge, STATUS_META } from '../../components/ui'
import { formatDate } from '../../lib/format'

// Detalle del ticket. En el mapa: panel lateral en escritorio y pantalla completa en celular/tablet.
export default function CaseDetail({ c, onBack, backLabel = 'Volver', overlay = false }) {
  const wrap = overlay
    ? 'fixed inset-0 z-40 overflow-y-auto bg-canvas px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] lg:static lg:z-auto lg:overflow-visible lg:bg-transparent lg:p-0'
    : ''
  return (
    <div className={wrap}>
      <div className="mx-auto max-w-3xl space-y-4">
        <button type="button" onClick={onBack}
          className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-navy dark:text-navy-200">
          <Icon name="chevronLeft" className="size-4" /> {backLabel}
        </button>

        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-sm font-bold text-muted">#{c.id}</p>
            <h2 className="text-xl font-extrabold leading-tight">{c.street}</h2>
            <p className="text-sm text-muted">{c.barrio}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge level={c.level} score={c.score.total} />
            <StatusBadge status={c.status} />
          </div>
        </div>

        {c.photo
          ? <AnalysisImage imageUrl={c.photo.imageUrl} analysis={c.photo.analysis} source={c.photo.source} />
          : <AnalysisImage imageUrl={null} />}

        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <Fact label="Tipo" value={c.typeLabel} />
          <Fact label="Gravedad" value={c.severity ?? 'sin dato'} />
          <Fact label="Reportes agrupados" value={`${c.reportCount}${c.pendingCount ? ` (+${c.pendingCount} en revisión)` : ''}`} />
          <Fact label="Confianza máx. IA" value={`${Math.round(c.maxConfidence * 100)} %`} />
          <Fact label="Agrupación" value={`Por cercanía, ${DUPLICATE_RADIUS_M} m`} />
          <Fact label="Creado" value={formatDate(c.createdAt)} />
        </dl>

        <Card>
          <h3 className="mb-3 font-bold">
            {c.rank ? `¿Por qué está en el puesto ${c.rank}?` : '¿Cómo se calculó el puntaje?'}
          </h3>
          <ScoreBreakdown c={c} />
        </Card>

        <Card>
          <h3 className="mb-3 font-bold">Cambiar estado</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUSES.map((s) => {
              const on = c.status === s
              const m = STATUS_META[s]
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => updateCaseStatus(c.id, s)}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-sm font-semibold transition ${
                    on ? `${m.dot} border-transparent text-white` : 'border-line bg-surface hover:bg-surface-2'}`}>
                  <Icon name={m.icon} className="size-4" /> {s}
                </button>
              )
            })}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-bold">Registro de cambios</h3>
          <ol className="space-y-3">
            {[...c.history].reverse().map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${STATUS_META[h.status]?.dot}`} />
                <div className="text-sm">
                  <b>{h.status}</b>
                  <p className="text-muted">{formatDate(h.at)} · {h.by}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
