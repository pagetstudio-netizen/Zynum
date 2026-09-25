# Déploiement ZyNum sur GitHub + Plesk

Le projet se déploie comme une seule application Node.js : le serveur API sert
également le frontend compilé. Il ne faut pas lancer Vite en production.

## Configuration Plesk

Le script `deploy.sh` installe pnpm si nécessaire, restaure les dépendances
depuis le lockfile puis compile le frontend et l’API :

```bash
bash deploy.sh
```

Le build produit :

- serveur : `artifacts/api-server/dist/index.cjs`
- frontend servi par le serveur : `artifacts/api-server/dist/public/`

Dans la configuration de l’application Node.js Plesk :

- **Application root** : racine du dépôt
- **Startup file** : `app.js`
- **Application URL** : le domaine ZyNum
- **Node.js** : version 20 (`.nvmrc` et `.node-version`)
- **Port** : laisser Plesk fournir `PORT`
- **Mode** : production

La commande de démarrage équivalente est :

```bash
NODE_ENV=production node app.js
```

Le script racine suivant peut aussi être utilisé par Plesk :

```bash
pnpm start
```

Dans les réglages du dépôt Git Plesk, ajoute une action de déploiement après
le déploiement :

```bash
bash deploy.sh
```

Cette action est nécessaire : le bouton **Deploy Now** ne compile pas le projet
simplement parce que `deploy.sh` existe. Ne lance pas `npm install` dans Plesk :
le dépôt utilise pnpm et bloque volontairement l’installation avec npm.

## Variables à renseigner dans Plesk

Ne jamais mettre les valeurs secrètes dans GitHub, `.env.example` ou les logs :

```text
NODE_ENV=production
SUPABASE_DATABASE_URL=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
FIVESIM_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
```

`TELEGRAM_CHAT_ID` sert de chat de secours pour les notifications générales.
Le chat privé du MFA administrateur se configure séparément dans **Admin →
Bot Telegram**; il ne faut pas compter sur une variable d’environnement pour
ce second facteur.

Ajouter les clés des moyens de paiement activés en suivant `.env.example`.
`FIVESIM_API_KEY` est facultative si la clé 5SIM est configurée dans le panneau
admin.

## Après un Pull + Deploy Now

1. Configurer une fois l’action de déploiement `bash deploy.sh` dans Plesk.
2. Après chaque push GitHub, cliquer sur **Pull** puis **Deploy Now**. Attendre
   que l’installation et le build se terminent sans erreur.
3. Dans la section Node.js, cliquer sur **Restart**.
4. Vérifier :
   `https://zynum.net/api/healthz`
5. Vérifier ensuite la connexion admin et l’achat d’un numéro.

Le démarrage initialise le schéma. Après connexion admin, configure la clé
5SIM dans **Paramètres**, puis sauvegarde. Ne pousse jamais `.env` vers GitHub;
les secrets doivent être saisis uniquement dans la configuration Node.js Plesk.