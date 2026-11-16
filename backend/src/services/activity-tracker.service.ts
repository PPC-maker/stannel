// Activity Tracker - logins (sessions), last seen and page views.
// Fully isolated from the Prisma schema: tables are created on demand with raw SQL
// (same pattern as AppLoginHandoff), so deploying this never touches existing queries.
// Every public function swallows its own errors - tracking must never break a request.

import prisma from '../lib/prisma.js';

const TZ = 'Asia/Jerusalem';
const TOUCH_INTERVAL_MS = 5 * 60 * 1000; // at most one DB write per user per 5 minutes
const SESSION_GAP_MINUTES = 30; // inactivity longer than this starts a new "login"
const PAGEVIEW_LIMIT_PER_MIN = 120;

let tablesReady: Promise<boolean> | null = null;

function ensureTables(): Promise<boolean> {
  if (!tablesReady) {
    tablesReady = (async () => {
      try {
        await prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "UserActivity" ("userId" TEXT PRIMARY KEY, "lastLoginAt" TIMESTAMPTZ NOT NULL, "lastSeenAt" TIMESTAMPTZ NOT NULL, "loginCount" INTEGER NOT NULL DEFAULT 1, "platform" TEXT)'
        );
        await prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "LoginEvent" ("id" BIGSERIAL PRIMARY KEY, "userId" TEXT NOT NULL, "role" TEXT NOT NULL, "platform" TEXT, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW())'
        );
        await prisma.$executeRawUnsafe(
          'CREATE INDEX IF NOT EXISTS "LoginEvent_createdAt_idx" ON "LoginEvent" ("createdAt")'
        );
        await prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "PageViewDaily" ("day" DATE NOT NULL, "platform" TEXT NOT NULL, "role" TEXT NOT NULL, "path" TEXT NOT NULL, "views" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("day", "platform", "role", "path"))'
        );
        return true;
      } catch (error) {
        console.error('[Activity] ensureTables failed:', error);
        tablesReady = null; // retry on next call
        return false;
      }
    })();
  }
  return tablesReady;
}

export function detectPlatform(userAgent?: string, header?: string): 'web' | 'mobile' {
  if (header === 'mobile' || header === 'web') return header;
  if (userAgent && /STANNEL-App|okhttp|CFNetwork|Expo|ReactNative|Dalvik/i.test(userAgent)) return 'mobile';
  return 'web';
}

// ---- Logins / last seen ----

const lastTouch = new Map<string, number>();

export function trackUserActivity(userId: string, role: string, platform: string): void {
  try {
    const now = Date.now();
    const last = lastTouch.get(userId);
    if (last && now - last < TOUCH_INTERVAL_MS) return;
    lastTouch.set(userId, now);
    if (lastTouch.size > 5000) {
      for (const [id, t] of lastTouch) {
        if (now - t > TOUCH_INTERVAL_MS) lastTouch.delete(id);
      }
    }
    void recordActivity(userId, role, platform).catch((error) => {
      console.error('[Activity] record failed:', error);
    });
  } catch (error) {
    console.error('[Activity] track failed:', error);
  }
}

async function recordActivity(userId: string, role: string, platform: string): Promise<void> {
  if (!(await ensureTables())) return;

  // lastLoginAt == lastSeenAt (same NOW()) only when this call started a new session
  const rows = await prisma.$queryRaw<{ newSession: boolean }[]>`
    INSERT INTO "UserActivity" ("userId", "lastLoginAt", "lastSeenAt", "loginCount", "platform")
    VALUES (${userId}, NOW(), NOW(), 1, ${platform})
    ON CONFLICT ("userId") DO UPDATE SET
      "lastLoginAt" = CASE WHEN NOW() - "UserActivity"."lastSeenAt" > make_interval(mins => ${SESSION_GAP_MINUTES}::int) THEN NOW() ELSE "UserActivity"."lastLoginAt" END,
      "loginCount" = "UserActivity"."loginCount" + CASE WHEN NOW() - "UserActivity"."lastSeenAt" > make_interval(mins => ${SESSION_GAP_MINUTES}::int) THEN 1 ELSE 0 END,
      "lastSeenAt" = NOW(),
      "platform" = ${platform}
    RETURNING ("lastLoginAt" = "lastSeenAt") AS "newSession"`;

  if (rows[0]?.newSession) {
    await prisma.$executeRaw`INSERT INTO "LoginEvent" ("userId", "role", "platform") VALUES (${userId}, ${role}, ${platform})`;
  }
}

// ---- Page views ----

const pageViewRate = new Map<string, { count: number; windowStart: number }>();

export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let path = raw.split('?')[0].split('#')[0].trim();
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, '');
  if (path.length > 120) return null;
  // Replace id-like segments (numbers, uuids, long tokens) so one page = one row
  path = path
    .split('/')
    .map((seg) =>
      /^\d+$/.test(seg) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(seg) || /^[A-Za-z0-9_-]{20,}$/.test(seg) ? ':id' : seg
    )
    .join('/');
  if (!/^\/[A-Za-z0-9_\-\/:.()%֐-׿]*$/.test(path)) return null;
  return path;
}

