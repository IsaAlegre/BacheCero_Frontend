import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { listCases, useLive } from '../../api'
import { rankCases } from '../../lib/ranking'

export function useRanked() {
  const { weights } = useOutletContext()
  const all = useLive(() => listCases({ includeResolved: true }))
  return useMemo(() => (all ? rankCases(all, weights) : null), [all, weights])
}
