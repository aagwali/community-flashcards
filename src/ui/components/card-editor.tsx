import { useEffect, useId, useMemo, useState } from 'react'
import type { Card, CardStatus } from '../../domain/card'
import { CARD_STATUSES, CARD_STATUS_LABELS, slugify, uniqueSlug, cardId } from '../../domain/card'
import { formatTag, parseTag } from '../../domain/tag'
import { useAuthor } from '../author'
import { useCollection } from '../collection'
import { Markdown } from '../design-system/markdown'
import { Button, Kbd, TagPill, cx } from '../design-system/primitives'
import { Close } from '../design-system/icons'

interface CardEditorProps {
  card: Card
  onClose: () => void
  onSaved?: (card: Card) => void
}

/**
 * L'éditeur est volontairement un simple champ Markdown avec aperçu.
 *
 * Un éditeur riche (WYSIWYG) produirait du HTML illisible en diff et
 * impossible à corriger à la main dans le dépôt. Nos contributeurs écrivent du
 * Markdown toute la journée : autant s'appuyer dessus.
 */
export function CardEditor({ card, onClose, onSaved }: CardEditorProps) {
  const { saveCard, discard, drafts, publishedCard, decks } = useCollection()
  const { author, setAuthor } = useAuthor()
  const fieldId = useId()

  const [question, setQuestion] = useState(card.question)
  const [answer, setAnswer] = useState(card.answer)
  const [status, setStatus] = useState<CardStatus>(card.status)
  const [rawTags, setRawTags] = useState(card.tags.map(formatTag).join(' '))
  const [note, setNote] = useState(drafts[card.id]?.note ?? '')

  const draft = drafts[card.id]
  const isNew = draft?.origin === 'created'

  const tagParsing = useMemo(() => {
    const tokens = rawTags.split(/[\s,]+/).filter((token) => token.length > 0)
    const valid = tokens.map(parseTag).filter((tag) => tag !== null)
    const invalid = tokens.filter((token) => parseTag(token) === null)
    return { valid, invalid }
  }, [rawTags])

  const canSave = question.trim().length > 0 && answer.trim().length > 0 && tagParsing.invalid.length === 0

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canSave) {
        event.preventDefault()
        save()
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  })

  function save(): void {
    if (!canSave) return

    /*
     * Une carte créée dans l'application n'a pas encore de nom de fichier
     * définitif : on le dérive de la question au moment de l'enregistrement,
     * une seule fois, pour qu'il reste stable ensuite.
     */
    const deck = decks.find((candidate) => candidate.slug === card.deckSlug)
    const shouldRename = isNew && card.slug.startsWith('nouvelle-carte')
    const taken = (deck?.cards ?? []).filter((c) => c.id !== card.id).map((c) => c.slug)
    const slug = shouldRename ? uniqueSlug(slugify(question), taken) : card.slug

    const updated: Card = {
      ...card,
      id: cardId(card.deckSlug, slug),
      slug,
      question: question.trim(),
      answer: answer.trim(),
      status,
      tags: tagParsing.valid,
      ...(author.length > 0 ? { author: card.author ?? author } : {}),
    }

    if (updated.id !== card.id) discard(card.id)
    saveCard(updated, note)
    onSaved?.(updated)
    onClose()
  }

  function revert(): void {
    discard(card.id)
    onClose()
  }

  const canRevert = draft !== undefined
  const publishedVersion = publishedCard(card.id)

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'Nouvelle carte' : 'Modifier la carte'}
        className="flex h-full w-full flex-col overflow-hidden border-line bg-canvas sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-2xl sm:border sm:shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{isNew ? 'Nouvelle carte' : 'Modifier la carte'}</h2>
            <p className="truncate font-mono text-[11px] text-muted">
              content/{card.deckSlug}/{card.slug}.md
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fermer">
            <Close />
          </Button>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-2">
          <div className="flex flex-col gap-4 border-line p-5 lg:border-r">
            <Field label="Question" hint="Markdown — les blocs de code sont colorés">
              <textarea
                id={`${fieldId}-question`}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={6}
                autoFocus
                placeholder="Pourquoi ce code viole-t-il le DIP ?"
                className={textareaClass}
              />
            </Field>

            <Field label="Réponse" hint="Markdown">
              <textarea
                id={`${fieldId}-answer`}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                rows={10}
                placeholder={'Le module de haut niveau dépend…\n\n```ts\n// un exemple vaut mieux\n```'}
                className={textareaClass}
              />
            </Field>

            <Field label="Tags" hint="espace de nom : theme, type, niveau, lang — séparés par des espaces">
              <input
                value={rawTags}
                onChange={(event) => setRawTags(event.target.value.toLowerCase())}
                placeholder="theme:solid type:principe lang:typescript"
                className={inputClass}
              />
              {tagParsing.invalid.length > 0 ? (
                <p className="mt-1.5 text-[12px] text-warn">
                  Hors taxonomie : {tagParsing.invalid.join(', ')} — attendu «&nbsp;theme:valeur&nbsp;»
                </p>
              ) : null}
              {tagParsing.valid.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tagParsing.valid.map((tag) => (
                    <TagPill key={formatTag(tag)} tag={tag} />
                  ))}
                </div>
              ) : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Statut" hint="où en est la validation par le groupe">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as CardStatus)}
                  className={inputClass}
                >
                  {CARD_STATUSES.map((candidate) => (
                    <option key={candidate} value={candidate}>
                      {CARD_STATUS_LABELS[candidate]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Votre pseudo GitHub" hint="pour créditer la contribution">
                <input
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  placeholder="prenom"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Remarque pour le groupe" hint="jointe à la proposition, facultative">
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="Sofiane trouve l'exemple trop abstrait, à remplacer par un cas de mission."
                className={textareaClass}
              />
            </Field>
          </div>

          <div className="bg-surface p-5">
            <p className="mb-3 text-[11px] font-medium tracking-wide text-muted uppercase">Aperçu</p>

            <div className="rounded-xl border border-line bg-canvas p-5">
              <Markdown source={question || '_Question vide_'} className="text-[15px]" />
              <hr className="my-4 border-line" />
              <Markdown source={answer || '_Réponse vide_'} className="text-[15px] text-ink/90" />
            </div>

            {publishedVersion && !isNew ? (
              <p className="mt-4 text-[12px] text-muted">
                Cette carte existe déjà dans le dépôt. Votre modification reste locale jusqu'à sa publication.
              </p>
            ) : null}
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3">
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd>
            <span>enregistrer</span>
            <span className="mx-1 text-line-strong">·</span>
            <Kbd>Échap</Kbd>
            <span>fermer</span>
          </div>

          <div className="flex items-center gap-2">
            {canRevert ? (
              <Button variant="ghost" size="sm" onClick={revert}>
                {isNew ? 'Supprimer' : 'Annuler mes modifications'}
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Fermer
            </Button>
            <Button variant="primary" size="sm" onClick={save} disabled={!canSave}>
              Enregistrer
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none'

const textareaClass = cx(inputClass, 'resize-y font-mono text-[13px] leading-relaxed')

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}
