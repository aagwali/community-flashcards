---
tags: [theme:typage, type:piege, niveau:confirme, lang:typescript]
status: validated
author: adrien
---

## Question

Ce code compile-t-il ? Et si oui, pourquoi est-ce dérangeant ?

```ts
interface Metres {
  valeur: number
}
interface Secondes {
  valeur: number
}

function distance(d: Metres): number {
  return d.valeur
}

distance({ valeur: 42 } satisfies Secondes)
```

## Réponse

Oui, ça compile. TypeScript est **structurel** : deux types de même forme sont
interchangeables, quels que soient leurs noms.

Pour obtenir une distinction nominale, on marque le type :

```ts
type Metres = number & { readonly __unite: 'metres' }
type Secondes = number & { readonly __unite: 'secondes' }

const metres = (n: number): Metres => n as Metres
```

Le _branded type_ n'existe qu'à la compilation : aucun coût à l'exécution.

C'est exactement ce qui évite de passer un `UserId` là où un `OrderId` est
attendu — le bug le plus silencieux d'un code pourtant « entièrement typé ».
