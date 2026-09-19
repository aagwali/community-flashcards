import type { Card, CardStatus } from './card'
import { CARD_STATUSES } from './card'

export interface Deck {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly maintainers: readonly string[]
  readonly order: number
  readonly cards: readonly Card[]
}

export type StatusCount = Record<CardStatus, number>

export function countByStatus(cards: readonly Card[]): StatusCount {
  const counts = Object.fromEntries(CARD_STATUSES.map((status) => [status, 0])) as StatusCount

  for (const card of cards) {
    counts[card.status] += 1
  }
  return counts
}

/** Ordre explicite d'abord (`order` dans deck.yml), puis titre. */
export function sortDecks(decks: readonly Deck[]): Deck[] {
  return [...decks].sort((a, b) => {
    const byOrder = a.order - b.order
    return byOrder !== 0 ? byOrder : a.title.localeCompare(b.title, 'fr')
  })
}

export function findCard(decks: readonly Deck[], cardIdentifier: string): Card | undefined {
  for (const deck of decks) {
    const found = deck.cards.find((card) => card.id === cardIdentifier)
    if (found) return found
  }
  return undefined
}
