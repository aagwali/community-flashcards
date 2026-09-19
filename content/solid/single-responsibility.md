---
tags: [theme:solid, type:principe, niveau:junior, lang:agnostique]
status: draft
---

## Question

« Une classe ne doit avoir qu'une seule responsabilité » : responsabilité envers
qui ?

## Réponse

> ⚠️ Carte à discuter lors de la prochaine session — brouillon à challenger.

Envers **un acteur métier**. La formulation exacte de Robert C. Martin est :
_« un module ne doit avoir qu'une seule raison de changer »_, et une raison de
changer, c'est une personne ou un service qui demande le changement.

Le contre-sens fréquent : comprendre « une classe = une seule chose », ce qui
mène à des classes anémiques à une méthode.

Le bon test : si la Comptabilité et les Opérations peuvent chacune exiger une
modification du même fichier, ce fichier a deux responsabilités.

<!-- À enrichir ensemble : un exemple tiré d'une de nos missions serait plus parlant qu'un exemple générique. -->
