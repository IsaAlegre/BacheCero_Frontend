# Bache Cero · Frontend

PWA en React + Vite + Tailwind CSS v4 con dos vistas en una sola app:

- `/vecino`: web móvil instalable (PWA) para reportar y seguir reportes.
- `/municipio`: dashboard con mapa, lista priorizada, pesos en vivo, revisión humana, estadísticas y cambio de estado.
- `/`: portada con "Soy vecino" y "Soy del municipio".

## Cómo correrlo

Todo corre en local en la misma máquina: el front habla con el backend (`BacheCero_backend`, puerto 3000) y el backend con la IA (`bache-cero-ia`, puerto 8000). Levantá los dos según sus README y después:

```bash
npm install
npm run dev          # http://localhost:5173
```

Vite reenvía `/api/*` al backend (`localhost:3000`) y `/ia/*` a la IA (`localhost:8000`, solo para el indicador "IA en línea"), así el navegador no hace pedidos a otro origen. Si el backend o la IA corren en otro puerto: `BACKEND_URL=http://localhost:3001 IA_URL=http://localhost:8001 npm run dev`.

Para la demo, abrí dos ventanas lado a lado: `/vecino` (con DevTools en modo celular) y `/municipio`. Los datos se actualizan cada 5 s. Cada rol tiene su propia sesión, así que podés estar logueado en las dos a la vez.

## Usuarios de demo

Se entra con **DNI** (sin puntos) y contraseña. El botón **"Entrar con usuario de demo"** usa estas cuentas, que hay que crear en la base del backend:

| Vista | DNI | Contraseña | Rol en el backend | Cómo crearla |
|---|---|---|---|---|
| Vecino | `30111222` | `demo1234` | ciudadano | Registrándose en `/vecino/registro` (o `POST /auth/registro`) |
| Municipio | `20111222` | `demo1234` | administrador | Registrarla igual y después `PATCH /usuarios/:id/rol` con un administrador, o el `UPDATE` del README del backend |

```sql
UPDATE usuarios SET rol_id = (SELECT id FROM roles WHERE codigo = 'administrador') WHERE dni = '20111222';
```

El panel municipal acepta operadores y administradores. Informes y novedades es solo para administradores: con un operador esa pantalla avisa que no tiene permiso.

## Pantallas

**Vecino** (celular primero; en tablet, columna centrada de 480 px; en escritorio ≥1024 px, navegación en el encabezado y contenido de ~1100 px en dos columnas)

1. `/vecino/login` y `/vecino/registro`: iniciar sesión y crear cuenta.
2. `/vecino`: inicio con saludo por nombre, "Reportar un bache", "Mis reportes", "Instalar app" y novedades. Barra inferior: Inicio, Reportar, Mis reportes, Novedades, Ayuda.
3. `/vecino/reportar` (paso 1): tomar foto (`capture="environment"`) con vista previa y "Ubicación detectada".
4. `/vecino/reportar` (paso 2): confirmar el reporte con minimapa, dirección aproximada, "Corregir ubicación", descripción y aviso de privacidad.
   - En escritorio es una sola pantalla: foto con arrastrar y soltar a la izquierda; mapa grande con buscador de direcciones y "Usar mi ubicación" a la derecha. Con mouse (`pointer: fine`) no se usa el GPS salvo que lo pidas.
5. `/vecino/reporte/:id`: "¡Reporte recibido!" con número, foto con cajas de la IA y avisos de revisión humana y de reporte agrupado.
6. `/vecino/mis-reportes` y `/vecino/mis-reportes/:id`: lista por estado y seguimiento con línea de tiempo.
7. `/vecino/novedades` y `/vecino/ayuda`: novedades publicadas por el municipio y preguntas frecuentes.

**Municipio** (escritorio: barra lateral fija; tablet: solo íconos; celular: menú hamburguesa)

- `/municipio/login`: acceso de personal autorizado.
- `/municipio`: mapa de prioridades con KPI, filtros (barrio, calle, estado), mapa, lista priorizada, pesos con deslizadores y detalle del ticket.
- `/municipio/tickets` y `/municipio/tickets/:id`: tabla ordenable con búsqueda (en celular, tarjetas) y detalle.
- `/municipio/revision`: revisión humana (Confirmar / Descartar).
- `/municipio/historial`: todos los cambios de estado, del más nuevo al más viejo.
- `/municipio/estadisticas`: estados, barrios y tiempo de resolución (de `GET /estadisticas`); tipos de daño y tiempo por etapa (calculados con los tickets).
- `/municipio/informes`: novedades para los vecinos. Generar el informe de un mes con IA, escribir un borrador, editarlo, aprobarlo y publicarlo, o eliminarlo.

## Dónde está cada cosa

