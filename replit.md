# ZyNum - Virtual Numbers Platform

## Overview

ZyNum est une plateforme web complète permettant aux utilisateurs d'acheter des numéros virtuels pour recevoir des SMS OTP. Intègre l'API 5SIM pour l'achat de numéros.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/zynum)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **UI**: Tailwind CSS v4, shadcn/ui, framer-motion, lucide-react
- **External API**: 5SIM (virtual phone numbers)
- **Auth**: Token-based (sessions stored in DB, token in localStorage)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── zynum/              # React + Vite frontend
│   │   ├── src/pages/      # home, buy, history, api-docs, login, register
│   │   ├── src/components/ # layout (navbar, footer)
│   │   └── src/hooks/      # use-currency
│   └── api-server/         # Express API server
│       ├── src/routes/     # auth, services, numbers, balance, developer, health
│       ├── src/lib/        # fivesim.ts, auth.ts
│       └── src/middlewares/# authMiddleware.ts
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/     # users.ts, orders.ts, sessions.ts
└── scripts/                # Utility scripts
```

## Admin Account

- **Email**: pagetstudio@gmail.com
- **Password**: AAbb11##
- **Access**: Onglet "Administration" visible uniquement pour les comptes admin dans le dashboard

## Database Tables

- **users**: id, name, email, passwordHash, apiKey, balanceUsd, isAdmin, isBanned, createdAt, updatedAt
- **orders**: id, userId, externalId (5SIM), phone, service, serviceName, country, countryName, status, smsCode, smsText, priceUsd, priceFcfa, currency, createdAt, updatedAt
- **sessions**: id, userId, token, expiresAt, createdAt
- **transactions**: id, userId, type, amountUsd, amountFcfa, method, provider, status, reference, metadata, createdAt
- **admin_settings**: id, key, value, updatedAt (clé-valeur pour la configuration plateforme)
- **admin_messages**: id, senderId, type (popup/email), target, subject, content, sentAt
- **payment_providers**: id, category (card/mobile_money/crypto), name, slug, isActive, isSelected, config, createdAt
- **faq_articles**: id, type (faq/article), category, question, answer, lang, isActive, sortOrder, createdAt
- **social_links**: id, platform, url, icon, isActive, sortOrder, createdAt
- **country_overrides**: id, countrySlug, countryName, isDisabled, priceMultiplier, updatedAt

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/logout` - Déconnexion
- `GET /api/v1/auth/me` - Utilisateur courant

### Numbers & Orders
- `GET /api/v1/services` - Liste des services disponibles
- `GET /api/v1/countries?service=telegram` - Pays disponibles avec prix
- `POST /api/v1/buy` - Acheter un numéro virtuel
- `GET /api/v1/check/:orderId` - Vérifier le statut SMS
- `GET /api/v1/orders` - Historique des commandes

### Account
- `GET /api/v1/balance` - Solde 5SIM
- `GET /api/v1/developer/apikey` - Clé API développeur
- `POST /api/v1/developer/apikey` - Régénérer la clé API

### Admin (requiert isAdmin=true)
- `GET /api/v1/admin/stats` - 15+ statistiques avec filtres date
- `GET|PATCH|DELETE /api/v1/admin/users/:id` - Gestion utilisateurs
- `GET /api/v1/admin/orders` - Toutes les commandes
- `GET /api/v1/admin/transactions` - Historique rechargements
- `POST /api/v1/admin/messages` - Envoyer message global
- `GET|POST|POST(bulk) /api/v1/admin/settings` - Paramètres plateforme
- `GET|POST|PATCH|DELETE /api/v1/admin/payment-providers` - Fournisseurs paiement
- `GET|POST|PATCH|DELETE /api/v1/admin/faq` - FAQ et articles d'aide
- `GET|POST|PATCH|DELETE /api/v1/admin/social-links` - Liens sociaux
- `GET|POST|PATCH /api/v1/admin/countries` - Overrides pays/prix
- `GET /api/v1/settings` - Paramètres publics

## Environment Variables

- `FIVESIM_API_KEY` - Clé API 5SIM (secret)
- `DATABASE_URL` - URL PostgreSQL (auto-provisionné)
- `SESSION_SECRET` - Secret de session (auto-provisionné)
- `PORT` - Port du serveur (auto-assigné)

## Admin Panel Features

10 sections disponibles dans l'onglet "Administration" du dashboard :
1. **Statistiques** — 15+ métriques + top services/pays + filtres date
2. **Utilisateurs** — liste, recherche, modifier solde/mot de passe/rôle, bannir
3. **Commandes** — tous les numéros achetés avec infos utilisateur
4. **Transactions** — historique rechargements avec méthode/provider
5. **Messages** — envoyer popup ou email global avec ciblage
6. **Paramètres** — nom plateforme, contacts, commission, maintenance
7. **Paiements** — fournisseurs carte/mobile money/crypto, sélection active
8. **Centre d'aide** — CRUD FAQ et articles multilingue
9. **Réseaux sociaux** — gestion liens sociaux avec icons SimpleIcons
10. **Pays** — désactiver pays, multiplicateur de prix

## Currency

- USD et FCFA supportés
- Taux de conversion : 1 USD = 620 FCFA
- Toggle USD/FCFA dans la navbar

## Order Statuses

PENDING → RECEIVED → FINISHED / TIMEOUT / BANNED / CANCELED

## Auth Flow

1. Inscription/connexion → Token JWT-like dans la DB
2. Token stocké dans `localStorage` sous la clé `zynum_token`
3. `custom-fetch.ts` injecte automatiquement le token dans les headers
4. API key développeur pour les intégrations tierces (format: `zyn_...`)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build`
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`
- `pnpm --filter @workspace/db run push` — push DB schema changes
