import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../api'
import AuthShell, { AuthError } from '../../components/AuthShell'
import { Button, Input } from '../../components/ui'
import { validateRegister } from '../../lib/validate'

export default function Register() {
  const nav = useNavigate()
  const [form, setForm] = useState({ nombre: '', dni: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    const errs = validateRegister(form)
    setErrors(errs)
    setError(null)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await register(form)
      nav('/vecino', { replace: true })
    } catch (err) {
      setError([400, 409, 0].includes(err.status) ? err.message : 'No pudimos crear la cuenta. Probá de nuevo.')
      setBusy(false)
    }
  }

  return (
    <AuthShell subtitle="Vecinos">
      <h1 className="text-2xl font-extrabold">Crear cuenta</h1>
      <p className="mb-6 mt-1 text-muted">Solo te pedimos lo justo para avisarte cómo sigue tu reporte.</p>
      <form noValidate className="space-y-4" onSubmit={submit}>
        <AuthError>{error}</AuthError>
        <Input label="Nombre" autoComplete="given-name" value={form.nombre} onChange={set('nombre')} error={errors.nombre} />
        <Input label="DNI" inputMode="numeric" autoComplete="username" value={form.dni}
          onChange={set('dni')} error={errors.dni} placeholder="Sin puntos, ej.: 30111222" />
        <Input label="Contraseña" type="password" autoComplete="new-password" value={form.password}
          onChange={set('password')} error={errors.password} hint="Mínimo 8 caracteres" />
        <Input label="Repetí la contraseña" type="password" autoComplete="new-password" value={form.confirm}
          onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" block size="lg" disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</Button>
      </form>
      <p className="mt-6 text-center text-sm">
        ¿Ya tenés cuenta?{' '}
        <Link to="/vecino/login" className="font-bold text-navy underline-offset-4 hover:underline dark:text-navy-200">
          Iniciá sesión
        </Link>
      </p>
    </AuthShell>
  )
}
