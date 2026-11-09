import { STATUS_META } from '../../components/ui'

// Estado que ve el vecino: el del caso, salvo que la foto esté en revisión o se haya descartado.
export function reportStatus(r) {
  if (r.review === 'descartado') {
    return { label: 'Revisado: sin daño', icon: 'xCircle', circle: 'bg-surface-2 text-muted' }
  }
  if (r.review === 'pendiente') {
    return { label: 'Foto en revisión', icon: 'hourglass', circle: 'bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200' }
  }
  const m = STATUS_META[r.case?.status] || STATUS_META.Pendiente
  return { label: r.case?.status, icon: m.icon, circle: m.badge, status: r.case?.status }
}
