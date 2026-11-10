import { Link } from 'react-router-dom'
import { Brand } from './Logo'
import { Icon, ThemeToggle } from './ui'

export default function AuthShell({ subtitle, children, wide = false }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between bg-navy px-4 py-2 text-white dark:bg-navy-950">
        <Link to="/" className="rounded-lg"><Brand subtitle={subtitle} /></Link>
        <ThemeToggle className="hover:bg-white/10" />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className={`w-full ${wide ? 'max-w-md' : 'max-w-sm'}`}>{children}</div>
      </main>
    </div>
  )
}

export function AuthError({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-100 px-3 py-2.5 text-sm font-medium text-red-800 dark:bg-red-500/15 dark:text-red-200">
      <Icon name="alert" className="mt-0.5 size-4" />
      {children}
    </div>
  )
}
