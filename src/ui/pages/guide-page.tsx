import type { ReactNode } from 'react'
import { repositoryUrl } from '../../app-config'
import { CARD_STATUS_LABELS } from '../../domain/card'
import { ArrowRight, Github, Pencil, Play, Plus } from '../design-system/icons'
import { ExternalButtonLink, Kbd, StatusBadge } from '../design-system/primitives'

/**
 * Page d'accueil des nouveaux arrivants.
 *
 * Elle existe pour que personne n'ait à expliquer l'outil quinze fois de suite,
 * et pour dire franchement ce qu'il ne fait pas — une limite connue d'avance
 * n'est pas une déception.
 */
export function GuidePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Comment ça marche</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Ces cartes sont les nôtres. Si une réponse te paraît fausse, incomplète ou mal formulée, corrige-la —
        c'est le but, et personne n'a besoin d'une permission.
      </p>

      <Section title="Les deux choses à ne pas confondre">
        <p>
          Une carte porte <strong>un statut éditorial</strong> : où en est sa validation par le groupe. Il
          voyage avec la carte, tout le monde le voit.
        </p>
        <div className="my-4 flex flex-wrap items-center gap-2">
          <StatusBadge status="draft" />
          <span className="text-muted">{CARD_STATUS_LABELS.draft.toLowerCase()} — écrite seul</span>
        </div>
        <div className="my-4 flex flex-wrap items-center gap-2">
          <StatusBadge status="proposed" />
          <span className="text-muted">discutée en session, en attente du verdict du groupe</span>
        </div>
        <div className="my-4 flex flex-wrap items-center gap-2">
          <StatusBadge status="validated" />
          <span className="text-muted">le groupe est d'accord, elle fait foi</span>
        </div>
        <p>
          À côté, il y a <strong>l'état de publication</strong> : tes modifications vivent d'abord sur ta
          machine, et ne rejoignent le dépôt que lorsque tu les publies. Personne ne les voit avant.
        </p>
        <Callout>
          Les deux sont indépendants. Tu peux très bien publier une carte en statut « À valider » : elle sera
          visible par tous, avec un badge qui dit que le groupe ne s'est pas encore prononcé.
        </Callout>
      </Section>

      <Section title="Le cycle d'une carte">
        <ol className="space-y-3">
          <Step number={1}>Quelqu'un écrit une carte, dans l'application ou directement dans le dépôt.</Step>
          <Step number={2}>
            Il la publie : une Pull Request part vers le dépôt, la CI vérifie le format, et une fois fusionnée
            la carte est en ligne pour tout le monde.
          </Step>
          <Step number={3}>
            Elle passe devant le groupe en session. On la corrige à l'écran, on la valide, ou on la réécrit.
          </Step>
          <Step number={4}>
            Elle se révise. Et elle se corrige encore, six mois plus tard, quand quelqu'un trouve mieux.
          </Step>
        </ol>
        <Callout>
          Une carte <strong>validée</strong> dont on change le texte repasse automatiquement à « À valider » :
          le badge ne doit jamais affirmer que le groupe a vu un texte qu'il n'a pas vu. Pour une simple
          coquille, tu peux remettre « Validée » toi-même dans l'éditeur.
        </Callout>
      </Section>

      <Section title="Les trois modes">
        <Mode icon={<Play />} title="Animer" shortcut="pendant la session, projeté">
          Une carte à la fois, en grand. <Kbd>Espace</Kbd> révèle la réponse, <Kbd>←</Kbd> <Kbd>→</Kbd>{' '}
          naviguent, <Kbd>S</Kbd> ouvre le sommaire pour sauter où tu veux. Et surtout <Kbd>E</Kbd> pour
          corriger la carte affichée devant tout le monde, <Kbd>N</Kbd> pour en créer une.
        </Mode>
        <Mode icon={<Pencil />} title="Réviser" shortcut="chacun de son côté">
          La répétition espacée : tu réponds, l'application décide quand te remontrer la carte. Ta progression
          est <strong>privée</strong> — elle reste dans ton navigateur, personne d'autre ne la voit, jamais.
        </Mode>
        <Mode icon={<Plus />} title="Publier" shortcut="quand tu veux partager">
          L'onglet <strong>Publication</strong> liste tes modifications locales. Un bouton copie la carte,
          l'autre ouvre GitHub au bon endroit : tu colles, tu décris en une ligne, tu valides. La Pull Request
          part toute seule.
        </Mode>
      </Section>

      <Section title="Le parcours le plus courant">
        <p>
          Tu révises, tu tombes sur une réponse qui te paraît fausse. Tu cliques <strong>Modifier</strong>, tu
          corriges, tu ajoutes une remarque pour expliquer pourquoi. Tu vas dans <strong>Publication</strong>,
          tu cliques <strong>Copier</strong> puis <strong>Modifier sur GitHub</strong>, tu colles et tu
          valides.
        </p>
        <p>
          Trente secondes, depuis un téléphone si besoin. Quelqu'un relira ta proposition et la fusionnera.
        </p>
      </Section>

      <Section title="Ce que l'outil ne fait pas">
        <p>
          <strong>Les brouillons ne se partagent pas en direct.</strong> Si trois personnes éditent chacune
          sur leur machine pendant une session, leurs modifications ne fusionnent pas — c'est l'écran de
          l'animateur qui fait foi. C'est le prix d'un outil sans serveur.
        </p>
        <p>
          <strong>La progression de révision est propre à chaque navigateur.</strong> Réviser sur ton
          téléphone puis sur ton portable, ce sont deux progressions distinctes.
        </p>
      </Section>

      <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-8">
        <ExternalButtonLink href={`${repositoryUrl()}/blob/main/CONTRIBUTING.md`} size="sm">
          <Github />
          Le format des cartes en détail
        </ExternalButtonLink>
        <ExternalButtonLink href={repositoryUrl()} variant="ghost" size="sm">
          Le dépôt
        </ExternalButtonLink>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink/90">{children}</div>
    </section>
  )
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <p className="my-4 border-l-2 border-brand bg-brand-soft/40 py-2 pl-4 text-[14px] leading-relaxed">
      {children}
    </p>
  )
}

function Step({ number, children }: { number: number; children: ReactNode }) {
  return (
    <li className="flex gap-3.5">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-[11px] text-muted tabular-nums">
        {number}
      </span>
      <span>{children}</span>
    </li>
  )
}

function Mode({
  icon,
  title,
  shortcut,
  children,
}: {
  icon: ReactNode
  title: string
  shortcut: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <span className="text-brand">{icon}</span>
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <ArrowRight className="text-line-strong" />
        <span className="text-[12px] text-muted">{shortcut}</span>
      </div>
      <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{children}</p>
    </div>
  )
}
