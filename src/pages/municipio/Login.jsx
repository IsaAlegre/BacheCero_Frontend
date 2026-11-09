import AuthShell from '../../components/AuthShell'
import LoginForm from '../../components/LoginForm'
import { Card, Icon } from '../../components/ui'

export default function MuniLogin() {
  return (
    <AuthShell subtitle="Municipalidad de Posadas" wide>
      <Card className="p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-navy-50 text-navy dark:bg-navy-500/25 dark:text-navy-100">
          <Icon name="lock" className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold">Panel municipal</h1>
        <p className="mb-6 mt-1 text-muted">Acceso solo para personal autorizado.</p>
        <LoginForm role="municipio" />
      </Card>
    </AuthShell>
  )
}
