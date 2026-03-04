# STANNEL 🏗️

> פלטפורמת ניהול מועדון לקוחות ותמריצים לאדריכלים וספקים

**Cross-platform: Web + iOS + Android | Google Cloud | Turbopack | El-Al Aesthetic**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat&logo=fastify&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=flat&logo=google-cloud&logoColor=white)

## ✨ Features

- 📱 **Cross-Platform** — Web (Next.js) + iOS + Android (Expo)
- 🎨 **Premium Design** — Glass morphism, El-Al inspired aesthetic
- 🤖 **AI Validation** — Automatic invoice verification with Vertex AI
- ⏰ **SLA Monitoring** — Real-time deadline tracking with alerts
- 💳 **Digital Wallet** — Points balance, transactions, digital card
- 🎁 **Rewards Store** — Redeem points for products and experiences
- 📊 **Analytics** — AI-powered business insights

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev

# Web: http://localhost:3000
# Mobile: http://localhost:8081
# API: http://localhost:8080
```

## 📁 Project Structure

```
stannel/
├── apps/
│   ├── web/          # Next.js 14 + Turbopack
│   └── mobile/       # Expo SDK 52
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── api-client/   # Shared API client
│   └── ui/           # Theme & utilities
├── backend/          # Fastify + Prisma
└── turbo.json        # Turborepo config
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Web** | Next.js 14 (Turbopack) |
| **Mobile** | Expo SDK 52 / React Native |
| **Backend** | Fastify + Prisma |
| **Database** | PostgreSQL (Cloud SQL) |
| **Cache** | Redis (Memorystore) |
| **AI** | Vertex AI (Gemini Pro) |
| **Auth** | Firebase Authentication |
| **Storage** | Google Cloud Storage |
| **CI/CD** | Cloud Build + Cloud Run |

## 🎨 Design System

- **Primary**: Navy Blue (#1a3a6b)
- **Accent**: Gold (#d4af37)
- **Style**: Glass morphism with animated backgrounds
- **Direction**: RTL (Hebrew-first)

## 📱 Mobile Build

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL=
REDIS_URL=
GOOGLE_CLOUD_PROJECT=
FIREBASE_PROJECT_ID=
```

## 📄 License

MIT © STANNEL

---

Built with ❤️ using Claude Code
