import { MapContainer, TileLayer } from 'react-leaflet'

// Mapa base con OpenStreetMap. En modo oscuro las tiles se oscurecen por CSS (styles.css).
export default function MapBase({ children, className = '', ...props }) {
  return (
    <MapContainer className={`z-0 ${className}`} {...props}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  )
}
