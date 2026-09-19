import { Link } from 'react-router'
import { deckProgress } from '../../application/review'
import { systemClock } from '../../application/ports'
import { countByStatus } from '../../domain/deck'
import { useCollection } from '../collection'
import { useProgress } from '../progress'
import { Layers, Play } from '../design-system/icons'
import { ButtonLink, Meter } from '../design-system/primitives'

export function DecksPage() {
  const { decks } = useCollection()
  const { states } = useProgress()
  const now = systemClock.now()

  return (
    <div>
      <div className="mb-10 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Les cartes de la communauté</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Écrites pendant nos sessions, corrigées et enrichies par tout le monde. Animez un deck pour le
          présenter, révisez-le pour ne pas l'oublier.{' '}
          <Link to="/guide" className="text-brand underline underline-offset-3">
            Première visite ?
          </Link>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {decks.map((deck) => {
          const status = countByStatus(deck.cards)
          const progress = deckProgress(deck.cards, states, now)
          const known = progress.scheduled

          return (
            <article
              key={deck.slug}
              className="group relative flex flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong"
            >
              <Link to={`/decks/${deck.slug}`} className="flex-1">
                <span className="absolute inset-0" aria-hidden="true" />
                <h2 className="text-[17px] font-semibold tracking-tight transition-colors group-hover:text-brand">
                  {deck.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{deck.description}</p>
              </Link>

              <div className="mt-5">
                <Meter value={known} total={deck.cards.length} />
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                  <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                    <Layers className="text-muted" />
                    {deck.cards.length} carte{deck.cards.length > 1 ? 's' : ''}
                  </span>
                  {status.proposed > 0 ? <span>· {status.proposed} à valider</span> : null}
                  {status.draft > 0 ? <span>· {status.draft} en brouillon</span> : null}
                  {progress.due + progress.learning + progress.fresh > 0 ? (
                    <span className="text-brand">
                      · {progress.due + progress.learning + progress.fresh} à réviser
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="relative z-10 mt-4 flex gap-2">
                <ButtonLink to={`/decks/${deck.slug}/animation`} variant="secondary" size="sm">
                  <Play />
                  Animer
                </ButtonLink>
                <ButtonLink to={`/decks/${deck.slug}/revision`} variant="secondary" size="sm">
                  Réviser
                </ButtonLink>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
