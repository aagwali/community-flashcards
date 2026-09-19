import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { slugify } from '../domain/card'
import { parseCardFile, parseDeckManifest } from './parse'
import { serializeCard } from './serialize'

/**
 * La validation du contenu est une suite de tests, pas un script à part : une
 * carte mal formée casse la CI comme n'importe quelle régression, et l'auteur
 * de la Pull Request lit un message d'erreur qui le situe dans SON fichier.
 */

const CONTENT_ROOT = fileURLToPath(new URL('../../content', import.meta.url))

interface CardFile {
  readonly deckSlug: string
  readonly slug: string
  readonly path: string
  readonly raw: string
}

const deckSlugs = readdirSync(CONTENT_ROOT).filter((entry) =>
  statSync(join(CONTENT_ROOT, entry)).isDirectory(),
)

const cardFiles: CardFile[] = deckSlugs.flatMap((deckSlug) =>
  readdirSync(join(CONTENT_ROOT, deckSlug))
    .filter((file) => file.endsWith('.md'))
    .map((file) => ({
      deckSlug,
      slug: file.slice(0, -'.md'.length),
      path: `content/${deckSlug}/${file}`,
      raw: readFileSync(join(CONTENT_ROOT, deckSlug, file), 'utf8'),
    })),
)

describe('arborescence', () => {
  it('contient au moins un deck', () => {
    expect(deckSlugs.length).toBeGreaterThan(0)
  })

  it.each(deckSlugs)('le deck "%s" est nommé en kebab-case', (deckSlug) => {
    expect(deckSlug).toBe(slugify(deckSlug))
  })

  it.each(deckSlugs)('le deck "%s" déclare un deck.yml valide', (deckSlug) => {
    const path = join(CONTENT_ROOT, deckSlug, 'deck.yml')
    const parsed = parseDeckManifest(readFileSync(path, 'utf8'))

    expect(parsed.ok ? [] : parsed.errors).toEqual([])
  })

  it.each(deckSlugs)('le deck "%s" contient au moins une carte', (deckSlug) => {
    expect(cardFiles.filter((card) => card.deckSlug === deckSlug).length).toBeGreaterThan(0)
  })
})

describe('cartes', () => {
  it('trouve des cartes à valider', () => {
    expect(cardFiles.length).toBeGreaterThan(0)
  })

  it.each(cardFiles.map((card) => [card.path, card] as const))('%s respecte le format', (_path, card) => {
    const parsed = parseCardFile(card.raw, card.deckSlug, card.slug)

    expect(parsed.ok ? [] : parsed.errors).toEqual([])
  })

  it.each(cardFiles.map((card) => [card.path, card] as const))(
    '%s porte un nom de fichier en kebab-case',
    (_path, card) => {
      expect(card.slug).toBe(slugify(card.slug))
    },
  )

  it.each(cardFiles.map((card) => [card.path, card] as const))(
    '%s survit à un aller-retour de sérialisation',
    (_path, card) => {
      const parsed = parseCardFile(card.raw, card.deckSlug, card.slug)
      if (!parsed.ok) return

      const round = parseCardFile(serializeCard(parsed.value), card.deckSlug, card.slug)
      expect(round.ok && round.value).toEqual(parsed.value)
    },
  )
})
