import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { listCases, useLive } from '../../api'
import { rankCases } from '../../lib/ranking'

// Todos los casos (incluidos resueltos) con puntaje y puesto según los pesos actuales.
export function useRanked() {
  const { weights } = useOutletContext()
  const all = useLive(() => listCases({ includeResolved: true }))
  return useMemo(() => (all ? rankCases(all, weights) : null), [all, weights])
}