export function trackPageView(userId: string, role: string, platform: string, rawPath: unknown): void {
  try {
    const path = normalizePath(rawPath);
    if (!path) return;

    const now = Date.now();
    const rate = pageViewRate.get(userId);
    if (!rate || now - rate.windowStart > 60_000) {
      pageViewRate.set(userId, { count: 1, windowStart: now });
    } else if (++rate.count > PAGEVIEW_LIMIT_PER_MIN) {
      return;
    }
    if (pageViewRate.size > 5000) {
      for (const [id, r] of pageViewRate) {
        if (now - r.windowStart > 60_000) pageViewRate.delete(id);
      }
    }

    void (async () => {
      if (!(await ensureTables())) return;
      await prisma.$executeRaw`
        INSERT INTO "PageViewDaily" ("day", "platform", "role", "path", "views")
        VALUES ((NOW() AT TIME ZONE ${TZ})::date, ${platform}, ${role}, ${path}, 1)
        ON CONFLICT ("day", "platform", "role", "path") DO UPDATE SET "views" = "PageViewDaily"."views" + 1`;
    })().catch((error) => console.error('[Activity] page view failed:', error));
  } catch (error) {
    console.error('[Activity] page view track failed:', error);
  }
}

// ---- Admin report ----

export interface RoleCounts {
  total: number;
  activeToday: number;
  active7d: number;
  active30d: number;
  neverSeen: number;
}

export async function getActivityReport(days: number) {
  const ready = await ensureTables();
  const empty = {
    trackingReady: ready,
    byRole: {} as Record<string, RoleCounts>,
    daily: [] as { day: string; role: string; users: number }[],
    recentUsers: [] as unknown[],
    topPages: [] as unknown[],
  };
  if (!ready) return empty;

  const [byRoleRows, dailyRows, recentUsers, topPages] = await Promise.all([
    prisma.$queryRaw<
      { role: string; total: number; activeToday: number; active7d: number; active30d: number; neverSeen: number }[]
    >`
      SELECT u."role"::text AS "role",
        COUNT(*)::int AS "total",
        COUNT(*) FILTER (WHERE (a."lastSeenAt" AT TIME ZONE ${TZ})::date = (NOW() AT TIME ZONE ${TZ})::date)::int AS "activeToday",
        COUNT(*) FILTER (WHERE a."lastSeenAt" >= NOW() - INTERVAL '7 days')::int AS "active7d",
        COUNT(*) FILTER (WHERE a."lastSeenAt" >= NOW() - INTERVAL '30 days')::int AS "active30d",
        COUNT(*) FILTER (WHERE a."userId" IS NULL)::int AS "neverSeen"
      FROM "User" u
      LEFT JOIN "UserActivity" a ON a."userId" = u."id"
      WHERE u."isDeleted" = false AND u."isActive" = true
      GROUP BY u."role"`,
    prisma.$queryRaw<{ day: string; role: string; users: number }[]>`
      SELECT to_char((e."createdAt" AT TIME ZONE ${TZ})::date, 'YYYY-MM-DD') AS "day",
        e."role" AS "role",
        COUNT(DISTINCT e."userId")::int AS "users"
      FROM "LoginEvent" e
      WHERE e."createdAt" >= NOW() - make_interval(days => ${days}::int)
      GROUP BY 1, 2
      ORDER BY 1`,
    prisma.$queryRaw<unknown[]>`
      SELECT u."id", u."name", u."email", u."role"::text AS "role", u."company",
        a."lastLoginAt", a."lastSeenAt", a."loginCount", a."platform"
      FROM "UserActivity" a
      JOIN "User" u ON u."id" = a."userId"
      WHERE u."isDeleted" = false
      ORDER BY a."lastSeenAt" DESC
      LIMIT 50`,
    prisma.$queryRaw<unknown[]>`
      SELECT p."path",
        SUM(p."views")::int AS "total",
        COALESCE(SUM(p."views") FILTER (WHERE p."role" IN ('ARCHITECT', 'DESIGNER')), 0)::int AS "architects",
        COALESCE(SUM(p."views") FILTER (WHERE p."role" = 'SUPPLIER'), 0)::int AS "suppliers",
        COALESCE(SUM(p."views") FILTER (WHERE p."role" = 'ADMIN'), 0)::int AS "admins"
      FROM "PageViewDaily" p
      WHERE p."day" >= ((NOW() AT TIME ZONE ${TZ})::date - ${days}::int)
      GROUP BY p."path"
      ORDER BY "total" DESC
      LIMIT 20`,
  ]);

  const byRole: Record<string, RoleCounts> = {};
  for (const r of byRoleRows) {
    byRole[r.role] = {
      total: r.total,
      activeToday: r.activeToday,
      active7d: r.active7d,
      active30d: r.active30d,
      neverSeen: r.neverSeen,
    };
  }

  return { trackingReady: true, byRole, daily: dailyRows, recentUsers, topPages };
}
