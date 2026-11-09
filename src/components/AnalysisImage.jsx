import { Badge, Icon } from './ui'

// Foto difuminada + cajas de la IA. Las cajas vienen en píxeles del original
// (width/height de la respuesta); el SVG con ese viewBox las escala solo.
// Los colores de las cajas son fijos (van sobre la foto, no cambian con el modo oscuro).
export default function AnalysisImage({ imageUrl, analysis, source, className = '' }) {
  if (!imageUrl) {
    return (
      <div className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface-2 text-sm text-muted ${className}`}>
        <Icon name="image" className="size-8" />
        Sin foto (reclamo simulado)
      </div>
    )
  }
  const { width, height, detections = [] } = analysis
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black ring-1 ring-line ${className}`}>
      <img src={imageUrl} alt="Foto del reporte con rostros y patentes difuminados" className="block h-auto w-full" />
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
        {detections.map((d, i) => {
          const [x1, y1, x2, y2] = d.bbox
          const color = d.type === 'pothole' ? '#e03131' : '#f2c94c'
          const fs = Math.max(14, width / 40)
          return (
            <g key={i}>
              <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1}
                fill="none" stroke={color} strokeWidth={Math.max(3, width / 250)} />
              <rect x={x1} y={Math.max(0, y1 - fs * 1.4)} width={fs * 0.62 * (d.label_es.length + 6)} height={fs * 1.4} fill={color} />
              <text x={x1 + fs * 0.3} y={Math.max(fs, y1 - fs * 0.35)} fontSize={fs}
                fill={d.type === 'pothole' ? '#fff' : '#000'} fontWeight="700" fontFamily="inherit">
                {d.label_es} {Math.round(d.confidence * 100)} %
              </text>
            </g>
          )
        })}
      </svg>
      {source === 'offline' && (
        <Badge tone="warn" className="absolute bottom-2 left-2 shadow">Modo sin conexión: respuesta guardada</Badge>
      )}
    </div>
  )
}
