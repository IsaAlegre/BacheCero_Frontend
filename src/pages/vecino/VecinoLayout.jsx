import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '../../api'
import { Brand } from '../../components/Logo'
import { Icon, ThemeToggle } from '../../components/ui'

const NAV = [
  { to: '/vecino', icon: 'home', label: 'Inicio', end: true },
  { to: '/vecino/reportar', icon: 'camera', label: 'Reportar' },
  { to: '/vecino/mis-reportes', icon: 'clipboard', label: 'Mis reportes' },
  { to: '/vecino/novedades', icon: 'bell', label: 'Novedades' },
  { to: '/vecino/ayuda', icon: 'help', label: 'Ayuda' },
]

// Celular primero: columna de 480 px con barra de navegación inferior.
// Escritorio (≥1024 px): ancho completo, navegación en el encabezado y contenido centrado (1280 px, 1400 px en monitores grandes).
export default function VecinoLayout() {
  const nav = useNavigate()
  return (
    <div className="min-h-dvh bg-navy-100/60 lg:bg-canvas dark:bg-black/40 lg:dark:bg-canvas">
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-canvas sm:shadow-xl lg:max-w-none lg:shadow-none">
        <header className="sticky top-0 z-20 bg-navy pt-[env(safe-area-inset-top)] text-white dark:bg-navy-950">
          <div className="flex items-center justify-between gap-4 px-3 py-1.5 lg:mx-auto lg:w-full lg:max-w-[1280px] lg:px-8 2xl:max-w-[1400px]">
            <Link to="/vecino" className="shrink-0 rounded-lg"><Brand subtitle="Posadas" /></Link>
            <nav aria-label="Navegación principal" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {NAV.map((n) => (
                  <li key={n.to}>
                    <NavLink to={n.to} end={n.end}
                      className={({ isActive }) => `flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${
                        isActive ? 'bg-white text-navy dark:bg-navy-700 dark:text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'}`}>
                      <Icon name={n.icon} className="size-4" /> {n.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex shrink-0 items-center">
              <ThemeToggle className="hover:bg-white/10" />
              <button type="button" aria-label="Cerrar sesión" title="Cerrar sesión"
                className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-white/10"
                onClick={async () => { await logout('vecino'); nav('/vecino/login') }}>
                <Icon name="logout" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 lg:mx-auto lg:w-full lg:max-w-[1280px] lg:px-8 lg:pb-12 lg:pt-8 2xl:max-w-[1400px]">
          <Outlet />
        </main>

        <nav aria-label="Navegación principal"
          className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t lg:hidden border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <ul className="grid grid-cols-5">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end}
                  className={({ isActive }) =>
                    `flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold leading-tight transition-colors ${
                      isActive ? 'text-navy dark:text-orange' : 'text-muted hover:text-ink'}`}>
                  {({ isActive }) => (
                    <>
                      <span className={`grid h-7 w-12 place-items-center rounded-full ${isActive ? 'bg-navy-50 dark:bg-orange/15' : ''}`}>
                        <Icon name={n.icon} className="size-5" />
                      </span>
                      <span className="text-center">{n.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
