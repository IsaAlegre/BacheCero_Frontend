import { Link } from 'react-router-dom'
import { listMyReports, useLive, useSession } from '../../api'
import { NEWS } from '../../data/news'
import { Card, CardTitle, Icon, SimBadge } from '../../components/ui'
import InstallButton from './InstallButton'
import AppQr from './AppQr'

export default function Home() {
  const session = useSession('vecino')
  const mine = useLive(listMyReports) || []
  const resolved = mine.filter((r) => r.case?.status === 'Resuelto').length
  const firstName = session?.nombre?.split(' ')[0] || 'vecino'

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-8">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Hola, {firstName} 👋</h1>
          <p className="mt-1 text-muted">¿Viste un bache? Reportalo en menos de un minuto.</p>
        </div>

        <Link to="/vecino/reportar"
          className="flex min-h-32 items-center gap-4 rounded-3xl bg-orange p-5 text-navy-950 shadow-lg shadow-orange/25 transition hover:bg-orange-dark active:scale-[0.99]">
          <span className="grid size-16 place-items-center rounded-2xl bg-white/35">
            <Icon name="camera" className="size-8" />
          </span>
          <span className="flex-1">
            <span className="block text-xl font-extrabold">Reportar un bache</span>
            <span className="block text-sm font-medium">Sacá una foto y listo</span>
          </span>
          <Icon name="chevronRight" className="size-6" />
        </Link>

        <Link to="/vecino/mis-reportes" className="block rounded-2xl">
          <Card className="flex items-center gap-4 transition hover:border-navy-300">
            <span className="grid size-12 place-items-center rounded-xl bg-navy-50 text-navy dark:bg-navy-500/25 dark:text-navy-100">
              <Icon name="clipboard" />
            </span>
            <span className="flex-1">
              <span className="block font-bold">Mis reportes</span>
              <span className="block text-sm text-muted">
                {mine.length === 0 ? 'Todavía no reportaste nada' : `${mine.length - resolved} en curso · ${resolved} resuelto${resolved === 1 ? '' : 's'}`}
              </span>
            </span>
            <span className="grid min-w-11 place-items-center rounded-full bg-navy px-3 py-1 text-lg font-extrabold text-white dark:bg-navy-300 dark:text-navy-950">
              {mine.length}
            </span>
          </Card>
        </Link>

        {/* La PWA es para el celular: en escritorio se ofrece el QR. */}
        <div className="lg:hidden"><InstallButton /></div>
        <div className="hidden lg:block"><AppQr /></div>
      </div>

      <section>
        <CardTitle action={<Link to="/vecino/novedades" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy dark:text-navy-200">Ver todas</Link>}>
          Novedades del municipio
        </CardTitle>
        <div className="space-y-3">
          {NEWS.map((n, i) => (
            <Card key={n.id} className={`gap-3 ${i < 2 ? 'flex' : 'hidden lg:flex'}`}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange/15 text-orange-dark dark:text-orange">
                <Icon name={n.icon} />
              </span>
              <div className="min-w-0">
                <p className="font-bold leading-snug">{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">{n.text}</p>
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted"><SimBadge>Contenido de ejemplo</SimBadge></p>
      </section>
    </div>
  )
}
