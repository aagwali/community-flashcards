import type { Card } from '../domain/card'
import type { ReviewState } from '../domain/scheduling'
import { isDue } from '../domain/scheduling'
import type { ProgressByCardId } from './ports'

export interface DeckProgress {
  readonly total: number
  /** Jamais vues. */
  readonly fresh: number
  /** En cours d'apprentissage ou de ré-apprentissage, échues. */
  readonly learning: number
  /** En révision, échues. */
  readonly due: number
  /** Programmées plus tard. */
  readonly scheduled: number
}

export function deckProgress(cards: readonly Card[], progress: ProgressByCardId, now: number): DeckProgress {
  let fresh = 0
  let learning = 0
  let due = 0
  let scheduled = 0

  for (const card of cards) {
    const state = progress[card.id]

    if (!state) fresh += 1
    else if (!isDue(state, now)) scheduled += 1
    else if (state.phase === 'review') due += 1
    else learning += 1
  }

  return { total: cards.length, fresh, learning, due, scheduled }
}

/**
 * File de révision.
 *
 * Ordre : ce qui est en apprentissage d'abord (c'est fragile, ça se perd vite),
 * puis les révisions échues de la plus en retard à la plus récente, puis les
 * cartes neuves. Pas de limite journalière — voir `domain/scheduling.ts`.
 */
export function reviewQueue(cards: readonly Card[], progress: ProgressByCardId, now: number): Card[] {
  const learning: { card: Card; state: ReviewState }[] = []
  const due: { card: Card; state: ReviewState }[] = []
  const fresh: Card[] = []

  for (const card of cards) {
    const state = progress[card.id]

    if (!state) fresh.push(card)
    else if (!isDue(state, now)) continue
    else if (state.phase === 'review') due.push({ card, state })
    else learning.push({ card, state })
  }

  const byDueDate = (a: { state: ReviewState }, b: { state: ReviewState }): number =>
    a.state.dueAt - b.state.dueAt

  return [
    ...learning.sort(byDueDate).map((entry) => entry.card),
    ...due.sort(byDueDate).map((entry) => entry.card),
    ...fresh,
  ]
}
