import type { SVGProps } from 'react'

/**
 * Jeu d'icônes minimal, dessiné à la main plutôt qu'importé : une douzaine de
 * traits ne justifie pas une dépendance, et le trait reste cohérent partout.
 */
type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const ArrowLeft = (props: IconProps) => (
  <Icon {...props}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
)

export const ArrowRight = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 5l7 7-7 7" />
  </Icon>
)

export const Plus = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const Pencil = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 20h4l10-10a2.4 2.4 0 10-3.4-3.4L4.6 16.6 4 20z" />
  </Icon>
)

export const Flag = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 21V4M5 5h11l-2 3.5L16 12H5" />
  </Icon>
)

export const Check = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 12.5l5 5L20 6.5" />
  </Icon>
)

export const Close = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)

export const Grid = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </Icon>
)

export const Play = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 4.5l12 7.5-12 7.5z" />
  </Icon>
)

export const Layers = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </Icon>
)

export const Download = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 4v11m0 0l-4-4m4 4l4-4M4 19h16" />
  </Icon>
)

export const Copy = (props: IconProps) => (
  <Icon {...props}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 012-2h8" />
  </Icon>
)

export const Github = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" aria-hidden="true" {...props}>
    <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .27.18.58.69.48A10 10 0 0012 2z" />
  </svg>
)

export const Sun = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
  </Icon>
)

export const Moon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
  </Icon>
)
