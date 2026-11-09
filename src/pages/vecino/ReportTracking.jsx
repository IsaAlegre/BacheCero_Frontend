import { useParams } from 'react-router-dom'
import { getReport, useLive, useSession } from '../../api'
import { STATUSES } from '../../config'
import AnalysisImage from '../../components/AnalysisImage'
import Notice from '../../components/Notice'
import { Card, Icon, Spinner, STATUS_META } from '../../components/ui'
import { formatDate } from '../../lib/format'
import PageTitle from './PageTitle'

// Seguimiento: línea de tiempo Pendiente → Programado → En reparación → Resuelto.
export default function ReportTracking() {
  const { id } = useParams()
  const session = useSession('vecino')
  const r = useLive(() => getReport(id), [id])
  if (!r) return <Spinner />
  if (r.userId !== session?.userId) {
    return <><PageTitle back="/vecino/mis-reportes">Reporte no encontrado</PageTitle><p className="text-muted">Este reporte no es tuyo.</p></>
  }

  const current = STATUSES.indexOf(r.case.status)
  const when = (status) => [...r.case.history].reverse().find((h) => h.status === status)?.at

  return (
    <div>
      <PageTitle back="/vecino/mis-reportes" subtitle={`${r.case.street} · ${r.case.barrio}`}>
        <span className="font-mono">#{r.id}</span>
      </PageTitle>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="space-y-5">
          {r.review === 'pendiente' && (
            <Notice icon="hourglass" tone="warn" title="Foto en revisión">
              La IA no estaba segura, así que una persona del municipio la está revisando.
            </Notice>
          )}
          {r.review === 'descartado' && (
            <Notice icon="xCircle" title="Revisado: sin daño">
              El municipio revisó la foto y no encontró un daño en la calle. Si el bache sigue ahí, probá con otra foto.
            </Notice>
          )}

          <Card>
            <h2 className="mb-4 font-bold">Seguimiento</h2>
            <ol>
              {STATUSES.map((s, i) => {
                const done = i <= current
                const m = STATUS_META[s]
                const at = done ? when(s) : null
                return (
                  <li key={s} className="relative flex gap-3 pb-6 last:pb-0">
                    {i < STATUSES.length - 1 && (
                      <span className={`absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 ${i < current ? m.dot : 'bg-line'}`} aria-hidden="true" />
                    )}
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full ${done ? `${m.dot} text-white` : 'border-2 border-line bg-surface text-muted'}`}>
                      <Icon name={m.icon} className="size-5" />
                    </span>
                    <div className="pt-1.5">
                      <p className={`font-bold ${done ? '' : 'text-muted'}`}>
                        {s} {i === current && <span className="ml-1 text-xs font-semibold text-orange-dark dark:text-orange">· Estado actual</span>}
                      </p>
                      <p className="text-sm text-muted">{at ? formatDate(at) : 'Todavía no'}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </Card>
        </div>

        <div className="space-y-2 lg:sticky lg:top-24 lg:order-first">
          <AnalysisImage imageUrl={r.imageUrl} analysis={r.analysis} source={r.source} />
          <p className="text-center text-xs text-muted">
            Caso #{r.caseId} · reportado el {formatDate(r.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )
}
