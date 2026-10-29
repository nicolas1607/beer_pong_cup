import { matchPoints } from './scoring'
import type { Match, Settings, Team } from './types'

export interface Standing {
  teamId: string
  played: number
  wins: number
  losses: number
  points: number
  cupsFor: number
  cupsAgainst: number
  cupDiff: number
}

/**
 * Classement de poule : points, puis mini-classement entre équipes à égalité de points
 * (victoires dans leurs matchs entre elles), puis différence de verres, puis verres
 * marqués, puis ordre d'inscription.
 */
export function computeStandings(
  teams: readonly Team[],
  matches: readonly Match[],
  settings: Pick<Settings, 'winPoints' | 'lossPoints'>,
): Standing[] {
  const rows = new Map<string, Standing>(
    teams.map((t) => [
      t.id,
      {
        teamId: t.id,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        cupsFor: 0,
        cupsAgainst: 0,
        cupDiff: 0,
      },
    ]),
  )
  const played = matches.flatMap((m) => {
    const a = m.teamA !== null ? rows.get(m.teamA) : undefined
    const b = m.teamB !== null ? rows.get(m.teamB) : undefined
    return m.stage === 'pool' && m.score && a && b
      ? [{ a, b, score: m.score, pts: matchPoints(m.score, settings) }]
      : []
  })

  for (const { a, b, score, pts } of played) {
    for (const [row, own, other, p] of [
      [a, score.a, score.b, pts.a],
      [b, score.b, score.a, pts.b],
    ] as const) {
      row.played++
      if (own > other) row.wins++
      else row.losses++
      row.points += p
      row.cupsFor += own
      row.cupsAgainst += other
      row.cupDiff += own - other
    }
  }

  // victoires (pas points : certains réglages donnent autant au perdant) contre des équipes au même total
  const headToHead = new Map<string, number>()
  for (const { a, b, score } of played) {
    if (a.points !== b.points) continue
    const winner = score.a > score.b ? a : b
    headToHead.set(winner.teamId, (headToHead.get(winner.teamId) ?? 0) + 1)
  }
  const h2h = (s: Standing) => headToHead.get(s.teamId) ?? 0
  const order = new Map(teams.map((t, i) => [t.id, i]))

  return [...rows.values()].sort(
    (x, y) =>
      y.points - x.points ||
      h2h(y) - h2h(x) ||
      y.cupDiff - x.cupDiff ||
      y.cupsFor - x.cupsFor ||
      (order.get(x.teamId) ?? 0) - (order.get(y.teamId) ?? 0),
  )
}
