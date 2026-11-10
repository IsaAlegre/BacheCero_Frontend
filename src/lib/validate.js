// Mismas reglas que el backend: DNI de 7 u 8 dígitos y contraseña de 8 a 72 caracteres.
export const isDni = (v) => /^\d{7,8}$/.test(cleanDni(v))
export const cleanDni = (v) => String(v || '').replace(/[.\s]/g, '')

export function validateLogin({ dni, password }) {
  const e = {}
  if (!isDni(dni)) e.dni = 'Ingresá tu DNI (7 u 8 números, sin puntos)'
  if (!String(password)) e.password = 'Ingresá tu contraseña'
  return e
}

export function validateRegister({ nombre, dni, password, confirm }) {
  const e = validateLogin({ dni, password })
  if (String(password).length < 8) e.password = 'La contraseña tiene que tener 8 caracteres o más'
  if (String(password).length > 72) e.password = 'La contraseña puede tener hasta 72 caracteres'
  if (!String(nombre).trim()) e.nombre = 'Contanos tu nombre'
  if (confirm !== password) e.confirm = 'Las contraseñas no coinciden'
  return e
}
