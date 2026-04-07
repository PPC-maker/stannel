// Backup Service - Daily database backup at 1:00 AM
// Backs up to Google Cloud Storage

import prisma from '../lib/prisma.js';
import { systemLogger } from './system-logger.service.js';
import { emailService, EMAIL_DESTINATIONS } from './email.service.js';

interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  tables: number;
  records: number;
  duration: number;
  error?: string;
}

export const backupService = {
  // Main backup function - runs at 1:00 AM daily
  async performBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    console.log('[Backup] Starting daily backup...');

    try {
      // Create backup data structure
      const backupData: Record<string, any[]> = {};
      let totalRecords = 0;

      // Backup all critical tables
      const tables = [
        { name: 'users', query: () => prisma.user.findMany() },
        { name: 'architectProfiles', query: () => prisma.architectProfile.findMany() },
        { name: 'supplierProfiles', query: () => prisma.supplierProfile.findMany() },
        { name: 'invoices', query: () => prisma.invoice.findMany() },
        { name: 'products', query: () => prisma.product.findMany() },
        { name: 'redemptions', query: () => prisma.redemption.findMany() },
        { name: 'cardTransactions', query: () => prisma.cardTransaction.findMany() },
        { name: 'supplierCardTransactions', query: () => prisma.supplierCardTransaction.findMany() },
        { name: 'events', query: () => prisma.event.findMany() },
        { name: 'eventRegistrations', query: () => prisma.eventRegistration.findMany() },
        { name: 'contracts', query: () => prisma.contract.findMany() },
        { name: 'supplierGoals', query: () => prisma.supplierGoal.findMany() },
        { name: 'goalBonuses', query: () => prisma.goalBonus.findMany() },
        { name: 'notifications', query: () => prisma.notification.findMany() },
        { name: 'invoiceStatusHistory', query: () => prisma.invoiceStatusHistory.findMany() },
        { name: 'architectGoals', query: () => prisma.architectGoal.findMany() },
        { name: 'bonusTransactions', query: () => prisma.bonusTransaction.findMany() },
        { name: 'supplierPayments', query: () => prisma.supplierPayment.findMany() },
      ];

      // Fetch all data
      for (const table of tables) {
        try {
          const data = await table.query();
          backupData[table.name] = data;
          totalRecords += data.length;
          console.log(`[Backup] ${table.name}: ${data.length} records`);
        } catch (err) {
          console.error(`[Backup] Failed to backup ${table.name}:`, err);
          backupData[table.name] = [];
        }
      }

      // Create backup JSON
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `stannel-backup-${timestamp}.json`;
      const backupJson = JSON.stringify({
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          totalTables: tables.length,
          totalRecords,
        },
        data: backupData,
      }, null, 2);

      const size = Buffer.byteLength(backupJson, 'utf8');

      // Try to upload to GCS if configured
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCS_INVOICE_BUCKET) {
        await this.uploadToGCS(filename, backupJson);
      } else {
        // Save locally as fallback
        await this.saveLocally(filename, backupJson);
      }

      const duration = Date.now() - startTime;

      // Log success
      await systemLogger.info('SCHEDULER', 'Backup Completed', `Daily backup completed: ${filename}`, {
        details: `Tables: ${tables.length}, Records: ${totalRecords}, Size: ${(size / 1024 / 1024).toFixed(2)}MB, Duration: ${duration}ms`,
      });

      // Send success email
      await this.sendBackupReport({
        success: true,
        filename,
        size,
        tables: tables.length,
        records: totalRecords,
        duration,
      });

      console.log(`[Backup] Completed successfully: ${filename} (${(size / 1024 / 1024).toFixed(2)}MB)`);

      return {
        success: true,
        filename,
        size,
        tables: tables.length,
        records: totalRecords,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      await systemLogger.critical('SCHEDULER', 'Backup Failed', `Daily backup failed: ${error.message}`, error);

      // Send failure alert
      await this.sendBackupReport({
        success: false,
        tables: 0,
        records: 0,
        duration,
        error: error.message,
      });

      console.error('[Backup] Failed:', error);

      return {
        success: false,
        tables: 0,
        records: 0,
        duration,
        error: error.message,
      };
    }
  },

  // Upload backup to Google Cloud Storage
  async uploadToGCS(filename: string, content: string): Promise<void> {
    try {
      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage();
      const bucketName = process.env.GCS_INVOICE_BUCKET || 'stannel-backups';

      const bucket = storage.bucket(bucketName);
      const file = bucket.file(`backups/${filename}`);

      await file.save(content, {
        contentType: 'application/json',
        metadata: {
          cacheControl: 'no-cache',
        },
      });

      console.log(`[Backup] Uploaded to GCS: gs://${bucketName}/backups/${filename}`);
    } catch (error) {
      console.error('[Backup] GCS upload failed, saving locally:', error);
      await this.saveLocally(filename, content);
    }
  },

  // Save backup locally as fallback
  async saveLocally(filename: string, content: string): Promise<void> {
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    const backupDir = path.join(process.cwd(), 'backups');

    // Create backup directory if it doesn't exist
    try {
      await fs.access(backupDir);
    } catch {
      await fs.mkdir(backupDir, { recursive: true });
    }

    const filePath = path.join(backupDir, filename);
    await fs.writeFile(filePath, content, 'utf8');

    console.log(`[Backup] Saved locally: ${filePath}`);

    // Clean up old backups (keep last 7 days)
    await this.cleanupOldBackups(backupDir, 7);
  },

  // Clean up old backup files
  async cleanupOldBackups(dir: string, keepDays: number): Promise<void> {
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');

    try {
      const files = await fs.readdir(dir);
      const now = Date.now();
      const maxAge = keepDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (file.startsWith('stannel-backup-')) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          const age = now - stats.mtime.getTime();

          if (age > maxAge) {
            await fs.unlink(filePath);
            console.log(`[Backup] Deleted old backup: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('[Backup] Failed to cleanup old backups:', error);
    }
  },

  // Send backup report email
  async sendBackupReport(result: BackupResult): Promise<void> {
    const statusIcon = result.success ? '✅' : '❌';
    const statusText = result.success ? 'הגיבוי בוצע בהצלחה' : 'הגיבוי נכשל';
    const statusColor = result.success ? '#10b981' : '#ef4444';

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STANNEL - דו״ח גיבוי</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 550px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%); padding: 25px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 22px;">STANNEL</h1>
      <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">דו״ח גיבוי יומי</p>
    </div>

    <!-- Status Banner -->
    <div style="background-color: ${result.success ? '#dcfce7' : '#fee2e2'}; padding: 15px; text-align: center; border-bottom: 2px solid ${statusColor};">
      <h2 style="color: ${statusColor}; margin: 0; font-size: 20px;">${statusIcon} ${statusText}</h2>
    </div>

    <!-- Content -->
    <div style="padding: 25px;">
      ${result.success ? `
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px; text-align: center; background-color: #f8fafc; border-radius: 8px;">
            <div style="color: #1a3a6b; font-size: 24px; font-weight: bold;">${result.tables}</div>
            <div style="color: #64748b; font-size: 12px;">טבלאות</div>
          </td>
          <td style="padding: 10px; text-align: center; background-color: #f8fafc; border-radius: 8px;">
            <div style="color: #1a3a6b; font-size: 24px; font-weight: bold;">${result.records?.toLocaleString()}</div>
            <div style="color: #64748b; font-size: 12px;">רשומות</div>
          </td>
          <td style="padding: 10px; text-align: center; background-color: #f8fafc; border-radius: 8px;">
            <div style="color: #1a3a6b; font-size: 24px; font-weight: bold;">${((result.size || 0) / 1024 / 1024).toFixed(2)}</div>
            <div style="color: #64748b; font-size: 12px;">MB</div>
          </td>
        </tr>
      </table>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
        <p style="margin: 0; color: #374151; font-size: 14px;">
          <strong>קובץ:</strong> ${result.filename}
        </p>
        <p style="margin: 8px 0 0 0; color: #374151; font-size: 14px;">
          <strong>משך:</strong> ${(result.duration / 1000).toFixed(2)} שניות
        </p>
      </div>
      ` : `
      <div style="background-color: #fee2e2; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
        <p style="color: #dc2626; margin: 0; font-size: 14px;">
          <strong>שגיאה:</strong> ${result.error || 'Unknown error'}
        </p>
      </div>
      `}

      <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
        הגיבוי מתבצע אוטומטית כל לילה בשעה 01:00
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
        ${new Date().toLocaleString('he-IL')} • STANNEL Backup System
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await emailService.send({
      to: EMAIL_DESTINATIONS.systemReports,
      subject: `${statusIcon} גיבוי יומי STANNEL - ${new Date().toLocaleDateString('he-IL')} ${result.success ? '(הצלחה)' : '(נכשל)'}`,
      html,
    });
  },

  // Manual backup trigger (for admin)
  async forceBackup(): Promise<BackupResult> {
    console.log('[Backup] Force backup triggered by admin');
    return this.performBackup();
  },

  // Restore from backup (admin only)
  async restoreFromBackup(filename: string): Promise<boolean> {
    console.log(`[Backup] Restore requested from: ${filename}`);
    // This would be implemented for disaster recovery
    // For now, just log the request
    await systemLogger.warning('SCHEDULER', 'Restore Requested', `Manual restore requested from ${filename}`);
    return false;
  },
};
