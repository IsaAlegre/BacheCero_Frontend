import { Link } from 'react-router-dom'
import AuthShell from '../../components/AuthShell'
import LoginForm from '../../components/LoginForm'

export default function VecinoLogin() {
  return (
    <AuthShell subtitle="Vecinos">
      <h1 className="text-2xl font-extrabold">Iniciar sesión</h1>
      <p className="mb-6 mt-1 text-muted">Entrá para reportar baches y seguir tus reportes.</p>
      <LoginForm role="vecino" />
      <p className="mt-6 text-center text-sm">
        ¿No tenés cuenta?{' '}
        <Link to="/vecino/registro" className="font-bold text-navy underline-offset-4 hover:underline dark:text-navy-200">
          Registrate
        </Link>
      </p>
    </AuthShell>
  )
}
