---
name: MFA administrateur
description: Décisions durables concernant le second facteur et le canal de validation de l’administrateur ZyNum.
---

Le compte administrateur doit réussir un second code à usage unique à chaque nouvelle authentification. Le code est stocké uniquement sous forme de hash, consommé atomiquement, et envoyé au Chat ID enregistré dans le panneau Admin → Bot Telegram. Le token est lu uniquement depuis le secret `TELEGRAM_BOT_TOKEN`.

**Why:** Le propriétaire a demandé que le Chat ID déjà configuré dans le panneau soit la source unique pour le MFA, plutôt qu’un second secret d’environnement. Un code en clair en base augmente aussi l’impact d’une fuite de données.

**How to apply:** Toute évolution du parcours admin doit conserver un échec fermé si `TELEGRAM_BOT_TOKEN` ou le Chat ID du panneau n’est pas configuré, ne jamais afficher le canal de livraison sur l’écran de connexion, et ne pas utiliser un fallback de Chat ID d’environnement pour le MFA.

La synchronisation du compte admin doit désactiver les anciens admins avant de promouvoir ou créer l’adresse configurée.

**Why:** La base applique une contrainte d’unicité partielle sur `is_admin=true`; une insertion ou promotion avant la désactivation de l’ancien compte fait échouer tout le démarrage.

**How to apply:** Conserver cet ordre dans les scripts d’initialisation et de seed, sans supprimer de données utilisateurs.