import { useState } from 'react'
import { Icon } from './ui'

// Las cajas vienen en píxeles de la foto que devuelve la IA. El backend no manda el tamaño,
// así que se toma de la imagen cargada; el SVG con ese viewBox las escala solo.
export default function AnalysisImage({ imageUrl, analysis, className = '' }) {
  const [natural, setNatural] = useState(null)
  if (!imageUrl) {
    return (
      <div className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface-2 text-sm text-muted ${className}`}>
        <Icon name="image" className="size-8" />
        Foto no disponible
      </div>
    )
  }
  const { detections = [] } = analysis
  const width = analysis.width ?? natural?.width
  const height = analysis.height ?? natural?.height
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black ring-1 ring-line ${className}`}>
      <img src={imageUrl} alt="Foto del reporte con rostros y patentes difuminados" className="block h-auto w-full"
        onLoad={(e) => setNatural({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })} />
      {width && height ? (
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
      ) : null}
    </div>
  )
}
