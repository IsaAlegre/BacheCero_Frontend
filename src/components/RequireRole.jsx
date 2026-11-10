import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../api'

export default function RequireRole({ role }) {
  const session = useSession(role)
  const location = useLocation()
  if (!session || session.role !== role) {
    return <Navigate to={`/${role}/login`} replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
