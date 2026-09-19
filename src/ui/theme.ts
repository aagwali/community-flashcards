import { useCallback, useEffect, useState } from 'react'
import { createLocalStore } from '../infrastructure/local-store'

export const THEMES = ['system', 'light', 'dark'] as const

export type Theme = (typeof THEMES)[number]

const themeStore = createLocalStore<Theme>('theme', () => 'system')

/**
 * « system » ne pose pas d'attribut : la feuille de style retombe alors sur
 * `prefers-color-scheme`. Les deux autres valeurs forcent explicitement, ce qui
 * est utile en salle de réunion où le vidéoprojecteur n'a pas les mêmes
 * contraintes de contraste qu'un écran.
 */
export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(() => themeStore.read())

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    themeStore.write(next)
    setThemeState(next)
  }, [])

  return { theme, setTheme }
}
