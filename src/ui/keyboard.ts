/**
 * Garde-fous communs aux raccourcis clavier des modes plein écran.
 */

/** La frappe vient-elle d'un champ de saisie ? Alors ce n'est pas un raccourci. */
export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true

  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Une touche combinée à Cmd, Ctrl ou Alt appartient au navigateur ou au
 * système : ⌘N ouvre une fenêtre, on ne lui vole pas son sens.
 */
export function hasModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey
}
