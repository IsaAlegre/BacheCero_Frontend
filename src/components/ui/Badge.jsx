const TONES = {
  neutral: 'bg-surface-2 text-ink',
  navy: 'bg-navy-50 text-navy-800 dark:bg-navy-500/25 dark:text-navy-100',
  warn: 'bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200',
  danger: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200',
}

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}

// Rótulo fijo para todo lo que es de prueba.
export function SimBadge({ children = 'Simulado' }) {
  return <Badge tone="warn">{children}</Badge>
}
