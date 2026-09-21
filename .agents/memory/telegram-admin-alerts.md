---
name: Alertes admin Telegram
description: Règle de couverture des notifications Telegram pour les actions administratives sensibles.
---

Toute modification administrative de solde, y compris les anciennes routes de transactions manuelles, doit envoyer une alerte Telegram détaillée avec l’ancien solde, le montant ajouté ou retiré, le nouveau solde, l’utilisateur, l’administrateur, le motif et la date.

**Why:** Une alerte ajoutée uniquement à la nouvelle route dédiée laisse les chemins historiques de crédit ou débit silencieux, ce qui rend l’audit incomplet.

**How to apply:** Lorsqu’une route admin met à jour `users.balanceUsd`, réutiliser l’alerte de solde commune et conserver le chat général de notifications séparé du chat privé MFA.