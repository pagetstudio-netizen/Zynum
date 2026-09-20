---
name: Remboursements de numéros
description: Règle de cohérence entre l’annulation 5SIM et le crédit du solde utilisateur.
---

Une commande expirée ne doit être créditée localement qu’après confirmation par 5SIM d’un état remboursable. Le traitement doit verrouiller la commande et rendre le crédit idempotent, y compris en cas de plusieurs instances ou d’une réponse réseau perdue. Toute autre mise à jour de statut doit être conditionnelle afin de ne jamais écraser un remboursement concurrent.

**Why:** 5SIM rembourse son propre solde après l’annulation, avec un délai possible. Ignorer un échec distant ou traiter deux fois la même commande peut désynchroniser les soldes ou doubler le crédit utilisateur.

**How to apply:** Pour tout nouveau chemin d’annulation ou d’expiration, réutiliser le flux central de remboursement, conserver les nouvelles tentatives automatiques, employer une mise à jour compare-and-set pour les statuts et ne jamais créditer directement le solde depuis une route.

Pour le compare-and-set, utiliser le statut et le jeton de remboursement, pas une égalité exacte sur `updated_at`.

**Why:** PostgreSQL peut conserver des microsecondes que les dates JavaScript tronquent aux millisecondes, ce qui fait échouer une comparaison exacte du timestamp même sans concurrence.