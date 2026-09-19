import { describe, expect, it } from 'vitest'
import type { ReviewState } from './scheduling'
import {
  DEFAULT_SCHEDULER_CONFIG as config,
  answer,
  formatDelay,
  initialState,
  isDue,
  isLeech,
  preview,
} from './scheduling'

const NOW = Date.UTC(2026, 8, 19, 12, 0, 0)
const MINUTE = 60_000
const DAY = 86_400_000

const reviewCard = (overrides: Partial<ReviewState> = {}): ReviewState => ({
  phase: 'review',
  step: 0,
  intervalDays: 10,
  ease: 2.5,
  lapses: 0,
  reviews: 5,
  dueAt: NOW,
  ...overrides,
})

describe('apprentissage', () => {
  it('démarre une carte neuve immédiatement due', () => {
    const state = initialState(NOW)
    expect(state.phase).toBe('learning')
    expect(isDue(state, NOW)).toBe(true)
  })

  it('avance d’un palier sur « Correct »', () => {
    const state = answer(initialState(NOW), 'good', NOW, config)
    expect(state.phase).toBe('learning')
    expect(state.step).toBe(1)
    expect(state.dueAt - NOW).toBe(10 * MINUTE)
  })

  it('diplôme la carte après le dernier palier', () => {
    const afterFirstStep = answer(initialState(NOW), 'good', NOW, config)
    const graduated = answer(afterFirstStep, 'good', NOW, config)

    expect(graduated.phase).toBe('review')
    expect(graduated.intervalDays).toBe(config.graduatingIntervalDays)
  })

  it('diplôme directement sur « Facile »', () => {
    const state = answer(initialState(NOW), 'easy', NOW, config)
    expect(state.phase).toBe('review')
    expect(state.intervalDays).toBe(config.easyIntervalDays)
  })

  it('ramène au premier palier sur « À revoir »', () => {
    const advanced = answer(initialState(NOW), 'good', NOW, config)
    const reset = answer(advanced, 'again', NOW, config)

    expect(reset.step).toBe(0)
    expect(reset.dueAt - NOW).toBe(1 * MINUTE)
  })

  it('ne compte pas d’oubli tant que la carte n’a pas diplômé', () => {
    const reset = answer(initialState(NOW), 'again', NOW, config)
    expect(reset.lapses).toBe(0)
  })
})

describe('révision', () => {
  it('multiplie l’intervalle par la facilité sur « Correct »', () => {
    const state = answer(reviewCard({ intervalDays: 10, ease: 2.5 }), 'good', NOW, config)
    expect(state.intervalDays).toBe(25)
    expect(state.ease).toBe(2.5)
  })

  it('applique un facteur réduit et abaisse la facilité sur « Difficile »', () => {
    const state = answer(reviewCard({ intervalDays: 10, ease: 2.5 }), 'hard', NOW, config)
    expect(state.intervalDays).toBe(12)
    expect(state.ease).toBe(2.35)
  })

  it('ajoute le bonus et relève la facilité sur « Facile »', () => {
    const state = answer(reviewCard({ intervalDays: 10, ease: 2.5 }), 'easy', NOW, config)
    expect(state.intervalDays).toBe(33)
    expect(state.ease).toBe(2.65)
  })

  it('ne descend jamais la facilité sous le plancher', () => {
    const state = answer(reviewCard({ ease: config.minimumEase }), 'hard', NOW, config)
    expect(state.ease).toBe(config.minimumEase)
  })

  it('plafonne l’intervalle', () => {
    const state = answer(reviewCard({ intervalDays: config.maximumIntervalDays }), 'easy', NOW, config)
    expect(state.intervalDays).toBe(config.maximumIntervalDays)
  })
})

describe('oubli', () => {
  it('bascule en ré-apprentissage, compte l’oubli et pénalise la facilité', () => {
    const lapsed = answer(reviewCard({ intervalDays: 30, ease: 2.5 }), 'again', NOW, config)

    expect(lapsed.phase).toBe('relearning')
    expect(lapsed.lapses).toBe(1)
    expect(lapsed.ease).toBe(2.3)
    expect(lapsed.dueAt - NOW).toBe(10 * MINUTE)
  })

  it('réduit l’intervalle sans jamais l’annuler', () => {
    const lapsed = answer(reviewCard({ intervalDays: 30 }), 'again', NOW, config)
    expect(lapsed.intervalDays).toBe(1)
  })

  it('sort du ré-apprentissage sans repartir de zéro', () => {
    const lapsed = answer(reviewCard({ intervalDays: 30 }), 'again', NOW, config)
    const recovered = answer(lapsed, 'good', NOW, config)

    expect(recovered.phase).toBe('review')
    expect(recovered.intervalDays).toBeGreaterThanOrEqual(config.graduatingIntervalDays)
  })

  it('signale une sangsue au-delà du seuil', () => {
    expect(isLeech(reviewCard({ lapses: config.leechThreshold - 1 }), config)).toBe(false)
    expect(isLeech(reviewCard({ lapses: config.leechThreshold }), config)).toBe(true)
  })
})

describe('preview', () => {
  it('ordonne les quatre échéances de la plus proche à la plus lointaine', () => {
    const delays = preview(reviewCard(), NOW, config)

    expect(delays.again).toBeLessThan(delays.hard)
    expect(delays.hard).toBeLessThan(delays.good)
    expect(delays.good).toBeLessThan(delays.easy)
  })

  it('ne modifie pas l’état de la carte', () => {
    const state = reviewCard()
    preview(state, NOW, config)
    expect(state).toEqual(reviewCard())
  })
})

describe('formatDelay', () => {
  it('choisit l’unité la plus lisible', () => {
    expect(formatDelay(10 * MINUTE)).toBe('10 min')
    expect(formatDelay(3 * 3_600_000)).toBe('3 h')
    expect(formatDelay(4 * DAY)).toBe('4 j')
    expect(formatDelay(60 * DAY)).toBe('2 mois')
    expect(formatDelay(730 * DAY)).toBe('2 ans')
  })
})
