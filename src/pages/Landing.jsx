import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { Icon, ThemeToggle } from '../components/ui'

const ROLES = [
  { to: '/vecino', icon: 'camera', title: 'Soy vecino', text: 'Reportá un bache con una foto y seguí su reparación.' },
  { to: '/municipio', icon: 'building', title: 'Soy del municipio', text: 'Mapa de prioridades, revisión y gestión de casos.' },
]

export default function Landing() {
  return (
    <div className="flex min-h-dvh flex-col bg-navy text-white dark:bg-navy-950">
      <div className="flex justify-end p-3"><ThemeToggle className="hover:bg-white/10" /></div>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 pb-12 text-center">
        <Logo className="size-20 shadow-lg ring-4 ring-white/15" />
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">Bache Cero</h1>
        <p className="mt-2 max-w-md text-navy-100">
          Reportes ciudadanos de baches en Posadas, priorizados con IA y revisados por personas.
        </p>
        <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <Link key={r.to} to={r.to}
              className="group flex items-center gap-4 rounded-2xl bg-white p-5 text-left text-ink shadow-lg transition hover:-translate-y-0.5 dark:bg-surface sm:flex-col sm:items-start">
              <span className="grid size-14 place-items-center rounded-2xl bg-orange text-navy-950">
                <Icon name={r.icon} className="size-7" />
              </span>
              <span className="flex-1">
                <span className="block text-xl font-bold">{r.title}</span>
                <span className="mt-1 block text-sm text-muted">{r.text}</span>
              </span>
              <Icon name="chevronRight" className="size-5 text-muted sm:hidden" />
            </Link>
          ))}
        </div>
        <p className="mt-10 text-xs text-navy-200">Demo · Hackathon “IA en Acción” · Posadas, Misiones</p>
      </main>
    </div>
  )
}
