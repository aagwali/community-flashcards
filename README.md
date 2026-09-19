# Cartes — Communauté Tech

Les cartes de révision de la communauté : écrites ensemble pendant nos sessions
tech, corrigées et enrichies par tout le monde, révisées par chacun de son côté.

L'application est un site statique. Pas de serveur, pas de base de données, pas
de compte à créer. Le contenu vit en Markdown dans ce dépôt ; la progression de
révision reste dans le navigateur de chacun.

---

## Les trois usages

| Mode            | Quand                       | Ce qu'il fait                                                                                                       |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Animation**   | Pendant la session, projeté | Une carte à la fois, navigation libre, sommaire, édition et création sur place. C'est l'écran qu'on montre à table. |
| **Révision**    | Chacun de son côté          | Répétition espacée (SM-2). Progression **locale et privée** : elle ne quitte jamais votre navigateur.               |
| **Publication** | Après la session            | Envoie les modifications locales vers le dépôt, via l'éditeur web de GitHub. Exporte aussi vers Anki (CSV) ou JSON. |

## Ajouter ou corriger une carte

Deux chemins, au choix :

1. **Depuis l'application** — bouton _Modifier_ ou _Nouvelle carte_. La
   modification est immédiate et locale ; l'onglet _Publication_ l'envoie
   ensuite vers GitHub.
2. **Directement dans le dépôt** — un fichier Markdown dans `content/`.

Le format et la taxonomie des tags sont décrits dans
[CONTRIBUTING.md](CONTRIBUTING.md).

---

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
```

| Commande         | Effet                                                |
| ---------------- | ---------------------------------------------------- |
| `npm run dev`    | serveur de développement                             |
| `npm test`       | tests unitaires **et** validation de tout le contenu |
| `npm run build`  | vérification des types puis build de production      |
| `npm run lint`   | ESLint                                               |
| `npm run format` | Prettier                                             |

## Publication

Le workflow [`ci.yml`](.github/workflows/ci.yml) vérifie chaque Pull Request
(tests, contenu, types, lint, format) et publie `main` sur GitHub Pages.

Mise en service, une seule fois :

1. **Settings → Pages → Source : GitHub Actions**
2. Ajuster `communityName` dans [`src/app-config.ts`](src/app-config.ts).

Le propriétaire, le dépôt et la branche sont injectés au build par la CI : un
fork pointe automatiquement vers son propre dépôt, sans modification de code.

> ⚠️ GitHub Pages sur un dépôt **privé** nécessite un plan Team ou Enterprise.
> Sur un dépôt privé en plan gratuit, remplacer l'étape `deploy` par un
> hébergeur statique (Cloudflare Pages, Netlify) : le reste du workflow ne
> change pas.

---

## Architecture

```
content/                 les cartes — modifiables sans toucher au code
src/
  domain/                TypeScript pur, aucune dépendance : cartes, tags, scheduler
  content/               lecture et validation des fichiers Markdown
  application/           cas d'usage et interfaces (ports)
  infrastructure/        localStorage, liens GitHub, exports
  ui/                    React — design system, pages, contextes
```

Une seule règle structurante : **`domain/` ne connaît ni React, ni le stockage,
ni l'horloge du navigateur.** `now` est toujours un paramètre. C'est ce qui rend
le scheduler testable sans machinerie de faux temps, et remplaçable (par FSRS,
par exemple) sans toucher au reste. ESLint fait respecter la frontière.

La séparation `content/` ↔ `src/` est tout aussi importante : **une personne
peut contribuer sans jamais ouvrir `src/`.** C'est ce qui rend l'outil
participatif plutôt que personnel.

## Décisions

Les choix qui se discutent, et pourquoi ils ont été tranchés ainsi.

**Le contenu est dans Git, pas dans une base.**
Nos contributeurs sont développeurs : une correction est une Pull Request,
une validation est une review. Aucun outil nouveau à apprendre, aucun backend à
maintenir, l'historique et l'attribution sont gratuits. Le prix : publier une
carte demande un build (≈ 1 min via la CI).

**L'édition se fait dans l'application, la publication passe par GitHub.**
Une remarque en séance se corrige devant tout le monde, immédiatement. Les
modifications restent locales jusqu'à ce qu'on les publie : l'onglet
_Publication_ ouvre l'éditeur web de GitHub sur le bon fichier. Aucun jeton
d'accès à distribuer, aucun secret dans une application publique — GitHub gère
les droits.

**La progression de révision est locale et privée.**
Dans un cadre professionnel, un score de révision visible par l'équipe
transforme un outil d'apprentissage en outil d'évaluation. Elle n'est ni
synchronisée, ni publiée.

**La validation du contenu est une suite de tests, pas un script.**
Une carte mal formée casse la CI comme n'importe quelle régression, et l'auteur
de la PR lit une erreur qui le situe dans son fichier.

**Le scheduler est SM-2, sans fuzz ni limites journalières.**
Ces deux mécanismes d'Anki protègent des collections de dizaines de milliers de
cartes. Sur quelques centaines, ils n'apportent rien et rendent le scheduler non
déterministe. Voir [`src/domain/scheduling.ts`](src/domain/scheduling.ts).

**Markdown plutôt qu'un éditeur riche.**
Nos cartes contiennent du code. Un éditeur WYSIWYG produirait du HTML illisible
en diff et impossible à corriger à la main dans le dépôt.

## Ce qui n'est délibérément pas là

Types de notes personnalisés, texte à trous, decks imbriqués, import `.apkg`,
decks filtrés, statistiques communautaires, synchronisation multi-appareils.

Chacun est rajoutable sur cette architecture sans rien casser. Aucun ne se
justifie pour quinze personnes et quelques centaines de cartes — et le contenu
reste exportable vers Anki pour qui veut ces fonctionnalités aujourd'hui.
