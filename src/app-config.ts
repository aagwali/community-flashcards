/**
 * Le seul endroit à modifier pour brancher l'application sur votre dépôt.
 *
 * Les valeurs peuvent être surchargées au build (`VITE_GITHUB_OWNER`, …), ce
 * qui permet à un fork de pointer ailleurs sans toucher au code.
 */
export const appConfig = {
  /** Nom affiché dans l'en-tête. */
  communityName: 'Communauté Tech',

  github: {
    owner: import.meta.env['VITE_GITHUB_OWNER'] ?? 'aagwali',
    repository: import.meta.env['VITE_GITHUB_REPO'] ?? 'community-flashcards',
    branch: import.meta.env['VITE_GITHUB_BRANCH'] ?? 'main',
  },
} as const

export function repositoryUrl(): string {
  return `https://github.com/${appConfig.github.owner}/${appConfig.github.repository}`
}
