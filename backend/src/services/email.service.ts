// Email Service - STANNEL Platform
// Uses Gmail SMTP for email delivery

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface GmailConfig {
  user: string;
  appPassword: string;
  fromName: string;
}

const getConfig = (): GmailConfig => ({
  user: process.env.GMAIL_USER || 'ppc@newpost.co.il',
  appPassword: process.env.GMAIL_APP_PASSWORD || '',
  fromName: process.env.EMAIL_FROM_NAME || 'STANNEL',
});

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    const config = getConfig();
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.appPassword,
      },
    });
  }
  return transporter;
};

// Email destinations - exported for use in other services
export const EMAIL_DESTINATIONS = {
  // System reports and monitoring
  systemReports: ['orenshp77@gmail.com'],
  // Contact form and site inquiries
  siteContact: ['ppc@newpost.co.il'],
};

export const emailService = {
  async send(options: EmailOptions): Promise<boolean> {
    const config = getConfig();

    if (!config.appPassword) {
      console.warn('[Email] Gmail App Password not configured. Email not sent.');
      console.log('[Email] Would send:', {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    try {
      const transport = getTransporter();
      const toAddresses = Array.isArray(options.to) ? options.to.join(', ') : options.to;

      await transport.sendMail({
        from: `"${config.fromName}" <${config.user}>`,
        to: toAddresses,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
        html: options.html,
      });

      console.log('[Email] Sent successfully to:', options.to);
      return true;
    } catch (error) {
      console.error('[Email] Send error:', error);
      return false;
    }
  },

  async sendHealthReport(
    adminEmails: string[],
    report: {
      summary: string;
      stats: Record<string, any>;
      issues: string[];
      recommendations: string[];
      generatedAt: Date;
    }
  ): Promise<boolean> {
    const issuesHtml = report.issues.length > 0
      ? `<ul style="color: #dc2626;">${report.issues.map(i => `<li>${i}</li>`).join('')}</ul>`
      : '<p style="color: #10b981;">No issues detected</p>';

    const recommendationsHtml = report.recommendations.length > 0
      ? `<ul>${report.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>`
      : '<p>No recommendations at this time</p>';

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STANNEL Weekly Health Report</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%); padding: 30px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 24px;">STANNEL</h1>
      <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Weekly System Health Report</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <!-- Summary -->
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #1a3a6b; margin: 0 0 10px 0; font-size: 18px;">Summary</h2>
        <p style="color: #64748b; margin: 0;">${report.summary}</p>
      </div>

      <!-- Stats Grid -->
      <h2 style="color: #1a3a6b; margin: 0 0 15px 0; font-size: 18px;">Key Metrics</h2>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
        ${Object.entries(report.stats).map(([key, value]) => `
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; text-align: center;">
            <div style="color: #d4af37; font-size: 24px; font-weight: bold;">${value}</div>
            <div style="color: #64748b; font-size: 12px;">${key}</div>
          </div>
        `).join('')}
      </div>

      <!-- Issues -->
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">Issues Found</h2>
        ${issuesHtml}
      </div>

      <!-- Recommendations -->
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #10b981; margin: 0 0 10px 0; font-size: 18px;">Recommendations</h2>
        ${recommendationsHtml}
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Generated on ${report.generatedAt.toLocaleDateString('he-IL')} at ${report.generatedAt.toLocaleTimeString('he-IL')}
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">
          STANNEL Platform - Loyalty Management System
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return this.send({
      to: adminEmails,
      subject: `STANNEL Weekly Health Report - ${report.generatedAt.toLocaleDateString('he-IL')}`,
      html,
    });
  },
  async sendDailyStatusReport(
    adminEmails: string[],
    status: {
      isHealthy: boolean;
      checks: {
        name: string;
        status: 'ok' | 'warning' | 'error';
        message: string;
      }[];
      timestamp: Date;
    }
  ): Promise<boolean> {
    const allOk = status.isHealthy && status.checks.every(c => c.status === 'ok');

    const checksHtml = status.checks.map(check => {
      const icon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      const bgColor = check.status === 'ok' ? '#dcfce7' : check.status === 'warning' ? '#fef3c7' : '#fee2e2';
      const borderColor = check.status === 'ok' ? '#10b981' : check.status === 'warning' ? '#f59e0b' : '#ef4444';

      return `
        <div style="background-color: ${bgColor}; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-right: 4px solid ${borderColor};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #1f2937;">${icon} ${escapeHtml(check.name)}</span>
            <span style="color: #6b7280; font-size: 13px;">${escapeHtml(check.message)}</span>
          </div>
        </div>
      `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STANNEL - דוח סטטוס יומי</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${allOk ? '#10b981' : '#ef4444'} 0%, ${allOk ? '#059669' : '#dc2626'} 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">
        ${allOk ? '✅' : '⚠️'} דוח סטטוס מערכת - STANNEL
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
        זמן: ${status.timestamp.toLocaleDateString('he-IL')}, ${status.timestamp.toLocaleTimeString('he-IL')}
      </p>
    </div>

    <!-- Status Banner -->
    <div style="padding: 30px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: ${allOk ? '#10b981' : '#ef4444'}; margin: 0; font-size: 20px;">
          ${allOk ? 'המערכת פועלת תקין' : 'נמצאו בעיות במערכת'}
        </h2>
      </div>

      <!-- Checks -->
      ${checksHtml}

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; margin-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          מערכת ניטור אוטומטית - STANNEL
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0 0;">
          הודעה זו נשלחת אוטומטית כל 24 שעות.
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0 0;">
          הבוט פועל כל 24 שעות ובודק את תקינות המערכת.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return this.send({
      to: adminEmails,
      subject: `${allOk ? '✅' : '⚠️'} דוח סטטוס: מערכת STANNEL ${allOk ? 'תקינה' : 'דורשת תשומת לב'}`,
      html,
    });
  },

  async sendSecurityAlert(
    adminEmails: string[],
    alert: {
      type: 'BRUTE_FORCE' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_UPLOAD' | 'SQL_INJECTION' | 'XSS_ATTEMPT' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_TOKEN' | 'SUSPICIOUS_ACTIVITY';
      ip: string;
      userAgent?: string;
      userId?: string;
      endpoint: string;
      details: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      timestamp: Date;
    }
  ): Promise<boolean> {
    const severityColors: Record<string, string> = {
      LOW: '#3b82f6',
      MEDIUM: '#f59e0b',
      HIGH: '#ef4444',
      CRITICAL: '#7c2d12',
    };

    const severityBg: Record<string, string> = {
      LOW: '#eff6ff',
      MEDIUM: '#fffbeb',
      HIGH: '#fef2f2',
      CRITICAL: '#fef2f2',
    };

    const alertTypeLabels: Record<string, string> = {
      BRUTE_FORCE: '🔐 ניסיון פריצה בכוח',
      UNAUTHORIZED_ACCESS: '🚫 גישה לא מורשית',
      SUSPICIOUS_UPLOAD: '📁 העלאת קובץ חשוד',
      SQL_INJECTION: '💉 ניסיון SQL Injection',
      XSS_ATTEMPT: '⚠️ ניסיון XSS',
      RATE_LIMIT_EXCEEDED: '🚦 חריגה ממגבלת בקשות',
      INVALID_TOKEN: '🎫 טוקן לא תקין',
      SUSPICIOUS_ACTIVITY: '🔍 פעילות חשודה',
    };

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STANNEL Security Alert</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f0f0f; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid #dc2626;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7c2d12 0%, #450a0a 100%); padding: 30px; text-align: center;">
      <h1 style="color: #fca5a5; margin: 0; font-size: 28px;">🚨 התראת אבטחה</h1>
      <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">STANNEL Platform Security</p>
    </div>

    <!-- Alert Badge -->
    <div style="text-align: center; padding: 20px;">
      <span style="display: inline-block; background-color: ${severityColors[alert.severity]}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold;">
        ${alert.severity} SEVERITY
      </span>
    </div>

    <!-- Content -->
    <div style="padding: 0 30px 30px;">
      <!-- Alert Type -->
      <div style="background-color: ${severityBg[alert.severity]}; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-right: 4px solid ${severityColors[alert.severity]};">
        <h2 style="color: ${severityColors[alert.severity]}; margin: 0 0 10px 0; font-size: 20px;">${alertTypeLabels[alert.type] || alert.type}</h2>
        <p style="color: #374151; margin: 0; font-size: 14px;">${escapeHtml(alert.details)}</p>
      </div>

      <!-- Details -->
      <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #d4af37; margin: 0 0 15px 0; font-size: 16px;">פרטי האירוע</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">כתובת IP:</td>
            <td style="padding: 8px 0; color: #f3f4f6; font-size: 14px; font-family: monospace;">${escapeHtml(alert.ip)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">נקודת קצה:</td>
            <td style="padding: 8px 0; color: #f3f4f6; font-size: 14px; font-family: monospace;">${escapeHtml(alert.endpoint)}</td>
          </tr>
          ${alert.userId ? `
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">מזהה משתמש:</td>
            <td style="padding: 8px 0; color: #f3f4f6; font-size: 14px; font-family: monospace;">${escapeHtml(alert.userId)}</td>
          </tr>
          ` : ''}
          ${alert.userAgent ? `
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">User Agent:</td>
            <td style="padding: 8px 0; color: #f3f4f6; font-size: 12px; font-family: monospace; word-break: break-all;">${escapeHtml(alert.userAgent)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">זמן האירוע:</td>
            <td style="padding: 8px 0; color: #f3f4f6; font-size: 14px;">${alert.timestamp.toLocaleDateString('he-IL')} ${alert.timestamp.toLocaleTimeString('he-IL')}</td>
          </tr>
        </table>
      </div>

      <!-- Actions -->
      <div style="background-color: #1f2937; border-radius: 8px; padding: 20px;">
        <h3 style="color: #60a5fa; margin: 0 0 10px 0; font-size: 16px;">פעולות מומלצות</h3>
        <ul style="color: #d1d5db; margin: 0; padding-right: 20px; font-size: 14px;">
          ${alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? `
          <li>בדוק את הלוגים של השרת מיידית</li>
          <li>שקול חסימת כתובת ה-IP</li>
          <li>וודא שהמשתמש המעורב לגיטימי</li>
          ` : `
          <li>עקוב אחר פעילות נוספת מכתובת IP זו</li>
          <li>בדוק את הלוגים בזמנך הפנוי</li>
          `}
        </ul>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; margin-top: 20px; border-top: 1px solid #374151;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          התראה אוטומטית מ-STANNEL Security System
        </p>
        <p style="color: #4b5563; font-size: 11px; margin: 5px 0 0 0;">
          אם אתה מאמין שזו התראת שווא, ניתן להתעלם מהודעה זו.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return this.send({
      to: adminEmails,
      subject: `🚨 [${alert.severity}] התראת אבטחה - ${alertTypeLabels[alert.type] || alert.type}`,
      html,
    });
  },

  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    loginUrl: string
  ): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ברוכים הבאים ל-STANNEL</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #060f1f; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, rgba(26, 58, 107, 0.9) 0%, rgba(15, 35, 71, 0.95) 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4); border: 1px solid rgba(212, 175, 55, 0.3);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%); padding: 40px; text-align: center; border-bottom: 2px solid rgba(212, 175, 55, 0.4);">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #d4af37 0%, #f5d77e 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);">
        <span style="color: #1a3a6b; font-size: 40px; font-weight: bold;">S</span>
      </div>
      <h1 style="color: #d4af37; margin: 0; font-size: 32px; font-weight: bold;">ברוכים הבאים ל-STANNEL</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 15px 0 0 0; font-size: 16px;">פלטפורמת הנאמנות המובילה לאדריכלים וספקים</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px;">
      <!-- Welcome Message -->
      <div style="background: rgba(255,255,255,0.07); border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.15);">
        <h2 style="color: white; margin: 0 0 15px 0; font-size: 22px;">שלום ${escapeHtml(userName)}! 👋</h2>
        <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 16px; line-height: 1.6;">
          חשבונך אושר בהצלחה! כעת תוכל להתחבר למערכת וליהנות מכל היתרונות של פלטפורמת STANNEL.
        </p>
      </div>

      <!-- Features -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #d4af37; margin: 0 0 15px 0; font-size: 18px;">מה מחכה לך במערכת?</h3>
        <ul style="color: rgba(255,255,255,0.8); margin: 0; padding-right: 20px; font-size: 15px; line-height: 2;">
          <li>ניהול חשבוניות חכם ומהיר</li>
          <li>צבירת נקודות נאמנות על כל רכישה</li>
          <li>מימוש נקודות לפרסים בלעדיים</li>
          <li>מעקב אחר היסטוריית הפעילות שלך</li>
          <li>גישה לאירועים בלעדיים</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${escapeHtml(loginUrl)}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f5d77e 100%); color: #1a3a6b; padding: 16px 48px; border-radius: 12px; font-size: 18px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">
          התחברות למערכת
        </a>
      </div>

      <!-- Support -->
      <div style="background: rgba(212, 175, 55, 0.1); border-radius: 12px; padding: 20px; border: 1px solid rgba(212, 175, 55, 0.2);">
        <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px; text-align: center;">
          שאלות? צרו קשר עם צוות התמיכה שלנו<br/>
          <a href="mailto:support@stannel.app" style="color: #d4af37; text-decoration: none;">support@stannel.app</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: rgba(0,0,0,0.3); padding: 25px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
      <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0;">
        © 2026 STANNEL. כל הזכויות שמורות.
      </p>
      <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 10px 0 0 0;">
        הודעה זו נשלחה מ-noreply@stannel.app
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.send({
      to: userEmail,
      subject: '🎉 ברוכים הבאים ל-STANNEL - חשבונך אושר!',
      html,
    });
  },

  // Send error alert email to admin
  async sendErrorAlert(
    adminEmails: string[],
    error: {
      title: string;
      message: string;
      category: string;
      endpoint?: string;
      userId?: string;
      userEmail?: string;
      stackTrace?: string;
      details?: string;
      timestamp: Date;
    }
  ): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STANNEL - התראת שגיאה</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #1a1a2e; margin: 0; padding: 20px;">
  <div style="max-width: 700px; margin: 0 auto; background-color: #16213e; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 1px solid #ef4444;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 25px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🚨 התראת שגיאה במערכת</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
        ${error.timestamp.toLocaleDateString('he-IL')} ${error.timestamp.toLocaleTimeString('he-IL')}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 25px;">
      <!-- Error Title -->
      <div style="background-color: #fee2e2; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-right: 4px solid #ef4444;">
        <h2 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">${escapeHtml(error.title)}</h2>
        <p style="color: #7f1d1d; margin: 0; font-size: 14px;">${escapeHtml(error.message)}</p>
      </div>

      <!-- Details Grid -->
      <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #d4af37; margin: 0 0 15px 0; font-size: 16px;">פרטי השגיאה</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; width: 120px;">קטגוריה:</td>
            <td style="padding: 8px 0; color: #f3f4f6; font-size: 14px;">${escapeHtml(error.category)}</td>
          </tr>
          ${error.endpoint ? '<tr><td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">נקודת קצה:</td><td style="padding: 8px 0; color: #60a5fa; font-size: 14px; font-family: monospace;">' + escapeHtml(error.endpoint) + '</td></tr>' : ''}
          ${error.userEmail ? '<tr><td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">משתמש:</td><td style="padding: 8px 0; color: #f3f4f6; font-size: 14px;">' + escapeHtml(error.userEmail) + '</td></tr>' : ''}
        </table>
      </div>

      ${error.stackTrace ? `
      <!-- Stack Trace - For copying to Claude -->
      <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155;">
        <h3 style="color: #fbbf24; margin: 0 0 15px 0; font-size: 16px;">📋 העתק לקלוד לניתוח:</h3>
        <pre style="color: #e2e8f0; font-size: 12px; font-family: 'Courier New', monospace; white-space: pre-wrap; word-break: break-all; margin: 0; background-color: #020617; padding: 15px; border-radius: 6px; max-height: 300px; overflow: auto;">${escapeHtml(error.stackTrace)}</pre>
      </div>
      ` : ''}

      ${error.details ? `
      <!-- Full Details for Claude -->
      <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155;">
        <h3 style="color: #22c55e; margin: 0 0 15px 0; font-size: 16px;">📄 פרטים מלאים להעתקה:</h3>
        <pre style="color: #e2e8f0; font-size: 11px; font-family: 'Courier New', monospace; white-space: pre-wrap; word-break: break-all; margin: 0; background-color: #020617; padding: 15px; border-radius: 6px; max-height: 400px; overflow: auto;">${escapeHtml(error.details)}</pre>
      </div>
      ` : ''}

      <!-- Instructions -->
      <div style="background-color: #1e3a5f; border-radius: 8px; padding: 15px; text-align: center;">
        <p style="color: #93c5fd; margin: 0; font-size: 13px;">
          💡 העתק את הטקסט מהחלק העליון והדבק אותו לקלוד לקבלת פתרון מהיר
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center; border-top: 1px solid #374151;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        התראה אוטומטית מ-STANNEL System Logger
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.send({
      to: adminEmails,
      subject: `🚨 שגיאה ב-STANNEL: ${error.title}`,
      html,
    });
  },

  // Send daily system report
  async sendDailyReport(
    adminEmails: string[],
    report: {
      isHealthy: boolean;
      totalLogs24h: number;
      errorsCount: number;
      warningsCount: number;
      criticalCount: number;
      errorsByCategory: Record<string, number>;
      recentErrors: Array<{
        title: string;
        message: string;
        category: string;
        createdAt: Date;
      }>;
      systemStatus: {
        database: boolean;
        api: boolean;
        storage: boolean;
      };
      timestamp: Date;
    }
  ): Promise<boolean> {
    const statusIcon = report.isHealthy ? '✅' : '⚠️';
    const statusColor = report.isHealthy ? '#10b981' : '#ef4444';
    const statusText = report.isHealthy ? 'המערכת פועלת תקין' : 'נמצאו בעיות במערכת';

    const categoryErrorsHtml = Object.entries(report.errorsByCategory)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => `<div style="display: inline-block; background-color: #fee2e2; color: #dc2626; padding: 5px 12px; border-radius: 20px; margin: 3px; font-size: 12px;">${category}: ${count}</div>`)
      .join('') || '<span style="color: #10b981;">אין שגיאות 🎉</span>';

    const recentErrorsHtml = report.recentErrors.length > 0
      ? report.recentErrors.slice(0, 5).map(err => `
        <div style="background-color: #1f2937; border-radius: 6px; padding: 12px; margin-bottom: 8px; border-right: 3px solid #ef4444;">
          <div style="color: #f87171; font-size: 13px; font-weight: 600;">${escapeHtml(err.title)}</div>
          <div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">${escapeHtml(err.message.slice(0, 100))}</div>
          <div style="color: #6b7280; font-size: 11px; margin-top: 4px;">${err.category} • ${new Date(err.createdAt).toLocaleTimeString('he-IL')}</div>
        </div>
      `).join('')
      : '<p style="color: #10b981; text-align: center;">אין שגיאות ב-24 שעות האחרונות 🎉</p>';

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STANNEL - דו״ח יומי</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 650px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%); padding: 30px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 26px;">STANNEL</h1>
      <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">דו״ח יומי - ${report.timestamp.toLocaleDateString('he-IL')}</p>
    </div>

    <!-- Status Banner -->
    <div style="background-color: ${report.isHealthy ? '#dcfce7' : '#fee2e2'}; padding: 20px; text-align: center; border-bottom: 2px solid ${statusColor};">
      <h2 style="color: ${statusColor}; margin: 0; font-size: 22px;">${statusIcon} ${statusText}</h2>
    </div>

    <!-- Content -->
    <div style="padding: 25px;">
      <!-- Stats Grid -->
      <table style="width: 100%; margin-bottom: 25px;">
        <tr>
          <td style="padding: 8px; text-align: center; background-color: #f8fafc; border-radius: 10px;">
            <div style="color: #1a3a6b; font-size: 28px; font-weight: bold;">${report.totalLogs24h}</div>
            <div style="color: #64748b; font-size: 11px;">לוגים ב-24ש</div>
          </td>
          <td style="padding: 8px; text-align: center; background-color: ${report.errorsCount > 0 ? '#fee2e2' : '#dcfce7'}; border-radius: 10px;">
            <div style="color: ${report.errorsCount > 0 ? '#dc2626' : '#10b981'}; font-size: 28px; font-weight: bold;">${report.errorsCount}</div>
            <div style="color: #64748b; font-size: 11px;">שגיאות</div>
          </td>
          <td style="padding: 8px; text-align: center; background-color: ${report.warningsCount > 0 ? '#fef3c7' : '#dcfce7'}; border-radius: 10px;">
            <div style="color: ${report.warningsCount > 0 ? '#f59e0b' : '#10b981'}; font-size: 28px; font-weight: bold;">${report.warningsCount}</div>
            <div style="color: #64748b; font-size: 11px;">אזהרות</div>
          </td>
          <td style="padding: 8px; text-align: center; background-color: ${report.criticalCount > 0 ? '#fecaca' : '#dcfce7'}; border-radius: 10px;">
            <div style="color: ${report.criticalCount > 0 ? '#b91c1c' : '#10b981'}; font-size: 28px; font-weight: bold;">${report.criticalCount}</div>
            <div style="color: #64748b; font-size: 11px;">קריטי</div>
          </td>
        </tr>
      </table>

      <!-- System Components -->
      <div style="background-color: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
        <h3 style="color: #1a3a6b; margin: 0 0 15px 0; font-size: 16px;">סטטוס רכיבי מערכת</h3>
        <p style="margin: 0;">
          <span style="color: ${report.systemStatus.database ? '#10b981' : '#ef4444'};">${report.systemStatus.database ? '✅' : '❌'}</span> מסד נתונים &nbsp;&nbsp;
          <span style="color: ${report.systemStatus.api ? '#10b981' : '#ef4444'};">${report.systemStatus.api ? '✅' : '❌'}</span> API &nbsp;&nbsp;
          <span style="color: ${report.systemStatus.storage ? '#10b981' : '#ef4444'};">${report.systemStatus.storage ? '✅' : '❌'}</span> אחסון
        </p>
      </div>

      <!-- Errors by Category -->
      <div style="background-color: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
        <h3 style="color: #1a3a6b; margin: 0 0 15px 0; font-size: 16px;">שגיאות לפי קטגוריה</h3>
        <div>${categoryErrorsHtml}</div>
      </div>

      <!-- Recent Errors -->
      <div style="background-color: #0f172a; border-radius: 10px; padding: 20px;">
        <h3 style="color: #f87171; margin: 0 0 15px 0; font-size: 16px;">שגיאות אחרונות</h3>
        ${recentErrorsHtml}
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        דו״ח אוטומטי • ${report.timestamp.toLocaleTimeString('he-IL')} • STANNEL System Monitor
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0 0;">
        הדו״ח נשלח כל יום בשעה 10:00
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.send({
      to: adminEmails,
      subject: `${statusIcon} דו״ח יומי STANNEL - ${report.timestamp.toLocaleDateString('he-IL')} ${report.isHealthy ? '(תקין)' : '(נמצאו בעיות)'}`,
      html,
    });
  },

  // Send test email
  async sendTestEmail(to: string): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STANNEL - מייל בדיקה</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">✅ מייל בדיקה</h1>
    </div>
    <div style="padding: 30px; text-align: center;">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #d4af37 0%, #f5d77e 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">📧</span>
      </div>
      <h2 style="color: #1a3a6b; margin: 0 0 15px 0;">המייל הגיע בהצלחה!</h2>
      <p style="color: #64748b; margin: 0; font-size: 14px;">
        מערכת המיילים של STANNEL פועלת תקין.<br/>
        כעת תקבל התראות על שגיאות ודו״חות יומיים.
      </p>
      <div style="margin-top: 25px; padding: 15px; background-color: #f0fdf4; border-radius: 8px;">
        <p style="color: #10b981; margin: 0; font-size: 13px;">
          🕐 דו״ח יומי יישלח כל יום בשעה 10:00
        </p>
      </div>
    </div>
    <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
        נשלח ב-${new Date().toLocaleString('he-IL')} • STANNEL Platform
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.send({
      to,
      subject: '✅ STANNEL - מייל בדיקה הצליח!',
      html,
    });
  },
};

// Helper function to escape HTML and prevent XSS in email templates
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}
