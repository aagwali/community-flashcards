import { marked } from 'marked'
import type { Card } from '../domain/card'
import type { Deck } from '../domain/deck'
import { formatTag } from '../domain/tag'

/**
 * Sortie vers l'extérieur.
 *
 * Le contenu ne doit jamais être prisonnier de cette application : il vit déjà
 * en Markdown dans le dépôt, et s'exporte ici au format que comprend Anki, pour
 * qui préfère son propre outil.
 */

export function toAnkiCsv(decks: readonly Deck[]): string {
  const rows = decks.flatMap((deck) => deck.cards.map((card) => csvRow(card, deck)))

  return [
    '#separator:comma',
    '#html:true',
    '#notetype column:0',
    '#deck column:4',
    '#tags column:3',
    ...rows,
  ].join('\n')
}

function csvRow(card: Card, deck: Deck): string {
  const fields = [
    renderHtml(card.question),
    renderHtml(card.answer),
    card.tags.map((tag) => formatTag(tag).replace(':', '::')).join(' '),
    deck.title,
  ]
  return fields.map(quoteCsv).join(',')
}

function quoteCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function renderHtml(markdown: string): string {
  return marked.parse(markdown, { async: false, gfm: true, breaks: false })
}

/** Export brut, pour réimporter ailleurs ou archiver. */
export function toJson(decks: readonly Deck[]): string {
  return JSON.stringify(
    decks.map((deck) => ({
      slug: deck.slug,
      title: deck.title,
      description: deck.description,
      cards: deck.cards.map((card) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        tags: card.tags.map(formatTag),
        status: card.status,
        author: card.author ?? null,
      })),
    })),
    null,
    2,
  )
}

export function download(filename: string, content: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }))
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}
