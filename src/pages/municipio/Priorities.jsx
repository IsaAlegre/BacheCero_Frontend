import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { listReviewQueue, useLive } from '../../api'
import { STATUSES, LEVELS } from '../../config'
import { resolvedThisMonth } from '../../lib/stats'
import PriorityMap from '../../components/PriorityMap'
import WeightsPanel from '../../components/WeightsPanel'
import { Card, Icon, Input, PriorityBadge, Spinner, StatusBadge } from '../../components/ui'
import CaseDetail from './CaseDetail'
import PageHeader from './PageHeader'
import { useRanked } from './useRanked'

const OPEN = 'abiertos'
const ALL = ''

export default function Priorities() {
  const { weights, setWeights } = useOutletContext()
  const ranked = useRanked()
  const queue = useLive(listReviewQueue) || []
  const [selectedId, setSelectedId] = useState(null)
  const [f, setF] = useState({ barrio: ALL, street: ALL, status: OPEN })

  const options = useMemo(() => {
    const all = ranked || []
    const uniq = (xs) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'es'))
    return {
      barrios: uniq(all.map((c) => c.barrio)),
      streets: uniq(all.filter((c) => !f.barrio || c.barrio === f.barrio).map((c) => c.street)),
    }
  }, [ranked, f.barrio])

  if (!ranked) return <Spinner />

  const open = ranked.filter((c) => c.status !== 'Resuelto')
  const visible = ranked.filter((c) =>
    (!f.barrio || c.barrio === f.barrio) &&
    (!f.street || c.street === f.street) &&
    (f.status === ALL || (f.status === OPEN ? c.status !== 'Resuelto' : c.status === f.status)))
  const selected = ranked.find((c) => c.id === selectedId)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value, ...(k === 'barrio' ? { street: ALL } : {}) }))
  const filtered = f.barrio || f.street || f.status !== OPEN

  return (
    <div>
      <PageHeader title="Mapa de prioridades" subtitle="Casos ordenados por puntaje. Tocá uno para ver por qué está en ese puesto." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon="clock" label="Pendientes" value={open.filter((c) => c.status === 'Pendiente').length} tone="text-st-pendiente" />
        <Kpi icon="alert" label="Prioridad alta" value={open.filter((c) => c.level === 'alta').length} tone="text-prio-alta" />
        <Kpi icon="scan" label="En revisión" value={queue.length} tone="text-orange-dark dark:text-orange" />
        <Kpi icon="checkCircle" label="Resueltos este mes" value={resolvedThisMonth(ranked)} tone="text-st-resuelto" />
      </div>

      <Card className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <Input as="select" label="Barrio" value={f.barrio} onChange={set('barrio')}>
          <option value={ALL}>Todos los barrios</option>
          {options.barrios.map((b) => <option key={b}>{b}</option>)}
        </Input>
        <Input as="select" label="Calle" value={f.street} onChange={set('street')}>
          <option value={ALL}>Todas las calles</option>
          {options.streets.map((s) => <option key={s}>{s}</option>)}
        </Input>
        <Input as="select" label="Estado" value={f.status} onChange={set('status')}>
          <option value={OPEN}>Abiertos (sin resolver)</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
          <option value={ALL}>Todos</option>
        </Input>
        <button type="button" disabled={!filtered} onClick={() => setF({ barrio: ALL, street: ALL, status: OPEN })}
          className="min-h-11 rounded-xl px-3 text-sm font-semibold text-navy hover:bg-surface-2 disabled:opacity-40 dark:text-navy-200">
          Limpiar filtros
        </button>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-4">
          <Card padded={false} className="overflow-hidden">
            <PriorityMap cases={visible} selectedId={selectedId} onSelect={setSelectedId}
              className="h-72 w-full md:h-[420px] lg:h-[560px]" />
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-sm">
              {Object.entries(LEVELS).map(([k, l]) => (
                <span key={k} className="flex items-center gap-1.5">
                  <i className="size-3 rounded-full" style={{ background: l.color }} /> {l.label}
                </span>
              ))}
              <span className="flex items-center gap-1.5"><i className="size-3 rounded-full bg-st-resuelto" /> Resuelto</span>
              <span className="text-muted">· Tamaño = cantidad de reportes</span>
            </div>
          </Card>
          <div className="hidden lg:block"><WeightsPanel weights={weights} onChange={setWeights} /></div>
        </div>

        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto">
          {selected ? (
            <Card className="lg:border-navy-300">
              <CaseDetail c={selected} overlay onBack={() => setSelectedId(null)} backLabel="Volver a la lista" />
            </Card>
          ) : (
            <Card padded={false}>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="font-bold">Lista priorizada</h2>
                <span className="text-sm text-muted">{visible.length} caso(s)</span>
              </div>
              {visible.length === 0 && <p className="p-4 text-sm text-muted">No hay casos con esos filtros.</p>}
              <ul className="divide-y divide-line">
                {visible.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => setSelectedId(c.id)}
                      className="flex w-full items-start gap-3 border-l-4 px-4 py-3 text-left transition hover:bg-surface-2"
                      style={{ borderLeftColor: c.status === 'Resuelto' ? 'var(--color-st-resuelto)' : LEVELS[c.level].color }}>
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-extrabold tabular-nums">
                        {c.rank ?? '–'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-mono text-sm font-bold">#{c.id}</span>
                          <span className="text-sm font-bold tabular-nums">{c.score.total}/100</span>
                          <PriorityBadge level={c.level} />
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-semibold">{c.street} · {c.barrio}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                          <span>{c.typeLabel} {c.severity}</span>
                          <span className="inline-flex items-center gap-1"><Icon name="layers" className="size-3.5" />{c.reportCount} reporte(s)</span>
                          <StatusBadge status={c.status} />
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="lg:hidden"><WeightsPanel weights={weights} onChange={setWeights} /></div>
      </div>
    </div>
  )
}

function Kpi({ icon, label, value, tone }) {
  return (
    <Card className="flex items-center gap-3">
      <span className={`hidden size-11 place-items-center rounded-xl bg-surface-2 sm:grid ${tone}`}><Icon name={icon} /></span>
      <span>
        <span className={`block text-2xl font-extrabold tabular-nums lg:text-3xl ${tone}`}>{value}</span>
        <span className="block text-sm text-muted">{label}</span>
      </span>
    </Card>
  )
}
