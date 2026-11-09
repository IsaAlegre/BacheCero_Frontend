import { NavLink } from 'react-router-dom'
import { FAQ, NEWS } from '../../data/news'
import { Card, Icon, SimBadge } from '../../components/ui'
import { formatDay } from '../../lib/format'

const TABS = [
  { to: '/vecino/novedades', label: 'Novedades' },
  { to: '/vecino/ayuda', label: 'Preguntas frecuentes' },
]

// Dos pestañas (cada una con su ruta, así la barra inferior marca la correcta).
export default function News({ tab = 'novedades' }) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">{tab === 'faq' ? 'Ayuda' : 'Novedades'}</h1>
      <nav aria-label="Secciones" className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1 lg:max-w-md">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to}
            className={({ isActive }) => `flex min-h-11 items-center justify-center rounded-xl px-2 text-center text-sm font-bold transition ${
              isActive ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>

      {tab === 'faq' ? (
        <div className="max-w-3xl space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-line bg-surface shadow-sm">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{f.q}</span>
                <Icon name="chevronDown" className="size-5 text-muted transition group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-4 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="lg:col-span-2"><SimBadge>Contenido de ejemplo</SimBadge></div>
          {NEWS.map((n) => (
            <Card key={n.id} as="article">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <span className="grid size-8 place-items-center rounded-lg bg-orange/15 text-orange-dark dark:text-orange">
                  <Icon name={n.icon} className="size-4" />
                </span>
                {n.tag} · {formatDay(n.at)}
              </div>
              <h2 className="mt-2 text-lg font-bold leading-snug">{n.title}</h2>
              <p className="mt-1 text-sm text-muted">{n.text}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
