import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import type { Card } from '../../domain/card'
import { matchesSearch } from '../../domain/card'
import type { Tag } from '../../domain/tag'
import { formatTag, sameTag, sortTags } from '../../domain/tag'
import { useCollection, useDeck } from '../collection'
import { CardEditor } from '../components/card-editor'
import { Markdown } from '../design-system/markdown'
import { Pencil, Play, Plus } from '../design-system/icons'
import { Button, ButtonLink, EmptyState, StatusBadge, TagPill, cx } from '../design-system/primitives'

export function DeckPage() {
  const { deckSlug } = useParams()
  const deck = useDeck(deckSlug)
  const { drafts, createCard } = useCollection()

  const [search, setSearch] = useState('')
  const [activeTags, setActiveTags] = useState<Tag[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<Card | null>(null)

  const availableTags = useMemo(() => {
    if (!deck) return []
    const seen = new Map<string, Tag>()
    for (const card of deck.cards) {
      for (const tag of card.tags) seen.set(formatTag(tag), tag)
    }
    return sortTags([...seen.values()])
  }, [deck])

  const visible = useMemo(() => {
    if (!deck) return []
    return deck.cards.filter(
      (card) =>
        matchesSearch(card, search) &&
        activeTags.every((tag) => card.tags.some((candidate) => sameTag(candidate, tag))),
    )
  }, [deck, search, activeTags])

  if (!deck) {
    return <EmptyState title="Deck introuvable">Il a peut-être été renommé dans le dépôt.</EmptyState>
  }

  function toggleTag(tag: Tag): void {
    setActiveTags((current) =>
      current.some((candidate) => sameTag(candidate, tag))
        ? current.filter((candidate) => !sameTag(candidate, tag))
        : [...current, tag],
    )
  }

  function addCard(): void {
    const created = createCard(deck!.slug)
    if (created) setEditing(created)
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{deck.title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{deck.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink to={`/decks/${deck.slug}/animation`} variant="primary" size="sm">
            <Play />
            Animer la session
          </ButtonLink>
          <ButtonLink to={`/decks/${deck.slug}/revision`} variant="secondary" size="sm">
            Réviser
          </ButtonLink>
          <Button variant="secondary" size="sm" onClick={addCard}>
            <Plus />
            Nouvelle carte
          </Button>
        </div>
      </header>

      <div className="mb-6 flex flex-col gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher dans les questions, les réponses, les tags…"
          className="h-10 w-full rounded-lg border border-line bg-surface px-3.5 text-sm placeholder:text-muted/70 focus:border-brand focus:outline-none"
        />

        {availableTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => (
              <TagPill
                key={formatTag(tag)}
                tag={tag}
                active={activeTags.some((candidate) => sameTag(candidate, tag))}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Aucune carte ne correspond">
          Modifiez la recherche ou retirez un filtre.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {visible.map((card) => {
            const isOpen = expanded === card.id
            const draft = drafts[card.id]

            return (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : card.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-canvas"
                >
                  <div className="min-w-0 flex-1">
                    <Markdown
                      source={firstLine(card.question)}
                      className={cx('text-[15px] font-medium', isOpen && 'text-brand')}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={card.status} />
                      {draft ? (
                        <span className="inline-flex items-center rounded-full border border-brand bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
                          {draft.origin === 'created' ? 'Nouvelle, non publiée' : 'Modifiée localement'}
                        </span>
                      ) : null}
                      {card.tags.map((tag) => (
                        <TagPill key={formatTag(tag)} tag={tag} />
                      ))}
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <div className="border-t border-line bg-canvas px-5 py-5">
                    <Markdown source={card.question} className="text-[15px]" />
                    <hr className="my-4 border-line" />
                    <Markdown source={card.answer} className="text-[15px]" />

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Button variant="secondary" size="sm" onClick={() => setEditing(card)}>
                        <Pencil />
                        Modifier
                      </Button>
                      {card.author ? (
                        <span className="text-[12px] text-muted">proposée par {card.author}</span>
                      ) : null}
                      {card.discussedAt ? (
                        <span className="text-[12px] text-muted">
                          discutée le {formatDate(card.discussedAt)}
                        </span>
                      ) : null}
                    </div>

                    {card.sources.length > 0 ? (
                      <ul className="mt-4 space-y-1 text-[12px] text-muted">
                        {card.sources.map((source) => (
                          <li key={source}>— {source}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {editing ? <CardEditor card={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  )
}

/** Aperçu : la première ligne non vide suffit à reconnaître une carte. */
function firstLine(markdown: string): string {
  return (
    markdown
      .split('\n')
      .find((line) => line.trim().length > 0)
      ?.trim() ?? '_Sans question_'
  )
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}
