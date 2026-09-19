import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { systemClock } from '../../application/ports'
import { deckProgress, reviewQueue } from '../../application/review'
import type { Card } from '../../domain/card'
import type { Deck } from '../../domain/deck'
import type { Rating } from '../../domain/scheduling'
import { RATINGS, RATING_LABELS, formatDelay, initialState, preview } from '../../domain/scheduling'
import { formatTag } from '../../domain/tag'
import { useDeck } from '../collection'
import { useProgress } from '../progress'
import { Markdown } from '../design-system/markdown'
import { Button, ButtonLink, EmptyState, Kbd, Meter, TagPill, cx } from '../design-system/primitives'
import { hasModifier, isTyping } from '../keyboard'

export function ReviewPage() {
  const { deckSlug } = useParams()
  const deck = useDeck(deckSlug)

  if (!deck) return <EmptyState title="Deck introuvable" />
  return <ReviewSession deck={deck} />
}

const RATING_STYLES: Record<Rating, string> = {
  again: 'border-line-strong hover:border-warn hover:text-warn',
  hard: 'border-line-strong hover:border-line-strong hover:bg-canvas',
  good: 'border-brand bg-brand text-brand-ink hover:brightness-110',
  easy: 'border-line-strong hover:border-brand hover:text-brand',
}

function ReviewSession({ deck }: { deck: Deck }) {
  const { states, stateOf, rate, forget } = useProgress()

  /*
   * La file est figée à l'ouverture de la session : si elle se recalculait à
   * chaque réponse, une carte replacée dans dix minutes pourrait réapparaître
   * en boucle. Les cartes encore en apprentissage sont remises en fin de file,
   * les autres quittent la session.
   */
  const [queue, setQueue] = useState<readonly Card[]>(() =>
    reviewQueue(deck.cards, states, systemClock.now()),
  )
  const [revealed, setRevealed] = useState(false)
  const [answered, setAnswered] = useState(0)

  const current = queue[0]
  const initialQueueLength = useMemo(
    () => reviewQueue(deck.cards, states, systemClock.now()).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck.slug],
  )

  const previews = useMemo(() => {
    if (!current) return null
    const now = systemClock.now()
    return preview(stateOf(current.id) ?? initialState(now), now)
  }, [current, stateOf])

  const submit = useCallback(
    (rating: Rating) => {
      if (!current) return

      const next = rate(current.id, rating)
      setQueue((pending) => {
        const rest = pending.slice(1)
        // Toujours en apprentissage : la carte repasse avant la fin de la session.
        return next.phase === 'review' ? rest : [...rest, current]
      })
      setRevealed(false)
      setAnswered((count) => count + 1)
    },
    [current, rate],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isTyping(event.target) || hasModifier(event)) return

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setRevealed(true)
        return
      }

      if (!revealed) return

      const position = Number.parseInt(event.key, 10)
      const rating = RATINGS[position - 1]
      if (rating) {
        event.preventDefault()
        submit(rating)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [revealed, submit])

  if (!current) {
    const remaining = deckProgress(deck.cards, states, systemClock.now())

    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Session terminée</h1>
        <p className="mt-2 text-[15px] text-muted">
          {answered > 0
            ? `${answered} réponse${answered > 1 ? 's' : ''} enregistrée${answered > 1 ? 's' : ''}. ${remaining.scheduled} carte${remaining.scheduled > 1 ? 's' : ''} programmée${remaining.scheduled > 1 ? 's' : ''} pour plus tard.`
            : 'Rien à réviser pour l’instant dans ce deck.'}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <ButtonLink to={`/decks/${deck.slug}`} variant="secondary" size="sm">
            Retour au deck
          </ButtonLink>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              forget(deck.cards.map((card) => card.id))
              setQueue(deck.cards)
              setAnswered(0)
            }}
          >
            Réinitialiser ma progression
          </Button>
        </div>
      </div>
    )
  }

  const done = Math.max(0, initialQueueLength - queue.length)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="mb-2 flex items-baseline justify-between text-[12px] text-muted">
          <span>{deck.title}</span>
          <span className="font-mono tabular-nums">
            {done} / {initialQueueLength}
          </span>
        </div>
        <Meter value={done} total={initialQueueLength} />
      </div>

      <article className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap gap-1.5">
          {current.tags.map((tag) => (
            <TagPill key={formatTag(tag)} tag={tag} />
          ))}
        </div>

        <Markdown source={current.question} className="text-lg leading-snug font-medium sm:text-xl" />

        {revealed ? (
          <>
            <hr className="my-7 border-line" />
            <Markdown source={current.answer} className="text-[15px]" />
          </>
        ) : null}
      </article>

      {revealed && previews ? (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RATINGS.map((rating, position) => (
            <button
              key={rating}
              type="button"
              onClick={() => submit(rating)}
              className={cx(
                'flex flex-col items-center gap-0.5 rounded-xl border px-3 py-3.5 transition-all duration-150',
                RATING_STYLES[rating],
              )}
            >
              <span className="text-sm font-medium">{RATING_LABELS[rating]}</span>
              <span className="font-mono text-[11px] opacity-70 tabular-nums">
                {formatDelay(previews[rating])}
              </span>
              <span className="mt-1 font-mono text-[10px] opacity-50">{position + 1}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex justify-center">
          <Button variant="primary" size="lg" onClick={() => setRevealed(true)} className="w-full sm:w-auto">
            Afficher la réponse
            <Kbd>Espace</Kbd>
          </Button>
        </div>
      )}
    </div>
  )
}
