import type { Card } from '../domain/card'
import type { Deck } from '../domain/deck'
import { formatTag } from '../domain/tag'
import type { CardDraft, DraftsByCardId } from './ports'

/**
 * Superpose les brouillons locaux au contenu publié.
 *
 * Le contenu du dépôt reste la référence ; ce que l'utilisateur modifie dans
 * l'application se voit immédiatement, mais reste marqué comme non publié tant
 * que la Pull Request n'est pas passée.
 */
export function applyDrafts(decks: readonly Deck[], drafts: DraftsByCardId): Deck[] {
  const createdByDeck = new Map<string, Card[]>()

  for (const draft of Object.values(drafts)) {
    if (draft.origin !== 'created') continue
    const existing = createdByDeck.get(draft.card.deckSlug) ?? []
    existing.push(draft.card)
    createdByDeck.set(draft.card.deckSlug, existing)
  }

  return decks.map((deck) => ({
    ...deck,
    cards: [
      ...deck.cards.map((card) => drafts[card.id]?.card ?? card),
      ...(createdByDeck.get(deck.slug) ?? []).sort((a, b) => a.slug.localeCompare(b.slug, 'fr')),
    ],
  }))
}

/** Un brouillon qui n'apporte rien ne doit pas encombrer la file de publication. */
export function isMeaningfulDraft(draft: CardDraft, published: Card | undefined): boolean {
  if (draft.origin === 'created') return true
  if (draft.note.trim().length > 0) return true
  if (!published) return true
  return !sameContent(draft.card, published)
}

export function sameContent(a: Card, b: Card): boolean {
  return (
    a.question.trim() === b.question.trim() &&
    a.answer.trim() === b.answer.trim() &&
    a.status === b.status &&
    a.tags.map(formatTag).join(',') === b.tags.map(formatTag).join(',')
  )
}

export function draftList(drafts: DraftsByCardId): CardDraft[] {
  return Object.values(drafts).sort((a, b) => b.updatedAt - a.updatedAt)
}
