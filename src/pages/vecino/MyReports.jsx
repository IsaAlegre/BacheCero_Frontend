import { Link } from 'react-router-dom'
import { listMyReports, useLive } from '../../api'
import { Badge, Button, Card, Icon, Spinner, StatusBadge } from '../../components/ui'
import { formatDate } from '../../lib/format'
import PageTitle from './PageTitle'
import { reportStatus } from './reportStatus'

export default function MyReports() {
  const mine = useLive(listMyReports)
  if (!mine) return <Spinner />

  return (
    <div>
      <PageTitle subtitle="Tocá un reporte para ver en qué etapa está.">Mis reportes</PageTitle>
      {mine.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <Icon name="clipboard" className="size-10 text-muted" />
          <p>Todavía no reportaste nada.</p>
          <Button to="/vecino/reportar" variant="action">Reportar un bache</Button>
        </Card>
      )}
      <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {mine.map((r) => {
          const st = reportStatus(r)
          return (
            <li key={r.id}>
              <Link to={`/vecino/mis-reportes/${r.id}`} className="block rounded-2xl">
                <Card className="flex items-center gap-3 transition hover:border-navy-300">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-full ${st.circle}`}>
                    <Icon name={st.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono font-bold">#{r.id}</span>
                      {st.status ? <StatusBadge status={st.status} /> : <Badge tone="warn">{st.label}</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-sm">{r.case?.street}</p>
                    <p className="text-xs text-muted">{formatDate(r.createdAt)}{r.source === 'simulado' ? ' · simulado' : ''}</p>
                  </div>
                  <Icon name="chevronRight" className="size-5 text-muted" />
                </Card>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
