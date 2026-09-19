import type { Tag } from './tag'
import { formatTag, sameTag } from './tag'

/**
 * Le statut porte le cycle de vie **communautaire** d'une carte, pas sa difficulté.
 *
 *  draft     — écrite par une personne, pas encore passée devant le groupe
 *  proposed  — discutée en session, en attente de validation par les participants
 *  validated — le groupe est d'accord : elle fait foi
 */
export const CARD_STATUSES = ['draft', 'proposed', 'validated'] as const

export type CardStatus = (typeof CARD_STATUSES)[number]

export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  draft: 'Brouillon',
  proposed: 'À valider',
  validated: 'Validée',
}

export interface Card {
  /** `<deck>/<slug>`, stable : c'est le chemin du fichier sans l'extension. */
  readonly id: string
  readonly deckSlug: string
  readonly slug: string
  /** Markdown. */
  readonly question: string
  /** Markdown. */
  readonly answer: string
  readonly tags: readonly Tag[]
  readonly status: CardStatus
  readonly author?: string
  readonly reviewers: readonly string[]
  readonly sources: readonly string[]
  /** Date de la session où la carte a été discutée (ISO `YYYY-MM-DD`). */
  readonly discussedAt?: string
}

export function cardId(deckSlug: string, slug: string): string {
  return `${deckSlug}/${slug}`
}

export function cardFilePath(card: Pick<Card, 'deckSlug' | 'slug'>): string {
  return `content/${card.deckSlug}/${card.slug}.md`
}

export function hasTag(card: Card, tag: Tag): boolean {
  return card.tags.some((candidate) => sameTag(candidate, tag))
}

/**
 * Recherche plein texte volontairement naïve : sur quelques centaines de cartes,
 * un `includes` insensible aux accents bat n'importe quel index à maintenir.
 */
export function matchesSearch(card: Card, search: string): boolean {
  const needle = normalize(search)
  if (needle.length === 0) return true

  const haystack = normalize(
    [card.question, card.answer, card.author ?? '', ...card.tags.map(formatTag)].join(' '),
  )
  return needle.split(/\s+/).every((word) => haystack.includes(word))
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/**
 * Dérive un slug de fichier depuis la question, pour les cartes créées dans l'app.
 * Le slug fait partie de l'URL du fichier : il doit rester court et stable.
 */
export function slugify(value: string, maxLength = 48): string {
  let slug = normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength)
    // On coupe sur un mot entier plutôt que de laisser un fragment illisible.
    const lastSeparator = slug.lastIndexOf('-')
    if (lastSeparator > 0) slug = slug.slice(0, lastSeparator)
  }

  slug = slug.replace(/^-+|-+$/g, '')
  return slug.length > 0 ? slug : 'carte'
}

/** Rend le slug unique au sein d'un deck : `dip`, `dip-2`, `dip-3`… */
export function uniqueSlug(desired: string, taken: readonly string[]): string {
  if (!taken.includes(desired)) return desired

  let suffix = 2
  while (taken.includes(`${desired}-${suffix}`)) suffix += 1
  return `${desired}-${suffix}`
}
