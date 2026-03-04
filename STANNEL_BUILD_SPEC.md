# 🏗️ STANNEL Platform V2 — Claude Code Build Specification

> **פלטפורמת ניהול מועדון לקוחות ותמריצים לאדריכלים וספקים**  
> Cross-platform: Web + iOS + Android | Google Cloud | Turbopacked | El-Al Aesthetic

---

## 📋 Table of Contents

1. [Tech Stack Decision](#tech-stack)
2. [Project Structure](#project-structure)
3. [Google Cloud Setup](#google-cloud-setup)
4. [Design System & UI](#design-system)
5. [Database Schema](#database-schema)
6. [Backend API](#backend-api)
7. [Frontend — Web](#frontend-web)
8. [Mobile — iOS & Android](#mobile)
9. [Authentication & Roles](#auth)
10. [Core Features — Implementation](#core-features)
11. [AI Insights Module](#ai-insights)
12. [SLA & Automation Engine](#sla-automation)
13. [Performance & Turbopack](#performance)
14. [Deployment Pipeline](#deployment)
15. [Claude Code Commands](#claude-code-commands)

---

## 1. Tech Stack Decision <a name="tech-stack"></a>

### Why This Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Frontend Web** | Next.js 14 (App Router) + Turbopack | SSR, fast builds, SEO, shared code with mobile logic |
| **Mobile** | React Native (Expo SDK 51) | Single codebase for iOS + Android, App Store ready |
| **Shared Logic** | TypeScript monorepo (Turborepo) | Share types, API clients, utils between web & mobile |
| **Backend** | Node.js + Fastify | Fast, lightweight, Google Cloud Run compatible |
| **Database** | PostgreSQL (Cloud SQL) + Prisma ORM | Relational data, ACID compliance, great DX |
| **Cache** | Redis (Memorystore) | SLA timers, sessions, real-time notifications |
| **File Storage** | Google Cloud Storage | Invoice images, catalogs, assets |
| **Auth** | Firebase Auth | Works natively with iOS, Android, Web |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | iOS + Android notifications unified |
| **AI** | Vertex AI (Gemini Pro) | Native Google Cloud, no extra billing account |
| **CI/CD** | Cloud Build + Cloud Run | Auto-deploy on git push |
| **Image CDN** | Cloud CDN + Cloud Storage | Fast background slider images |

---

## 2. Project Structure <a name="project-structure"></a>

```
stannel/
├── apps/
│   ├── web/                          # Next.js 14 Web App
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (admin)/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── invoices/page.tsx
│   │   │   │   ├── suppliers/page.tsx
│   │   │   │   ├── architects/page.tsx
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   ├── events/page.tsx
│   │   │   │   ├── contracts/page.tsx
│   │   │   │   ├── goals/page.tsx
│   │   │   │   ├── payments/page.tsx
│   │   │   │   └── audit-logs/page.tsx
│   │   │   ├── (architect)/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── invoices/page.tsx
│   │   │   │   ├── wallet/page.tsx
│   │   │   │   ├── rewards/page.tsx
│   │   │   │   ├── events/page.tsx
│   │   │   │   ├── card/page.tsx
│   │   │   │   ├── catalogs/page.tsx
│   │   │   │   └── ai-tools/page.tsx
│   │   │   ├── (supplier)/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── invoices/page.tsx
│   │   │   │   ├── payments/page.tsx
│   │   │   │   ├── catalog/page.tsx
│   │   │   │   └── goals/page.tsx
│   │   │   ├── layout.tsx            # Global layout with BG Slider
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── BackgroundSlider.tsx   # ⭐ Full-screen animated bg
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── GlassCard.tsx
│   │   │   ├── ui/                        # shadcn/ui components
│   │   │   ├── invoice/
│   │   │   ├── wallet/
│   │   │   ├── rewards/
│   │   │   └── charts/
│   │   ├── next.config.js              # Turbopack enabled
│   │   └── tailwind.config.ts
│   │
│   └── mobile/                        # Expo React Native
│       ├── app/
│       │   ├── (tabs)/
│       │   │   ├── index.tsx           # Home/Dashboard
│       │   │   ├── wallet.tsx
│       │   │   ├── invoices.tsx
│       │   │   ├── rewards.tsx
│       │   │   └── profile.tsx
│       │   ├── (auth)/
│       │   │   ├── login.tsx
│       │   │   └── register.tsx
│       │   └── _layout.tsx
│       ├── components/
│       │   ├── BackgroundSlider.native.tsx
│       │   ├── GlassCard.native.tsx
│       │   └── ArchitectCard.native.tsx
│       ├── app.json
│       └── eas.json                   # EAS Build config (App Store)
│
├── packages/
│   ├── api-client/                    # Shared API client (web + mobile)
│   │   ├── src/
│   │   │   ├── invoices.ts
│   │   │   ├── wallet.ts
│   │   │   ├── events.ts
│   │   │   └── auth.ts
│   │   └── package.json
│   │
│   ├── types/                         # Shared TypeScript types
│   │   └── src/
│   │       ├── user.types.ts
│   │       ├── invoice.types.ts
│   │       ├── wallet.types.ts
│   │       └── index.ts
│   │
│   └── ui/                            # Shared cross-platform utils
│       └── src/
│           ├── formatCurrency.ts
│           ├── formatDate.ts
│           └── slaUtils.ts
│
├── backend/                           # Fastify API Server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── invoices.routes.ts
│   │   │   ├── wallet.routes.ts
│   │   │   ├── events.routes.ts
│   │   │   ├── rewards.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── supplier.routes.ts
│   │   │   └── analytics.routes.ts
│   │   ├── services/
│   │   │   ├── sla.service.ts         # SLA monitoring & alerts
│   │   │   ├── notification.service.ts
│   │   │   ├── ai.service.ts          # Vertex AI integration
│   │   │   ├── storage.service.ts     # GCS uploads
│   │   │   └── loyalty.service.ts     # Points engine
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── rbac.middleware.ts
│   │   ├── jobs/
│   │   │   └── sla-cron.ts            # Bull queue SLA jobs
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── server.ts
│   ├── Dockerfile
│   └── package.json
│
├── turbo.json                         # Turborepo config
├── package.json                       # Root workspace
└── pnpm-workspace.yaml
```

---

## 3. Google Cloud Setup <a name="google-cloud-setup"></a>

### Account
```
Project Account: PPC@newpost.co.il
```

### Services to Enable in Google Cloud Console

```bash
# Run these in Google Cloud Shell or gcloud CLI

gcloud services enable \
  run.googleapis.com \
  sql.googleapis.com \
  redis.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  aiplatform.googleapis.com \
  firebase.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudtasks.googleapis.com

# Create Cloud SQL PostgreSQL instance
gcloud sql instances create stannel-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=me-west1 \
  --storage-auto-increase

# Create Redis (Memorystore)
gcloud redis instances create stannel-cache \
  --size=1 \
  --region=me-west1 \
  --redis-version=redis_7_0

# Create GCS Bucket for assets
gsutil mb -l me-west1 gs://stannel-assets
gsutil iam ch allUsers:objectViewer gs://stannel-assets

# Create GCS Bucket for invoice images (private)
gsutil mb -l me-west1 gs://stannel-invoices
```

### Secret Manager — Environment Variables

```bash
# Store all secrets in Secret Manager
echo -n "postgresql://..." | gcloud secrets create DATABASE_URL --data-file=-
echo -n "redis://..." | gcloud secrets create REDIS_URL --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "your-firebase-config" | gcloud secrets create FIREBASE_CONFIG --data-file=-
```

### Cloud Run Deployment Config

```yaml
# cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: stannel-api
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cloudsql-instances: "PROJECT:me-west1:stannel-db"
    spec:
      containers:
        - image: gcr.io/PROJECT/stannel-api:latest
          resources:
            limits:
              cpu: "2"
              memory: "512Mi"
```

---

## 4. Design System & UI <a name="design-system"></a>

### 🎨 El-Al Inspired Design Language

**Core Aesthetic:** Premium, hi-tech, clean, architectural luxury — think El-Al meets luxury architecture studio.

#### Color Palette

```typescript
// packages/ui/src/theme.ts
export const theme = {
  colors: {
    // Primary — Deep Navy (El-Al Blue)
    primary: {
      50: '#e8edf7',
      100: '#c5d0ea',
      500: '#1a3a6b',
      600: '#0f2750',
      900: '#060f1f',
    },
    // Accent — Warm Gold (Architecture/Luxury)
    gold: {
      400: '#d4af37',
      500: '#b8960c',
      600: '#9a7b0a',
    },
    // Glass effect backgrounds
    glass: {
      white: 'rgba(255, 255, 255, 0.08)',
      dark: 'rgba(0, 0, 0, 0.45)',
      border: 'rgba(255, 255, 255, 0.15)',
    },
    // Status colors
    status: {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      overdue: '#dc2626',
    }
  },
  fonts: {
    primary: "'Assistant', 'Heebo', sans-serif",  // Hebrew-friendly
    display: "'Playfair Display', serif",           // Luxury headers
    mono: "'JetBrains Mono', monospace",
  },
  blur: {
    glass: 'backdrop-filter: blur(20px)',
    heavy: 'backdrop-filter: blur(40px)',
  }
}
```

#### Global CSS — Glass Morphism + RTL

```css
/* apps/web/app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700&family=Heebo:wght@300;400;500;700&family=Playfair+Display:wght@400;600;700&display=swap');

:root {
  --primary: #1a3a6b;
  --gold: #d4af37;
  --glass-bg: rgba(255, 255, 255, 0.07);
  --glass-border: rgba(255, 255, 255, 0.15);
  --glass-blur: blur(20px);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  direction: rtl;
  font-family: 'Assistant', 'Heebo', sans-serif;
  background: #060f1f;
  color: #ffffff;
  overflow-x: hidden;
}

/* Glass Card Component */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 2px; }
```

---

### ⭐ BackgroundSlider Component — CRITICAL UI ELEMENT

This component runs on **every page**, full-screen, with parallax and smooth transitions.

```typescript
// apps/web/components/layout/BackgroundSlider.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Architecture & Design related premium images
// Store these in gs://stannel-assets/backgrounds/
const SLIDES = [
  {
    src: 'https://storage.googleapis.com/stannel-assets/backgrounds/arch-1.jpg',
    alt: 'מרחב אדריכלי מודרני',
  },
  {
    src: 'https://storage.googleapis.com/stannel-assets/backgrounds/arch-2.jpg',
    alt: 'עיצוב פנים יוקרתי',
  },
  {
    src: 'https://storage.googleapis.com/stannel-assets/backgrounds/arch-3.jpg',
    alt: 'אדריכלות עכשווית',
  },
  {
    src: 'https://storage.googleapis.com/stannel-assets/backgrounds/arch-4.jpg',
    alt: 'חומרי בנייה פרמיום',
  },
  {
    src: 'https://storage.googleapis.com/stannel-assets/backgrounds/arch-5.jpg',
    alt: 'עיצוב ואדריכלות',
  },
];

// 🎨 Source high-quality images (royalty-free) from:
// - Unsplash: https://unsplash.com/collections/architecture
// - Key terms: "luxury interior design", "modern architecture", "building materials premium"
// - Recommended: Pexels API for dynamic fresh images
// - REQUIRED dimensions: minimum 1920x1080, JPG optimized <500KB each

export default function BackgroundSlider() {
  const [current, setCurrent] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next]);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{
            opacity: 1,
            scale: 1.05,
            x: mousePos.x,
            y: mousePos.y,
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.5, ease: 'easeInOut' },
            scale: { duration: 8, ease: 'linear' },
            x: { duration: 0.3, ease: 'linear' },
            y: { duration: 0.3, ease: 'linear' },
          }}
        >
          <Image
            src={SLIDES[current].src}
            alt={SLIDES[current].alt}
            fill
            priority
            quality={85}
            className="object-cover"
          />
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#060f1f]/70 via-[#060f1f]/50 to-[#060f1f]/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060f1f]/60 via-transparent to-[#060f1f]/40" />
        </motion.div>
      </AnimatePresence>

      {/* Animated particles overlay */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 60 - 30],
              y: [0, Math.random() * 60 - 30],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: Math.random() * 8 + 6,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === current ? 'w-8 bg-gold-400' : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Database Schema <a name="database-schema"></a>

```prisma
// backend/src/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  ARCHITECT
  SUPPLIER
}

enum UserRank {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}

enum InvoiceStatus {
  PENDING_ADMIN
  CLARIFICATION_NEEDED
  APPROVED
  REJECTED
  PENDING_SUPPLIER_PAY
  PAID
  OVERDUE
}

enum ContractType {
  STANDARD
  PREMIUM
  EXCLUSIVE
}

model User {
  id              String          @id @default(cuid())
  firebaseUid     String          @unique
  email           String          @unique
  name            String
  phone           String?
  role            UserRole
  rank            UserRank        @default(BRONZE)
  isActive        Boolean         @default(false) // Admin must approve
  profileImage    String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  architectProfile  ArchitectProfile?
  supplierProfile   SupplierProfile?
  auditLogs         AuditLog[]
  eventRegistrations EventRegistration[]
}

model ArchitectProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  
  // Wallet
  pointsBalance   Float     @default(0)
  cashBalance     Float     @default(0)
  totalEarned     Float     @default(0)
  totalRedeemed   Float     @default(0)
  
  // Card
  cardNumber      String    @unique @default(cuid())
  cardExpiry      DateTime?
  
  // Goals progress
  monthlyGoal     Float     @default(0)
  monthlyProgress Float     @default(0)
  
  invoices        Invoice[]
  cardTransactions CardTransaction[]
  goalBonuses     GoalBonus[]
}

model SupplierProfile {
  id            String        @id @default(cuid())
  userId        String        @unique
  user          User          @relation(fields: [userId], references: [id])
  companyName   String
  trustScore    Float         @default(5.0)
  qualityScore  Float         @default(5.0)
  
  // Contract
  contracts     Contract[]
  
  // Relations
  invoices      Invoice[]
  supplierGoals SupplierGoal[]
  products      Product[]
}

model Invoice {
  id              String          @id @default(cuid())
  imageUrl        String          // GCS URL
  amount          Float
  status          InvoiceStatus   @default(PENDING_ADMIN)
  
  // Parties
  architectId     String
  architect       ArchitectProfile @relation(fields: [architectId], references: [id])
  supplierId      String
  supplier        SupplierProfile  @relation(fields: [supplierId], references: [id])
  
  // SLA
  slaDeadline     DateTime
  slaAlertSent    Boolean         @default(false)
  
  // Verification
  adminNote       String?
  supplierRef     String?         // Payment reference from supplier
  
  // Timestamps
  createdAt       DateTime        @default(now())
  approvedAt      DateTime?
  paidAt          DateTime?
  
  // AI validation result
  aiExtractedAmount Float?
  aiConfidence      Float?
  aiStatus          String?       // 'MATCH' | 'MISMATCH' | 'UNCLEAR'
  
  statusHistory     InvoiceStatusHistory[]
}

model InvoiceStatusHistory {
  id          String        @id @default(cuid())
  invoiceId   String
  invoice     Invoice       @relation(fields: [invoiceId], references: [id])
  status      InvoiceStatus
  note        String?
  changedBy   String        // userId
  createdAt   DateTime      @default(now())
}

model Contract {
  id          String        @id @default(cuid())
  supplierId  String
  supplier    SupplierProfile @relation(fields: [supplierId], references: [id])
  type        ContractType
  feePercent  Float         // Commission %
  validFrom   DateTime
  validTo     DateTime
  isActive    Boolean       @default(true)
  createdAt   DateTime      @default(now())
}

model Product {
  id            String    @id @default(cuid())
  name          String
  description   String?
  imageUrl      String
  pointCost     Float
  cashCost      Float
  stock         Int       @default(0)
  isActive      Boolean   @default(true)
  supplierId    String?
  supplier      SupplierProfile? @relation(fields: [supplierId], references: [id])
  createdAt     DateTime  @default(now())
  
  redemptions   Redemption[]
}

model Redemption {
  id              String    @id @default(cuid())
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  architectId     String
  pointsUsed      Float
  cashPaid        Float     @default(0)
  createdAt       DateTime  @default(now())
}

model CardTransaction {
  id            String    @id @default(cuid())
  architectId   String
  architect     ArchitectProfile @relation(fields: [architectId], references: [id])
  type          String    // 'CREDIT' | 'DEBIT'
  amount        Float
  description   String
  invoiceId     String?
  createdAt     DateTime  @default(now())
}

model Event {
  id              String    @id @default(cuid())
  title           String
  description     String
  imageUrl        String?
  date            DateTime
  location        String
  capacity        Int
  isHidden        Boolean   @default(false) // VIP/Invite-only
  registeredCount Int       @default(0)
  waitlistEnabled Boolean   @default(true)
  createdAt       DateTime  @default(now())
  
  registrations   EventRegistration[]
}

model EventRegistration {
  id        String    @id @default(cuid())
  eventId   String
  event     Event     @relation(fields: [eventId], references: [id])
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  status    String    @default("CONFIRMED") // 'CONFIRMED' | 'WAITLIST'
  createdAt DateTime  @default(now())
  
  @@unique([eventId, userId])
}

model SupplierGoal {
  id            String    @id @default(cuid())
  supplierId    String
  supplier      SupplierProfile @relation(fields: [supplierId], references: [id])
  targetAmount  Float
  bonusPoints   Float
  period        String    // 'MONTHLY' | 'QUARTERLY'
  startDate     DateTime
  endDate       DateTime
  isActive      Boolean   @default(true)
}

model GoalBonus {
  id            String    @id @default(cuid())
  architectId   String
  architect     ArchitectProfile @relation(fields: [architectId], references: [id])
  goalId        String
  bonusPoints   Float
  awardedAt     DateTime  @default(now())
}

model AuditLog {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  action    String    // e.g. 'INVOICE_APPROVED', 'USER_ACTIVATED'
  entityId  String?
  metadata  Json?
  ipAddress String?
  createdAt DateTime  @default(now())
}
```

---

## 6. Backend API <a name="backend-api"></a>

### Server Setup (Fastify)

```typescript
// backend/src/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';

const server = Fastify({
  logger: true,
  trustProxy: true, // Cloud Run
});

// Plugins
await server.register(cors, {
  origin: [
    'https://stannel.app',
    'https://stannel-web-xxxx.run.app',
    /^http:\/\/localhost/,
  ],
  credentials: true,
});

await server.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Routes
server.register(authRoutes, { prefix: '/api/v1/auth' });
server.register(invoiceRoutes, { prefix: '/api/v1/invoices' });
server.register(walletRoutes, { prefix: '/api/v1/wallet' });
server.register(eventsRoutes, { prefix: '/api/v1/events' });
server.register(rewardsRoutes, { prefix: '/api/v1/rewards' });
server.register(adminRoutes, { prefix: '/api/v1/admin' });
server.register(supplierRoutes, { prefix: '/api/v1/supplier' });
server.register(analyticsRoutes, { prefix: '/api/v1/analytics' });

const port = parseInt(process.env.PORT || '8080');
await server.listen({ port, host: '0.0.0.0' });
```

### Complete API Endpoints

```
# AUTH
POST   /api/v1/auth/register          → Register new user (pending activation)
POST   /api/v1/auth/login             → Firebase token verification
GET    /api/v1/auth/me                → Get current user profile
PATCH  /api/v1/auth/profile           → Update profile

# ADMIN
GET    /api/v1/admin/users            → List all users (paginated)
PATCH  /api/v1/admin/users/:id/activate    → Activate user account
PATCH  /api/v1/admin/users/:id/deactivate  → Deactivate user
GET    /api/v1/admin/invoices         → List all invoices with filters
PATCH  /api/v1/admin/invoices/:id/verify   → Approve/Reject/Clarify invoice
POST   /api/v1/admin/contracts        → Create supplier contract
GET    /api/v1/admin/contracts        → List contracts
PATCH  /api/v1/admin/contracts/:id    → Update contract
GET    /api/v1/admin/analytics/trends → AI Insights (Vertex AI)
GET    /api/v1/admin/audit-logs       → Audit trail
POST   /api/v1/admin/goals            → Create supplier goal
PATCH  /api/v1/admin/goals/:id        → Update goal

# INVOICES
POST   /api/v1/invoices/upload        → Upload invoice (multipart, GCS)
GET    /api/v1/invoices               → List architect's invoices
GET    /api/v1/invoices/:id           → Single invoice with history
GET    /api/v1/invoices/:id/status    → Status check (polling)

# WALLET
GET    /api/v1/wallet/balance         → Points + cash balance
GET    /api/v1/wallet/transactions    → Transaction history (paginated)
GET    /api/v1/wallet/card            → Digital card details

# REWARDS STORE
GET    /api/v1/rewards/products       → List products (paginated, filterable)
GET    /api/v1/rewards/products/:id   → Single product
POST   /api/v1/rewards/redeem         → Redeem product (points + optional cash)

# EVENTS
GET    /api/v1/events                 → List visible events
GET    /api/v1/events/:id             → Single event
POST   /api/v1/events/register        → Register for event
DELETE /api/v1/events/:id/cancel      → Cancel registration
GET    /api/v1/events/my              → My registered events

# SUPPLIER
GET    /api/v1/supplier/invoices      → Invoices pending payment
PATCH  /api/v1/supplier/invoices/:id/confirm → Confirm payment + add reference
GET    /api/v1/supplier/goals         → Active goals for this supplier
GET    /api/v1/supplier/catalog       → Manage product catalog
POST   /api/v1/supplier/catalog       → Add product
PATCH  /api/v1/supplier/catalog/:id   → Update product

# ANALYTICS (Admin only)
GET    /api/v1/analytics/trends       → AI-powered trends (Vertex AI)
GET    /api/v1/analytics/sla-report   → SLA compliance report
GET    /api/v1/analytics/top-architects → Ranking by volume
GET    /api/v1/analytics/supplier-performance → Supplier trust scores
```

---

## 7. Frontend — Web <a name="frontend-web"></a>

### Next.js Config with Turbopack

```javascript
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      // Turbopack configuration
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/stannel-assets/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  i18n: {
    locales: ['he'],
    defaultLocale: 'he',
  },
};

module.exports = nextConfig;
```

### Root Layout with Background Slider

```typescript
// apps/web/app/layout.tsx
import type { Metadata } from 'next';
import BackgroundSlider from '@/components/layout/BackgroundSlider';
import Navbar from '@/components/layout/Navbar';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'STANNEL | פלטפורמת ניהול מועדון לקוחות מקצועי',
  description: 'הפלטפורמה האקסקלוסיבית לאדריכלים וספקים בתחום הבנייה והעיצוב',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <Providers>
          {/* Full-screen animated background — runs on EVERY page */}
          <BackgroundSlider />
          
          {/* Main app shell */}
          <div className="relative z-10 min-h-screen">
            <Navbar />
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

### GlassCard Component

```typescript
// apps/web/components/layout/GlassCard.tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gold?: boolean; // Gold accent border for premium cards
  animate?: boolean;
}

export default function GlassCard({
  children,
  className,
  hover = true,
  gold = false,
  animate = true,
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'glass-card p-6 transition-all duration-300',
        hover && 'hover:bg-white/12 hover:shadow-2xl hover:-translate-y-0.5',
        gold && 'border-gold-400/30 shadow-gold-400/10',
        className
      )}
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
```

### Architect Dashboard Page

```typescript
// apps/web/app/(architect)/dashboard/page.tsx
'use client';

import { useWallet } from '@/hooks/useWallet';
import { useInvoices } from '@/hooks/useInvoices';
import GlassCard from '@/components/layout/GlassCard';
import ArchitectCard from '@/components/wallet/ArchitectCard';
import InvoiceStatusChart from '@/components/charts/InvoiceStatusChart';
import RecentTransactions from '@/components/wallet/RecentTransactions';
import QuickActions from '@/components/dashboard/QuickActions';
import { motion } from 'framer-motion';

export default function ArchitectDashboard() {
  const { balance, loading: walletLoading } = useWallet();
  const { invoices, stats } = useInvoices();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display text-white font-semibold">
          שלום, {/* user name */} 👋
        </h1>
        <p className="text-white/60 mt-1">הנה סיכום הפעילות שלך</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'יתרת נקודות', value: balance?.points?.toLocaleString(), icon: '⭐', color: 'text-gold-400' },
          { label: 'חשבוניות פתוחות', value: stats?.pending, icon: '📄', color: 'text-yellow-400' },
          { label: 'אושרו החודש', value: stats?.approvedThisMonth, icon: '✅', color: 'text-green-400' },
          { label: 'סה"כ זיכוי', value: `₪${balance?.cash?.toLocaleString()}`, icon: '💳', color: 'text-blue-400' },
        ].map((stat, i) => (
          <GlassCard key={i}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-white/50 text-sm mt-1">{stat.label}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Digital Card */}
        <GlassCard className="lg:col-span-1" gold>
          <h2 className="text-lg font-semibold text-white mb-4">הכרטיס הדיגיטלי שלך</h2>
          <ArchitectCard />
        </GlassCard>

        {/* Invoice Chart */}
        <GlassCard className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">סטטוס חשבוניות</h2>
          <InvoiceStatusChart data={stats} />
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <QuickActions />
      </div>

      {/* Recent Transactions */}
      <GlassCard className="mt-6">
        <h2 className="text-lg font-semibold text-white mb-4">תנועות אחרונות</h2>
        <RecentTransactions />
      </GlassCard>
    </div>
  );
}
```

### Invoice Upload Page (Drag & Drop)

```typescript
// apps/web/app/(architect)/invoices/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import { apiClient } from '@packages/api-client';

export default function InvoiceUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleSubmit = async () => {
    if (!file || !amount || !supplierId) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('invoice', file);
    formData.append('amount', amount);
    formData.append('supplierId', supplierId);
    
    const result = await apiClient.invoices.upload(formData);
    setAiResult(result.aiValidation);
    setUploading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-display text-white mb-8">העלאת חשבונית</h1>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <GlassCard>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-gold-400 bg-gold-400/10'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <>
                <div className="text-5xl mb-4">📄</div>
                <p className="text-white/70">
                  {isDragActive ? 'שחרר כאן...' : 'גרור חשבונית לכאן או לחץ לבחירה'}
                </p>
                <p className="text-white/40 text-sm mt-2">JPG, PNG, PDF עד 10MB</p>
              </>
            )}
          </div>
        </GlassCard>

        {/* Form */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-white mb-4">פרטי העסקה</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">ספק</label>
              <select
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">בחר ספק...</option>
                {/* Dynamic supplier list */}
              </select>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">סכום החשבונית (₪)</label>
              <input
                type="number"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-xl font-bold"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* AI Validation Result */}
            {aiResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg ${
                  aiResult.status === 'MATCH' ? 'bg-green-500/20 border border-green-500/40' :
                  'bg-yellow-500/20 border border-yellow-500/40'
                }`}
              >
                <p className="text-sm">
                  {aiResult.status === 'MATCH'
                    ? `✅ הסכום תואם את החשבונית (ביטחון: ${Math.round(aiResult.confidence * 100)}%)`
                    : `⚠️ קיים אי-התאמה: ה-AI זיהה ₪${aiResult.extractedAmount}`
                  }
                </p>
              </motion.div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!file || !amount || !supplierId || uploading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 hover:from-primary-400 transition-all duration-300"
            >
              {uploading ? '⏳ מעלה ומנתח...' : 'שלח לאישור'}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
```

---

## 8. Mobile — iOS & Android <a name="mobile"></a>

### Expo Configuration

```json
// apps/mobile/app.json
{
  "expo": {
    "name": "STANNEL",
    "slug": "stannel",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "cover",
      "backgroundColor": "#060f1f"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.stannel.app",
      "buildNumber": "1",
      "usesAppleSignIn": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#060f1f"
      },
      "package": "com.stannel.app",
      "versionCode": 1
    },
    "plugins": [
      "expo-router",
      "expo-camera",
      "expo-image-picker",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/messaging"
    ],
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

### EAS Build Config (App Store)

```json
// apps/mobile/eas.json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "ios": { "resourceClass": "m1-medium" },
      "android": { "buildType": "apk" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "developer@stannel.app",
        "ascAppId": "YOUR_APP_STORE_CONNECT_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Mobile Background Slider (Native)

```typescript
// apps/mobile/components/BackgroundSlider.native.tsx
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  { uri: 'https://storage.googleapis.com/stannel-assets/backgrounds/arch-1.jpg' },
  { uri: 'https://storage.googleapis.com/stannel-assets/backgrounds/arch-2.jpg' },
  { uri: 'https://storage.googleapis.com/stannel-assets/backgrounds/arch-3.jpg' },
];

export default function BackgroundSlider() {
  const [current, setCurrent] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1.1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start();
      
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
      }, 800);
    }, 6000);

    // Subtle scale animation (Ken Burns effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.0, duration: 8000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.1, duration: 8000, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity, transform: [{ scale }] }]}>
        <Image
          source={SLIDES[current]}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={1000}
          cachePolicy="memory-disk"
        />
      </Animated.View>
      <LinearGradient
        colors={['rgba(6,15,31,0.7)', 'rgba(6,15,31,0.5)', 'rgba(6,15,31,0.85)']}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}
```

### Mobile Tab Navigator

```typescript
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(6,15,31,0.95)',
          borderTopColor: 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
          paddingBottom: 20,
          height: 75,
        },
        tabBarActiveTintColor: '#d4af37',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: {
          fontFamily: 'Assistant',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ראשי',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'ארנק',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'חשבוניות',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-upload" color={color} size={size} />
          ),
          tabBarBadge: undefined, // pending count
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'הטבות',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="gift" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'פרופיל',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## 9. Authentication & Roles <a name="auth"></a>

### Firebase Auth Setup

```typescript
// packages/api-client/src/auth.ts
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  // Loaded from Secret Manager via environment variable
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
```

### Auth Middleware (Backend)

```typescript
// backend/src/middleware/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { auth as firebaseAdmin } from 'firebase-admin';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) return reply.code(401).send({ error: 'Unauthorized' });

  try {
    const decoded = await firebaseAdmin().verifyIdToken(token);
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      include: { architectProfile: true, supplierProfile: true },
    });
    if (!user || !user.isActive) return reply.code(403).send({ error: 'Account not active' });
    request.user = user;
  } catch {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}

// RBAC middleware
export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
  };
}
```

---

## 10. Core Features — Implementation <a name="core-features"></a>

### Loyalty Engine Service

```typescript
// backend/src/services/loyalty.service.ts
export class LoyaltyService {
  // Calculate points for approved invoice
  async creditInvoicePoints(invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { architect: true, supplier: { include: { contracts: true } } },
    });

    const contract = invoice.supplier.contracts.find((c) => c.isActive);
    if (!contract) throw new Error('No active contract');

    const points = invoice.amount * (contract.feePercent / 100);

    await prisma.$transaction([
      prisma.architectProfile.update({
        where: { id: invoice.architectId },
        data: {
          pointsBalance: { increment: points },
          totalEarned: { increment: points },
          monthlyProgress: { increment: invoice.amount },
        },
      }),
      prisma.cardTransaction.create({
        data: {
          architectId: invoice.architectId,
          type: 'CREDIT',
          amount: points,
          description: `זיכוי מחשבונית #${invoiceId.slice(-6)}`,
          invoiceId,
        },
      }),
    ]);

    // Check goal milestones
    await this.checkGoalBonuses(invoice.architectId, invoice.supplierId);
  }

  async checkGoalBonuses(architectId: string, supplierId: string): Promise<void> {
    const architect = await prisma.architectProfile.findUnique({ where: { id: architectId } });
    const goals = await prisma.supplierGoal.findMany({
      where: { supplierId, isActive: true, endDate: { gte: new Date() } },
    });

    for (const goal of goals) {
      if (architect.monthlyProgress >= goal.targetAmount) {
        // Check if bonus already awarded this period
        const existing = await prisma.goalBonus.findFirst({
          where: { architectId, goalId: goal.id },
        });
        if (!existing) {
          await prisma.$transaction([
            prisma.architectProfile.update({
              where: { id: architectId },
              data: { pointsBalance: { increment: goal.bonusPoints } },
            }),
            prisma.goalBonus.create({
              data: { architectId, goalId: goal.id, bonusPoints: goal.bonusPoints },
            }),
          ]);
          // Send push notification
          await notificationService.send(architectId, {
            title: '🎉 יעד הושג!',
            body: `קיבלת בונוס של ${goal.bonusPoints} נקודות!`,
          });
        }
      }
    }
  }

  // Redeem points for product
  async redeemProduct(architectId: string, productId: string, cashAmount: number): Promise<void> {
    const [architect, product] = await Promise.all([
      prisma.architectProfile.findUnique({ where: { id: architectId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);

    if (!product || product.stock < 1) throw new Error('Product out of stock');
    if (architect.pointsBalance < product.pointCost) throw new Error('Insufficient points');

    await prisma.$transaction([
      prisma.architectProfile.update({
        where: { id: architectId },
        data: {
          pointsBalance: { decrement: product.pointCost },
          totalRedeemed: { increment: product.pointCost },
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: 1 } },
      }),
      prisma.redemption.create({
        data: { productId, architectId, pointsUsed: product.pointCost, cashPaid: cashAmount },
      }),
      prisma.cardTransaction.create({
        data: {
          architectId,
          type: 'DEBIT',
          amount: product.pointCost,
          description: `מימוש: ${product.name}`,
        },
      }),
    ]);
  }
}
```

### Rewards Store UI

```typescript
// apps/web/app/(architect)/rewards/page.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import { useRewards } from '@/hooks/useRewards';
import { useWallet } from '@/hooks/useWallet';
import Image from 'next/image';

export default function RewardsStore() {
  const { products, loading } = useRewards();
  const { balance } = useWallet();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Balance Banner — like El-Al FlyCard */}
      <GlassCard gold className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm">יתרת נקודות זמינות</p>
          <p className="text-4xl font-bold text-gold-400">{balance?.points?.toLocaleString()} נק׳</p>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-sm">מדרגה</p>
          <p className="text-2xl font-semibold text-white">🥇 GOLD</p>
        </div>
      </GlassCard>

      <h1 className="text-3xl font-display text-white mb-6">חנות ההטבות</h1>

      {/* Product Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <GlassCard
              className="cursor-pointer group"
              onClick={() => setSelected(product.id)}
            >
              {/* Product Image */}
              <div className="relative h-40 rounded-lg overflow-hidden mb-4 -mx-2 -mt-2">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.stock <= 3 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    נשארו {product.stock}!
                  </div>
                )}
              </div>

              <h3 className="text-white font-semibold mb-2">{product.name}</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gold-400 font-bold text-lg">
                    {product.pointCost.toLocaleString()} נק׳
                  </span>
                  {product.cashCost > 0 && (
                    <span className="text-white/50 text-sm mr-2">+ ₪{product.cashCost}</span>
                  )}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  balance?.points >= product.pointCost
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {balance?.points >= product.pointCost ? '✓ זמין' : 'חסר'}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

