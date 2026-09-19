import { CORE_SCHEMA, load as loadYaml } from 'js-yaml'
import type { Card } from '../domain/card'
import { cardId } from '../domain/card'
import type { Tag } from '../domain/tag'
import { parseTag } from '../domain/tag'
import type { DeckManifest } from './schema'
import { cardFrontmatterSchema, deckManifestSchema, describeIssues } from './schema'

export type ParseOutcome<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly errors: readonly string[] }

const QUESTION_HEADING = 'question'
const ANSWER_HEADING = 'reponse'

/**
 * Format d'une carte : un en-tête YAML, puis deux sections `## Question` et
 * `## Réponse` en Markdown.
 *
 * Ce format est lisible tel quel sur GitHub, se relit dans une diff, et
 * accueille du code — ce qui, pour des cartes de développeurs, n'est pas un
 * détail.
 */
export function parseCardFile(raw: string, deckSlug: string, slug: string): ParseOutcome<Card> {
  const split = splitFrontmatter(raw)
  if (!split.ok) return split

  const rawFrontmatter = safeLoadYaml(split.value.frontmatter)
  if (!rawFrontmatter.ok) return rawFrontmatter

  const parsed = cardFrontmatterSchema.safeParse(rawFrontmatter.value ?? {})
  if (!parsed.success) return { ok: false, errors: describeIssues(parsed.error) }

  const sections = splitSections(split.value.body)
  const question = sections.get(QUESTION_HEADING)
  const answer = sections.get(ANSWER_HEADING)

  const errors: string[] = []
  if (!question) errors.push('section "## Question" absente')
  if (!answer) errors.push('section "## Réponse" absente')

  const tags: Tag[] = []
  for (const rawTag of parsed.data.tags) {
    const tag = parseTag(rawTag)
    if (tag) tags.push(tag)
    else errors.push(`tag invalide : "${rawTag}"`)
  }

  if (errors.length > 0 || !question || !answer) return { ok: false, errors }

  const { status, author, reviewers, sources, discussedAt } = parsed.data

  return {
    ok: true,
    value: {
      id: cardId(deckSlug, slug),
      deckSlug,
      slug,
      question,
      answer,
      tags,
      status,
      reviewers,
      sources,
      ...(author !== undefined ? { author } : {}),
      ...(discussedAt !== undefined ? { discussedAt } : {}),
    },
  }
}

export function parseDeckManifest(raw: string): ParseOutcome<DeckManifest> {
  const yaml = safeLoadYaml(raw)
  if (!yaml.ok) return yaml

  const parsed = deckManifestSchema.safeParse(yaml.value ?? {})
  if (!parsed.success) return { ok: false, errors: describeIssues(parsed.error) }

  return { ok: true, value: parsed.data }
}

const FRONTMATTER_DELIMITER = /^---\s*$/

function splitFrontmatter(raw: string): ParseOutcome<{ frontmatter: string; body: string }> {
  // Un BOM en tête de fichier empêcherait de reconnaître le "---" d'ouverture.
  const lines = raw.replace(/^\u{FEFF}/u, '').split(/\r?\n/)

  if (lines[0] === undefined || !FRONTMATTER_DELIMITER.test(lines[0])) {
    return { ok: false, errors: ['en-tête YAML absent : le fichier doit commencer par "---"'] }
  }

  const closing = lines.findIndex((line, index) => index > 0 && FRONTMATTER_DELIMITER.test(line))
  if (closing === -1) {
    return { ok: false, errors: ['en-tête YAML non refermé : il manque un "---"'] }
  }

  return {
    ok: true,
    value: {
      frontmatter: lines.slice(1, closing).join('\n'),
      body: lines.slice(closing + 1).join('\n'),
    },
  }
}

function safeLoadYaml(raw: string): ParseOutcome<Record<string, unknown> | undefined> {
  try {
    /**
     * Schéma YAML 1.2 « core » et non le schéma par défaut : ce dernier
     * transforme `2026-09-12` en objet Date. On veut des chaînes, validées
     * ensuite par Zod — sinon le fuseau horaire du navigateur décale la date.
     */
    const value = loadYaml(raw, { schema: CORE_SCHEMA })
    if (value === null || value === undefined) return { ok: true, value: undefined }
    if (typeof value !== 'object' || Array.isArray(value)) {
      return { ok: false, errors: ["l'en-tête YAML doit être un objet clé/valeur"] }
    }
    return { ok: true, value: value as Record<string, unknown> }
  } catch (error) {
    return { ok: false, errors: [`YAML illisible : ${(error as Error).message}`] }
  }
}

const HEADING = /^##\s+(.+?)\s*$/
const FENCE = /^\s*(?:```|~~~)/

/**
 * Découpe le corps en sections de niveau 2.
 * Les blocs de code sont ignorés : un `## commentaire` dans un extrait de code
 * ne doit pas ouvrir une section.
 */
function splitSections(body: string): Map<string, string> {
  const sections = new Map<string, string>()
  let heading: string | null = null
  let buffer: string[] = []
  let insideFence = false

  const flush = (): void => {
    if (heading !== null) sections.set(heading, buffer.join('\n').trim())
    buffer = []
  }

  for (const line of body.split('\n')) {
    if (FENCE.test(line)) insideFence = !insideFence

    const match = insideFence ? null : HEADING.exec(line)
    if (match?.[1] !== undefined) {
      flush()
      heading = normalizeHeading(match[1])
      continue
    }
    if (heading !== null) buffer.push(line)
  }
  flush()

  return sections
}

function normalizeHeading(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}
