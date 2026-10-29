import type { CupCount, Score, Settings } from './types'

/** Scores entiers entre 0 et le nombre de verres, sans match nul. */
export function isValidScore(score: Score, cups: CupCount): boolean {
  const inRange = (n: number) => Number.isInteger(n) && n >= 0 && n <= cups
  return inRange(score.a) && inRange(score.b) && score.a !== score.b
}

/** Points de classement gagnés par chaque équipe pour un score valide. */
export function matchPoints(score: Score, settings: Pick<Settings, 'winPoints' | 'lossPoints'>) {
  const win = settings.winPoints === 'cupDiff' ? Math.abs(score.a - score.b) : settings.winPoints
  const loss = settings.lossPoints
  return score.a > score.b ? { a: win, b: loss } : { a: loss, b: win }
}