---

## 11. AI Insights Module <a name="ai-insights"></a>

### Vertex AI Integration

```typescript
// backend/src/services/ai.service.ts
import { VertexAI } from '@google-cloud/vertexai';
import { Storage } from '@google-cloud/storage';

const vertex = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1',
});

const model = vertex.getGenerativeModel({ model: 'gemini-1.5-pro' });

export class AIService {
  // Extract and validate invoice amount from image
  async validateInvoice(imageUrl: string, declaredAmount: number) {
    const imageData = await this.fetchImageAsBase64(imageUrl);
    
    const prompt = `
      You are an invoice validation AI for a construction/architecture platform.
      Analyze this invoice image and extract:
      1. Total amount (look for "סה"כ", "total", "לתשלום")
      2. Supplier name
      3. Date
      
      Declared amount: ₪${declaredAmount}
      
      Respond ONLY in JSON format:
      {
        "extractedAmount": number,
        "supplierName": string,
        "date": string,
        "confidence": number (0-1),
        "status": "MATCH" | "MISMATCH" | "UNCLEAR",
        "notes": string
      }
      
      MATCH if difference is less than 5%, MISMATCH if more, UNCLEAR if can't read.
    `;

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: imageData } },
            { text: prompt },
          ],
        },
      ],
    });

    const text = response.response.candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  }

  // Generate business insights for admin
  async generateTrends(data: {
    invoices: any[];
    topSuppliers: any[];
    topArchitects: any[];
    period: string;
  }) {
    const prompt = `
      You are a business intelligence AI for STANNEL - an architect-supplier loyalty platform.
      
      Analyze this data and provide actionable insights in Hebrew:
      
      Period: ${data.period}
      Total invoices: ${data.invoices.length}
      Top suppliers: ${JSON.stringify(data.topSuppliers)}
      Top architects: ${JSON.stringify(data.topArchitects)}
      
      Respond in JSON:
      {
        "summary": "2-3 sentence executive summary in Hebrew",
        "trends": [{"title": string, "insight": string, "action": string}],
        "alerts": [{"severity": "HIGH"|"MEDIUM"|"LOW", "message": string}],
        "recommendations": [string]
      }
    `;

    const response = await model.generateContent(prompt);
    const text = response.response.candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  }

  private async fetchImageAsBase64(gcsUrl: string): Promise<string> {
    const storage = new Storage();
    const bucket = gcsUrl.split('/')[3];
    const file = gcsUrl.split('/').slice(4).join('/');
    const [contents] = await storage.bucket(bucket).file(file).download();
    return contents.toString('base64');
  }
}
```

---

## 12. SLA & Automation Engine <a name="sla-automation"></a>

### SLA Monitoring with Bull Queue

```typescript
// backend/src/services/sla.service.ts
import Bull from 'bull';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const slaQueue = new Bull('sla-monitoring', { redis: { url: process.env.REDIS_URL } });

export class SLAService {
  // Schedule SLA check when invoice is approved
  async scheduleCheck(invoiceId: string, slaDeadline: Date): Promise<void> {
    const warningTime = new Date(slaDeadline.getTime() - 24 * 60 * 60 * 1000); // 24h before
    const delay = Math.max(0, warningTime.getTime() - Date.now());

    await slaQueue.add(
      'sla-warning',
      { invoiceId, type: 'WARNING' },
      { delay, jobId: `sla-warn-${invoiceId}`, removeOnComplete: true }
    );

    await slaQueue.add(
      'sla-breach',
      { invoiceId, type: 'BREACH' },
      {
        delay: Math.max(0, slaDeadline.getTime() - Date.now()),
        jobId: `sla-breach-${invoiceId}`,
        removeOnComplete: true,
      }
    );
  }

  // Process SLA jobs
  async processJobs(): Promise<void> {
    slaQueue.process('sla-warning', async (job) => {
      const { invoiceId } = job.data;
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { supplier: { include: { user: true } }, architect: true },
      });

      if (invoice?.status === 'PENDING_SUPPLIER_PAY') {
        await notificationService.send(invoice.supplier.userId, {
          title: '⚠️ תזכורת תשלום SLA',
          body: `נותרו פחות מ-24 שעות לתשלום חשבונית #${invoiceId.slice(-6)}`,
          data: { invoiceId, type: 'SLA_WARNING' },
        });
        
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { slaAlertSent: true },
        });
      }
    });

    slaQueue.process('sla-breach', async (job) => {
      const { invoiceId } = job.data;
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      
      if (invoice?.status === 'PENDING_SUPPLIER_PAY') {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: 'OVERDUE' },
        });
        
        // Notify admin + supplier
        // Update supplier trust score
        await prisma.supplierProfile.update({
          where: { id: invoice.supplierId },
          data: { trustScore: { decrement: 0.5 } },
        });
      }
    });
  }
}
```

---

## 13. Performance & Turbopack <a name="performance"></a>

### Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": { "outputs": [] },
    "type-check": { "outputs": [] }
  }
}
```

