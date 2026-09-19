/**
 * Répétition espacée — SM-2 dans la variante d'Anki, volontairement resserrée.
 *
 * Deux écarts assumés avec Anki :
 *
 *  1. pas de « fuzz » (le bruit aléatoire sur les intervalles). Il sert à étaler
 *     la charge sur des collections de dizaines de milliers de cartes ; sur
 *     quelques centaines il n'apporte rien et rend le scheduler non déterministe,
 *     donc pénible à tester ;
 *  2. pas de limites journalières. Elles existent pour protéger d'un backlog que
 *     nous n'aurons pas.
 *
 * Tout est pur : `now` est un paramètre, jamais `Date.now()`. C'est ce qui rend
 * les tests ci-contre lisibles sans machinerie de faux temps.
 */

export const RATINGS = ['again', 'hard', 'good', 'easy'] as const

export type Rating = (typeof RATINGS)[number]

export const RATING_LABELS: Record<Rating, string> = {
  again: 'À revoir',
  hard: 'Difficile',
  good: 'Correct',
  easy: 'Facile',
}

export type ReviewPhase = 'learning' | 'review' | 'relearning'

export interface ReviewState {
  readonly phase: ReviewPhase
  /** Position dans les paliers d'apprentissage. */
  readonly step: number
  /** Intervalle courant en jours ; 0 tant que la carte n'a pas « diplômé ». */
  readonly intervalDays: number
  /** Facteur de facilité SM-2. */
  readonly ease: number
  readonly lapses: number
  readonly reviews: number
  /** Timestamp (ms) de la prochaine échéance. */
  readonly dueAt: number
}

export interface SchedulerConfig {
  readonly learningStepsMinutes: readonly number[]
  readonly relearningStepsMinutes: readonly number[]
  readonly graduatingIntervalDays: number
  readonly easyIntervalDays: number
  readonly startingEase: number
  readonly minimumEase: number
  readonly easyBonus: number
  readonly hardFactor: number
  /** Part de l'intervalle conservée après un oubli. 0 = on repart d'un jour. */
  readonly lapseFactor: number
  readonly maximumIntervalDays: number
  /** Nombre d'oublis au-delà duquel la carte est signalée comme « sangsue ». */
  readonly leechThreshold: number
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  learningStepsMinutes: [1, 10],
  relearningStepsMinutes: [10],
  graduatingIntervalDays: 1,
  easyIntervalDays: 4,
  startingEase: 2.5,
  minimumEase: 1.3,
  easyBonus: 1.3,
  hardFactor: 1.2,
  lapseFactor: 0,
  maximumIntervalDays: 365 * 5,
  leechThreshold: 8,
}

const MINUTE = 60_000
const DAY = 86_400_000

export function initialState(now: number): ReviewState {
  return {
    phase: 'learning',
    step: 0,
    intervalDays: 0,
    ease: DEFAULT_SCHEDULER_CONFIG.startingEase,
    lapses: 0,
    reviews: 0,
    dueAt: now,
  }
}

export function isDue(state: ReviewState, now: number): boolean {
  return state.dueAt <= now
}

export function isLeech(state: ReviewState, config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG): boolean {
  return state.lapses >= config.leechThreshold
}

export function answer(
  state: ReviewState,
  rating: Rating,
  now: number,
  config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG,
): ReviewState {
  const reviewed = { ...state, reviews: state.reviews + 1 }

  return state.phase === 'review'
    ? answerInReview(reviewed, rating, now, config)
    : answerInSteps(reviewed, rating, now, config)
}

/** Les quatre échéances proposées, pour afficher l'intervalle sous chaque bouton. */
export function preview(
  state: ReviewState,
  now: number,
  config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG,
): Record<Rating, number> {
  return {
    again: answer(state, 'again', now, config).dueAt - now,
    hard: answer(state, 'hard', now, config).dueAt - now,
    good: answer(state, 'good', now, config).dueAt - now,
    easy: answer(state, 'easy', now, config).dueAt - now,
  }
}

