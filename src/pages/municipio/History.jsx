import { Link } from 'react-router-dom'
import { listCases, useLive } from '../../api'
import { Card, Spinner, StatusBadge } from '../../components/ui'
import { formatDate } from '../../lib/format'
import PageHeader from './PageHeader'

// Todos los cambios de estado de todos los casos, del más nuevo al más viejo.
export default function History() {
  const cases = useLive(() => listCases({ includeResolved: true }))
  if (!cases) return <Spinner />

  const events = cases
    .flatMap((c) => c.history.map((h, i) => ({ ...h, c, prev: c.history[i - 1]?.status ?? null, key: `${c.id}-${i}` })))
    .sort((a, b) => b.at - a.at)

  return (
    <div>
      <PageHeader title="Historial" subtitle={`${events.length} cambios de estado registrados.`} />

      <ul className="space-y-3 md:hidden">
        {events.map((e) => (
          <li key={e.key}>
            <Card className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to={`/municipio/tickets/${e.c.id}`} className="font-mono font-bold text-navy dark:text-navy-200">#{e.c.id}</Link>
                <span className="text-xs text-muted">{formatDate(e.at)}</span>
              </div>
              <p className="text-sm font-semibold">{e.c.street} · {e.c.barrio}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {e.prev ? <><StatusBadge status={e.prev} /> →</> : <span className="text-muted">Creado como</span>}
                <StatusBadge status={e.status} />
              </div>
              <p className="text-xs text-muted">Por {e.by}</p>
            </Card>
          </li>
        ))}
      </ul>

      <Card padded={false} className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-3 py-3">Fecha</th>
              <th scope="col" className="px-3 py-3">Ticket</th>
              <th scope="col" className="px-3 py-3">Calle</th>
              <th scope="col" className="px-3 py-3">Cambio</th>
              <th scope="col" className="px-3 py-3">Quién</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {events.map((e) => (
              <tr key={e.key} className="hover:bg-surface-2">
                <td className="whitespace-nowrap px-3 py-2.5 text-muted">{formatDate(e.at)}</td>
                <td className="px-3 py-2.5">
                  <Link to={`/municipio/tickets/${e.c.id}`} className="font-mono font-bold text-navy hover:underline dark:text-navy-200">#{e.c.id}</Link>
                </td>
                <td className="px-3 py-2.5">{e.c.street} <span className="text-muted">· {e.c.barrio}</span></td>
                <td className="px-3 py-2.5">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {e.prev ? <><StatusBadge status={e.prev} /> →</> : <span className="text-muted">Creado como</span>}
                    <StatusBadge status={e.status} />
                  </span>
                </td>
                <td className="px-3 py-2.5">{e.by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
