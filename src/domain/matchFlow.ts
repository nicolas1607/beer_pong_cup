import { buildBracket, drawSeeds } from './bracket'
import { createPoolMatches, sharesTeam } from './roundRobin'
import { isValidScore } from './scoring'
import { computeStandings } from './standings'
import type { GameMode, Match, Rng, Score, Settings, Team, Tournament } from './types'

export const MIN_TEAMS = 2
export const MAX_TEAMS = 32
export const FREE_MAX_TEAMS = 8

export function maxTeams(settings: Pick<Settings, 'isPro'>): number {
  return settings.isPro ? MAX_TEAMS : FREE_MAX_TEAMS
}

export function createTournament(
  mode: GameMode,
  teams: readonly Team[],
  settings: Settings,
  rng: Rng,
): Tournament {
  const ids = teams.map((t) => t.id)
  if (ids.length < MIN_TEAMS || ids.length > MAX_TEAMS)
    throw new Error('A tournament needs 2 to 32 teams')
  if (ids.length > maxTeams(settings)) throw new Error('The free version is limited to 8 teams')
  if (new Set(ids).size !== ids.length) throw new Error('Team ids must be unique')
  if (mode === 'single' && ids.length !== 2) throw new Error('A single match needs exactly 2 teams')
  if (mode === 'poolKnockout' && settings.qualifiers >= ids.length)
    throw new Error('Qualifiers must be fewer than the teams')

  const matches =
    mode === 'pool' || mode === 'poolKnockout'
      ? createPoolMatches(ids)
      : buildBracket(drawSeeds(ids, mode === 'single' ? 'ranking' : settings.draw, rng))
  return { mode, settings, teams: [...teams], matches, validated: [] }
}

export function isKnockoutStarted(t: Tournament): boolean {
  return t.matches.some((m) => m.stage === 'bracket')
}

/** Matchs jouables : pas encore validés et dont les deux équipes sont connues. */
export function pendingMatches(t: Tournament): Match[] {
  return t.matches.filter((m) => !m.score && m.teamA !== null && m.teamB !== null)
}

function lastValidated(t: Tournament): Match | undefined {
  const id = t.validated[t.validated.length - 1]
  return t.matches.find((m) => m.id === id)
}

/** Prochain match prévu, en évitant les équipes du dernier match validé quand c'est possible. */
export function nextMatch(t: Tournament): Match | null {
  const pending = pendingMatches(t)
  const last = lastValidated(t)
  return pending.find((m) => !last || !sharesTeam(m, last)) ?? pending[0] ?? null
}

/**
 * Autre match au hasard, sans aucune des équipes du match écarté.
 * null si tous les matchs restants font jouer l'une d'elles.
 */
export function rerollMatch(t: Tournament, rejected: Match, rng: Rng): Match | null {
  const last = lastValidated(t)
  const candidates = pendingMatches(t).filter((m) => !sharesTeam(m, rejected))
  const rested = candidates.filter((m) => !last || !sharesTeam(m, last))
  const choices = rested.length ? rested : candidates
  return choices[Math.floor(rng() * choices.length)] ?? null
}

/** Valide le score de n'importe quel match jouable (l'utilisateur peut imposer le match). */
export function validateMatch(t: Tournament, matchId: string, score: Score): Tournament {
  const match = t.matches.find((m) => m.id === matchId)
  if (!match) throw new Error(`Unknown match ${matchId}`)
  if (match.score) throw new Error('Match already validated')
  if (match.teamA === null || match.teamB === null) throw new Error('Match teams are not known yet')
  if (!isValidScore(score, t.settings.cups)) throw new Error('Invalid score')

  const winner = score.a > score.b ? match.teamA : match.teamB
  return {
    ...t,
    matches: t.matches.map((m) => {
      if (m.id === match.id) return { ...m, score: { ...score } }
      if (m.id === match.nextMatchId && match.nextSlot) return { ...m, [match.nextSlot]: winner }
      return m
    }),
    validated: [...t.validated, match.id],
  }
}

/** Annule le dernier match validé. Interdit pour un match de poule une fois la phase finale lancée. */
export function undoLastMatch(t: Tournament): Tournament {
  const match = lastValidated(t)
  if (!match) throw new Error('No match to undo')
  if (match.stage === 'pool' && isKnockoutStarted(t))
    throw new Error('Pool matches are locked once the knockout stage has started')

  return {
    ...t,
    matches: t.matches.map((m) => {
      if (m.id === match.id) return { ...m, score: null }
      if (m.id === match.nextMatchId && match.nextSlot) return { ...m, [match.nextSlot]: null }
      return m
    }),
    validated: t.validated.slice(0, -1),
  }
}

/** Poule + phase finale : les N premiers du classement passent dans le tableau. */
export function startKnockout(t: Tournament, rng: Rng): Tournament {
  if (t.mode !== 'poolKnockout')
    throw new Error('Only pool + knockout tournaments have a knockout stage')
  if (isKnockoutStarted(t)) throw new Error('Knockout stage already started')
  if (t.matches.some((m) => !m.score)) throw new Error('All pool matches must be played first')

  const qualified = computeStandings(t.teams, t.matches, t.settings)
    .slice(0, t.settings.qualifiers)
    .map((s) => s.teamId)
  return {
    ...t,
    matches: [...t.matches, ...buildBracket(drawSeeds(qualified, t.settings.draw, rng))],
  }
}

/** Vainqueur du tournoi, ou null tant qu'il n'est pas terminé. */
export function tournamentWinner(t: Tournament): string | null {
  // buildBracket range la finale en dernier
  const bracket = t.matches.filter((m) => m.stage === 'bracket')
  const final = bracket[bracket.length - 1]
  if (final) {
    if (!final.score) return null
    return final.score.a > final.score.b ? final.teamA : final.teamB
  }
  if (t.mode === 'pool' && t.matches.every((m) => m.score))
    return computeStandings(t.teams, t.matches, t.settings)[0]?.teamId ?? null
  return null
}
