import { useState } from 'react'
import { appConfig } from '../../app-config'

/**
 * Logo officiel, déposé dans `public/logo.svg`.
 *
 * Il n'est pas importé comme module : Vite recopie `public/` tel quel, ce qui
 * laisse le fichier remplaçable sans rebuild du code. En contrepartie sa
 * présence n'est pas vérifiable à la compilation — d'où le repli sur la marque
 * dessinée si la requête échoue, pour qu'un fork sans logo reste présentable.
 */
const LOGO_URL = `${import.meta.env.BASE_URL}logo.svg`

export function Mark({ height = 22 }: { height?: number }) {
  const [unavailable, setUnavailable] = useState(false)

  if (unavailable) return <FallbackMark size={height + 6} />

  return (
    <img
      src={LOGO_URL}
      alt={appConfig.communityName}
      style={{ height }}
      className="w-auto object-contain"
      onError={() => setUnavailable(true)}
    />
  )
}

/**
 * Marque de repli — une déclinaison, pas une reproduction : deux cartes
 * superposées dont celle du dessus se retourne, dans les couleurs de l'identité.
 */
function FallbackMark({ size }: { size: number }) {
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

/**
 * Verrouillage co-marqué : le logo porte l'entreprise, le mot porte le produit.
 * Le filet les sépare sans les hiérarchiser.
 *
 * Sur mobile, le nom du produit s'efface : la barre doit loger la navigation,
 * et le logo suffit à dire où l'on est.
 */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-3">
      <Mark />
      <span className="hidden h-6 w-px bg-line-strong sm:block" aria-hidden="true" />
      <span className="hidden text-[15px] font-semibold tracking-tight text-ink sm:block">Cartes</span>
    </span>
  )
}
