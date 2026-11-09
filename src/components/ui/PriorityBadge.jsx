import { LEVELS } from '../../config'

// Alta con texto blanco; media y baja con texto oscuro (contraste suficiente sobre naranja y amarillo).
const CLS = {
  alta: 'bg-prio-alta text-white',
  media: 'bg-prio-media text-navy-950',
  baja: 'bg-prio-baja text-navy-950',
}

export default function PriorityBadge({ level, score, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${CLS[level]} ${className}`}>
      {LEVELS[level].label}
      {score != null && <span className="font-semibold opacity-90">· {score}/100</span>}
    </span>
  )
}
