import { describe, expect, it } from 'vitest'
import { formatTag, parseTag, sortTags } from './tag'

describe('parseTag', () => {
  it('accepte un espace de nom connu et une valeur en kebab-case', () => {
    expect(parseTag('theme:solid')).toEqual({ namespace: 'theme', value: 'solid' })
    expect(parseTag('lang:c-sharp')).toEqual({ namespace: 'lang', value: 'c-sharp' })
  })

  it('refuse un espace de nom inconnu', () => {
    expect(parseTag('categorie:solid')).toBeNull()
  })

  it('refuse une valeur qui inviterait à la dérive', () => {
    expect(parseTag('theme:SOLID')).toBeNull()
    expect(parseTag('theme:principes solid')).toBeNull()
    expect(parseTag('theme:-solid')).toBeNull()
    expect(parseTag('theme:')).toBeNull()
  })

  it('refuse un tag sans espace de nom', () => {
    expect(parseTag('solid')).toBeNull()
  })

  it('conserve les deux-points suivants dans la valeur pour mieux la rejeter', () => {
    expect(parseTag('theme:a:b')).toBeNull()
  })
})

describe('formatTag', () => {
  it("est l'inverse de parseTag", () => {
    const raw = 'niveau:confirme'
    const tag = parseTag(raw)
    expect(tag).not.toBeNull()
    expect(formatTag(tag!)).toBe(raw)
  })
})

describe('sortTags', () => {
  it("groupe par espace de nom dans l'ordre de déclaration", () => {
    const tags = ['lang:typescript', 'type:piege', 'theme:solid'].map((raw) => parseTag(raw)!)

    expect(sortTags(tags).map(formatTag)).toEqual(['theme:solid', 'type:piege', 'lang:typescript'])
  })
})
