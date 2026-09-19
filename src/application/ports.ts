import type { Card } from '../domain/card'
import type { ReviewState } from '../domain/scheduling'

/**
 * Les frontières de l'application. Le domaine ne connaît que ces interfaces ;
 * il ignore localStorage, GitHub et l'horloge du navigateur.
 */

export interface Clock {
  now(): number
}

export const systemClock: Clock = {
  now: () => Date.now(),
}

/** Un brouillon local : une carte modifiée ou créée, pas encore publiée. */
export interface CardDraft {
  readonly card: Card
  readonly origin: 'edited' | 'created'
  /** Remarque prise pendant la session, à transmettre avec la modification. */
  readonly note: string
  readonly updatedAt: number
}

export type DraftsByCardId = Readonly<Record<string, CardDraft>>

export interface DraftStore {
  read(): DraftsByCardId
  write(drafts: DraftsByCardId): void
}

/**
 * La progression est **privée**. Elle ne quitte jamais le navigateur : dans un
 * cadre professionnel, c'est la condition pour que chacun ose répondre « je ne
 * sais pas » sans que ça se voie.
 */
export type ProgressByCardId = Readonly<Record<string, ReviewState>>

export interface ProgressStore {
  read(): ProgressByCardId
  write(progress: ProgressByCardId): void
}
