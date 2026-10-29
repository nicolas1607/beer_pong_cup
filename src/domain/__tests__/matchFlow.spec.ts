import { describe, expect, it } from 'vitest'
import {
  createTournament,
  nextMatch,
  pendingMatches,
  rerollMatch,
  startKnockout,
  tournamentWinner,
  undoLastMatch,
  validateMatch,
} from '../matchFlow'
import { sharesTeam } from '../roundRobin'
import type { Rng, Tournament } from '../types'
import { makeSettings, makeTeams, seededRng } from './helpers'

/** Joue tous les matchs proposés avec des scores aléatoires valides. */
function playAll(t: Tournament, rng: Rng): Tournament {
  let match = nextMatch(t)
  while (match) {
    const loser = Math.floor(rng() * t.settings.cups)
    t = validateMatch(
      t,
      match.id,
      rng() < 0.5 ? { a: t.settings.cups, b: loser } : { a: loser, b: t.settings.cups },
    )
    match = nextMatch(t)
  }
  return t
}

describe('createTournament', () => {
  const rng = seededRng(1)

  it.each([0, 1, 33])('refuse %i équipe(s)', (n) => {
    expect(() => createTournament('pool', makeTeams(n), makeSettings(), rng)).toThrow(
      /2 to 32 teams/,
    )
  })

  it('version gratuite limitée à 8 équipes', () => {
    expect(() =>
      createTournament('pool', makeTeams(8), makeSettings({ isPro: false }), rng),
    ).not.toThrow()
    expect(() =>
      createTournament('pool', makeTeams(9), makeSettings({ isPro: false }), rng),
    ).toThrow(/8 teams/)
    expect(() =>
      createTournament('pool', makeTeams(32), makeSettings({ isPro: true }), rng),
    ).not.toThrow()
  })

  it('refuse des identifiants en double', () => {
    const teams = [...makeTeams(2), { id: 't1', name: 'bis', players: [] }]
    expect(() => createTournament('pool', teams, makeSettings(), rng)).toThrow(/unique/)
  })

  it('match simple : exactement 2 équipes, un seul match', () => {
    expect(createTournament('single', makeTeams(2), makeSettings(), rng).matches).toHaveLength(1)
    expect(() => createTournament('single', makeTeams(3), makeSettings(), rng)).toThrow(
      /exactly 2 teams/,
    )
  })

  it('poule + phase finale : moins de qualifiés que d’équipes', () => {
    expect(() =>
      createTournament('poolKnockout', makeTeams(4), makeSettings({ qualifiers: 4 }), rng),
    ).toThrow(/Qualifiers/)
    expect(() =>
      createTournament('poolKnockout', makeTeams(5), makeSettings({ qualifiers: 4 }), rng),
    ).not.toThrow()
  })
})

describe('déroulement d’une poule', () => {
  it.each([
    [2, 0],
    [3, 2],
    [5, 0],
    [10, 0],
    [17, 0],
    [32, 0],
  ])('%i équipes : tous les matchs, %i enchaînement(s) inévitable(s)', (n, repeats) => {
    const rng = seededRng(n)
    const t = playAll(createTournament('pool', makeTeams(n), makeSettings(), rng), rng)
    expect(t.validated).toHaveLength((n * (n - 1)) / 2)
    const order = t.validated.map((id) => t.matches.find((m) => m.id === id)!)
    expect(order.slice(1).filter((m, i) => sharesTeam(m, order[i]!))).toHaveLength(repeats)
    expect(tournamentWinner(t)).not.toBeNull()
  })

  it('l’utilisateur peut imposer un autre match, le suivant évite alors ses équipes', () => {
    let t = createTournament('pool', makeTeams(6), makeSettings(), seededRng(1))
    const forced = pendingMatches(t).slice(-1)[0]!
    t = validateMatch(t, forced.id, { a: 6, b: 2 })
    expect(sharesTeam(nextMatch(t)!, forced)).toBe(false)
  })

  it('refuse un score invalide, un match inconnu ou déjà validé', () => {
    let t = createTournament('pool', makeTeams(4), makeSettings(), seededRng(1))
    const id = nextMatch(t)!.id
    expect(() => validateMatch(t, id, { a: 3, b: 3 })).toThrow(/Invalid score/)
    expect(() => validateMatch(t, id, { a: 7, b: 0 })).toThrow(/Invalid score/)
    expect(() => validateMatch(t, 'nope', { a: 6, b: 0 })).toThrow(/Unknown match/)
    t = validateMatch(t, id, { a: 6, b: 0 })
    expect(() => validateMatch(t, id, { a: 6, b: 0 })).toThrow(/already validated/)
  })

  it('ne modifie pas le tournoi d’origine', () => {
    const t = createTournament('pool', makeTeams(4), makeSettings(), seededRng(1))
    const copy = structuredClone(t)
    validateMatch(t, nextMatch(t)!.id, { a: 6, b: 0 })
    expect(t).toEqual(copy)
  })
})

