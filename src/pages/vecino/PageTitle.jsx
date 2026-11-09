import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'

export default function PageTitle({ children, back, subtitle }) {
  return (
    <div className="mb-5">
      {back && (
        <Link to={back} className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-navy dark:text-navy-200">
          <Icon name="chevronLeft" className="size-4" /> Volver
        </Link>
      )}
      <h1 className="text-2xl font-extrabold tracking-tight">{children}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </div>
  )
}
