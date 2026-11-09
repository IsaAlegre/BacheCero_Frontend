# Bache Cero · Frontend

PWA en React + Vite + Tailwind CSS v4 con dos vistas en una sola app:

- `/vecino`: web móvil instalable (PWA) para reportar y seguir reportes.
- `/municipio`: dashboard con mapa, lista priorizada, pesos en vivo, revisión humana, estadísticas y cambio de estado.
- `/`: portada con "Soy vecino" y "Soy del municipio".

## Cómo correrlo

```bash
npm install
npm run dev          # http://localhost:5173 (el service worker también corre en dev)
npm run build && npm run preview   # versión de producción en http://localhost:4173
```

El servicio de IA tiene que estar en `http://localhost:8000`. Vite reenvía `/ia/*` ahí (el servicio no tiene CORS).

Para la demo, abrí dos ventanas lado a lado en el mismo navegador: `/vecino` (con DevTools en modo celular) y `/municipio`. Comparten el `localStorage`, así que el cambio de estado se ve en vivo en la vista vecino. Cada rol tiene su propia sesión, así que podés estar logueado en las dos a la vez.

## Usuarios de demo

> Login simulado para la demo, no es seguridad real. Las cuentas se guardan en el `localStorage` del navegador.

| Vista | Email | Contraseña |
|---|---|---|
| Vecino | `lucia@demo.com` | `demo1234` |
| Municipio | `agente@posadas.gob.ar` | `demo123` |

Las dos pantallas de login tienen el botón **"Entrar con usuario de demo"**. También podés registrar vecinos nuevos en `/vecino/registro` (la contraseña se guarda hasheada con SHA-256; si abrís la app por IP de la red local sin https, `crypto.subtle` no existe y se usa un hash simple).

## Pantallas

**Vecino** (celular primero; en tablet, columna centrada de 480 px; en escritorio ≥1024 px, navegación en el encabezado y contenido de ~1100 px en dos columnas)

1. `/vecino/login` y `/vecino/registro`: iniciar sesión y crear cuenta.
2. `/vecino`: inicio con saludo por nombre, "Reportar un bache", "Mis reportes", "Instalar app" y novedades. Barra inferior: Inicio, Reportar, Mis reportes, Novedades, Ayuda.
3. `/vecino/reportar` (paso 1): tomar foto (`capture="environment"`) con vista previa y "Ubicación detectada".
4. `/vecino/reportar` (paso 2): confirmar el reporte con minimapa, dirección aproximada, "Corregir ubicación", descripción y aviso de privacidad.
   - En escritorio es una sola pantalla: foto con arrastrar y soltar a la izquierda; mapa grande con buscador de direcciones y "Usar mi ubicación" a la derecha. Con mouse (`pointer: fine`) no se usa el GPS salvo que lo pidas.
5. `/vecino/reporte/:id`: "¡Reporte recibido!" con número, foto con cajas de la IA y avisos de revisión humana y de reporte agrupado.
6. `/vecino/mis-reportes` y `/vecino/mis-reportes/:id`: lista por estado y seguimiento con línea de tiempo.
7. `/vecino/novedades` y `/vecino/ayuda`: novedades (contenido de ejemplo) y preguntas frecuentes.

**Municipio** (escritorio: barra lateral fija; tablet: solo íconos; celular: menú hamburguesa)

- `/municipio/login`: acceso de personal autorizado.
- `/municipio`: mapa de prioridades con KPI, filtros (barrio, calle, estado), mapa, lista priorizada, pesos con deslizadores y detalle del ticket.
- `/municipio/tickets` y `/municipio/tickets/:id`: tabla ordenable con búsqueda (en celular, tarjetas) y detalle.
- `/municipio/revision`: revisión humana (Confirmar / Corregir / Descartar).
- `/municipio/historial`: todos los cambios de estado, del más nuevo al más viejo.
- `/municipio/estadisticas`: estados, barrios, tipos de daño y tiempos de resolución, calculados con los datos.
- `/municipio/informes`: borrador de informe mensual. **Próxima etapa (no implementado).**

## Dónde está cada cosa

- `src/api.js`: la única interfaz con datos. Hoy simula el backend en `localStorage` y llama en vivo a la IA. Incluye `register`, `login`, `logout` y `getSession`. Cuando esté el backend NestJS se reemplaza el cuerpo de cada función por un `fetch`.
- `src/config.js`: todas las reglas (umbral de revisión 0.4, umbrales de gravedad de la §5.1 del PRD, radio de duplicados, pesos).
- `src/lib/scoring.js`: gravedad y puntaje de prioridad. `src/lib/ranking.js` aplica los pesos y numera el puesto.
- `src/lib/stats.js`: cálculos de Estadísticas e Informes.
- `src/components/ui/`: Button, Card, Badge, Input, StatusBadge, PriorityBadge, ThemeToggle e íconos.
- `src/styles.css`: Tailwind, Leaflet y el tema (colores, fuente y modo oscuro).
- `src/data/seed.js`: datos de prueba (simulados y rotulados así en la UI). `src/data/news.js`: novedades de ejemplo y preguntas frecuentes.

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

## Plan B (sin IA)

- Si `/ia` no responde, se usa `public/fixtures/analyze-demo.json` automáticamente.
- También se puede forzar con "Modo sin conexión" en la barra lateral del dashboard.
- **Reemplazá el fixture por una respuesta real** de la foto que vayan a usar en la demo:

```bash
curl -F file=@foto-demo.jpg http://localhost:8000/v1/analyze > public/fixtures/analyze-demo.json
```

"Reiniciar demo" (en el dashboard) vuelve a los datos de prueba. No borra las cuentas registradas.
