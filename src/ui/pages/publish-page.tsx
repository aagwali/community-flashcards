import { useState } from 'react'
import { repositoryUrl } from '../../app-config'
import type { CardDraft } from '../../application/ports'
import { cardFilePath } from '../../domain/card'
import { formatTag } from '../../domain/tag'
import { publishTarget, sessionReportUrl } from '../../infrastructure/github'
import { download, toAnkiCsv, toJson } from '../../infrastructure/export'
import { useCollection } from '../collection'
import { Markdown } from '../design-system/markdown'
import { Copy, Check, Download, Github } from '../design-system/icons'
import { Button, EmptyState, ExternalButtonLink, StatusBadge, TagPill } from '../design-system/primitives'

/**
 * Publication — le moment où le travail de la session rejoint le dépôt.
 *
 * Pas de jeton, pas de connexion : on ouvre l'éditeur web de GitHub avec le bon
 * fichier, l'utilisateur colle, décrit et ouvre sa Pull Request. Le contrôle
 * d'accès reste celui du dépôt, ce qui est exactement ce qu'on veut.
 */
export function PublishPage() {
  const { pending, decks, discard, discardAll } = useCollection()

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Publication</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Vos modifications sont enregistrées sur cette machine. Pour qu'elles profitent à tout le monde,
          envoyez-les au dépôt : GitHub s'occupe de la branche et de la Pull Request.
        </p>
      </header>

      {pending.length === 0 ? (
        <EmptyState title="Aucune modification en attente">
          Modifiez ou créez une carte depuis un deck, elle apparaîtra ici.
        </EmptyState>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <ExternalButtonLink href={sessionReportUrl(pending)} variant="primary" size="sm">
              <Github />
              Ouvrir une issue récapitulative
            </ExternalButtonLink>
            <Button variant="ghost" size="sm" onClick={discardAll}>
              Tout abandonner
            </Button>
            <p className="w-full text-[12px] text-muted sm:w-auto sm:flex-1 sm:text-right">
              {pending.length} modification{pending.length > 1 ? 's' : ''} locale
              {pending.length > 1 ? 's' : ''}
            </p>
          </div>

          <ul className="space-y-3">
            {pending.map((draft) => (
              <DraftRow key={draft.card.id} draft={draft} onDiscard={() => discard(draft.card.id)} />
            ))}
          </ul>
        </>
      )}

      <section className="mt-14 border-t border-line pt-8">
        <h2 className="text-[17px] font-semibold tracking-tight">Emporter les cartes ailleurs</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Le contenu n'appartient pas à cette application : il vit en Markdown dans le dépôt, et s'exporte
          pour qui préfère son propre outil.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => download('cartes-anki.csv', toAnkiCsv(decks), 'text/csv')}
          >
            <Download />
            Export Anki (CSV)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => download('cartes.json', toJson(decks), 'application/json')}
          >
            <Download />
            Export JSON
          </Button>
          <ExternalButtonLink href={repositoryUrl()} variant="ghost" size="sm">
            <Github />
            Voir le dépôt
          </ExternalButtonLink>
        </div>
      </section>
    </div>
  )
}

function DraftRow({ draft, onDiscard }: { draft: CardDraft; onDiscard: () => void }) {
  const target = publishTarget(draft)
  const [copied, setCopied] = useState(false)

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(target.fileContent)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Presse-papiers refusé (contexte non sécurisé) : le contenu reste visible ci-dessous.
    }
  }

  return (
    <li className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-brand bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
              {draft.origin === 'created' ? 'Nouvelle carte' : 'Modification'}
            </span>
            <StatusBadge status={draft.card.status} />
          </div>
          <p className="mt-2 font-mono text-[12px] text-muted">{cardFilePath(draft.card)}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDiscard}>
            Abandonner
          </Button>
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copié' : 'Copier'}
          </Button>
          <ExternalButtonLink href={target.url} variant="primary" size="sm">
            <Github />
            {draft.origin === 'created' ? 'Créer' : 'Modifier'}
          </ExternalButtonLink>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-canvas p-4">
        <Markdown source={firstLine(draft.card.question)} className="text-sm font-medium" />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {draft.card.tags.map((tag) => (
            <TagPill key={formatTag(tag)} tag={tag} />
          ))}
        </div>
      </div>

      {draft.note.trim().length > 0 ? (
        <p className="mt-3 border-l-2 border-brand pl-3 text-[13px] text-muted">{draft.note}</p>
      ) : null}

      {target.requiresPaste ? (
        <p className="mt-3 text-[12px] text-muted">
          GitHub ne pré-remplit pas le contenu d'un fichier existant : copiez d'abord, puis collez dans
          l'éditeur qui s'ouvre.
        </p>
      ) : null}
    </li>
  )
}

function firstLine(markdown: string): string {
  return (
    markdown
      .split('\n')
      .find((line) => line.trim().length > 0)
      ?.trim() ?? '_Sans question_'
  )
}
