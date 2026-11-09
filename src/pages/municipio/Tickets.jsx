import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SEVERITY_ORDER, STATUSES } from '../../config'
import { Card, Icon, Input, PriorityBadge, Spinner, StatusBadge } from '../../components/ui'
import { formatDay } from '../../lib/format'
import PageHeader from './PageHeader'
import { useRanked } from './useRanked'

const COLS = [
  { key: 'id', label: 'Ticket', get: (c) => c.id },
  { key: 'street', label: 'Calle', get: (c) => c.street },
  { key: 'barrio', label: 'Barrio', get: (c) => c.barrio },
  { key: 'type', label: 'Tipo', get: (c) => c.typeLabel },
  { key: 'severity', label: 'Gravedad', get: (c) => SEVERITY_ORDER.indexOf(c.severity) },
  { key: 'score', label: 'Puntaje', get: (c) => c.score.total },
  { key: 'status', label: 'Estado', get: (c) => STATUSES.indexOf(c.status) },
  { key: 'date', label: 'Fecha', get: (c) => c.createdAt },
]

export default function Tickets() {
  const ranked = useRanked()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: 'score', dir: 'desc' })

  const rows = useMemo(() => {
    if (!ranked) return []
    const needle = q.trim().toLowerCase()
    const col = COLS.find((c) => c.key === sort.key)
    return ranked
      .filter((c) => !needle || [c.id, c.street, c.barrio, c.typeLabel, c.status].some((v) => String(v).toLowerCase().includes(needle)))
      .sort((a, b) => {
        const x = col.get(a), y = col.get(b)
        const r = typeof x === 'string' ? x.localeCompare(y, 'es') : x - y
        return sort.dir === 'asc' ? r : -r
      })
  }, [ranked, q, sort])

  if (!ranked) return <Spinner />
  const toggle = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))

  return (
    <div>
      <PageHeader title="Tickets" subtitle={`${ranked.length} casos en total, incluidos los resueltos.`}>
        <div className="relative w-full sm:w-72">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input type="search" aria-label="Buscar tickets" placeholder="Buscar por calle, barrio, tipo…"
            value={q} onChange={(e) => setQ(e.target.value)} className="[&_input]:pl-9" />
        </div>
      </PageHeader>

      {/* Celular: tarjetas apiladas */}
      <div className="md:hidden">
        <label className="mb-3 flex items-center gap-2 text-sm">
          <span className="font-semibold">Ordenar por</span>
          <select value={`${sort.key}:${sort.dir}`} onChange={(e) => { const [key, dir] = e.target.value.split(':'); setSort({ key, dir }) }}
            className="h-11 flex-1 rounded-xl border border-line bg-surface px-3">
            <option value="score:desc">Puntaje (mayor primero)</option>
            <option value="date:desc">Fecha (más nuevo)</option>
            <option value="date:asc">Fecha (más viejo)</option>
            <option value="severity:desc">Gravedad</option>
            <option value="street:asc">Calle (A-Z)</option>
          </select>
        </label>
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id}>
              <Link to={`/municipio/tickets/${c.id}`} className="block rounded-2xl">
                <Card className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-bold">#{c.id}</span>
                    <PriorityBadge level={c.level} score={c.score.total} />
                  </div>
                  <p className="font-semibold">{c.street} · {c.barrio}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    {c.typeLabel} · {c.severity} · {formatDay(c.createdAt)} <StatusBadge status={c.status} />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Tablet y escritorio: tabla */}
      <Card padded={false} className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
            <tr>
              {COLS.map((col) => (
                <th key={col.key} scope="col" className={`px-3 py-1 font-semibold ${col.key === 'barrio' || col.key === 'severity' ? 'max-xl:hidden' : ''}`}
                  aria-sort={sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" onClick={() => toggle(col.key)}
                    className="inline-flex min-h-10 items-center gap-1 whitespace-nowrap rounded hover:text-ink">
                    {col.label}
                    <Icon name={sort.key === col.key ? 'chevronDown' : 'sort'}
                      className={`size-3.5 ${sort.key === col.key && sort.dir === 'asc' ? 'rotate-180' : ''} ${sort.key === col.key ? '' : 'opacity-50'}`} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((c) => (
              <tr key={c.id} onClick={() => nav(`/municipio/tickets/${c.id}`)} className="cursor-pointer hover:bg-surface-2">
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Link to={`/municipio/tickets/${c.id}`} className="font-mono font-bold text-navy hover:underline dark:text-navy-200"
                    onClick={(e) => e.stopPropagation()}>#{c.id}</Link>
                </td>
                <td className="px-3 py-2.5 font-semibold">
                  {c.street}
                  <span className="block text-xs font-normal text-muted xl:hidden">{c.barrio}</span>
                </td>
                <td className="px-3 py-2.5 max-xl:hidden">{c.barrio}</td>
                <td className="px-3 py-2.5">
                  {c.typeLabel}
                  <span className="block text-xs text-muted xl:hidden">{c.severity}</span>
                </td>
                <td className="px-3 py-2.5 max-xl:hidden">{c.severity}</td>
                <td className="whitespace-nowrap px-3 py-2.5"><PriorityBadge level={c.level} score={c.score.total} /></td>
                <td className="whitespace-nowrap px-3 py-2.5"><StatusBadge status={c.status} /></td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted">{formatDay(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-muted">No hay tickets que coincidan con “{q}”.</p>}
      </Card>
      {rows.length === 0 && <p className="text-sm text-muted md:hidden">No hay tickets que coincidan con “{q}”.</p>}
    </div>
  )
}
