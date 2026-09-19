import { useCallback, useState } from 'react'
import { createLocalStore } from '../infrastructure/local-store'

const authorStore = createLocalStore<string>('author', () => '')

/**
 * Le pseudo GitHub de la personne, demandé une fois puis réutilisé.
 *
 * Il sert à créditer les contributions dans l'en-tête des cartes : dans une
 * communauté naissante, savoir qui a écrit quoi est la moitié de l'intérêt.
 */
export function useAuthor(): { author: string; setAuthor: (author: string) => void } {
  const [author, setAuthorState] = useState<string>(() => authorStore.read())

  const setAuthor = useCallback((next: string) => {
    const trimmed = next.trim()
    authorStore.write(trimmed)
    setAuthorState(trimmed)
  }, [])

  return { author, setAuthor }
}
