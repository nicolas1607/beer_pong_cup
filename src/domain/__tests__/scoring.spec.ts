import { describe, expect, it } from 'vitest'
import { isValidScore, matchPoints } from '../scoring'
import type { CupCount } from '../types'

describe('isValidScore', () => {
  it.each([3, 6, 10, 15] as CupCount[])('%i verres : bornes 0 et nombre de verres', (cups) => {
    expect(isValidScore({ a: cups, b: 0 }, cups)).toBe(true)
    expect(isValidScore({ a: 0, b: cups }, cups)).toBe(true)
    expect(isValidScore({ a: cups + 1, b: 0 }, cups)).toBe(false)
    expect(isValidScore({ a: 0, b: cups + 1 }, cups)).toBe(false)
  })

  it('accepte un score où le gagnant n’a pas touché tous les verres', () => {
    expect(isValidScore({ a: 4, b: 2 }, 6)).toBe(true)
  })

  it.each([
    [{ a: 3, b: 3 }, 'match nul'],
    [{ a: 6, b: 6 }, 'nul au maximum'],
    [{ a: -1, b: 2 }, 'négatif'],
    [{ a: 2.5, b: 1 }, 'non entier'],
    [{ a: Number.NaN, b: 1 }, 'NaN'],
  ])('refuse %o (%s)', (score) => {
    expect(isValidScore(score, 6)).toBe(false)
  })
})

describe('matchPoints', () => {
  it('écart de verres : le gagnant prend la différence, le perdant les points de défaite', () => {
    expect(matchPoints({ a: 6, b: 2 }, { winPoints: 'cupDiff', lossPoints: -1 })).toEqual({
      a: 4,
      b: -1,
    })
    expect(matchPoints({ a: 1, b: 6 }, { winPoints: 'cupDiff', lossPoints: 1 })).toEqual({
      a: 1,
      b: 5,
    })
  })

  it.each([1, 3, 5] as const)('victoire fixe à %i point(s)', (win) => {
    expect(matchPoints({ a: 6, b: 5 }, { winPoints: win, lossPoints: 0 })).toEqual({ a: win, b: 0 })
  })

  it.each([-2, -1, 0, 1] as const)('défaite à %i', (loss) => {
    expect(matchPoints({ a: 0, b: 6 }, { winPoints: 3, lossPoints: loss })).toEqual({
      a: loss,
      b: 3,
    })
  })
})
