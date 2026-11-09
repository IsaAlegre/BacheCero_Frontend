import { useMemo } from 'react'
import { qrMatrix } from '../lib/qr'

// QR en SVG. Siempre oscuro sobre blanco (también en modo oscuro), para que lo lea la cámara.
export default function QrCode({ value, className = 'size-40', label }) {
  const { d, n } = useMemo(() => {
    const m = qrMatrix(value)
    let path = ''
    m.forEach((row, y) => row.forEach((dark, x) => { if (dark) path += `M${x + 4} ${y + 4}h1v1h-1z` }))
    return { d: path, n: m.length + 8 }
  }, [value])
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className={`rounded-xl bg-white ${className}`} role="img" aria-label={label || `Código QR: ${value}`}
      shapeRendering="crispEdges">
      <path d={d} fill="#0b1724" />
    </svg>
  )
}