### Root Package.json

```json
// package.json
{
  "name": "stannel",
  "private": true,
  "workspaces": ["apps/*", "packages/*", "backend"],
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:mobile": "turbo run dev --filter=mobile",
    "dev:backend": "turbo run dev --filter=backend",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "db:push": "cd backend && npx prisma db push",
    "db:studio": "cd backend && npx prisma studio",
    "deploy:api": "cd backend && gcloud run deploy stannel-api --source .",
    "deploy:web": "cd apps/web && gcloud run deploy stannel-web --source ."
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

### Performance Optimizations

```typescript
// Web — React Query caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,      // 30 seconds
      gcTime: 5 * 60 * 1000,     // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Image optimization — preload background slides
// In BackgroundSlider, preload next image
useEffect(() => {
  const nextIndex = (current + 1) % SLIDES.length;
  const img = new window.Image();
  img.src = SLIDES[nextIndex].src;
}, [current]);
```

---

## 14. Deployment Pipeline <a name="deployment"></a>

### Cloud Build CI/CD

```yaml
# cloudbuild.yaml
steps:
  # Install dependencies
  - name: 'node:20'
    entrypoint: 'npm'
    args: ['install', '-g', 'pnpm']

  - name: 'node:20'
    entrypoint: 'pnpm'
    args: ['install', '--frozen-lockfile']

  # Run tests
  - name: 'node:20'
    entrypoint: 'pnpm'
    args: ['run', 'type-check']

  # Build backend Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/stannel-api:$COMMIT_SHA'
      - '-f'
      - 'backend/Dockerfile'
      - '.'

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/stannel-api:$COMMIT_SHA']

  # Deploy API to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'stannel-api'
      - '--image=gcr.io/$PROJECT_ID/stannel-api:$COMMIT_SHA'
      - '--region=me-west1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--set-env-vars=NODE_ENV=production'

  # Deploy Web to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'stannel-web'
      - '--source=apps/web'
      - '--region=me-west1'
      - '--platform=managed'
      - '--allow-unauthenticated'

