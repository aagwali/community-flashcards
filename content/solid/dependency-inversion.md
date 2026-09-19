---
tags: [theme:solid, type:principe, niveau:confirme, lang:agnostique]
status: proposed
author: adrien
discussedAt: 2026-09-12
sources:
  - Robert C. Martin, Agile Software Development, Principles, Patterns, and Practices
---

## Question

Pourquoi ce code viole-t-il le principe d'inversion des dépendances ?

```ts
class FactureService {
  private readonly db = new PostgresRepository()

  enregistrer(facture: Facture): void {
    this.db.insert(facture)
  }
}
```

## Réponse

`FactureService` est un module de **haut niveau** (la règle métier) qui dépend
directement d'un détail **de bas niveau** (PostgreSQL). Le sens de la dépendance
suit l'exécution au lieu de la contredire.

Deux conséquences concrètes :

- impossible de tester la règle métier sans une base qui tourne ;
- changer de stockage oblige à rouvrir le code métier.

On inverse en introduisant une abstraction **possédée par le haut niveau** :

```ts
interface FactureRepository {
  enregistrer(facture: Facture): void
}

class FactureService {
  constructor(private readonly repository: FactureRepository) {}

  enregistrer(facture: Facture): void {
    this.repository.enregistrer(facture)
  }
}
```

> Le point qui avait fait débat : injecter une dépendance ne suffit pas. Si
> l'interface est dictée par la base (`insert`, `select`), on a juste déplacé le
> couplage. L'inversion n'existe que si **l'interface parle le langage du métier**.
