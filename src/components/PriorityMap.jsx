import { useEffect } from 'react'
import { CircleMarker, Tooltip, useMap } from 'react-leaflet'
import { MAP_CENTER, LEVELS } from '../config'
import { useTheme } from '../lib/theme'
import MapBase from './MapBase'

function FlyTo({ c }) {
  const map = useMap()
  useEffect(() => { if (c) map.flyTo([c.lat, c.lng], Math.max(map.getZoom(), 15), { duration: 0.6 }) }, [c, map])
  return null
}

export default function PriorityMap({ cases, selectedId, onSelect, className = '' }) {
  const dark = useTheme() === 'dark'
  const selected = cases.find((c) => c.id === selectedId)
  return (
    <MapBase center={MAP_CENTER} zoom={14} className={className}>
      {cases.map((c) => {
        const on = c.id === selectedId
        return (
          <CircleMarker
            key={c.id}
            center={[c.lat, c.lng]}
            radius={7 + Math.min(c.reportCount, 8)}
            pathOptions={{
              color: on ? (dark ? '#ffffff' : '#0b1724') : dark ? '#0b1724' : '#ffffff',
              weight: on ? 4 : 2,
              fillColor: c.status === 'Resuelto' ? '#2f9e44' : LEVELS[c.level].color,
              fillOpacity: 0.9,
            }}
            eventHandlers={{ click: () => onSelect(c.id) }}
          >
            <Tooltip>#{c.id} · {c.street} · {c.score.total}/100</Tooltip>
          </CircleMarker>
        )
      })}
      <FlyTo c={selected} />
    </MapBase>
  )
}
