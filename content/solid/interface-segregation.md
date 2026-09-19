---
tags: [theme:solid, type:principe, niveau:junior, lang:agnostique]
status: draft
---

## Question

Quelle différence concrète entre le principe de ségrégation des interfaces (ISP)
et le principe de responsabilité unique (SRP) ?

## Réponse

> ⚠️ Carte à discuter lors de la prochaine session — brouillon à challenger.

SRP regarde l'**implémentation** : combien d'acteurs peuvent exiger un
changement de ce module ?

ISP regarde la **dépendance** : un client ne doit pas être forcé de dépendre de
méthodes qu'il n'utilise pas.

```ts
// Le client "affichage" ne se sert que de `nom`, mais dépend de tout le reste.
interface Employe {
  nom(): string
  calculerPaie(): Montant
  sauvegarder(): void
}
```

Conséquence pratique : une recompilation ou un redéploiement inutile, et surtout
des doubles de test surdimensionnés.

<!-- À enrichir ensemble : le lien avec les interfaces "role-based" côté consommateur. -->
