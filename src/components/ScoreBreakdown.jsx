import { DUPLICATE_RADIUS_M } from '../config'
import { SimBadge } from './ui'

const DETAIL = {
  gravedad: (c) => `${c.typeLabel} · ${c.severity ?? 'sin dato'} (regla por tamaño en la foto, sin validar)`,
  jerarquia: (c) => `${c.hierarchyLabel} · ${c.street}`,
  reportes: (c) => `${c.reportCount} reporte(s) agrupado(s) por cercanía (radio de ${DUPLICATE_RADIUS_M} m)`,
  social: (c) => c.socialKnown === false
    ? `${c.barrio}: sin índice cargado, se usa el valor neutro (${Math.round(c.socialIndex * 100)} / 100)`
    : `Índice de ${c.barrio}: ${Math.round(c.socialIndex * 100)} / 100`,
}
const SIMULATED = { social: true }
const COLOR = { gravedad: 'bg-prio-alta', jerarquia: 'bg-navy-500 dark:bg-navy-300', reportes: 'bg-orange', social: 'bg-st-programado' }

export default function ScoreBreakdown({ c }) {
  return (
    <div className="space-y-4">
      {c.score.parts.map((p) => (
        <div key={p.key}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
            <span className="flex items-center gap-2 font-semibold">
              {p.label} {SIMULATED[p.key] && <SimBadge />}
            </span>
            <b className="tabular-nums">{p.points.toFixed(1)} / {p.max.toFixed(0)} pts</b>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2" role="img"
            aria-label={`${p.label}: ${Math.round(p.value * 100)} %`}>
            <div className={`h-full rounded-full ${COLOR[p.key]}`} style={{ width: `${p.value * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">{DETAIL[p.key](c)}</p>
        </div>
      ))}
      <p className="border-t border-line pt-3 text-sm">
        Puntaje total: <b className="tabular-nums">{c.score.total} / 100</b>
      </p>
    </div>
  )
}
