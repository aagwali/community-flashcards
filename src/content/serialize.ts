import type { Card } from '../domain/card'
import { formatTag } from '../domain/tag'

/**
 * Ré-écrit une carte au format fichier. C'est ce texte qu'on pousse sur GitHub
 * quand on publie une modification faite dans l'application.
 *
 * Invariant testé : `parseCardFile(serializeCard(card))` redonne la carte.
 */
export function serializeCard(card: Card): string {
  const frontmatter: string[] = []

  frontmatter.push(`tags: [${card.tags.map(formatTag).join(', ')}]`)
  frontmatter.push(`status: ${card.status}`)
  if (card.author) frontmatter.push(`author: ${quote(card.author)}`)
  if (card.reviewers.length > 0) {
    frontmatter.push(`reviewers: [${card.reviewers.map(quote).join(', ')}]`)
  }
  if (card.sources.length > 0) {
    frontmatter.push('sources:')
    for (const source of card.sources) frontmatter.push(`  - ${quote(source)}`)
  }
  if (card.discussedAt) frontmatter.push(`discussedAt: ${card.discussedAt}`)

  return [
    '---',
    ...frontmatter,
    '---',
    '',
    '## Question',
    '',
    card.question.trim(),
    '',
    '## Réponse',
    '',
    card.answer.trim(),
    '',
  ].join('\n')
}

/**
 * YAML n'aime ni les deux-points nus, ni les chaînes commençant par un
 * caractère de structure. On ne cite que lorsque c'est nécessaire : le fichier
 * reste lisible dans une diff.
 */
function quote(value: string): string {
  const needsQuotes = /[:#{}[\],&*?|<>=!%@`"']/.test(value) || /^[-\s]|\s$/.test(value) || value === ''
  if (!needsQuotes) return value
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
