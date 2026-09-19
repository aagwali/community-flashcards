import { describe, expect, it } from 'vitest'
import type { Card } from './card'
import { cardFilePath, matchesSearch, slugify, suggestedStatusAfterEdit, uniqueSlug } from './card'
import { parseTag } from './tag'

const card: Card = {
  id: 'solid/dependency-inversion',
  deckSlug: 'solid',
  slug: 'dependency-inversion',
  question: 'Pourquoi ce code viole-t-il le principe d’inversion des dépendances ?',
  answer: 'Le module de haut niveau dépend d’un détail de bas niveau.',
  tags: [parseTag('theme:solid')!, parseTag('lang:typescript')!],
  status: 'proposed',
  author: 'adrien',
  reviewers: [],
  sources: [],
}

describe('cardFilePath', () => {
  it('reconstruit le chemin du fichier source', () => {
    expect(cardFilePath(card)).toBe('content/solid/dependency-inversion.md')
  })
})

describe('suggestedStatusAfterEdit', () => {
  const validated: Card = { ...card, status: 'validated' }

  it('fait redescendre une carte validée dont le fond change', () => {
    expect(suggestedStatusAfterEdit(validated, 'Une autre question ?', validated.answer)).toBe('proposed')
    expect(suggestedStatusAfterEdit(validated, validated.question, 'Une autre réponse.')).toBe('proposed')
  })

  it('laisse la carte validée si le fond est identique', () => {
    expect(suggestedStatusAfterEdit(validated, validated.question, validated.answer)).toBe('validated')
  })

  it('ignore les espaces de bord, qui ne changent rien au fond', () => {
    expect(suggestedStatusAfterEdit(validated, `  ${validated.question}  `, `\n${validated.answer}\n`)).toBe(
      'validated',
    )
  })

  it('ne touche pas aux statuts qui ne prétendent rien', () => {
    expect(suggestedStatusAfterEdit({ ...card, status: 'draft' }, 'autre', 'autre')).toBe('draft')
    expect(suggestedStatusAfterEdit({ ...card, status: 'proposed' }, 'autre', 'autre')).toBe('proposed')
  })
})

describe('matchesSearch', () => {
  it('ignore les accents et la casse', () => {
    expect(matchesSearch(card, 'DEPENDANCES')).toBe(true)
    expect(matchesSearch(card, 'dépendances')).toBe(true)
  })

  it('exige que tous les mots soient présents', () => {
    expect(matchesSearch(card, 'inversion module')).toBe(true)
    expect(matchesSearch(card, 'inversion kubernetes')).toBe(false)
  })

  it('cherche aussi dans les tags et l’auteur', () => {
    expect(matchesSearch(card, 'typescript')).toBe(true)
    expect(matchesSearch(card, 'adrien')).toBe(true)
  })

  it('ne filtre rien quand la recherche est vide', () => {
    expect(matchesSearch(card, '   ')).toBe(true)
  })
})

describe('slugify', () => {
  it('produit un identifiant de fichier lisible', () => {
    expect(slugify('Qu’est-ce que le principe de Liskov ?')).toBe('qu-est-ce-que-le-principe-de-liskov')
  })

  it('tronque sans laisser de tiret orphelin', () => {
    expect(slugify('abcdef ghijkl', 8)).toBe('abcdef')
  })

  it('retombe sur une valeur par défaut plutôt que sur une chaîne vide', () => {
    expect(slugify('??? !!!')).toBe('carte')
  })
})

describe('uniqueSlug', () => {
  it('laisse le slug intact quand il est libre', () => {
    expect(uniqueSlug('liskov', ['solid'])).toBe('liskov')
  })

  it('suffixe jusqu’à trouver une place', () => {
    expect(uniqueSlug('liskov', ['liskov', 'liskov-2'])).toBe('liskov-3')
  })
})
