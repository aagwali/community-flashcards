import { appConfig } from '../../app-config'

/**
 * Logo officiel, optionnel.
 *
 * Déposez le fichier dans `src/assets/logo.svg` (ou `.png`) et il remplace
 * automatiquement la marque dessinée ci-dessous — aucune ligne de code à
 * changer. La résolution se fait au build : tant que le fichier est absent,
 * rien n'est téléchargé et aucune requête ne part.
 */
const officialLogo = Object.values(
  import.meta.glob('/src/assets/logo.{svg,png}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)[0] as string | undefined

/**
 * Marque de repli — une déclinaison, pas une reproduction.
 *
 * Elle reprend les deux couleurs de l'identité et le geste du logo (une forme
 * en mouvement, coupée en diagonale) sans en copier le dessin. Deux cartes
 * superposées dont celle du dessus se retourne : c'est littéralement le produit.
 */
export function Mark({ size = 28 }: { size?: number }) {
  if (officialLogo) {
    return (
      <img
        src={officialLogo}
        alt={appConfig.communityName}
        height={size}
        className="w-auto object-contain"
        style={{ height: size }}
      />
    )
  }

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
      <path d="M17 8.5 L22.5 14 L14 22.5 L11 22.5 L11 19.5 Z" className="fill-brand-vivid" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark />
      {/* Le logo officiel porte déjà le nom : inutile de le répéter à côté. */}
      {officialLogo ? (
        <span className="text-[15px] font-semibold tracking-tight text-ink">Cartes</span>
      ) : (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-ink">Cartes</span>
          <span className="mt-0.5 text-[11px] font-medium tracking-wide text-muted">
            {appConfig.communityName}
          </span>
        </span>
      )}
    </span>
  )
}
