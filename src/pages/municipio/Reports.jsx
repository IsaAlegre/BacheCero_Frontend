import { listCases, useLive } from '../../api'
import Notice from '../../components/Notice'
import { Badge, Button, Card, CardTitle, Icon, Spinner } from '../../components/ui'
import { avgResolutionDays, countBy, formatDays, isThisMonth, lastAt } from '../../lib/stats'
import PageHeader from './PageHeader'

const STEPS = [
  { icon: 'chart', title: 'Datos del mes', text: 'Casos nuevos, cambios de estado y tiempos de resolución.' },
  { icon: 'cpu', title: 'Borrador con un LLM', text: 'Un modelo de lenguaje redacta el informe a partir de esos datos.' },
  { icon: 'pencil', title: 'Revisión del municipio', text: 'Una persona lo lee, corrige y completa.' },
  { icon: 'checkCircle', title: 'Aprobación y publicación', text: 'Recién ahí se publica.' },
]

// PRÓXIMA ETAPA (no implementado). Muestra el flujo y los datos reales que usaría;
// NO hay texto generado: el borrador queda vacío a propósito.
export default function Reports() {
  const cases = useLive(() => listCases({ includeResolved: true }))
  if (!cases) return <Spinner />

  const month = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const created = cases.filter((c) => isThisMonth(c.createdAt))
  const resolved = cases.filter((c) => c.status === 'Resuelto' && isThisMonth(lastAt(c, 'Resuelto')))
  const changes = cases.flatMap((c) => c.history.slice(1)).filter((h) => isThisMonth(h.at)).length
  const topBarrio = countBy(created, (c) => c.barrio)[0]

  return (
    <div>
      <PageHeader title="Borrador de informe mensual" subtitle={`Informe de ${month}`}>
        <Badge tone="warn" className="!px-3 !py-1 !text-sm"><Icon name="alert" className="size-4" /> Próxima etapa (no implementado)</Badge>
      </PageHeader>

      <Notice icon="info" tone="warn" title="Esta pantalla todavía no funciona" className="mb-4">
        En la próxima etapa, el borrador lo va a generar un LLM con los datos del mes (casos, estados y tiempos).
        El municipio lo revisa, lo corrige y lo aprueba antes de publicarlo: nada se publica sin revisión humana.
      </Notice>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardTitle>Borrador</CardTitle>
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-surface-2 p-6 text-center text-muted">
            <Icon name="file" className="size-10" />
            <p className="max-w-sm">Acá va a aparecer el borrador para revisar y editar. Todavía no hay ningún texto generado.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled><Icon name="cpu" className="size-4" /> Generar borrador</Button>
            <Button variant="secondary" disabled><Icon name="pencil" className="size-4" /> Editar</Button>
            <Button variant="success" disabled><Icon name="check" className="size-4" /> Aprobar y publicar</Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>Datos que usaría</CardTitle>
            <dl className="space-y-2 text-sm">
              <Row label="Casos nuevos este mes" value={created.length} />
              <Row label="Resueltos este mes" value={resolved.length} />
              <Row label="Cambios de estado este mes" value={changes} />
              <Row label="Casos abiertos hoy" value={cases.filter((c) => c.status !== 'Resuelto').length} />
              <Row label="Resolución promedio" value={formatDays(avgResolutionDays(cases).days)} />
              <Row label="Barrio con más casos nuevos" value={topBarrio ? `${topBarrio.label} (${topBarrio.value})` : '—'} />
            </dl>
            <p className="mt-3 text-xs text-muted">Calculados en vivo con los datos de prueba.</p>
          </Card>

          <Card>
            <CardTitle>Cómo va a funcionar</CardTitle>
            <ol className="space-y-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-navy dark:text-navy-200">
                    <Icon name={s.icon} className="size-4" />
                  </span>
                  <div className="text-sm">
                    <p className="font-bold">{i + 1}. {s.title}</p>
                    <p className="text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-bold tabular-nums">{value}</dd>
    </div>
  )
}
