// Gráficos simples en SVG/HTML propio: se adaptan al ancho del contenedor y
// toman los colores del tema (sirven en modo claro y oscuro).

// Barras horizontales. data: [{ label, value, color? (clase bg-*) }]
export function HBars({ data, format = (v) => v, color = 'bg-navy dark:bg-navy-300' }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <span className="font-semibold">{d.label}</span>
            <span className="tabular-nums text-muted">{format(d.value)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-2">
            <div className={`h-full rounded-full ${d.color || color}`} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// Barra apilada al 100 %. data: [{ label, value, color (clase bg-*) }]
export function StackedBar({ data }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1
  return (
    <div>
      <div className="flex h-8 w-full overflow-hidden rounded-xl bg-surface-2" role="img"
        aria-label={data.map((d) => `${d.label}: ${d.value}`).join(', ')}>
        {data.filter((d) => d.value).map((d) => (
          <div key={d.label} className={`${d.color} h-full border-r-2 border-surface last:border-r-0`} style={{ width: `${(d.value / total) * 100}%` }} />
        ))}
      </div>
      <Legend data={data} className="mt-3" />
    </div>
  )
}

// Dona. data: [{ label, value, stroke (clase stroke-*), color (clase bg-*) }]
export function Donut({ data, centerLabel }) {
  const total = data.reduce((a, d) => a + d.value, 0)
  let offset = 25 // empieza arriba
  return (
    <div className="@container">
      <div className="flex flex-col items-center gap-5 @md:flex-row">
        <svg viewBox="0 0 42 42" className="w-full max-w-48 shrink-0 @md:max-w-40" role="img"
          aria-label={data.map((d) => `${d.label}: ${d.value}`).join(', ')}>
          <circle cx="21" cy="21" r="15.915" fill="none" strokeWidth="6" className="stroke-[var(--surface-2)]" />
          {data.filter((d) => d.value).map((d) => {
            const pct = (d.value / (total || 1)) * 100
            const el = (
              <circle key={d.label} cx="21" cy="21" r="15.915" fill="none" strokeWidth="6"
                className={d.stroke} strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} />
            )
            offset -= pct
            return el
          })}
          <text x="21" y="21" textAnchor="middle" className="fill-[var(--ink)] text-[8px] font-extrabold">{total}</text>
          <text x="21" y="26.5" textAnchor="middle" className="fill-[var(--muted)] text-[3px] font-semibold">{centerLabel}</text>
        </svg>
        <Legend data={data} total={total} vertical />
      </div>
    </div>
  )
}

function Legend({ data, total, vertical = false, className = '' }) {
  return (
    <ul className={`flex gap-x-4 gap-y-2 text-sm ${vertical ? 'w-full flex-col' : 'flex-wrap'} ${className}`}>
      {data.map((d) => (
        <li key={d.label} className="flex min-w-0 items-center gap-2">
          <i className={`size-3 shrink-0 rounded-full ${d.color}`} />
          <span className="min-w-0 flex-1">{d.label}</span>
          <b className="tabular-nums">{d.value}</b>
          {total ? <span className="w-10 text-right tabular-nums text-muted">{Math.round((d.value / total) * 100)} %</span> : null}
        </li>
      ))}
    </ul>
  )
}
