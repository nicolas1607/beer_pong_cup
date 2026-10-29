import type { Match } from './types'

export interface Pairing {
  round: number
  teamA: string
  teamB: string
}

/** Méthode du cercle : chaque équipe rencontre toutes les autres une fois. Une équipe fantôme gère les nombres impairs. */
export function roundRobinPairs(teamIds: readonly string[]): Pairing[] {
  const circle: (string | null)[] = teamIds.length % 2 ? [...teamIds, null] : [...teamIds]
  const n = circle.length
  const pairs: Pairing[] = []
  for (let round = 1; round < n; round++) {
    for (let i = 0; i < n / 2; i++) {
      const teamA = circle[i]
      const teamB = circle[n - 1 - i]
      if (teamA && teamB) pairs.push({ round, teamA, teamB })
    }
    // la première équipe reste fixe, les autres tournent d'un cran
    circle.splice(1, 0, circle.pop() ?? null)
  }
  return pairs
}

/** Vrai si les deux matchs ont une équipe en commun. */
export function sharesTeam(
  x: { teamA: string | null; teamB: string | null },
  y: { teamA: string | null; teamB: string | null },
): boolean {
  return [x.teamA, x.teamB].some((id) => id !== null && (id === y.teamA || id === y.teamB))
}

/**
 * Ordre glouton : évite qu'une équipe du match précédent rejoue, puis prend le match
 * dont l'équipe la plus récemment active a joué il y a le plus longtemps.
 * Vérifié sans enchaînement évitable de 2 à 32 équipes (voir les tests).
 */
export function orderPairs(pairs: readonly Pairing[]): Pairing[] {
  const remaining = [...pairs]
  const lastPlayed = new Map<string, number>()
  const ordered: Pairing[] = []
  const rest = (id: string) => lastPlayed.get(id) ?? -1
  while (remaining.length) {
    const prev = ordered[ordered.length - 1]
    let best = 0
    let bestKey = Infinity
    remaining.forEach((p, i) => {
      const conflict = prev && sharesTeam(p, prev) ? 1 : 0
      const key = conflict * 1e6 + Math.max(rest(p.teamA), rest(p.teamB))
      if (key < bestKey) {
        bestKey = key
        best = i
      }
    })
    const [next] = remaining.splice(best, 1)
    if (!next) break
    lastPlayed.set(next.teamA, ordered.length)
    lastPlayed.set(next.teamB, ordered.length)
    ordered.push(next)
  }
  return ordered
}

export function createPoolMatches(teamIds: readonly string[]): Match[] {
  return orderPairs(roundRobinPairs(teamIds)).map((p, i) => ({
    id: `pool-${i + 1}`,
    stage: 'pool',
    round: p.round,
    teamA: p.teamA,
    teamB: p.teamB,
    score: null,
  }))
}
