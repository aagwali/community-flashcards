---
tags: [theme:solid, type:principe, niveau:confirme, lang:agnostique]
status: proposed
author: adrien
discussedAt: 2026-09-12
---

## Question

« Ouvert à l'extension, fermé à la modification » : qu'est-ce qu'on ouvre, et
qu'est-ce qu'on ferme exactement ?

## Réponse

On ouvre le **comportement** : on doit pouvoir ajouter un cas sans rouvrir le
code existant. On ferme le **code source** de l'abstraction : elle ne bouge plus
quand un cas s'ajoute.

Avant — chaque nouveau moyen de paiement rouvre le `switch` :

```ts
function calculerFrais(paiement: Paiement): number {
  switch (paiement.type) {
    case 'carte':
      return paiement.montant * 0.015
    case 'virement':
      return 0
    // ...et on revient ici à chaque fois
  }
}
```

Après — le point de variation est nommé, chaque cas vit dans son fichier :

```ts
interface MoyenDePaiement {
  frais(montant: number): number
}
```

Le piège : appliquer OCP partout produit une abstraction par `if`. On paie une
indirection permanente pour une variation hypothétique.

> Ce qu'on avait retenu à table : **on n'ouvre qu'un axe qu'on a déjà vu varier
> au moins deux fois.** La première fois, on écrit le `if`. La troisième, on
> abstrait.
