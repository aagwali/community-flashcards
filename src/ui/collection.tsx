import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { CardDraft, DraftsByCardId } from '../application/ports'
import { applyDrafts, draftList, isMeaningfulDraft } from '../application/collection'
import type { ContentError } from '../content/load'
import { loadContent } from '../content/load'
import type { Card } from '../domain/card'
import { cardId, slugify, uniqueSlug } from '../domain/card'
import type { Deck } from '../domain/deck'
import { createLocalStore } from '../infrastructure/local-store'

/** Le contenu publié est figé à la compilation : on le charge une fois. */
const published = loadContent()

const draftStore = createLocalStore<DraftsByCardId>('drafts', () => ({}))

interface CollectionValue {
  /** Contenu publié, recouvert des modifications locales. */
  readonly decks: readonly Deck[]
  readonly errors: readonly ContentError[]
  readonly drafts: DraftsByCardId
  readonly pending: readonly CardDraft[]
  publishedCard(id: string): Card | undefined
  saveCard(card: Card, note?: string): void
  createCard(deckSlug: string): Card | null
  discard(id: string): void
  discardAll(): void
}

const CollectionContext = createContext<CollectionValue | null>(null)

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<DraftsByCardId>(() => draftStore.read())

  const persist = useCallback((next: DraftsByCardId) => {
    draftStore.write(next)
    setDrafts(next)
  }, [])

  const publishedCard = useCallback(
    (id: string): Card | undefined =>
      published.decks.flatMap((deck) => deck.cards).find((card) => card.id === id),
    [],
  )

  const saveCard = useCallback(
    (card: Card, note?: string) => {
      const existing = drafts[card.id]
      const origin = existing?.origin ?? (publishedCard(card.id) ? 'edited' : 'created')

      const draft: CardDraft = {
        card,
        origin,
        note: note ?? existing?.note ?? '',
        updatedAt: Date.now(),
      }

      const next = { ...drafts }
      // Une modification revenue à son état publié doit disparaître de la file.
      if (isMeaningfulDraft(draft, publishedCard(card.id))) next[card.id] = draft
      else delete next[card.id]

      persist(next)
    },
    [drafts, persist, publishedCard],
  )

  const createCard = useCallback(
    (deckSlug: string): Card | null => {
      const deck = published.decks.find((candidate) => candidate.slug === deckSlug)
      if (!deck) return null

      const taken = [
        ...deck.cards.map((card) => card.slug),
        ...Object.values(drafts)
          .filter((draft) => draft.card.deckSlug === deckSlug)
          .map((draft) => draft.card.slug),
      ]

      const slug = uniqueSlug(slugify(`nouvelle carte`), taken)
      const card: Card = {
        id: cardId(deckSlug, slug),
        deckSlug,
        slug,
        question: '',
        answer: '',
        tags: [],
        status: 'draft',
        reviewers: [],
        sources: [],
      }

      persist({
        ...drafts,
        [card.id]: { card, origin: 'created', note: '', updatedAt: Date.now() },
      })

      return card
    },
    [drafts, persist],
  )

  const discard = useCallback(
    (id: string) => {
      const next = { ...drafts }
      delete next[id]
      persist(next)
    },
    [drafts, persist],
  )

  const discardAll = useCallback(() => persist({}), [persist])

  const value = useMemo<CollectionValue>(
    () => ({
      decks: applyDrafts(published.decks, drafts),
      errors: published.errors,
      drafts,
      pending: draftList(drafts),
      publishedCard,
      saveCard,
      createCard,
      discard,
      discardAll,
    }),
    [drafts, publishedCard, saveCard, createCard, discard, discardAll],
  )

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
}

export function useCollection(): CollectionValue {
  const value = useContext(CollectionContext)
  if (!value) throw new Error('useCollection doit être utilisé dans un CollectionProvider')
  return value
}

export function useDeck(slug: string | undefined): Deck | undefined {
  const { decks } = useCollection()
  return decks.find((deck) => deck.slug === slug)
}