describe('rerollMatch', () => {
  it('propose un match sans aucune équipe du match écarté', () => {
    const t = createTournament('pool', makeTeams(8), makeSettings(), seededRng(1))
    const rejected = nextMatch(t)!
    for (let seed = 0; seed < 20; seed++) {
      const other = rerollMatch(t, rejected, seededRng(seed))
      expect(other).not.toBeNull()
      expect(sharesTeam(other!, rejected)).toBe(false)
    }
  })

  it('null quand tous les matchs restants font jouer une équipe écartée', () => {
    const t = createTournament('pool', makeTeams(3), makeSettings(), seededRng(1))
    expect(rerollMatch(t, nextMatch(t)!, seededRng(1))).toBeNull()
  })
})

describe('undoLastMatch', () => {
  it('annule le dernier match validé', () => {
    const start = createTournament('pool', makeTeams(4), makeSettings(), seededRng(1))
    const t = validateMatch(start, nextMatch(start)!.id, { a: 6, b: 1 })
    expect(undoLastMatch(t)).toEqual(start)
  })

  it('refuse quand rien n’a été validé', () => {
    expect(() =>
      undoLastMatch(createTournament('pool', makeTeams(4), makeSettings(), seededRng(1))),
    ).toThrow(/No match to undo/)
  })

  it('élimination : retire aussi le vainqueur du tour suivant', () => {
    const start = createTournament('knockout', makeTeams(4), makeSettings(), seededRng(1))
    const t = validateMatch(start, 'ko-1-1', { a: 6, b: 2 })
    expect(t.matches.find((m) => m.id === 'ko-2-1')!.teamA).toBe('t1')
    expect(undoLastMatch(t)).toEqual(start)
  })

  it('poule verrouillée une fois la phase finale lancée', () => {
    const rng = seededRng(5)
    const pool = playAll(
      createTournament('poolKnockout', makeTeams(5), makeSettings({ qualifiers: 2 }), rng),
      rng,
    )
    expect(() => undoLastMatch(pool)).not.toThrow()
    expect(() => undoLastMatch(startKnockout(pool, rng))).toThrow(/locked/)
  })
})

describe('phase finale', () => {
  it('refuse de démarrer avant la fin de la poule', () => {
    const t = createTournament(
      'poolKnockout',
      makeTeams(5),
      makeSettings({ qualifiers: 4 }),
      seededRng(1),
    )
    expect(() => startKnockout(t, seededRng(1))).toThrow(/pool matches must be played/)
  })

  it.each([2, 4, 8] as const)('top %i : 1er contre dernier qualifié', (qualifiers) => {
    const rng = seededRng(qualifiers)
    const settings = makeSettings({ qualifiers, cups: 10 })
    let t = createTournament('poolKnockout', makeTeams(10), settings, rng)
    // l’équipe d’indice le plus petit gagne toujours, nettement : classement t1, t2, t3…
    for (const m of t.matches) {
      const aWins = Number(m.teamA!.slice(1)) < Number(m.teamB!.slice(1))
      t = validateMatch(t, m.id, aWins ? { a: 10, b: 0 } : { a: 0, b: 10 })
    }
    t = startKnockout(t, rng)
    const bracket = t.matches.filter((m) => m.stage === 'bracket')
    expect(bracket).toHaveLength(qualifiers - 1)
    expect(bracket[0]).toMatchObject({ teamA: 't1', teamB: `t${qualifiers}` })
    expect(bracket.flatMap((m) => [m.teamA, m.teamB]).filter(Boolean)).toHaveLength(qualifiers)
    expect(() => startKnockout(t, rng)).toThrow(/already started/)

    t = playAll(t, rng)
    expect(tournamentWinner(t)).toMatch(/^t[1-8]$/)
  })

  it.each([2, 3, 7, 10, 32])('élimination directe à %i équipes jusqu’au vainqueur', (n) => {
    const rng = seededRng(n)
    let t = createTournament('knockout', makeTeams(n), makeSettings({ draw: 'random' }), rng)
    expect(tournamentWinner(t)).toBeNull()
    t = playAll(t, rng)
    expect(t.validated).toHaveLength(n - 1)
    expect(tournamentWinner(t)).not.toBeNull()
  })

  it('match simple : le gagnant est le vainqueur', () => {
    let t = createTournament('single', makeTeams(2), makeSettings(), seededRng(1))
    t = validateMatch(t, t.matches[0]!.id, { a: 2, b: 6 })
    expect(tournamentWinner(t)).toBe('t2')
  })
})
