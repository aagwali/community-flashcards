/**
 * Les tags sont une taxonomie **fermée sur l'espace de nom**, libre sur la valeur.
 *
 * `theme:solid`, `lang:typescript`, `niveau:junior`, `type:piege`…
 *
 * Fermer l'espace de nom évite la dérive classique (`solid`, `SOLID`, `#solid`,
 * `principes-solid`) sans imposer une liste de valeurs qu'il faudrait maintenir
 * à chaque nouvelle session.
 */

export const TAG_NAMESPACES = ['theme', 'type', 'niveau', 'lang'] as const

export type TagNamespace = (typeof TAG_NAMESPACES)[number]

export interface Tag {
  readonly namespace: TagNamespace
  readonly value: string
}

export const TAG_NAMESPACE_LABELS: Record<TagNamespace, string> = {
  theme: 'Thème',
  type: 'Type',
  niveau: 'Niveau',
  lang: 'Langage',
}

const VALUE_PATTERN = /^[a-z0-9][a-z0-9-]*$/

export function parseTag(raw: string): Tag | null {
  const separator = raw.indexOf(':')
  if (separator === -1) return null

  const namespace = raw.slice(0, separator)
  const value = raw.slice(separator + 1)

  if (!isTagNamespace(namespace)) return null
  if (!VALUE_PATTERN.test(value)) return null

  return { namespace, value }
}

export function formatTag(tag: Tag): string {
  return `${tag.namespace}:${tag.value}`
}

export function isTagNamespace(candidate: string): candidate is TagNamespace {
  return (TAG_NAMESPACES as readonly string[]).includes(candidate)
}

export function sameTag(a: Tag, b: Tag): boolean {
  return a.namespace === b.namespace && a.value === b.value
}

/** Trie par espace de nom (ordre de déclaration) puis alphabétiquement. */
export function sortTags(tags: readonly Tag[]): Tag[] {
  return [...tags].sort((a, b) => {
    const byNamespace = TAG_NAMESPACES.indexOf(a.namespace) - TAG_NAMESPACES.indexOf(b.namespace)
    return byNamespace !== 0 ? byNamespace : a.value.localeCompare(b.value, 'fr')
  })
}
