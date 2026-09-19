/**
 * Stockage local versionné.
 *
 * `localStorage` échoue silencieusement en navigation privée ou quand le quota
 * est atteint. On ne laisse jamais cette panne remonter dans l'interface : une
 * progression perdue est ennuyeuse, une page blanche est inacceptable.
 */
export interface LocalStore<T> {
  read(): T
  write(value: T): void
}

export function createLocalStore<T>(key: string, fallback: () => T): LocalStore<T> {
  const namespacedKey = `flashcards:v1:${key}`

  return {
    read(): T {
      try {
        const raw = window.localStorage.getItem(namespacedKey)
        if (raw === null) return fallback()
        return JSON.parse(raw) as T
      } catch {
        return fallback()
      }
    },

    write(value: T): void {
      try {
        window.localStorage.setItem(namespacedKey, JSON.stringify(value))
      } catch {
        // Stockage indisponible : la session reste utilisable en mémoire.
      }
    },
  }
}
