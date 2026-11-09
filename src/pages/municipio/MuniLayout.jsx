import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { checkIA, getMode, setMode, listReviewQueue, logout, useLive, useSession } from '../../api'
import { DEFAULT_WEIGHTS } from '../../config'
import { resetState, useStore } from '../../lib/store'
import { toggleTheme, useTheme } from '../../lib/theme'
import { Brand } from '../../components/Logo'
import Logo from '../../components/Logo'
import { Icon, ThemeToggle } from '../../components/ui'

const NAV = [
  { to: '/municipio', icon: 'map', label: 'Mapa', end: true },
  { to: '/municipio/tickets', icon: 'ticket', label: 'Tickets' },
  { to: '/municipio/revision', icon: 'scan', label: 'Revisión humana', badge: true },
  { to: '/municipio/historial', icon: 'history', label: 'Historial' },
  { to: '/municipio/estadisticas', icon: 'chart', label: 'Estadísticas' },
  { to: '/municipio/informes', icon: 'file', label: 'Informes' },
]

// Escritorio (≥1024): barra lateral completa. Tablet (768–1023): solo íconos. Celular: drawer.
export default function MuniLayout() {
  // Los pesos viven acá para que Mapa, Tickets y el detalle usen el mismo puntaje.
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()
  useEffect(() => setDrawer(false), [location.pathname])

  return (
    <div className="min-h-dvh md:pl-20 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 bg-navy text-white md:flex lg:w-64 dark:bg-navy-950 dark:border-r dark:border-line">
        <Sidebar compact />
      </aside>

      <header className="sticky top-0 z-30 flex items-center gap-2 bg-navy px-2 py-1.5 pt-[max(0.375rem,env(safe-area-inset-top))] text-white md:hidden dark:bg-navy-950">
        <button type="button" aria-label="Abrir menú" aria-expanded={drawer} onClick={() => setDrawer(true)}
          className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-white/10">
          <Icon name="menu" />
        </button>
        <Brand subtitle="Municipio" className="flex-1" />
        <ThemeToggle className="hover:bg-white/10" />
      </header>

      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] bg-navy text-white shadow-2xl dark:bg-navy-950">
            <Sidebar onClose={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <Outlet context={{ weights, setWeights }} />
        <footer className="mt-8 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
          <Icon name="alert" className="mt-0.5 size-4" />
          <span>
            <b>Datos de prueba:</b> los reclamos previos, la jerarquía de calles y las variables sociales son SIMULADOS.
          </span>
        </footer>
      </main>
    </div>
  )
}

// compact: en tablet se ven solo los íconos (las etiquetas quedan para lectores de pantalla).
function Sidebar({ compact = false, onClose }) {
  useStore()
  const nav = useNavigate()
  const session = useSession('municipio')
  const theme = useTheme()
  const mode = getMode()
  const queue = useLive(listReviewQueue) || []
  const [iaOk, setIaOk] = useState(null)
  const hide = compact ? 'md:max-lg:sr-only' : ''

  useEffect(() => {
    const ping = () => checkIA().then(setIaOk)
    ping()
    const t = setInterval(ping, 15000)
    return () => clearInterval(t)
  }, [])

  const item = 'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors'
  const itemCompact = compact ? 'md:max-lg:justify-center md:max-lg:px-0' : ''
  const iaLabel = mode === 'offline' ? 'IA: modo sin conexión' : iaOk === null ? 'IA: verificando…' : iaOk ? 'IA en línea' : 'IA sin conexión'
  const iaColor = mode === 'offline' ? 'bg-amber-400' : iaOk === null ? 'bg-slate-400' : iaOk ? 'bg-green-400' : 'bg-red-400'

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto p-3">
      <div className={`mb-5 flex items-center justify-between gap-2 px-1 pt-1 ${compact ? 'md:max-lg:justify-center' : ''}`}>
        {compact ? (
          <>
            <Logo className="size-10 lg:hidden" />
            <Brand subtitle="Municipio de Posadas" className="max-lg:hidden" />
          </>
        ) : <Brand subtitle="Municipio de Posadas" />}
        {onClose && (
          <button type="button" aria-label="Cerrar menú" onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-white/10">
            <Icon name="x" />
          </button>
        )}
      </div>

      <nav aria-label="Secciones del panel" className="flex-1">
        <ul className="space-y-1">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} end={n.end} title={compact ? n.label : undefined}
                className={({ isActive }) => `${item} ${itemCompact} relative ${
                  isActive ? 'bg-white text-navy shadow dark:bg-navy-700 dark:text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'}`}>
                <Icon name={n.icon} />
                <span className={`flex-1 ${hide}`}>{n.label}</span>
                {n.badge && queue.length > 0 && (
                  <span aria-label={`${queue.length} pendientes`}
                    className={`grid min-w-6 place-items-center rounded-full bg-orange px-1.5 text-xs font-bold text-navy-950 ${compact ? 'md:max-lg:absolute md:max-lg:right-1 md:max-lg:top-0.5' : ''}`}>
                    {queue.length}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4 space-y-1 border-t border-white/15 pt-3 text-navy-100">
        <div className={`${item} ${itemCompact} cursor-default`} title={compact ? iaLabel : undefined} role="status">
          <span className="relative">
            <Icon name="cpu" />
            <span className={`absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-navy dark:ring-navy-950 ${iaColor}`} />
          </span>
          <span className={hide}>{iaLabel}</span>
        </div>
        <button type="button" role="switch" aria-checked={mode === 'offline'} title={compact ? 'Modo sin conexión' : undefined}
          onClick={() => setMode(mode === 'offline' ? 'live' : 'offline')}
          className={`${item} ${itemCompact} hover:bg-white/10`}>
          <Icon name="wifiOff" />
          <span className={`flex-1 text-left ${hide}`}>Modo sin conexión</span>
          <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${mode === 'offline' ? 'bg-orange' : 'bg-white/25'} ${hide}`}>
            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${mode === 'offline' ? 'left-[1.125rem]' : 'left-0.5'}`} />
          </span>
        </button>
        <button type="button" title={compact ? 'Reiniciar demo' : undefined}
          onClick={() => { if (confirm('¿Borrar los reportes nuevos y volver a los datos de prueba?')) resetState() }}
          className={`${item} ${itemCompact} hover:bg-white/10`}>
          <Icon name="refresh" /><span className={hide}>Reiniciar demo</span>
        </button>
        <button type="button" onClick={toggleTheme} title={compact ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
          className={`${item} ${itemCompact} hover:bg-white/10`}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          <span className={hide}>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>
        <button type="button" title={compact ? 'Cerrar sesión' : undefined}
          onClick={async () => { await logout('municipio'); nav('/municipio/login') }}
          className={`${item} ${itemCompact} hover:bg-white/10`}>
          <Icon name="logout" />
          <span className={`text-left ${hide}`}>
            Cerrar sesión
            {session && <span className="block text-xs font-normal text-navy-200">{session.nombre}</span>}
          </span>
        </button>
      </div>
    </div>
  )
}