- `src/api.js`: la única interfaz con datos. Llama al backend NestJS y traduce sus respuestas (tickets, estados `en_reparacion`, gravedad `moderada`…) a la forma que usan las pantallas (casos, `En reparación`, `moderado`…). La sesión es el JWT del backend, guardado por rol en `localStorage`.
- `src/config.js`: URLs y reglas que se muestran en pantalla (umbral de revisión 0.5, radio de agrupación 15 m, pesos 40/25/15/20). Tienen que coincidir con `src/domain/reglas.ts` del backend.
- `src/lib/scoring.js`: puntaje de prioridad con los componentes que manda el backend (gravedad, peso de la calle, reportes, índice del barrio). Con los pesos por defecto da lo mismo que la prioridad del backend; los deslizadores lo recalculan en vivo. `src/lib/ranking.js` numera el puesto.
- `src/lib/stats.js`: tiempos por etapa y conteos que el backend no calcula.
- `src/components/ui/`: Button, Card, Badge, Input, StatusBadge, PriorityBadge, ThemeToggle e íconos.
- `src/styles.css`: Tailwind, Leaflet y el tema (colores, fuente y modo oscuro).
- `src/data/news.js`: preguntas frecuentes.

## Tema

- Fuente Plus Jakarta Sans, instalada por npm (`@fontsource-variable/plus-jakarta-sans`) y precacheada: funciona sin internet.
- Modo oscuro por clase. Arranca según la preferencia del sistema y, si la cambiás con el botón sol/luna, se guarda en `localStorage` (`bachecero:theme`). En oscuro, las tiles del mapa se oscurecen con un filtro CSS.

## Búsqueda de direcciones (Nominatim)

En escritorio, el buscador del mapa usa Nominatim (OpenStreetMap), limitado a Posadas (`viewbox` + `countrycodes=ar`). Para cumplir su [política de uso](https://operations.osmfoundation.org/policies/nominatim/): busca solo al apretar Enter o "Buscar" (Nominatim no permite autocompletar), con un máximo de una consulta por segundo y resultados en caché. Necesita internet; sin conexión, el punto se marca a mano en el mapa.

## Instalar la PWA

- Android/Chrome: botón "Instalar app" en el inicio del vecino (usa `beforeinstallprompt`).
- iPhone: el mismo botón muestra los pasos (Compartir → "Agregar a inicio").
- Si la app ya está instalada, el botón no aparece.
- En escritorio no se ofrece instalar: se muestra un QR con el link para abrirla en el celular. El QR usa la URL con la que abriste la app; si es `localhost`, entrá por la IP de la red (la que muestra `npm run dev` como "Network") o definí `VITE_APP_URL` (por ejemplo, `VITE_APP_URL=https://bachecero.example/vecino npm run build`). El QR se genera con `src/lib/qr.js`, sin dependencias.

## Sin IA

Si el servicio de IA no está, el backend puede arrancar con `MODO_DESARROLLO=1` y sin `IA_URL`: usa una IA falsa que siempre devuelve un bache. Con `MODO_DESARROLLO=1` y sin `ANTHROPIC_API_KEY`, el informe mensual se redacta con un texto fijo. Sirve para probar el flujo, no para la demo.

## Endpoints que usa el front

| Pantalla | Endpoint |
|---|---|
| Registro y login | `POST /auth/registro`, `POST /auth/login` (devuelve `accessToken`, `rol`, `nombre`) |
| Reportar | `POST /reportes` (multipart: `foto`, `lat`, `lng`, `descripcion`) |
| Mis reportes y seguimiento | `GET /reportes/mios` |
| Novedades (vecino) | `GET /novedades` |
| Mapa, tickets, historial, revisión | `GET /tickets`, `GET /tickets?estado=resuelto`, `GET /tickets/:id` |
| Cambio de estado | `PATCH /tickets/:id/estado` |
| Revisión humana | `POST /tickets/:id/revision` (`confirmada` o `rechazada`) |
| Estadísticas | `GET /estadisticas` |
| Informes | `GET /novedades/gestion`, `POST /novedades/generar`, `POST /novedades`, `PATCH /novedades/:id`, `POST /novedades/:id/publicar`, `DELETE /novedades/:id` |
| Indicador de IA | `GET /health` de la IA |

## Limitaciones por lo que expone el backend

- **Fotos:** con `ALMACEN_IMAGENES=local` el backend guarda `local://…`, que el navegador no puede abrir: se muestra "Foto no disponible". Con Cloudinary se ven. Justo después de reportar, el vecino ve la foto que subió (solo en esa pestaña).
- **Cajas de la IA:** el backend no devuelve el tamaño de la foto; se toma de la imagen al cargarla y las cajas se dibujan encima (en el panel, la revisión, el resultado y el seguimiento). Sin foto visible no hay cajas, pero las detecciones se listan igual.
- **Mis reportes:** el backend no devuelve las detecciones ni las fechas de cada cambio de estado. Se completan con lo que se guardó al enviar el reporte desde ese navegador; la línea de tiempo muestra el estado actual sin fecha.
- **Barrio:** la lista de tickets no lo trae; se toma del detalle de cada ticket.
- **Puntaje:** el backend no expone el peso de la calle. Se despeja de su prioridad (con el índice de barrio en 0,5, que es lo que usa mientras la tabla de barrios esté vacía) y se muestra como "estimada".
- **Revisión humana:** es por **ticket** y solo tiene **Confirmar** o **Descartar**. Los descartados no aparecen en el mapa ni en la lista.
- **Estados:** solo avanzan (Pendiente → Programado → En reparación → Resuelto); "Resuelto" es final. El panel desactiva los botones que el backend rechazaría.
