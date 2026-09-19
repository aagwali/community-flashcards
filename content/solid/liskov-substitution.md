---
tags: [theme:solid, type:principe, niveau:confirme, lang:agnostique]
status: proposed
author: adrien
discussedAt: 2026-09-12
sources:
  - Barbara Liskov & Jeannette Wing, A Behavioral Notion of Subtyping (1994)
---

## Question

Le classique `Carre extends Rectangle` compile parfaitement. Pourquoi est-ce
malgré tout une violation de Liskov ?

## Réponse

Parce que Liskov porte sur le **contrat comportemental**, pas sur la signature.
Le compilateur ne vérifie que la seconde.

```ts
class Rectangle {
  constructor(
    protected largeur: number,
    protected hauteur: number,
  ) {}
  setLargeur(l: number): void {
    this.largeur = l
  }
  aire(): number {
    return this.largeur * this.hauteur
  }
}

class Carre extends Rectangle {
  override setLargeur(l: number): void {
    this.largeur = l
    this.hauteur = l // surprise pour l'appelant
  }
}
```

Le code appelant tient pour acquis qu'après `setLargeur(5)` la hauteur n'a pas
bougé. `Carre` casse cette promesse : il n'est donc pas substituable.

La règle de lecture rapide :

- **préconditions** : une sous-classe ne peut pas en exiger davantage ;
- **postconditions** : elle ne peut pas en garantir moins ;
- **invariants** : elle doit les préserver.

> L'exception qu'on avait soulevée : lever `NotImplementedException` dans une
> redéfinition est toujours une violation. Si ça arrive, c'est l'interface qui
> est trop large — et on bascule sur ISP.
