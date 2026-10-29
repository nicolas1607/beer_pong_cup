import { describe, expect, it } from 'vitest'
import { computeStandings } from '../standings'
import type { Match } from '../types'
import { makeSettings, makeTeams } from './helpers'

let seq = 0
function played(teamA: string, teamB: string, a: number, b: number): Match {
  return { id: `m${++seq}`, stage: 'pool', round: 1, teamA, teamB, score: { a, b } }
}
const order = (rows: { teamId: string }[]) => rows.map((r) => r.teamId)

describe('computeStandings', () => {
  it('compte les points selon les réglages', () => {
    const rows = computeStandings(makeTeams(2), [played('t1', 't2', 6, 1)], {
      winPoints: 'cupDiff',
      lossPoints: -1,
    })
    expect(rows[0]).toMatchObject({
      teamId: 't1',
      points: 5,
      wins: 1,
      cupsFor: 6,
      cupsAgainst: 1,
      cupDiff: 5,
    })
    expect(rows[1]).toMatchObject({ teamId: 't2', points: -1, losses: 1, cupDiff: -5 })
  })

  it('ignore les matchs non joués et la phase finale', () => {
    const matches: Match[] = [
      { id: 'p', stage: 'pool', round: 1, teamA: 't1', teamB: 't2', score: null },
      { id: 'k', stage: 'bracket', round: 1, teamA: 't1', teamB: 't2', score: { a: 6, b: 0 } },
    ]
    expect(
      computeStandings(makeTeams(2), matches, makeSettings()).every((r) => r.played === 0),
    ).toBe(true)
  })

  it('sans match joué : ordre d’inscription', () => {
    expect(order(computeStandings(makeTeams(4), [], makeSettings()))).toEqual([
      't1',
      't2',
      't3',
      't4',
    ])
  })

  it('égalité à 2 : la confrontation directe passe avant la différence de verres', () => {
    // t1 et t2 ont 6 points, t1 a battu t2 mais t2 a une meilleure différence
    const matches = [
      played('t1', 't2', 6, 5),
      played('t1', 't3', 6, 5),
      played('t1', 't4', 0, 6),
      played('t2', 't3', 6, 0),
      played('t2', 't4', 6, 0),
      played('t3', 't4', 6, 5),
    ]
    const rows = computeStandings(makeTeams(4), matches, makeSettings())
    expect(order(rows)).toEqual(['t1', 't2', 't3', 't4'])
    expect(rows[1]!.cupDiff).toBeGreaterThan(rows[0]!.cupDiff)
  })

  it('égalité à 2 : la confrontation directe compte la victoire même si le perdant prend autant de points', () => {
    // écart de verres + 1 point par défaite : t1 bat t2 6-5, chacun prend 1 point dans ce match.
    // t1 et t2 finissent à 8 points, t2 a la meilleure différence.
    const matches = [
      played('t1', 't2', 6, 5),
      played('t1', 't3', 0, 6),
      played('t1', 't4', 6, 0),
      played('t2', 't3', 6, 0),
      played('t2', 't4', 6, 5),
      played('t3', 't4', 6, 4),
    ]
    const rows = computeStandings(makeTeams(4), matches, { winPoints: 'cupDiff', lossPoints: 1 })
    expect(rows.map((r) => r.points)).toEqual([9, 8, 8, 3])
    expect(order(rows)).toEqual(['t3', 't1', 't2', 't4'])
    expect(rows[2]!.cupDiff).toBeGreaterThan(rows[1]!.cupDiff)
  })

  it('égalité à 3 : le mini-classement entre les équipes à égalité passe avant la différence de verres', () => {
    // t1, t2, t3 ont 2 victoires ; entre elles : t1 2 victoires, t2 1, t3 0. t3 a la meilleure différence.
    const matches = [
      played('t1', 't2', 10, 9),
      played('t1', 't3', 10, 9),
      played('t2', 't3', 10, 9),
      played('t1', 't4', 0, 10),
      played('t1', 't5', 0, 10),
      played('t2', 't4', 10, 9),
      played('t2', 't5', 9, 10),
      played('t3', 't4', 10, 0),
      played('t3', 't5', 10, 0),
      played('t4', 't5', 0, 10),
    ]
    const rows = computeStandings(makeTeams(5), matches, makeSettings({ cups: 10 }))
    expect(order(rows)).toEqual(['t5', 't1', 't2', 't3', 't4'])
    expect(rows[3]!.cupDiff).toBeGreaterThan(rows[1]!.cupDiff)
  })

  it('égalité à 3 en cercle : différence de verres puis verres marqués', () => {
    // t1 > t2, t2 > t3, t3 > t1 : mini-classement à égalité
    const matches = [played('t1', 't2', 6, 0), played('t2', 't3', 6, 1), played('t3', 't1', 6, 2)]
    const rows = computeStandings(makeTeams(3), matches, makeSettings())
    // différences : t1 +2, t2 -1, t3 -1 ; verres marqués : t3 7, t2 6
    expect(order(rows)).toEqual(['t1', 't3', 't2'])
  })

  it('égalité parfaite : ordre d’inscription', () => {
    const matches = [played('t2', 't1', 6, 0), played('t1', 't3', 6, 0), played('t3', 't2', 6, 0)]
    expect(order(computeStandings(makeTeams(3), matches, makeSettings()))).toEqual([
      't1',
      't2',
      't3',
    ])
  })
})
