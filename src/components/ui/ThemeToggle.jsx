import { toggleTheme, useTheme } from '../../lib/theme'
import Icon from './Icon'

export default function ThemeToggle({ className = '', withLabel = false }) {
  const theme = useTheme()
  const dark = theme === 'dark'
  const label = dark ? 'Pasar a modo claro' : 'Pasar a modo oscuro'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl transition-colors ${className}`}
    >
      <Icon name={dark ? 'sun' : 'moon'} />
      {withLabel && <span className="text-sm">{dark ? 'Modo claro' : 'Modo oscuro'}</span>}
    </button>
  )
}
