export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim())

export function validateLogin({ email, password }) {
  const e = {}
  if (!isEmail(email)) e.email = 'Ingresá un email válido'
  if (String(password).length < 6) e.password = 'La contraseña tiene que tener 6 caracteres o más'
  return e
}

export function validateRegister({ nombre, email, password, confirm }) {
  const e = validateLogin({ email, password })
  if (!String(nombre).trim()) e.nombre = 'Contanos tu nombre'
  if (confirm !== password) e.confirm = 'Las contraseñas no coinciden'
  return e
}
