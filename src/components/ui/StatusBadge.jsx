import Icon from './Icon'

export const STATUS_META = {
  Pendiente: {
    icon: 'clock', dot: 'bg-st-pendiente', text: 'text-st-pendiente',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-400/20 dark:text-slate-200',
  },
  Programado: {
    icon: 'calendar', dot: 'bg-st-programado', text: 'text-st-programado',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-200',
  },
  'En reparación': {
    icon: 'wrench', dot: 'bg-st-reparacion', text: 'text-st-reparacion',
    badge: 'bg-orange-100 text-orange-900 dark:bg-orange-400/20 dark:text-orange-200',
  },
  Resuelto: {
    icon: 'checkCircle', dot: 'bg-st-resuelto', text: 'text-st-resuelto',
    badge: 'bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-200',
  },
}

export default function StatusBadge({ status, className = '' }) {
  const m = STATUS_META[status] || STATUS_META.Pendiente
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.badge} ${className}`}>
      <Icon name={m.icon} className="size-3.5" />
      {status}
    </span>
  )
}
