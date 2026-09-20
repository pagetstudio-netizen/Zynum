---
name: MFA administrateur
description: Décisions durables concernant le second facteur et le canal de validation de l’administrateur ZyNum.
---

Le compte administrateur doit réussir un second code à usage unique à chaque nouvelle authentification. Le code est stocké uniquement sous forme de hash, consommé atomiquement, et envoyé exclusivement au chat privé configuré par `TELEGRAM_ADMIN_CHAT_ID`.

**Why:** Le canal général de notifications peut avoir une audience plus large et ne doit pas recevoir un secret de connexion administrateur. Un code en clair en base augmente aussi l’impact d’une fuite de données.

**How to apply:** Toute évolution du parcours admin doit conserver un échec fermé si les secrets admin ou le chat privé ne sont pas configurés, ne jamais afficher le canal de livraison sur l’écran de connexion, et ne pas réutiliser `TELEGRAM_CHAT_ID` pour le MFA.

La synchronisation du compte admin doit désactiver les anciens admins avant de promouvoir ou créer l’adresse configurée.

**Why:** La base applique une contrainte d’unicité partielle sur `is_admin=true`; une insertion ou promotion avant la désactivation de l’ancien compte fait échouer tout le démarrage.

**How to apply:** Conserver cet ordre dans les scripts d’initialisation et de seed, sans supprimer de données utilisateurs.