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

## Database Tables

- **users**: id, name, email, passwordHash, apiKey, createdAt, updatedAt
- **orders**: id, userId, externalId (5SIM), phone, service, serviceName, country, countryName, status, smsCode, smsText, priceUsd, priceFcfa, currency, createdAt, updatedAt
- **sessions**: id, userId, token, expiresAt, createdAt

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

## Environment Variables

- `FIVESIM_API_KEY` - Clé API 5SIM (secret)
- `DATABASE_URL` - URL PostgreSQL (auto-provisionné)
- `SESSION_SECRET` - Secret de session (auto-provisionné)
- `PORT` - Port du serveur (auto-assigné)

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
