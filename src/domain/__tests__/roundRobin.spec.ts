import { describe, expect, it } from 'vitest'
import { createPoolMatches, orderPairs, roundRobinPairs, sharesTeam } from '../roundRobin'

const ids = (n: number) => Array.from({ length: n }, (_, i) => `t${i + 1}`)

function consecutiveRepeats(matches: { teamA: string | null; teamB: string | null }[]) {
  return matches.slice(1).filter((m, i) => sharesTeam(m, matches[i]!)).length
}

describe('roundRobinPairs', () => {
  it.each(Array.from({ length: 31 }, (_, i) => i + 2))(
    '%i équipes : chaque paire une seule fois',
    (n) => {
      const teams = ids(n)
      const pairs = roundRobinPairs(teams)
      expect(pairs).toHaveLength((n * (n - 1)) / 2)

      const keys = pairs.map((p) => [p.teamA, p.teamB].sort().join('|'))
      expect(new Set(keys).size).toBe(pairs.length)
      for (const p of pairs) {
        expect(p.teamA).not.toBe(p.teamB)
        expect(teams).toContain(p.teamA)
        expect(teams).toContain(p.teamB)
      }
      for (const t of teams)
        expect(pairs.filter((p) => p.teamA === t || p.teamB === t)).toHaveLength(n - 1)
    },
  )

  it('10 équipes : 45 matchs valides (bug de l’ancienne version)', () => {
    const teams = ids(10)
    const matches = createPoolMatches(teams)
    expect(matches).toHaveLength(45)
    expect(new Set(matches.map((m) => m.id)).size).toBe(45)
    for (const m of matches) {
      expect(teams).toContain(m.teamA)
      expect(teams).toContain(m.teamB)
      expect(m.teamA).not.toBe(m.teamB)
    }
  })

  it.each([3, 5, 7, 9, 31])('%i équipes (impair) : une équipe exemptée par tour', (n) => {
    const pairs = roundRobinPairs(ids(n))
    const rounds = new Set(pairs.map((p) => p.round))
    expect(rounds.size).toBe(n)
    for (const r of rounds) expect(pairs.filter((p) => p.round === r)).toHaveLength((n - 1) / 2)
  })
})

describe('orderPairs', () => {
  it.each(Array.from({ length: 28 }, (_, i) => i + 5))(
    '%i équipes : aucune équipe ne joue deux matchs de suite',
    (n) => {
      expect(consecutiveRepeats(orderPairs(roundRobinPairs(ids(n))))).toBe(0)
    },
  )

  it('3 et 4 équipes : seulement les enchaînements inévitables', () => {
    // 3 équipes : tous les matchs se touchent ; 4 équipes : au mieux 2 enchaînements
    expect(consecutiveRepeats(orderPairs(roundRobinPairs(ids(3))))).toBe(2)
    expect(consecutiveRepeats(orderPairs(roundRobinPairs(ids(4))))).toBe(2)
  })

  it('garde tous les matchs', () => {
    const pairs = roundRobinPairs(ids(12))
    expect(orderPairs(pairs)).toHaveLength(pairs.length)
    expect(new Set(orderPairs(pairs))).toEqual(new Set(pairs))
  })
})
