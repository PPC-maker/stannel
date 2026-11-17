// Push Service — sends admin-composed push notifications to installed apps (FCM, iOS + Android)

import prisma from '../lib/prisma.js';
import { getFirebaseMessaging } from '../lib/firebase.js';

export type PushAudience = 'ALL' | 'ARCHITECT' | 'DESIGNER' | 'SUPPLIER';

const INVALID_TOKEN_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
];

function audienceWhere(audience: PushAudience) {
  return {
    isActive: true,
    isDeleted: false,
    ...(audience !== 'ALL' && { role: audience }),
  };
}

export const pushService = {
  async countDevices(audience: PushAudience) {
    const [devices, users] = await Promise.all([
      prisma.deviceToken.count({ where: { user: audienceWhere(audience) } }),
      prisma.user.count({ where: audienceWhere(audience) }),
    ]);
    return { devices, users };
  },

  async sendToAudience(params: {
    title: string;
    body: string;
    audience: PushAudience;
    createdById?: string;
    alsoInApp?: boolean;
  }) {
    const { title, body, audience, createdById, alsoInApp } = params;
    const messaging = getFirebaseMessaging();

    const rows = await prisma.deviceToken.findMany({
      where: { user: audienceWhere(audience) },
      select: { token: true },
    });
    const tokens = rows.map((r) => r.token);

    let sent = 0;
    let failed = 0;
    const invalid: string[] = [];

    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      const res = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: { type: 'ADMIN_PUSH' },
        apns: { payload: { aps: { sound: 'default' } } },
        android: { priority: 'high', notification: { sound: 'default' } },
      });
      sent += res.successCount;
      failed += res.failureCount;
      res.responses.forEach((r, idx) => {
        if (!r.success && r.error && INVALID_TOKEN_CODES.includes(r.error.code)) {
          invalid.push(chunk[idx]);
        }
      });
    }

    // Drop tokens that Firebase says no longer exist (app uninstalled etc.)
    if (invalid.length > 0) {
      await prisma.deviceToken.deleteMany({ where: { token: { in: invalid } } });
    }

    // Optional: also leave the message in the in-app bell for every user in the audience
    if (alsoInApp) {
      try {
        const users = await prisma.user.findMany({ where: audienceWhere(audience), select: { id: true } });
        if (users.length > 0) {
          await prisma.notification.createMany({
            data: users.map((u) => ({
              recipientId: u.id,
              type: 'SYSTEM_ALERT' as const,
              title,
              message: body,
            })),
          });
        }
      } catch (e) {
        console.error('[Push] failed to create in-app notifications:', e);
      }
    }

    const campaign = await prisma.pushCampaign.create({
      data: { title, body, audience, sentCount: sent, failedCount: failed, createdById },
    });

    return { campaign, devices: tokens.length, sent, failed };
  },
};
