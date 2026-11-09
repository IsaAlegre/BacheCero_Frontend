import { DEFAULT_WEIGHTS, WEIGHT_LABELS } from '../config'
import { Card, CardTitle, Icon } from './ui'

export default function WeightsPanel({ weights, onChange }) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1
  return (
    <Card>
      <CardTitle action={
        <button type="button" onClick={() => onChange(DEFAULT_WEIGHTS)}
          className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-navy hover:underline dark:text-navy-200">
          Restablecer
        </button>
      }>
        <span className="flex items-center gap-2"><Icon name="sliders" className="size-4" /> Pesos del puntaje</span>
      </CardTitle>
      <div className="space-y-3">
        {Object.keys(weights).map((k) => (
          <label key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <span className="text-sm font-semibold">{WEIGHT_LABELS[k]}</span>
            <b className="w-12 text-right text-sm tabular-nums">{Math.round((weights[k] * 100) / total)} %</b>
            <input type="range" min="0" max="100" value={weights[k]}
              onChange={(e) => onChange({ ...weights, [k]: Number(e.target.value) })}
              className="col-span-2 h-6 w-full cursor-pointer accent-orange" />
          </label>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">El municipio decide cuánto pesa cada criterio. La lista se reordena en vivo.</p>
    </Card>
  )
}
