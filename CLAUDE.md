# STANNEL Platform — Claude Code Instructions

## Project Overview
Cross-platform loyalty management platform for architects and suppliers in the construction/design industry.
Monorepo with Next.js web, Expo mobile, Fastify backend.

## Tech Stack
- **Frontend Web**: Next.js 14 with Turbopack (SSR, fast builds)
- **Mobile**: Expo SDK 52 / React Native (iOS + Android)
- **Backend**: Fastify + Prisma + PostgreSQL
- **Cache**: Redis (Memorystore) for SLA queues
- **AI**: Vertex AI (Gemini Pro) for invoice validation
- **Auth**: Firebase Authentication
- **Storage**: Google Cloud Storage
- **Deployment**: Google Cloud Run

## Development Commands

```bash
# Install dependencies (from root)
pnpm install

# Run all apps
pnpm dev

# Run specific apps
pnpm dev:web      # Web only (http://localhost:3000) with Turbopack
pnpm dev:mobile   # Expo mobile (http://localhost:8081)
pnpm dev:backend  # API server (http://localhost:8080)

# Database
pnpm db:push      # Push schema to database
pnpm db:generate  # Generate Prisma client
pnpm db:studio    # Open Prisma Studio

# Build
pnpm build        # Build all apps

# Type checking
pnpm type-check
```

## Project Structure

```
stannel/
├── apps/
│   ├── web/          # Next.js 14 Web App
│   └── mobile/       # Expo React Native App
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── api-client/   # Shared API client
│   └── ui/           # Shared utilities & theme
├── backend/          # Fastify API Server
├── turbo.json        # Turborepo config
└── package.json      # Root workspace
```

## Key Architecture Rules

1. **BackgroundSlider** — MUST run on ALL pages (web + mobile). Full-screen animated background with parallax.

2. **Glass Morphism** — All cards use `glass-card` CSS class or `GlassCard` component.

3. **RTL Support** — `html dir="rtl"`, Hebrew-first design.

4. **Shared Types** — Types ALWAYS from `@stannel/types`, never define inline.

5. **Shared API Client** — API calls ALWAYS through `@stannel/api-client`, never fetch directly.

## Google Cloud

- **Project Account**: PPC@newpost.co.il
- **Region**: me-west1 (Tel Aviv)
- **Secrets**: All in Secret Manager

## Design System

### Colors
- **Primary Navy**: #1a3a6b (El-Al Blue)
- **Gold Accent**: #d4af37 (Luxury)
- **Background**: #060f1f (Dark)
- **Glass BG**: rgba(255, 255, 255, 0.07)
- **Glass Border**: rgba(255, 255, 255, 0.15)

### Fonts
- **UI**: Assistant, Heebo (Hebrew-friendly)
- **Headers**: Playfair Display (Luxury)
- **Mono**: JetBrains Mono

### Effects
- Glass blur: 20px
- Animations: Framer Motion (web), Animated API (mobile)
- Background slider: 6s interval, Ken Burns effect

## API Endpoints

```
# Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

# Invoices (Architect)
POST   /api/v1/invoices/upload
GET    /api/v1/invoices
GET    /api/v1/invoices/:id

# Wallet
GET    /api/v1/wallet/balance
GET    /api/v1/wallet/transactions
GET    /api/v1/wallet/card

# Rewards
GET    /api/v1/rewards/products
POST   /api/v1/rewards/redeem

# Events
GET    /api/v1/events
POST   /api/v1/events/register

# Admin
GET    /api/v1/admin/users
PATCH  /api/v1/admin/invoices/:id/verify

# Supplier
GET    /api/v1/supplier/invoices
PATCH  /api/v1/supplier/invoices/:id/confirm
```

## File Naming Conventions
- Components: PascalCase (BackgroundSlider.tsx)
- Hooks: camelCase with 'use' prefix (useWallet.ts)
- Routes: lowercase with dashes (invoice-upload)
- Database: camelCase (architectProfile)

## Environment Variables

Create `.env` files based on `.env.example`:

```bash
# Backend
DATABASE_URL=
REDIS_URL=
GOOGLE_CLOUD_PROJECT=
FIREBASE_PROJECT_ID=

# Web
NEXT_PUBLIC_API_URL=

# Mobile
EXPO_PUBLIC_API_URL=
```

## Mobile Build (App Store)

```bash
# iOS
eas build --platform ios --profile production
eas submit --platform ios

# Android
eas build --platform android --profile production
eas submit --platform android
```

## Testing
- Unit: Vitest
- E2E: Playwright (web), Detox (mobile)
- Run: `pnpm test`
