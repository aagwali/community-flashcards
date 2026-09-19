import type { Card } from '../domain/card'
import type { Deck } from '../domain/deck'
import { sortDecks } from '../domain/deck'
import { parseCardFile, parseDeckManifest } from './parse'

/**
 * Le contenu est embarqué dans le bundle au moment du build.
 *
 * Conséquence assumée : publier une carte demande un build (≈ 1 min via la CI).
 * En échange, l'application n'a ni base de données, ni API, ni authentification —
 * et elle fonctionne hors ligne.
 */
const cardModules = import.meta.glob('/content/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const deckModules = import.meta.glob('/content/*/deck.yml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export interface ContentError {
  readonly file: string
  readonly errors: readonly string[]
}

export interface Content {
  readonly decks: readonly Deck[]
  readonly errors: readonly ContentError[]
}

export function loadContent(): Content {
  const errors: ContentError[] = []
  const cardsByDeck = new Map<string, Card[]>()

  for (const [path, raw] of Object.entries(cardModules)) {
    const location = locate(path)
    if (!location) continue

    const parsed = parseCardFile(raw, location.deckSlug, location.slug)
    if (!parsed.ok) {
      errors.push({ file: path, errors: parsed.errors })
      continue
    }

    const cards = cardsByDeck.get(location.deckSlug) ?? []
    cards.push(parsed.value)
    cardsByDeck.set(location.deckSlug, cards)
  }

  const decks: Deck[] = []

  for (const [path, raw] of Object.entries(deckModules)) {
    const deckSlug = path.split('/').at(-2)
    if (!deckSlug) continue

    const manifest = parseDeckManifest(raw)
    if (!manifest.ok) {
      errors.push({ file: path, errors: manifest.errors })
      continue
    }

    const cards = (cardsByDeck.get(deckSlug) ?? []).sort((a, b) => a.slug.localeCompare(b.slug, 'fr'))

    decks.push({ slug: deckSlug, ...manifest.value, cards })
  }

  return { decks: sortDecks(decks), errors }
}

function locate(path: string): { deckSlug: string; slug: string } | null {
  const segments = path.split('/')
  const file = segments.at(-1)
  const deckSlug = segments.at(-2)

  if (!file || !deckSlug || !file.endsWith('.md')) return null

  return { deckSlug, slug: file.slice(0, -'.md'.length) }
}
