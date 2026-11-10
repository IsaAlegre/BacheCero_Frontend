import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login, AUTH_ERROR } from '../api'
import { DEMO_USERS } from '../data/demoUsers'
import { validateLogin } from '../lib/validate'
import { AuthError } from './AuthShell'
import { Button, Input } from './ui'

export default function LoginForm({ role }) {
  const nav = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ dni: '', password: '' })
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function enter(data) {
    const errs = validateLogin(data)
    setErrors(errs)
    setAuthError(null)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await login({ ...data, role })
      nav(location.state?.from || `/${role}`, { replace: true })
    } catch (e) {
      setAuthError(e.status === 401 ? AUTH_ERROR : e.status === 403 || e.status === 0 ? e.message : 'No pudimos iniciar sesión. Probá de nuevo.')
      setBusy(false)
    }
  }

  function demo() {
    const { dni, password } = DEMO_USERS[role]
    setForm({ dni, password })
    enter({ dni, password })
  }

  return (
    <form noValidate className="space-y-4" onSubmit={(e) => { e.preventDefault(); enter(form) }}>
      <AuthError>{authError}</AuthError>
      <Input label="DNI" autoComplete="username" inputMode="numeric"
        value={form.dni} onChange={set('dni')} error={errors.dni} placeholder="Sin puntos, ej.: 30111222" />
      <Input label="Contraseña" type="password" autoComplete="current-password"
        value={form.password} onChange={set('password')} error={errors.password} />
      <Button type="submit" block size="lg" disabled={busy}>
        {busy ? 'Entrando…' : 'Iniciar sesión'}
      </Button>
      <Button variant="secondary" block onClick={demo} disabled={busy}>
        Entrar con usuario de demo
      </Button>
    </form>
  )
}
