import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ProgressByCardId } from '../application/ports'
import { systemClock } from '../application/ports'
import type { Rating, ReviewState } from '../domain/scheduling'
import { answer, initialState } from '../domain/scheduling'
import { createLocalStore } from '../infrastructure/local-store'

const progressStore = createLocalStore<ProgressByCardId>('progress', () => ({}))

interface ProgressValue {
  readonly states: ProgressByCardId
  stateOf(cardId: string): ReviewState | undefined
  rate(cardId: string, rating: Rating): ReviewState
  forget(cardIds: readonly string[]): void
}

const ProgressContext = createContext<ProgressValue | null>(null)

/**
 * La progression de révision — strictement locale au navigateur.
 *
 * Elle n'est ni publiée, ni synchronisée, ni visible par les autres. C'est un
 * choix de produit : dans une équipe, un score de révision exposé transforme un
 * outil d'apprentissage en outil d'évaluation.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<ProgressByCardId>(() => progressStore.read())

  const persist = useCallback((next: ProgressByCardId) => {
    progressStore.write(next)
    setStates(next)
  }, [])

  const rate = useCallback(
    (cardId: string, rating: Rating): ReviewState => {
      const now = systemClock.now()
      const current = states[cardId] ?? initialState(now)
      const next = answer(current, rating, now)

      persist({ ...states, [cardId]: next })
      return next
    },
    [states, persist],
  )

  const forget = useCallback(
    (cardIds: readonly string[]) => {
      const next = { ...states }
      for (const id of cardIds) delete next[id]
      persist(next)
    },
    [states, persist],
  )

  const value = useMemo<ProgressValue>(
    () => ({ states, stateOf: (cardId) => states[cardId], rate, forget }),
    [states, rate, forget],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressValue {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgress doit être utilisé dans un ProgressProvider')
  return value
}
