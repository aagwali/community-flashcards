import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { Card } from '../../domain/card'
import { formatTag } from '../../domain/tag'
import { useCollection, useDeck } from '../collection'
import { CardEditor } from '../components/card-editor'
import { Markdown } from '../design-system/markdown'
import { ArrowLeft, ArrowRight, Close, Grid, Pencil, Plus } from '../design-system/icons'
import { Button, EmptyState, Kbd, StatusBadge, TagPill, cx } from '../design-system/primitives'
import { hasModifier, isTyping } from '../keyboard'

/**
 * Mode animation — l'écran qu'on projette pendant la session du midi.
 *
 * Trois partis pris :
 *
 *  - **navigation libre.** L'animateur mène la discussion, l'outil suit. Pas de
 *    parcours imposé, pas de progression à terminer : on saute d'une carte à
 *    l'autre par le sommaire.
 *  - **édition sur place.** Une remarque du groupe se corrige immédiatement,
 *    devant tout le monde, et se publie ensuite.
 *  - **aucune chrome superflue.** Ce qui n'aide pas à lire la carte à trois
 *    mètres n'a rien à faire à l'écran.
 */
export function AnimatePage() {
  const { deckSlug } = useParams()
  const deck = useDeck(deckSlug)
  const { createCard } = useCollection()
  const navigate = useNavigate()

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)

  const cards = deck?.cards ?? []
  const current = cards[Math.min(index, Math.max(0, cards.length - 1))]

  const goTo = useCallback(
    (next: number) => {
      if (cards.length === 0) return
      setIndex(((next % cards.length) + cards.length) % cards.length)
      setRevealed(false)
    },
    [cards.length],
  )

  const addCard = useCallback(() => {
    if (!deck) return
    const created = createCard(deck.slug)
    if (created) setEditing(created)
  }, [deck, createCard])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      // L'éditeur gère ses propres raccourcis ; on ne lui vole pas ses touches.
      if (editing || isTyping(event.target) || hasModifier(event)) return

      /*
       * `preventDefault` sur TOUTES les touches traitées, y compris les lettres.
       *
       * Sans lui, « E » ouvre l'éditeur — React monte le champ et lui donne le
       * focus avant que le navigateur n'ait fini de traiter la frappe — puis la
       * même frappe s'insère dans le champ fraîchement focalisé. Annuler le
       * comportement par défaut coupe l'insertion à la racine.
       */
      switch (event.key) {
        case ' ':
        case 'Enter':
          event.preventDefault()
          setRevealed((value) => !value)
          break
        case 'ArrowRight':
          event.preventDefault()
          goTo(index + 1)
          break
        case 'ArrowLeft':
          event.preventDefault()
          goTo(index - 1)
          break
        case 'Escape':
          event.preventDefault()
          if (outlineOpen) setOutlineOpen(false)
          else navigate(`/decks/${deckSlug ?? ''}`)
          break
        case 's':
        case 'S':
          event.preventDefault()
          setOutlineOpen((value) => !value)
          break
        case 'e':
        case 'E':
          event.preventDefault()
          if (current) setEditing(current)
          break
        case 'n':
        case 'N':
          event.preventDefault()
          addCard()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, goTo, outlineOpen, editing, current, addCard, navigate, deckSlug])

  if (!deck) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <EmptyState title="Deck introuvable" />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line px-4 sm:px-6">
        <Link
          to={`/decks/${deck.slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <Close />
          <span className="hidden sm:inline">Quitter</span>
        </Link>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-medium">{deck.title}</p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={addCard} title="Nouvelle carte (N)">
            <Plus />
            <span className="hidden sm:inline">Nouvelle</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => current && setEditing(current)}
            disabled={!current}
            title="Modifier (E)"
          >
            <Pencil />
            <span className="hidden sm:inline">Modifier</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOutlineOpen(true)} title="Sommaire (S)">
            <Grid />
            <span className="hidden sm:inline">Sommaire</span>
          </Button>
        </div>
      </header>

      {!current ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <EmptyState title="Ce deck est vide">
            <Button variant="primary" size="sm" className="mt-4" onClick={addCard}>
              <Plus />
              Créer la première carte
            </Button>
          </EmptyState>
        </div>
      ) : (
        <>
          <main
            className="flex flex-1 cursor-pointer flex-col items-center overflow-y-auto px-6 py-10 sm:py-14"
            onClick={() => setRevealed((value) => !value)}
          >
            <div className="w-full max-w-3xl">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <StatusBadge status={current.status} />
                {current.tags.map((tag) => (
                  <TagPill key={formatTag(tag)} tag={tag} />
                ))}
              </div>

              <Markdown source={current.question} className="text-xl leading-snug font-medium sm:text-2xl" />

              <div
                className={cx(
                  'grid transition-all duration-300 ease-out',
                  revealed ? 'mt-8 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <hr className="mb-8 border-line" />
                  <Markdown source={current.answer} className="text-[17px] sm:text-lg" />

                  {current.sources.length > 0 ? (
                    <ul className="mt-8 space-y-1 text-[13px] text-muted">
                      {current.sources.map((source) => (
                        <li key={source}>— {source}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              {!revealed ? (
                <p className="mt-10 text-sm text-muted">
                  <Kbd>Espace</Kbd> <span className="ml-1.5">pour afficher la réponse</span>
                </p>
              ) : null}
            </div>
          </main>

          <footer className="flex h-16 shrink-0 items-center justify-between gap-4 border-t border-line px-4 sm:px-6">
            <Button variant="ghost" size="sm" onClick={() => goTo(index - 1)} aria-label="Carte précédente">
              <ArrowLeft />
              <span className="hidden sm:inline">Précédente</span>
            </Button>

            <div className="hidden items-center gap-2 text-[12px] text-muted md:flex">
              <Kbd>←</Kbd>
              <Kbd>→</Kbd>
              <span>naviguer</span>
              <span className="mx-1 text-line-strong">·</span>
              <Kbd>S</Kbd>
              <span>sommaire</span>
              <span className="mx-1 text-line-strong">·</span>
              <Kbd>E</Kbd>
              <span>modifier</span>
              <span className="mx-1 text-line-strong">·</span>
              <Kbd>N</Kbd>
              <span>nouvelle</span>
            </div>

            <span className="font-mono text-[13px] text-muted tabular-nums">
              {index + 1} / {cards.length}
            </span>

            <Button variant="ghost" size="sm" onClick={() => goTo(index + 1)} aria-label="Carte suivante">
              <span className="hidden sm:inline">Suivante</span>
              <ArrowRight />
            </Button>
          </footer>
        </>
      )}

      {outlineOpen ? (
        <Outline
          cards={cards}
          currentIndex={index}
          onSelect={(next) => {
            goTo(next)
            setOutlineOpen(false)
          }}
          onClose={() => setOutlineOpen(false)}
        />
      ) : null}

      {editing ? (
        <CardEditor
          card={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            const position = cards.findIndex((card) => card.id === saved.id)
            if (position >= 0) setIndex(position)
          }}
        />
      ) : null}
    </div>
  )
}

function Outline({
  cards,
  currentIndex,
  onSelect,
  onClose,
}: {
  cards: readonly Card[]
  currentIndex: number
  onSelect: (index: number) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-canvas/95 backdrop-blur-sm">
      <header className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6">
        <p className="text-sm font-medium">Sommaire</p>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fermer le sommaire">
          <Close />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-10 sm:px-6">
        <ol className="mx-auto grid max-w-5xl gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, position) => (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => onSelect(position)}
                className={cx(
                  'h-full w-full rounded-xl border p-4 text-left transition-colors',
                  position === currentIndex
                    ? 'border-brand bg-brand-soft'
                    : 'border-line bg-surface hover:border-line-strong',
                )}
              >
                <span className="font-mono text-[11px] text-muted tabular-nums">
                  {String(position + 1).padStart(2, '0')}
                </span>
                <Markdown source={firstLine(card.question)} className="mt-1.5 text-sm font-medium" />
                <div className="mt-3">
                  <StatusBadge status={card.status} />
                </div>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
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