options:
  logging: CLOUD_LOGGING_ONLY
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY backend/package.json ./backend/
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile --filter backend...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY . .
RUN cd backend && npx prisma generate
RUN pnpm run build --filter backend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/src/prisma ./prisma

EXPOSE 8080
CMD ["node", "dist/server.js"]
```

---

## 15. Claude Code Commands <a name="claude-code-commands"></a>

### Initial Setup — Run These in Order

```bash
# 1. Create monorepo
mkdir stannel && cd stannel
git init

# 2. Initialize with pnpm workspaces
pnpm init
echo 'packages:\n  - "apps/*"\n  - "packages/*"\n  - "backend"' > pnpm-workspace.yaml

# 3. Create Next.js web app with Turbopack
cd apps
pnpm create next-app@latest web --typescript --tailwind --app --src-dir=false --import-alias="@/*"

# 4. Create Expo mobile app
pnpm create expo-app mobile --template tabs

# 5. Initialize backend
mkdir backend && cd backend
pnpm init
pnpm add fastify @fastify/cors @fastify/multipart @fastify/rate-limit
pnpm add prisma @prisma/client
pnpm add firebase-admin @google-cloud/vertexai @google-cloud/storage
pnpm add bull ioredis
pnpm add -D typescript @types/node tsx

