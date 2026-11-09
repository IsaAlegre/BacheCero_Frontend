import { listCases, useLive } from '../../api'
import { CLASS_LABELS } from '../../config'
import { Donut, HBars, StackedBar } from '../../components/Charts'
import { Card, CardTitle, Icon, Spinner } from '../../components/ui'
import { avgResolutionDays, avgStageDays, byStatus, countBy, formatDays } from '../../lib/stats'
import PageHeader from './PageHeader'

const STATUS_COLOR = {
  Pendiente: 'bg-st-pendiente', Programado: 'bg-st-programado', 'En reparación': 'bg-st-reparacion', Resuelto: 'bg-st-resuelto',
}
// Un color por clase del modelo (CLASS_LABELS). "—": casos sin tipo confirmado.
const TYPE_COLOR = {
  [CLASS_LABELS.pothole]: ['bg-navy dark:bg-navy-300', 'stroke-navy dark:stroke-navy-300'],
  [CLASS_LABELS.longitudinal_crack]: ['bg-orange', 'stroke-orange'],
  [CLASS_LABELS.transverse_crack]: ['bg-st-programado', 'stroke-st-programado'],
  [CLASS_LABELS.alligator_crack]: ['bg-prio-baja', 'stroke-prio-baja'],
}

// Todo se calcula con listCases() y el historial de cada caso.
export default function Stats() {
  const cases = useLive(() => listCases({ includeResolved: true }))
  if (!cases) return <Spinner />

  const statuses = byStatus(cases).map((s) => ({ ...s, color: STATUS_COLOR[s.label] }))
  const resolved = statuses.find((s) => s.label === 'Resuelto').value
  const open = cases.length - resolved
  const reports = cases.reduce((a, c) => a + c.reportCount, 0)
  const resolution = avgResolutionDays(cases)
  const stages = avgStageDays(cases)
  const barrios = countBy(cases, (c) => c.barrio)
  // Las 4 clases siempre aparecen (aunque tengan 0) para que se vea el catálogo completo.
  const typeCounts = countBy(cases, (c) => c.typeLabel)
  const types = Object.values(CLASS_LABELS).map((label) => ({
    label,
    value: typeCounts.find((t) => t.label === label)?.value || 0,
    color: TYPE_COLOR[label][0],
    stroke: TYPE_COLOR[label][1],
  }))

  return (
    <div>
      <PageHeader title="Estadísticas" subtitle="Calculadas en vivo con los casos y su historial de estados." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon="clock" label="Casos abiertos" value={open} />
        <Kpi icon="checkCircle" label="Casos resueltos" value={resolved} />
        <Kpi icon="layers" label="Reportes confirmados" value={reports} />
        <Kpi icon="history" label="Resolución promedio" value={formatDays(resolution.days)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Pendientes vs. Resueltos</CardTitle>
          <p className="mb-3 text-sm text-muted">
            <b className="text-ink">{open}</b> abiertos y <b className="text-ink">{resolved}</b> resueltos de {cases.length} casos.
          </p>
          <StackedBar data={statuses} />
        </Card>

        <Card>
          <CardTitle>Tipos de daño</CardTitle>
          <Donut data={types} centerLabel="casos" />
        </Card>

        <Card>
          <CardTitle>Barrios con más casos</CardTitle>
          <HBars data={barrios} format={(v) => `${v} caso${v === 1 ? '' : 's'}`} />
        </Card>

        <Card>
          <CardTitle>Tiempo promedio de resolución</CardTitle>
          <p className="text-4xl font-extrabold tabular-nums">{formatDays(resolution.days)}</p>
          <p className="mb-4 text-sm text-muted">
            Desde que se crea el caso hasta que se marca Resuelto · {resolution.n} caso(s) resuelto(s).
          </p>
          <h3 className="mb-2 text-sm font-bold">Por etapa</h3>
          <HBars color="bg-orange"
            data={stages.map((s) => ({ label: `${s.label} (${s.n})`, value: s.days ?? 0 }))}
            format={(v) => formatDays(v)} />
        </Card>
      </div>
    </div>
  )
}

function Kpi({ icon, label, value }) {
  return (
    <Card className="flex items-center gap-3">
      <span className="hidden size-11 place-items-center rounded-xl bg-surface-2 text-navy sm:grid dark:text-navy-200"><Icon name={icon} /></span>
      <span>
        <span className="block text-2xl font-extrabold tabular-nums">{value}</span>
        <span className="block text-sm text-muted">{label}</span>
      </span>
    </Card>
  )
}