function answerInSteps(
  state: ReviewState,
  rating: Rating,
  now: number,
  config: SchedulerConfig,
): ReviewState {
  const steps = state.phase === 'relearning' ? config.relearningStepsMinutes : config.learningStepsMinutes

  switch (rating) {
    case 'again':
      return { ...state, step: 0, dueAt: now + stepDelay(steps, 0) }

    case 'hard':
      return { ...state, dueAt: now + stepDelay(steps, state.step) }

    case 'good': {
      const nextStep = state.step + 1
      if (nextStep < steps.length) {
        return { ...state, step: nextStep, dueAt: now + stepDelay(steps, nextStep) }
      }
      return graduate(state, now, config, graduatingInterval(state, config))
    }

    case 'easy':
      return graduate(state, now, config, easyInterval(state, config))
  }
}

function answerInReview(
  state: ReviewState,
  rating: Rating,
  now: number,
  config: SchedulerConfig,
): ReviewState {
  if (rating === 'again') {
    const steps = config.relearningStepsMinutes
    return {
      ...state,
      phase: 'relearning',
      step: 0,
      lapses: state.lapses + 1,
      ease: clampEase(state.ease - 0.2, config),
      intervalDays: clampInterval(Math.round(state.intervalDays * config.lapseFactor), config),
      dueAt: now + stepDelay(steps, 0),
    }
  }

  const { ease, intervalDays } = nextReviewInterval(state, rating, config)

  return { ...state, phase: 'review', step: 0, ease, intervalDays, dueAt: now + intervalDays * DAY }
}

function nextReviewInterval(
  state: ReviewState,
  rating: 'hard' | 'good' | 'easy',
  config: SchedulerConfig,
): { ease: number; intervalDays: number } {
  switch (rating) {
    case 'hard':
      return {
        ease: clampEase(state.ease - 0.15, config),
        intervalDays: clampInterval(Math.round(state.intervalDays * config.hardFactor), config),
      }
    case 'good':
      return {
        ease: state.ease,
        intervalDays: clampInterval(Math.round(state.intervalDays * state.ease), config),
      }
    case 'easy':
      return {
        ease: clampEase(state.ease + 0.15, config),
        intervalDays: clampInterval(Math.round(state.intervalDays * state.ease * config.easyBonus), config),
      }
  }
}

function graduate(
  state: ReviewState,
  now: number,
  config: SchedulerConfig,
  intervalDays: number,
): ReviewState {
  const capped = clampInterval(intervalDays, config)
  return { ...state, phase: 'review', step: 0, intervalDays: capped, dueAt: now + capped * DAY }
}

/**
 * Une carte qui sort de ré-apprentissage retrouve l'intervalle réduit calculé au
 * moment de l'oubli — elle ne repart pas de zéro comme une carte neuve.
 */
function graduatingInterval(state: ReviewState, config: SchedulerConfig): number {
  return state.phase === 'relearning'
    ? Math.max(config.graduatingIntervalDays, state.intervalDays)
    : config.graduatingIntervalDays
}

function easyInterval(state: ReviewState, config: SchedulerConfig): number {
  return state.phase === 'relearning'
    ? Math.max(config.easyIntervalDays, state.intervalDays)
    : config.easyIntervalDays
}

function stepDelay(steps: readonly number[], index: number): number {
  return (steps[index] ?? steps.at(-1) ?? 1) * MINUTE
}

function clampEase(ease: number, config: SchedulerConfig): number {
  return Math.max(config.minimumEase, Math.round(ease * 100) / 100)
}

function clampInterval(days: number, config: SchedulerConfig): number {
  return Math.min(config.maximumIntervalDays, Math.max(1, days))
}

/** « 10 min », « 3 j », « 2 mois »… tel qu'affiché sous les boutons de réponse. */
export function formatDelay(milliseconds: number): string {
  const minutes = Math.round(milliseconds / MINUTE)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `${minutes} min`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h`

  const days = Math.round(milliseconds / DAY)
  if (days < 31) return `${days} j`

  const months = Math.round(days / 30)
  if (months < 12) return `${months} mois`

  const years = Math.round((days / 365) * 10) / 10
  return `${years} an${years >= 2 ? 's' : ''}`
}
