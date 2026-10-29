import type { Rng, Settings, Team } from '../types'

/** mulberry32 : générateur reproductible pour les tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeTeams(n: number): Team[] {
  return Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, name: `T${i + 1}`, players: [] }))
}

export function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    format: 'teams',
    cups: 6,
    winPoints: 3,
    lossPoints: 0,
    qualifiers: 4,
    draw: 'ranking',
    isPro: true,
    ...overrides,
  }
}
