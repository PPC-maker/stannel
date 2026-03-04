// Notification Service - Firebase Cloud Messaging

import { getMessaging } from 'firebase-admin/messaging';
import prisma from '../lib/prisma.js';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export const notificationService = {
  async send(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      // Get user's FCM tokens (stored separately - you'd need a DeviceToken model)
      // For now, this is a placeholder
      console.log(`[Notification] Sending to user ${userId}:`, payload);

      // In production, you'd have device tokens stored:
      // const tokens = await prisma.deviceToken.findMany({
      //   where: { userId },
      //   select: { token: true },
      // });

      // if (tokens.length === 0) return false;

      // const message = {
      //   notification: {
      //     title: payload.title,
      //     body: payload.body,
      //     imageUrl: payload.imageUrl,
      //   },
      //   data: payload.data,
      //   tokens: tokens.map(t => t.token),
      // };

      // await getMessaging().sendEachForMulticast(message);
      return true;
    } catch (error) {
      console.error('Notification error:', error);
      return false;
    }
  },

  async sendToTopic(topic: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        topic,
      };

      await getMessaging().send(message);
      return true;
    } catch (error) {
      console.error('Topic notification error:', error);
      return false;
    }
  },

  async sendToAdmins(payload: NotificationPayload): Promise<void> {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });

    await Promise.all(admins.map(admin => this.send(admin.id, payload)));
  },

  // Notify about new invoice
  async notifyNewInvoice(invoiceId: string): Promise<void> {
    await this.sendToAdmins({
      title: '📄 חשבונית חדשה',
      body: 'חשבונית חדשה ממתינה לאישור',
      data: { type: 'NEW_INVOICE', invoiceId },
    });
  },

  // Notify supplier about pending payment
  async notifySupplierPayment(supplierId: string, invoiceId: string, amount: number): Promise<void> {
    const supplier = await prisma.supplierProfile.findUnique({
      where: { id: supplierId },
      select: { userId: true },
    });

    if (supplier) {
      await this.send(supplier.userId, {
        title: '💳 תשלום ממתין',
        body: `חשבונית בסך ₪${amount.toLocaleString()} ממתינה לתשלום`,
        data: { type: 'PENDING_PAYMENT', invoiceId },
      });
    }
  },

  // Notify architect about invoice status
  async notifyArchitectInvoiceStatus(
    architectId: string,
    invoiceId: string,
    status: string
  ): Promise<void> {
    const architect = await prisma.architectProfile.findUnique({
      where: { id: architectId },
      select: { userId: true },
    });

    if (!architect) return;

    const statusMessages: Record<string, { title: string; body: string }> = {
      APPROVED: {
        title: '✅ חשבונית אושרה',
        body: 'החשבונית שלך אושרה וממתינה לתשלום הספק',
      },
      REJECTED: {
        title: '❌ חשבונית נדחתה',
        body: 'החשבונית שלך נדחתה. בדוק את ההערות',
      },
      CLARIFICATION_NEEDED: {
        title: '❓ נדרש הבהרה',
        body: 'נדרשת הבהרה לגבי החשבונית',
      },
      PAID: {
        title: '🎉 תשלום התקבל!',
        body: 'הספק שילם והנקודות זוכו לחשבונך',
      },
    };

    const message = statusMessages[status];
    if (message) {
      await this.send(architect.userId, {
        ...message,
        data: { type: 'INVOICE_STATUS', invoiceId, status },
      });
    }
  },
};
