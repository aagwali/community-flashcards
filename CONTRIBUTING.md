# Écrire une carte

Ces cartes sont les nôtres. Si une réponse te paraît fausse, incomplète ou mal
formulée, corrige-la — c'est le but. Personne n'a besoin d'une permission.

## Le plus simple : depuis l'application

1. Ouvre le deck, déplie une carte, clique **Modifier**. Ou **Nouvelle carte**.
2. Écris. L'aperçu est à droite, en direct.
3. Va dans **Publication**, clique **Copier**, puis **Modifier sur GitHub**.
4. Colle, décris ta modification en une ligne, valide. GitHub crée la Pull
   Request.

Tes modifications restent sur ta machine tant que tu ne les publies pas — tu
peux corriger trois cartes pendant la session et tout envoyer d'un coup après.

## L'autre chemin : directement dans le dépôt

Un fichier `.md` par carte, dans `content/<deck>/` :

````markdown
---
tags: [theme:solid, type:principe, niveau:confirme, lang:typescript]
status: proposed
author: ton-pseudo
discussedAt: 2026-09-12
sources:
  - Robert C. Martin, Clean Architecture
---

## Question

Pourquoi ce code viole-t-il le principe d'inversion des dépendances ?

```ts
class FactureService {
  private readonly db = new PostgresRepository()
}
```

## Réponse

Le module de haut niveau dépend directement d'un détail de bas niveau…

> La remarque de Sofiane : injecter la dépendance ne suffit pas si l'interface
> parle encore le langage de la base.
````

Le nom du fichier devient l'identifiant de la carte : en minuscules, avec des
tirets, et **on ne le change plus** une fois la carte publiée.

## Les champs

| Champ         | Obligatoire | Rôle                                                       |
| ------------- | ----------- | ---------------------------------------------------------- |
| `tags`        | non         | classement et filtrage — voir la taxonomie ci-dessous      |
| `status`      | non         | où en est la validation par le groupe (`draft` par défaut) |
| `author`      | non         | ton pseudo GitHub, pour créditer la contribution           |
| `reviewers`   | non         | qui a relu et approuvé en session                          |
| `sources`     | non         | livre, conférence, article — une par ligne                 |
| `discussedAt` | non         | date de la session, au format `AAAA-MM-JJ`                 |

## Les statuts

- **`draft`** — tu l'as écrite seul, elle n'est pas encore passée devant le groupe.
- **`proposed`** — discutée en session, en attente de validation.
- **`validated`** — le groupe est d'accord, elle fait foi.

Une carte `proposed` qu'on valide en séance passe en `validated` : c'est
exactement le geste qu'on vient faire ensemble à la prochaine pause déjeuner.

## Les tags

L'**espace de nom** est fermé, la valeur est libre — en minuscules, avec des
tirets. C'est ce qui évite d'avoir un jour `solid`, `SOLID` et `principes-solid`
côte à côte.

| Espace de nom | Pour quoi             | Exemples                                          |
| ------------- | --------------------- | ------------------------------------------------- |
| `theme:`      | le sujet              | `theme:solid`, `theme:archi`, `theme:tests`       |
| `type:`       | la nature de la carte | `type:principe`, `type:piege`, `type:definition`  |
| `niveau:`     | pour qui              | `niveau:junior`, `niveau:confirme`                |
| `lang:`       | le langage concerné   | `lang:typescript`, `lang:java`, `lang:agnostique` |

Un tag hors de ces quatre espaces de nom **fait échouer la CI**, avec le chemin
de ton fichier dans le message d'erreur. Ce n'est pas une punition : c'est ce
qui garantit que les filtres marchent encore dans six mois.

## Ce qui fait une bonne carte

- **Une seule idée.** Si la réponse a deux parties indépendantes, ce sont deux
  cartes.
- **Une question qui se répond**, pas un titre de chapitre. « Pourquoi ce code
  viole-t-il le DIP ? » plutôt que « Le principe DIP ».
- **Du code plutôt qu'une paraphrase.** Un contre-exemple de huit lignes vaut
  trois paragraphes.
- **Ce qui a fait débat à table.** C'est la partie qu'on ne retrouve dans aucun
  livre, et la plus utile six mois plus tard. Une citation en `>` suffit.

## Vérifier avant de proposer

```bash
npm test
```

La commande valide toutes les cartes : format, tags, sections manquantes. La CI
fait exactement la même chose sur ta Pull Request.
