# STANNEL Platform - Technical Architecture Report

**Version:** 1.0.0
**Date:** March 2026
**Platform:** Cross-platform Loyalty Management System

---

## Executive Summary

STANNEL is a professionally built, custom-developed loyalty management platform designed for architects and suppliers in the construction and design industry. The platform is built from the ground up using industry-standard technologies with no dependency on low-code/no-code platforms.

---

## Technology Stack

### Frontend - Web Application

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 15.1.0 |
| Build Tool | Turbopack | Built-in |
| Language | TypeScript | 5.7.0 |
| UI Library | React | 19.0.0 |
| Styling | Tailwind CSS | 3.4.17 |
| Animations | Framer Motion | 11.15.0 |
| State Management | Zustand | 5.0.2 |
| Data Fetching | TanStack Query | 5.62.0 |
| Forms | React Hook Form | 7.54.0 |
| Icons | Lucide React | 0.468.0 |

### Frontend - Mobile Application

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Expo | SDK 52 |
| Platform | React Native | Latest |
| Target | iOS + Android | - |

### Backend Server

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20+ |
| Framework | Fastify | 5.2.0 |
| CORS | @fastify/cors | 10.0.0 |
| File Upload | @fastify/multipart | 9.0.0 |
| Rate Limiting | @fastify/rate-limit | 10.0.0 |
| Validation | Zod | 3.24.0 |
| Task Queue | Bull | 4.16.0 |

### Database & Storage

| Component | Technology | Version |
|-----------|------------|---------|
| Database | PostgreSQL | 15 |
| ORM | Prisma | 6.2.0 |
| Cache | Redis (ioredis) | 5.4.0 |
| File Storage | Google Cloud Storage | 7.14.0 |

### Authentication & AI

| Component | Technology | Version |
|-----------|------------|---------|
| Auth Provider | Firebase Authentication | 13.0.0 |
| AI/ML | Google Vertex AI (Gemini) | 1.9.0 |

### Build & DevOps

| Component | Technology | Version |
|-----------|------------|---------|
| Monorepo | Turborepo | 2.3.0 |
| Package Manager | pnpm | 9.15.0 |
| Deployment | Google Cloud Run | - |
| Region | me-west1 (Tel Aviv) | - |

---

## Project Architecture

### Monorepo Structure

```
stannel/
├── apps/
│   ├── web/                    # Next.js 15 Web Application
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   └── package.json
│   │
│   └── mobile/                # Expo React Native App
│       ├── app/               # Expo Router
│       ├── components/        # Native components
│       └── package.json
│
├── packages/
│   ├── types/                 # Shared TypeScript definitions
│   ├── api-client/            # Shared API client library
│   └── ui/                    # Shared theme & utilities
│
├── backend/                   # Fastify API Server
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth & RBAC
│   │   └── prisma/           # Database schema
│   └── package.json
│
├── turbo.json                # Turborepo configuration
├── pnpm-workspace.yaml       # Workspace definition
└── package.json              # Root package
```

---

## Database Schema

### Core Entities

#### Users & Profiles

| Table | Description | Key Fields |
|-------|-------------|------------|
| `User` | Base user account | id, email, role, rank, isActive |
| `ArchitectProfile` | Architect details | pointsBalance, cashBalance, cardNumber |
| `SupplierProfile` | Supplier details | companyName, trustScore, qualityScore |

#### Business Operations

| Table | Description | Key Fields |
|-------|-------------|------------|
| `Invoice` | Transaction records | amount, status, slaDeadline, aiStatus |
| `InvoiceStatusHistory` | Audit trail | status, changedBy, createdAt |
| `Contract` | Supplier agreements | type, feePercent, validFrom/To |
| `CardTransaction` | Wallet history | type, amount, description |

#### Rewards System

| Table | Description | Key Fields |
|-------|-------------|------------|
| `Product` | Reward catalog | pointCost, cashCost, stock |
| `Redemption` | Reward claims | pointsUsed, cashPaid |
| `SupplierGoal` | Sales targets | targetAmount, bonusPoints |
| `GoalBonus` | Achievement rewards | bonusPoints, awardedAt |

#### Events & Audit

| Table | Description | Key Fields |
|-------|-------------|------------|
| `Event` | Platform events | title, date, capacity |
| `EventRegistration` | RSVP records | status (CONFIRMED/WAITLIST) |
| `AuditLog` | System audit | action, entityId, metadata |

### Entity Relationships

```
User (1) ←→ (1) ArchitectProfile
User (1) ←→ (1) SupplierProfile
ArchitectProfile (1) ←→ (M) Invoice
SupplierProfile (1) ←→ (M) Invoice
SupplierProfile (1) ←→ (M) Contract
Product (1) ←→ (M) Redemption
Event (1) ←→ (M) EventRegistration
User (1) ←→ (M) AuditLog
```

