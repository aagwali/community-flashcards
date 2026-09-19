import { describe, expect, it } from 'vitest'
import type { Card } from '../domain/card'
import type { ReviewState } from '../domain/scheduling'
import { initialState } from '../domain/scheduling'
import type { ProgressByCardId } from './ports'
import { deckProgress, reviewQueue } from './review'

const NOW = Date.UTC(2026, 8, 19, 12, 0, 0)
const DAY = 86_400_000

const card = (slug: string): Card => ({
  id: `deck/${slug}`,
  deckSlug: 'deck',
  slug,
  question: 'Q',
  answer: 'R',
  tags: [],
  status: 'validated',
  reviewers: [],
  sources: [],
})

const state = (overrides: Partial<ReviewState>): ReviewState => ({
  ...initialState(NOW),
  ...overrides,
})

describe('deckProgress', () => {
  it('répartit les cartes entre neuves, échues et programmées', () => {
    const cards = [card('a'), card('b'), card('c'), card('d')]
    const progress: ProgressByCardId = {
      'deck/b': state({ phase: 'learning', dueAt: NOW - 1000 }),
      'deck/c': state({ phase: 'review', dueAt: NOW - DAY }),
      'deck/d': state({ phase: 'review', dueAt: NOW + DAY }),
    }

    expect(deckProgress(cards, progress, NOW)).toEqual({
      total: 4,
      fresh: 1,
      learning: 1,
      due: 1,
      scheduled: 1,
    })
  })
})

describe('reviewQueue', () => {
  it('fait passer l’apprentissage avant les révisions, et les neuves en dernier', () => {
    const cards = [card('neuve'), card('revision'), card('apprentissage')]
    const progress: ProgressByCardId = {
      'deck/revision': state({ phase: 'review', dueAt: NOW - DAY }),
      'deck/apprentissage': state({ phase: 'learning', dueAt: NOW - 60_000 }),
    }

    expect(reviewQueue(cards, progress, NOW).map((c) => c.slug)).toEqual([
      'apprentissage',
      'revision',
      'neuve',
    ])
  })

  it('traite d’abord le plus en retard', () => {
    const cards = [card('recent'), card('ancien')]
    const progress: ProgressByCardId = {
      'deck/recent': state({ phase: 'review', dueAt: NOW - DAY }),
      'deck/ancien': state({ phase: 'review', dueAt: NOW - 30 * DAY }),
    }

    expect(reviewQueue(cards, progress, NOW).map((c) => c.slug)).toEqual(['ancien', 'recent'])
  })

  it('exclut ce qui n’est pas encore échu', () => {
    const cards = [card('plus-tard')]
    const progress: ProgressByCardId = { 'deck/plus-tard': state({ phase: 'review', dueAt: NOW + DAY }) }

    expect(reviewQueue(cards, progress, NOW)).toEqual([])
  })
})
