import { describe, expect, it } from 'vitest'
import { buildBracket, drawSeeds, seedOrder } from '../bracket'
import { seededRng } from './helpers'

const ids = (n: number) => Array.from({ length: n }, (_, i) => `s${i + 1}`)

describe('seedOrder', () => {
  it('place 1 contre le dernier, et 1 et 2 dans des moitiés opposées', () => {
    expect(seedOrder(2)).toEqual([1, 2])
    expect(seedOrder(4)).toEqual([1, 4, 2, 3])
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6])
  })
})

describe('buildBracket', () => {
  it.each(Array.from({ length: 31 }, (_, i) => i + 2))(
    '%i équipes : n - 1 matchs, une seule finale',
    (n) => {
      const matches = buildBracket(ids(n))
      expect(matches).toHaveLength(n - 1)
      expect(matches.filter((m) => !m.nextMatchId)).toHaveLength(1)
      expect(matches[matches.length - 1]!.nextMatchId).toBeUndefined()
      for (const m of matches.filter((x) => x.nextMatchId)) {
        expect(matches.some((x) => x.id === m.nextMatchId)).toBe(true)
      }
    },
  )

  it.each([4, 8, 16, 32])('%i équipes : pas d’exempté, 1er contre dernier', (n) => {
    const firstRound = buildBracket(ids(n)).filter((m) => m.round === 1)
    expect(firstRound).toHaveLength(n / 2)
    expect(firstRound.flatMap((m) => [m.teamA, m.teamB])).not.toContain(null)
    expect(firstRound[0]).toMatchObject({ teamA: 's1', teamB: `s${n}` })
  })

  it.each([3, 5, 6, 7, 10, 20, 31])(
    '%i équipes : les meilleures têtes de série sont exemptées',
    (n) => {
      const size = 2 ** Math.ceil(Math.log2(n))
      const byes = size - n
      const matches = buildBracket(ids(n))
      const firstRoundTeams = matches
        .filter((m) => m.round === 1)
        .flatMap((m) => [m.teamA, m.teamB])
      const exempted = matches
        .filter((m) => m.round === 2)
        .flatMap((m) => [m.teamA, m.teamB])
        .filter(Boolean)
      expect(exempted.sort()).toEqual(ids(byes).sort())
      expect(firstRoundTeams).toHaveLength(2 * (n - size / 2))
      expect(firstRoundTeams).not.toContain(null)
    },
  )

  it('5 équipes : seul 4 contre 5 joue au premier tour', () => {
    const matches = buildBracket(ids(5))
    expect(matches.filter((m) => m.round === 1)).toEqual([
      expect.objectContaining({
        teamA: 's4',
        teamB: 's5',
        nextMatchId: 'ko-2-1',
        nextSlot: 'teamB',
      }),
    ])
    expect(matches.filter((m) => m.round === 2)).toEqual([
      expect.objectContaining({ teamA: 's1', teamB: null }),
      expect.objectContaining({ teamA: 's2', teamB: 's3' }),
    ])
  })
})

describe('drawSeeds', () => {
  it('par classement : garde l’ordre', () => {
    expect(drawSeeds(ids(6), 'ranking', seededRng(1))).toEqual(ids(6))
  })

  it('aléatoire : reproductible avec la même graine, et c’est une permutation', () => {
    const a = drawSeeds(ids(16), 'random', seededRng(42))
    expect(a).toEqual(drawSeeds(ids(16), 'random', seededRng(42)))
    expect(a).not.toEqual(ids(16))
    expect([...a].sort()).toEqual([...ids(16)].sort())
  })
})
