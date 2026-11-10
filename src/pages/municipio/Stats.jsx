import { getStats, listCases, STATUS_FROM, useLive } from '../../api'
import { CLASS_LABELS } from '../../config'
import { Donut, HBars, StackedBar } from '../../components/Charts'
import { Card, CardTitle, Icon, Spinner } from '../../components/ui'
import { avgStageDays, countBy, formatDays } from '../../lib/stats'
import PageHeader from './PageHeader'

const STATUS_COLOR = {
  Pendiente: 'bg-st-pendiente', Programado: 'bg-st-programado', 'En reparación': 'bg-st-reparacion', Resuelto: 'bg-st-resuelto',
}
const TYPE_COLOR = {
  [CLASS_LABELS.pothole]: ['bg-navy dark:bg-navy-300', 'stroke-navy dark:stroke-navy-300'],
  [CLASS_LABELS.longitudinal_crack]: ['bg-orange', 'stroke-orange'],
  [CLASS_LABELS.transverse_crack]: ['bg-st-programado', 'stroke-st-programado'],
  [CLASS_LABELS.alligator_crack]: ['bg-prio-baja', 'stroke-prio-baja'],
}

export default function Stats() {
  const stats = useLive(getStats)
  const cases = useLive(() => listCases({ includeResolved: true }))
  if (!stats || !cases) return <Spinner />

  const { resumen, tiempoResolucion, zonas } = stats
  const statuses = resumen.porEstado.map((s) => {
    const label = STATUS_FROM[s.codigo] ?? s.nombre
    return { label, value: s.cantidad, color: STATUS_COLOR[label] }
  })
  const open = resumen.abiertos
  const resolved = resumen.resueltos
  const resolutionDays = tiempoResolucion.promedioHoras == null ? null : tiempoResolucion.promedioHoras / 24
  const stages = avgStageDays(cases)
  const barrios = zonas.items.map((z) => ({ label: z.barrio, value: z.total }))
  if (zonas.sinBarrio) barrios.push({ label: 'Sin barrio', value: zonas.sinBarrio })
  const typeCounts = countBy(cases, (c) => c.typeLabel)
  const types = Object.values(CLASS_LABELS).map((label) => ({
    label,
    value: typeCounts.find((t) => t.label === label)?.value || 0,
    color: TYPE_COLOR[label][0],
    stroke: TYPE_COLOR[label][1],
  }))

  return (
    <div>
      <PageHeader title="Estadísticas" subtitle="Calculadas en vivo por el backend con todos los tickets." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon="clock" label="Casos abiertos" value={open} />
        <Kpi icon="checkCircle" label="Casos resueltos" value={resolved} />
        <Kpi icon="eye" label="Esperan revisión" value={resumen.necesitanRevision} />
        <Kpi icon="history" label="Resolución promedio" value={formatDays(resolutionDays)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Pendientes vs. Resueltos</CardTitle>
          <p className="mb-3 text-sm text-muted">
            <b className="text-ink">{open}</b> abiertos y <b className="text-ink">{resolved}</b> resueltos de {resumen.total} casos.
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
          <p className="text-4xl font-extrabold tabular-nums">{formatDays(resolutionDays)}</p>
          <p className="mb-4 text-sm text-muted">
            Desde que se crea el caso hasta que se marca Resuelto · {tiempoResolucion.muestra} caso(s) resuelto(s)
            {tiempoResolucion.medianaHoras != null && ` · mediana ${formatDays(tiempoResolucion.medianaHoras / 24)}`}.
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
