import { describe, expect, it } from 'vitest'
import { makeRandomTeams } from '../randomTeams'
import type { Player } from '../types'
import { seededRng } from './helpers'

const players = (n: number): Player[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `J${i + 1}` }))

describe('makeRandomTeams', () => {
  it('forme des équipes de 2 avec tous les joueurs une seule fois', () => {
    const teams = makeRandomTeams(players(8), seededRng(3))
    expect(teams).toHaveLength(4)
    expect(teams.every((t) => t.players.length === 2)).toBe(true)
    expect(teams.flatMap((t) => t.players.map((p) => p.id)).sort()).toEqual(
      players(8)
        .map((p) => p.id)
        .sort(),
    )
    expect(new Set(teams.map((t) => t.id)).size).toBe(4)
  })

  it('nombre impair : la dernière équipe a 3 joueurs', () => {
    const teams = makeRandomTeams(players(7), seededRng(3))
    expect(teams.map((t) => t.players.length)).toEqual([2, 2, 3])
  })

  it('reproductible avec la même graine', () => {
    expect(makeRandomTeams(players(10), seededRng(9))).toEqual(
      makeRandomTeams(players(10), seededRng(9)),
    )
  })

  it('refuse moins de 4 joueurs', () => {
    expect(() => makeRandomTeams(players(3), seededRng(1))).toThrow(/4 players/)
  })
})
