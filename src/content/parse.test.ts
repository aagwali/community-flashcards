import { describe, expect, it } from 'vitest'
import { formatTag } from '../domain/tag'
import { parseCardFile, parseDeckManifest } from './parse'
import { serializeCard } from './serialize'

const valid = `---
tags: [theme:solid, lang:typescript]
status: proposed
author: adrien
discussedAt: 2026-09-12
---

## Question

Pourquoi ce code viole-t-il le DIP ?

## Réponse

Parce que le haut niveau dépend du bas niveau.
`

describe('parseCardFile', () => {
  it('lit l’en-tête, les tags et les deux sections', () => {
    const parsed = parseCardFile(valid, 'solid', 'dip')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.value.id).toBe('solid/dip')
    expect(parsed.value.status).toBe('proposed')
    expect(parsed.value.author).toBe('adrien')
    expect(parsed.value.discussedAt).toBe('2026-09-12')
    expect(parsed.value.tags.map(formatTag)).toEqual(['theme:solid', 'lang:typescript'])
    expect(parsed.value.question).toBe('Pourquoi ce code viole-t-il le DIP ?')
    expect(parsed.value.answer).toBe('Parce que le haut niveau dépend du bas niveau.')
  })

  it('applique les valeurs par défaut d’un en-tête minimal', () => {
    const minimal = `---
---

## Question

Q

## Réponse

R
`
    const parsed = parseCardFile(minimal, 'deck', 'slug')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.value.status).toBe('draft')
    expect(parsed.value.tags).toEqual([])
    expect(parsed.value.author).toBeUndefined()
  })

  it('accepte « Reponse » sans accent', () => {
    const parsed = parseCardFile(valid.replace('## Réponse', '## Reponse'), 'solid', 'dip')
    expect(parsed.ok).toBe(true)
  })

  it('n’ouvre pas de section sur un « ## » situé dans un bloc de code', () => {
    const withCode = `---
---

## Question

\`\`\`bash
## ceci est un commentaire, pas un titre
echo ok
\`\`\`

## Réponse

R
`
    const parsed = parseCardFile(withCode, 'deck', 'slug')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.value.question).toContain('## ceci est un commentaire')
    expect(parsed.value.answer).toBe('R')
  })

  it('signale une section manquante', () => {
    const parsed = parseCardFile('---\n---\n\n## Question\n\nQ\n', 'deck', 'slug')
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return

    expect(parsed.errors).toContain('section "## Réponse" absente')
  })

  it('signale un tag hors taxonomie plutôt que de l’ignorer', () => {
    const parsed = parseCardFile(valid.replace('theme:solid', 'categorie:solid'), 'solid', 'dip')
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return

    expect(parsed.errors.join(' ')).toContain('tags.0')
  })

  it('signale un en-tête absent', () => {
    const parsed = parseCardFile('## Question\n\nQ\n', 'deck', 'slug')
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return

    expect(parsed.errors[0]).toContain('en-tête YAML absent')
  })

  it('signale un statut inconnu', () => {
    const parsed = parseCardFile(valid.replace('status: proposed', 'status: publie'), 'solid', 'dip')
    expect(parsed.ok).toBe(false)
  })
})

describe('parseDeckManifest', () => {
  it('lit un manifeste complet', () => {
    const parsed = parseDeckManifest('title: SOLID\ndescription: Les principes\norder: 1\n')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.value).toEqual({ title: 'SOLID', description: 'Les principes', maintainers: [], order: 1 })
  })

  it('exige un titre et une description', () => {
    expect(parseDeckManifest('title: SOLID\n').ok).toBe(false)
  })
})

describe('aller-retour parse / serialize', () => {
  it('conserve la carte à l’identique', () => {
    const first = parseCardFile(valid, 'solid', 'dip')
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const second = parseCardFile(serializeCard(first.value), 'solid', 'dip')
    expect(second.ok).toBe(true)
    if (!second.ok) return

    expect(second.value).toEqual(first.value)
  })

  it('conserve les sources et relecteurs, y compris avec des caractères YAML', () => {
    const first = parseCardFile(valid, 'solid', 'dip')
    if (!first.ok) throw new Error('fixture invalide')

    const enriched = {
      ...first.value,
      reviewers: ['marie', 'sofiane'],
      sources: ['Martin, R. C. : Clean Architecture', 'https://example.org/a?b=c'],
    }

    const round = parseCardFile(serializeCard(enriched), 'solid', 'dip')
    expect(round.ok).toBe(true)
    if (!round.ok) return

    expect(round.value.sources).toEqual(enriched.sources)
    expect(round.value.reviewers).toEqual(enriched.reviewers)
  })
})
