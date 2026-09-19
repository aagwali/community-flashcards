import { NavLink, Outlet, Route, Routes, Link } from 'react-router'
import { repositoryUrl } from '../app-config'
import { CollectionProvider, useCollection } from './collection'
import { ProgressProvider } from './progress'
import { Logo } from './design-system/logo'
import { Github, Moon, Sun } from './design-system/icons'
import { ButtonLink, cx } from './design-system/primitives'
import { useTheme } from './theme'
import { AnimatePage } from './pages/animate-page'
import { DeckPage } from './pages/deck-page'
import { DecksPage } from './pages/decks-page'
import { GuidePage } from './pages/guide-page'
import { PublishPage } from './pages/publish-page'
import { ReviewPage } from './pages/review-page'

export function App() {
  return (
    <CollectionProvider>
      <ProgressProvider>
        <Routes>
          {/* Le mode animation occupe tout l'écran : il sort délibérément de la coquille. */}
          <Route path="decks/:deckSlug/animation" element={<AnimatePage />} />

          <Route element={<Layout />}>
            <Route index element={<DecksPage />} />
            <Route path="decks/:deckSlug" element={<DeckPage />} />
            <Route path="decks/:deckSlug/revision" element={<ReviewPage />} />
            <Route path="publication" element={<PublishPage />} />
            <Route path="guide" element={<GuidePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ProgressProvider>
    </CollectionProvider>
  )
}

function Layout() {
  const { pending, errors } = useCollection()
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>

          {/*
            La navigation absorbe l'espace restant et défile en son sein plutôt
            que d'élargir la page : quelle que soit la longueur des libellés,
            le document ne peut pas se mettre à défiler horizontalement.
          */}
          <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-[13px] [scrollbar-width:none] sm:gap-1 sm:text-sm [&::-webkit-scrollbar]:hidden">
            <NavItem to="/">Decks</NavItem>
            <NavItem to="/publication">
              Publication
              {pending.length > 0 ? (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-ink">
                  {pending.length}
                </span>
              ) : null}
            </NavItem>
            <NavItem to="/guide">Guide</NavItem>
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={iconActionClass}
              aria-label="Changer de thème"
              title="Changer de thème"
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            {/* Replié sur mobile : le dépôt reste accessible depuis le Guide et la Publication. */}
            <a
              href={repositoryUrl()}
              target="_blank"
              rel="noreferrer"
              className={cx(iconActionClass, 'hidden sm:inline-flex')}
              aria-label="Le dépôt sur GitHub"
              title="Le dépôt sur GitHub"
            >
              <Github />
            </a>
          </div>
        </div>
      </header>

      {errors.length > 0 ? <ContentErrors /> : null}

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 text-[12px] text-muted sm:px-6">
        Les cartes vivent dans le dépôt, en Markdown. La progression de révision reste sur votre machine.
      </footer>
    </div>
  )
}

/** Les actions iconiques de l'en-tête partagent la même boîte de 32 px. */
const iconActionClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink'

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cx(
          'inline-flex h-8 shrink-0 items-center rounded-lg px-2.5 font-medium transition-colors sm:px-3',
          isActive ? 'bg-surface text-ink' : 'text-muted hover:text-ink',
        )
      }
    >
      {children}
    </NavLink>
  )
}

/**
 * En principe impossible : la CI refuse une carte invalide. Si l'écran apparaît
 * quand même, c'est qu'un fichier est arrivé sans passer par la Pull Request.
 */
function ContentErrors() {
  const { errors } = useCollection()

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
      <div className="rounded-xl border border-warn bg-warn-soft p-4 text-sm">
        <p className="font-medium text-warn">
          {errors.length} fichier{errors.length > 1 ? 's' : ''} de contenu illisible
          {errors.length > 1 ? 's' : ''}
        </p>
        <ul className="mt-2 space-y-1 font-mono text-[12px] text-ink/80">
          {errors.map((error) => (
            <li key={error.file}>
              {error.file} — {error.errors.join(' ; ')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-medium">Cette page n'existe pas.</p>
      <ButtonLink to="/" variant="secondary" className="mt-6">
        Revenir aux decks
      </ButtonLink>
    </div>
  )
}