# 6. Install shared packages
cd ../packages
mkdir types api-client ui
# ... init each package

# 7. Install Turborepo at root
cd ..
pnpm add -D turbo

# 8. Install key web dependencies
cd apps/web
pnpm add framer-motion react-dropzone @tanstack/react-query zustand
pnpm add react-hook-form zod @hookform/resolvers
pnpm add lucide-react class-variance-authority clsx tailwind-merge

# 9. Setup Prisma
cd ../../backend
npx prisma init
# Edit schema.prisma as shown above
npx prisma db push
npx prisma generate

# 10. Run everything
cd ..
pnpm dev
```

### Claude Code CLAUDE.md File

```markdown
# STANNEL Platform — Claude Code Instructions

## Project Overview
Cross-platform loyalty management platform for architects and suppliers.
Monorepo with Next.js web, Expo mobile, Fastify backend.

## Development Commands
- `pnpm dev` — Run all apps (web + mobile + backend)
- `pnpm dev:web` — Web only (http://localhost:3000) with Turbopack
- `pnpm dev:mobile` — Expo mobile (http://localhost:8081)
- `pnpm dev:backend` — API server (http://localhost:8080)
- `pnpm db:studio` — Prisma Studio

## Key Architecture Rules
1. ALL background images must use BackgroundSlider component — no page without it
2. All components use glass-card CSS class for consistent UI
3. RTL support: html dir="rtl", Hebrew-first design
4. Types ALWAYS come from packages/types — never define inline
5. API calls ALWAYS go through packages/api-client — never fetch directly

## Google Cloud
- Project: newpost-co-il (PPC@newpost.co.il)
- Region: me-west1 (Tel Aviv)
- All secrets in Secret Manager

## Design Rules
- Colors: primary navy #1a3a6b, gold accent #d4af37
- Font: Assistant/Heebo for UI, Playfair Display for headers
- All cards: glass morphism (blur 20px, white/8 bg, white/15 border)
- Animations: Framer Motion for web, Animated API for mobile
- Background slider: MANDATORY on every page, 6s interval, parallax

## File Naming
- Components: PascalCase (BackgroundSlider.tsx)
- Hooks: camelCase with 'use' prefix (useWallet.ts)
- Routes: lowercase with dashes (invoice-upload)
- DB: camelCase (architectProfile)

## Testing
- Unit: Vitest
- E2E: Playwright (web), Detox (mobile)
- Run: `pnpm test`
```

---

## 📱 App Store Submission Checklist

```
iOS App Store:
□ Bundle ID: com.stannel.app
□ App Store Connect account configured
□ Privacy Policy URL ready
□ Screenshots: 6.5" + 5.5" iPhone, iPad Pro
□ App Review notes (Hebrew + English)
□ Age rating: 17+ (business transactions)
□ EAS build: eas build --platform ios --profile production

Google Play Store:
□ Package: com.stannel.app
□ Signed APK/AAB with keystore
□ Feature graphic: 1024x500
□ Screenshots: Phone + Tablet
□ Content rating: Everyone
□ EAS build: eas build --platform android --profile production
```

---

## ✅ MVP Build Priority Order

```
Phase 1 (Week 1-2) — Core:
□ Monorepo setup + Turbopack
□ BackgroundSlider (web + mobile)
□ Auth (Firebase) + User management
□ Database schema + Prisma migrations
□ Invoice upload + AI validation

Phase 2 (Week 3-4) — Workflow:
□ Admin dashboard + verification flow
□ SLA engine (Bull queues)
□ Supplier payment confirmation
□ Loyalty point credit

Phase 3 (Week 5-6) — UX:
□ Architect digital card
□ Rewards store
□ Events management
□ Push notifications (FCM)

Phase 4 (Week 7-8) — Polish:
□ AI Insights (Vertex AI)
□ Mobile app store build (EAS)
□ Cloud CDN for background images
□ Full E2E testing
□ Production deployment
```

---

*STANNEL Platform V2 — Build Specification*  
*Generated for Claude Code | Google Cloud Account: PPC@newpost.co.il*  
*Stack: Next.js 14 + Expo + Fastify + PostgreSQL + Vertex AI | Turbopack enabled*
