# Déploiement ZyNum sur GitHub + Plesk

Le projet se déploie comme une seule application Node.js : le serveur API sert
également le frontend compilé. Il ne faut pas lancer Vite en production.

## Configuration Plesk

Depuis la racine du dépôt :

```bash
npm install -g pnpm@10
pnpm install --frozen-lockfile
pnpm run build
```

Le build produit :

- serveur : `artifacts/api-server/dist/index.cjs`
- frontend servi par le serveur : `artifacts/api-server/dist/public/`

Dans la configuration de l’application Node.js Plesk :

- **Application root** : racine du dépôt
- **Startup file** : `app.js`
- **Application URL** : le domaine ZyNum
- **Node.js** : version compatible avec `.nvmrc` / `.node-version`
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

## Variables à renseigner dans Plesk

Ne jamais mettre les valeurs secrètes dans GitHub, `.env.example` ou les logs :

```text
NODE_ENV=production
SUPABASE_DATABASE_URL=...
SESSION_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
FIVESIM_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
```

Ajouter aussi les secrets de paiement utilisés par l’installation, en suivant
`.env.example`. La clé 5SIM peut être configurée dans le panneau admin ;
`FIVESIM_API_KEY` reste disponible comme solution de secours si aucune clé
n’est enregistrée dans les paramètres admin.

## Après un Pull + Deploy Now

1. Vérifier que l’installation utilise pnpm :
   `pnpm install --frozen-lockfile`
2. Lancer le build :
   `pnpm run build`
3. Redémarrer l’application Node.js.
4. Vérifier :
   `https://zynum.net/api/healthz`
5. Vérifier ensuite la connexion admin et l’achat d’un numéro.

Le démarrage initialise le schéma. Après connexion admin, configure la clé
5SIM dans **Paramètres**, puis sauvegarde.