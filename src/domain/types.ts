/** Générateur aléatoire injectable, même contrat que Math.random : [0, 1). */
export type Rng = () => number

export type GameMode = 'single' | 'pool' | 'knockout' | 'poolKnockout'
/** EcE (équipe contre équipe) ou JcJ (1 contre 1). */
export type GameFormat = 'teams' | 'solo'
export type CupCount = 3 | 6 | 10 | 15
export type WinPoints = 'cupDiff' | 1 | 3 | 5
export type LossPoints = -2 | -1 | 0 | 1
export type QualifierCount = 2 | 4 | 8
/** Placement des têtes de série : par classement (ou ordre d'inscription) ou aléatoire. */
export type DrawMethod = 'ranking' | 'random'

export interface Settings {
  format: GameFormat
  cups: CupCount
  winPoints: WinPoints
  lossPoints: LossPoints
  qualifiers: QualifierCount
  draw: DrawMethod
  isPro: boolean
}

export interface Player {
  id: string
  name: string
}

export interface Team {
  id: string
  name: string
  players: Player[]
}

/** Verres touchés par teamA (a) et teamB (b). */
export interface Score {
  a: number
  b: number
}

export type Stage = 'pool' | 'bracket'

export interface Match {
  id: string
  stage: Stage
  round: number
  /** null : case du tableau en attente du vainqueur d'un match précédent. */
  teamA: string | null
  teamB: string | null
  score: Score | null
  nextMatchId?: string
  nextSlot?: 'teamA' | 'teamB'
}

export interface Tournament {
  mode: GameMode
  settings: Settings
  teams: Team[]
  matches: Match[]
  /** Identifiants des matchs validés, dans l'ordre de validation. */
  validated: string[]
}
