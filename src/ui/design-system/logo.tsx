import { appConfig } from '../../app-config'

/**
 * Marque de l'application — une déclinaison, pas une reproduction.
 *
 * Elle reprend les deux couleurs de l'identité et le geste du logo (une forme
 * en mouvement, coupée en diagonale) sans en copier le dessin. Deux cartes
 * superposées dont celle du dessus se retourne : c'est littéralement le produit.
 *
 * Pour utiliser le logo officiel : déposez-le dans `public/logo.svg` et
 * remplacez `<Mark />` par une balise <img>.
 */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={`${appConfig.communityName} — cartes`}
    >
      <rect x="2" y="6" width="20" height="24" rx="4" className="fill-ink" opacity="0.14" />
      <rect x="7" y="3" width="20" height="24" rx="4" className="fill-ink" />
      <path d="M17 8.5 L22.5 14 L14 22.5 L11 22.5 L11 19.5 Z" className="fill-brand" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight text-ink">Cartes</span>
        <span className="mt-0.5 text-[11px] font-medium tracking-wide text-muted">
          {appConfig.communityName}
        </span>
      </span>
    </span>
  )
}
