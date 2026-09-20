---
name: MFA administrateur
description: Décisions durables concernant le second facteur et le canal de validation de l’administrateur ZyNum.
---

Le compte administrateur doit réussir un second code à usage unique à chaque nouvelle authentification. Le code est stocké uniquement sous forme de hash, consommé atomiquement, et envoyé exclusivement au chat privé configuré par `TELEGRAM_ADMIN_CHAT_ID`.

**Why:** Le canal général de notifications peut avoir une audience plus large et ne doit pas recevoir un secret de connexion administrateur. Un code en clair en base augmente aussi l’impact d’une fuite de données.

**How to apply:** Toute évolution du parcours admin doit conserver un échec fermé si les secrets admin ou le chat privé ne sont pas configurés, ne jamais afficher le canal de livraison sur l’écran de connexion, et ne pas réutiliser `TELEGRAM_CHAT_ID` pour le MFA.