### Enums

```
UserRole: ADMIN | ARCHITECT | SUPPLIER
UserRank: BRONZE | SILVER | GOLD | PLATINUM
InvoiceStatus: PENDING_ADMIN | CLARIFICATION_NEEDED | APPROVED |
               REJECTED | PENDING_SUPPLIER_PAY | PAID | OVERDUE
ContractType: STANDARD | PREMIUM | EXCLUSIVE
```

---

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register     - User registration
POST   /api/v1/auth/login        - Firebase token verification
GET    /api/v1/auth/me           - Current user profile
```

### Invoices
```
POST   /api/v1/invoices/upload   - Upload invoice (multipart)
GET    /api/v1/invoices          - List invoices
GET    /api/v1/invoices/:id      - Get invoice details
```

### Wallet
```
GET    /api/v1/wallet/balance      - Points & cash balance
GET    /api/v1/wallet/transactions - Transaction history
GET    /api/v1/wallet/card         - Digital card details
```

### Rewards
```
GET    /api/v1/rewards/products    - Product catalog
POST   /api/v1/rewards/redeem      - Redeem product
```

### Events
```
GET    /api/v1/events              - List events
POST   /api/v1/events/register     - Register for event
```

### Admin
```
GET    /api/v1/admin/users                - List users
PATCH  /api/v1/admin/invoices/:id/verify  - Verify invoice
GET    /api/v1/admin/analytics/trends     - AI insights
```

### Supplier
```
GET    /api/v1/supplier/invoices          - Pending invoices
PATCH  /api/v1/supplier/invoices/:id/confirm - Confirm payment
```

---

## Security & Authentication

### Authentication Flow
1. User authenticates via Firebase Authentication
2. Firebase returns JWT token
3. Token sent in Authorization header to backend
4. Backend verifies token with Firebase Admin SDK
5. User profile loaded from PostgreSQL
6. RBAC middleware checks permissions

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| ADMIN | Full system access, user management, invoice verification |
| ARCHITECT | Invoice upload, wallet management, rewards redemption |
| SUPPLIER | Invoice confirmation, catalog management, goals view |

---

## Third-Party Platform Independence

### Verification Results

| Platform | Status |
|----------|--------|
| BASE44 | NOT FOUND |
| Lovable | NOT FOUND |
| Bolt.new | NOT FOUND |
| Replit | NOT FOUND |
| Cursor AI | NOT FOUND |
| v0.dev | NOT FOUND |

### Codebase Analysis

The codebase has been thoroughly analyzed and contains:

- **Custom React Components**: All UI components are custom-built
- **Standard npm Packages**: Only industry-standard open-source packages
- **Professional Architecture**: Monorepo structure with Turborepo
- **Type-Safe Code**: Full TypeScript implementation
- **Custom Backend**: Fastify server with Prisma ORM

---

## Dependencies Summary

### Production Dependencies (Web)
```json
{
  "next": "^15.1.0",
  "react": "^19.0.0",
  "framer-motion": "^11.15.0",
  "lucide-react": "^0.468.0",
  "@tanstack/react-query": "^5.62.0",
  "zustand": "^5.0.2",
  "tailwindcss": "^3.4.17"
}
```

### Production Dependencies (Backend)
```json
{
  "fastify": "^5.2.0",
  "@prisma/client": "^6.2.0",
  "firebase-admin": "^13.0.0",
  "@google-cloud/vertexai": "^1.9.0",
  "@google-cloud/storage": "^7.14.0",
  "bull": "^4.16.0",
  "ioredis": "^5.4.0"
}
```

---

## Deployment Architecture

```
                    ┌─────────────────┐
                    │   Cloud CDN     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Cloud Run    │   │  Cloud Run    │   │  Cloud Run    │
│  (Web App)    │   │  (API Server) │   │  (Workers)    │
└───────────────┘   └───────┬───────┘   └───────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
      │ Cloud SQL   │ │ Memorystore │ │ Cloud       │
      │ PostgreSQL  │ │ Redis       │ │ Storage     │
      └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Conclusion

STANNEL is a professionally architected, custom-built platform using industry-standard technologies. The codebase demonstrates:

1. **Modern Architecture**: Monorepo with shared packages
2. **Type Safety**: Full TypeScript implementation
3. **Scalability**: Cloud-native deployment on Google Cloud
4. **Security**: Firebase Auth with RBAC middleware
5. **AI Integration**: Vertex AI for invoice validation
6. **No Low-Code Dependencies**: 100% custom code

---

*Report Generated: March 2026*
*Platform: STANNEL v1.0.0*
