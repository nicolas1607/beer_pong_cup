import { shuffle } from './random'
import type { Player, Rng, Team } from './types'

/** Équipes de 2 tirées au hasard ; avec un nombre impair de joueurs, la dernière équipe en a 3. */
export function makeRandomTeams(players: readonly Player[], rng: Rng): Team[] {
  if (players.length < 4) throw new Error('At least 4 players are needed to form 2 teams')
  const shuffled = shuffle(players, rng)
  const teams: Player[][] = []
  for (let i = 0; i + 1 < shuffled.length; i += 2) teams.push(shuffled.slice(i, i + 2))
  const odd = shuffled.length % 2 ? shuffled[shuffled.length - 1] : undefined
  if (odd) teams[teams.length - 1]?.push(odd)
  return teams.map((members, i) => ({
    id: `team-${i + 1}`,
    name: members.map((p) => p.name).join(' & '),
    players: members,
  }))
}
