import { z } from 'zod'
import { CARD_STATUSES } from '../domain/card'
import { TAG_NAMESPACES } from '../domain/tag'

/**
 * Le contrat du contenu. Il est vérifié en CI (`src/content/content.test.ts`) :
 * une carte malformée fait échouer la Pull Request, pas la page en production.
 */

const tagPattern = new RegExp(`^(?:${TAG_NAMESPACES.join('|')}):[a-z0-9][a-z0-9-]*$`)

export const cardFrontmatterSchema = z.object({
  tags: z
    .array(z.string().regex(tagPattern, `doit s'écrire "<${TAG_NAMESPACES.join('|')}>:valeur-en-minuscules"`))
    .default([]),
  status: z.enum(CARD_STATUSES).default('draft'),
  author: z.string().min(1).optional(),
  reviewers: z.array(z.string().min(1)).default([]),
  sources: z.array(z.string().min(1)).default([]),
  discussedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'doit être une date ISO (AAAA-MM-JJ)')
    .optional(),
})

export type CardFrontmatter = z.infer<typeof cardFrontmatterSchema>

export const deckManifestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  maintainers: z.array(z.string().min(1)).default([]),
  order: z.number().int().nonnegative().default(999),
})

export type DeckManifest = z.infer<typeof deckManifestSchema>

export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join('.')
    return path.length > 0 ? `${path} : ${issue.message}` : issue.message
  })
}
