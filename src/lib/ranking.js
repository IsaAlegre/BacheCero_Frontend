import { score, level } from './scoring'

// Aplica los pesos a todos los casos y numera el puesto solo entre los abiertos
// (un caso resuelto no compite por la cuadrilla).
export function rankCases(cases, weights) {
  const withScore = cases.map((c) => {
    const s = score(c, weights)
    return { ...c, score: s, level: level(s.total) }
  })
  const open = withScore.filter((c) => c.status !== 'Resuelto').sort((a, b) => b.score.total - a.score.total)
  const rank = new Map(open.map((c, i) => [c.id, i + 1]))
  return withScore
    .map((c) => ({ ...c, rank: rank.get(c.id) ?? null }))
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || b.score.total - a.score.total)
}
