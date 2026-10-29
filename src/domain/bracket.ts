import { shuffle } from './random'
import type { DrawMethod, Match, Rng } from './types'

/** Ordre de placement standard : 1 et 2 ne peuvent se croiser qu'en finale. Ex. 8 → [1, 8, 4, 5, 2, 7, 3, 6]. */
export function seedOrder(size: number): number[] {
  let order = [1]
  while (order.length < size) {
    const next = order.length * 2 + 1
    order = order.flatMap((s) => [s, next - s])
  }
  return order
}

/**
 * Tableau d'élimination directe à partir des équipes rangées par tête de série.
 * Si le nombre n'est pas une puissance de 2, les meilleures têtes de série sont exemptées
 * du premier tour : elles sont placées directement au tour suivant.
 */
export function buildBracket(seeds: readonly string[]): Match[] {
  const size = 2 ** Math.ceil(Math.log2(Math.max(seeds.length, 2)))
  const rounds = Math.log2(size)
  const slots = seedOrder(size).map((s) => seeds[s - 1] ?? null)

  const matches: Match[] = []
  for (let round = 1; round <= rounds; round++) {
    const count = size / 2 ** round
    for (let i = 0; i < count; i++) {
      const match: Match = {
        id: `ko-${round}-${i + 1}`,
        stage: 'bracket',
        round,
        teamA: round === 1 ? (slots[2 * i] ?? null) : null,
        teamB: round === 1 ? (slots[2 * i + 1] ?? null) : null,
        score: null,
      }
      if (round < rounds) {
        match.nextMatchId = `ko-${round + 1}-${Math.floor(i / 2) + 1}`
        match.nextSlot = i % 2 ? 'teamB' : 'teamA'
      }
      matches.push(match)
    }
  }

  // exemptés : la tête de série passe directement au tour 2 et le match disparaît
  const byes = matches.filter((m) => m.round === 1 && (m.teamA === null) !== (m.teamB === null))
  for (const bye of byes) {
    const next = matches.find((m) => m.id === bye.nextMatchId)
    if (next && bye.nextSlot) next[bye.nextSlot] = bye.teamA ?? bye.teamB
  }
  return matches.filter((m) => !byes.includes(m))
}

/** Têtes de série : ordre donné (classement ou inscription) ou tirage aléatoire. */
export function drawSeeds(teamIds: readonly string[], draw: DrawMethod, rng: Rng): string[] {
  return draw === 'random' ? shuffle(teamIds, rng) : [...teamIds]
}
