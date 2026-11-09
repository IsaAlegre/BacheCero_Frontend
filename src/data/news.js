// CONTENIDO DE EJEMPLO para maquetar la pantalla. La UI lo rotula así.
const DAY = 86400000
const now = Date.now()

export const NEWS = [
  {
    id: 'n1', icon: 'wrench', tag: 'Obras',
    title: 'Cuadrillas de bacheo en Villa Cabello',
    text: 'Esta semana se trabaja sobre Av. Blas Parera. Puede haber desvíos cortos durante la mañana.',
    at: now - 1 * DAY,
  },
  {
    id: 'n2', icon: 'sliders', tag: 'Cómo funciona',
    title: 'Cómo decidimos qué bache se arregla primero',
    text: 'Se tiene en cuenta la gravedad del daño, el tipo de calle, cuántos vecinos lo reportaron y las características de la zona. Una persona del municipio revisa siempre la lista.',
    at: now - 3 * DAY,
  },
  {
    id: 'n3', icon: 'alert', tag: 'Tránsito',
    title: 'Corte parcial en Av. Uruguay',
    text: 'Por reparación de calzada, se habilita un solo carril entre Av. López Torres y Calle Santa Fe.',
    at: now - 5 * DAY,
  },
  {
    id: 'n4', icon: 'checkCircle', tag: 'Novedad',
    title: 'Ahora podés seguir tu reporte paso a paso',
    text: 'En "Mis reportes" ves cuándo tu caso pasa a Programado, En reparación y Resuelto.',
    at: now - 8 * DAY,
  },
]

export const FAQ = [
  {
    q: '¿Cómo saco una buena foto del bache?',
    a: 'De día y desde uno o dos metros, con el bache entero en la foto y la cámara apuntando hacia abajo. Si podés, incluí algo del cordón o la calle para que se entienda dónde está. Evitá que salgan personas o autos de cerca.',
  },
  {
    q: '¿Qué pasa después de reportar?',
    a: 'La IA analiza la foto y propone el tipo de daño y su gravedad. Si no está segura, una persona del municipio la revisa. Después, el municipio ordena los casos por prioridad y vos podés seguir el estado en "Mis reportes": Pendiente, Programado, En reparación y Resuelto.',
  },
  {
    q: '¿Puedo reportar más de un bache?',
    a: 'Sí, hacé un reporte por cada bache. Si alguien ya reportó un bache muy cerca del mismo lugar, sumamos tu reporte a ese caso: así no se duplica y el caso gana prioridad.',
  },
  {
    q: '¿Qué hacen con mi foto?',
    a: 'Antes de guardarla, difuminamos rostros y patentes y le borramos los datos internos (ubicación GPS, fecha y modelo del celular). Solo se guarda la versión difuminada y se usa únicamente para evaluar el daño.',
  },
]
