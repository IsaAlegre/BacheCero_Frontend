export function formatDate(ts) {
  return new Date(ts).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function formatDay(ts) {
  return new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`
}
