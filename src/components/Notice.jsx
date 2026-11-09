import { Icon } from './ui'

const TONES = {
  info: 'bg-navy-50 text-navy-900 dark:bg-navy-500/20 dark:text-navy-50',
  warn: 'bg-amber-50 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-100 dark:ring-amber-400/30',
  success: 'bg-green-50 text-green-900 dark:bg-green-500/15 dark:text-green-100',
}

// Aviso con ícono (privacidad, revisión humana, reporte agrupado, datos simulados).
export default function Notice({ icon = 'info', tone = 'info', title, children, className = '' }) {
  return (
    <div className={`flex gap-3 rounded-2xl p-3.5 text-sm ${TONES[tone]} ${className}`}>
      <Icon name={icon} className="mt-0.5 size-5" />
      <div>
        {title && <p className="font-bold">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
    </div>
  )
}
