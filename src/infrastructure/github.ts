import { appConfig } from '../app-config'
import type { CardDraft } from '../application/ports'
import { cardFilePath } from '../domain/card'
import { serializeCard } from '../content/serialize'

/**
 * Publication sans backend ni authentification.
 *
 * On ne parle pas à l'API GitHub : on ouvre l'éditeur web de GitHub sur le bon
 * fichier. L'utilisateur est déjà connecté, GitHub gère les droits, propose la
 * branche et ouvre la Pull Request. Zéro jeton à distribuer, zéro secret à
 * stocker dans une application publique.
 *
 * Pour une création, GitHub accepte de pré-remplir le contenu via l'URL ; pour
 * une modification, non — d'où le bouton « copier » qui l'accompagne.
 */

const { owner, repository, branch } = appConfig.github
const BASE = `https://github.com/${owner}/${repository}`

/** Limite pragmatique : au-delà, certains navigateurs tronquent l'URL. */
const MAX_PREFILL_LENGTH = 6000

export interface PublishTarget {
  readonly label: string
  readonly url: string
  /** Le contenu doit-il être collé à la main une fois GitHub ouvert ? */
  readonly requiresPaste: boolean
  readonly fileContent: string
}

export function publishTarget(draft: CardDraft): PublishTarget {
  const path = cardFilePath(draft.card)
  const fileContent = serializeCard(draft.card)

  if (draft.origin === 'created') {
    const prefill = `${BASE}/new/${branch}?filename=${encodeURIComponent(path)}&value=${encodeURIComponent(fileContent)}`

    if (prefill.length <= MAX_PREFILL_LENGTH) {
      return { label: 'Créer le fichier sur GitHub', url: prefill, requiresPaste: false, fileContent }
    }
    return {
      label: 'Créer le fichier sur GitHub',
      url: `${BASE}/new/${branch}?filename=${encodeURIComponent(path)}`,
      requiresPaste: true,
      fileContent,
    }
  }

  return {
    label: 'Modifier le fichier sur GitHub',
    url: `${BASE}/edit/${branch}/${path}`,
    requiresPaste: true,
    fileContent,
  }
}

/**
 * Récapitulatif d'une session, à coller dans une issue : c'est la trace de ce
 * que le groupe a décidé autour de la table.
 */
export function sessionReportUrl(drafts: readonly CardDraft[]): string {
  const title = `Session du ${new Date().toLocaleDateString('fr-FR')} — retours sur les cartes`
  return `${BASE}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(sessionReport(drafts))}`
}

export function sessionReport(drafts: readonly CardDraft[]): string {
  if (drafts.length === 0) return '_Aucune modification locale._'

  const lines: string[] = ['Retours collectés pendant la session :', '']

  for (const draft of drafts) {
    const verb = draft.origin === 'created' ? 'Nouvelle carte' : 'Modification'
    lines.push(`- **${verb}** — \`${cardFilePath(draft.card)}\``)
    if (draft.note.trim().length > 0) {
      lines.push(`  > ${draft.note.trim().replace(/\n/g, '\n  > ')}`)
    }
  }

  lines.push('', '<details><summary>Contenu proposé</summary>', '')
  for (const draft of drafts) {
    lines.push(
      `#### \`${cardFilePath(draft.card)}\``,
      '',
      '````markdown',
      serializeCard(draft.card),
      '````',
      '',
    )
  }
  lines.push('</details>')

  return lines.join('\n')
}
