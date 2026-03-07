// Email Service - STANNEL Platform
// Uses SendGrid for email delivery

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

const getConfig = (): SendGridConfig => ({
  apiKey: process.env.SENDGRID_API_KEY || '',
  fromEmail: process.env.EMAIL_FROM || 'noreply@stannel.app',
  fromName: process.env.EMAIL_FROM_NAME || 'STANNEL Platform',
});

export const emailService = {
  async send(options: EmailOptions): Promise<boolean> {
    const config = getConfig();

    if (!config.apiKey) {
      console.warn('[Email] SendGrid API key not configured. Email not sent.');
      console.log('[Email] Would send:', {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: Array.isArray(options.to)
                ? options.to.map(email => ({ email }))
                : [{ email: options.to }],
            },
          ],
          from: {
            email: config.fromEmail,
            name: config.fromName,
          },
          subject: options.subject,
          content: [
            { type: 'text/plain', value: options.text || options.html.replace(/<[^>]*>/g, '') },
            { type: 'text/html', value: options.html },
          ],
        }),
      });

      if (response.ok || response.status === 202) {
        console.log('[Email] Sent successfully to:', options.to);
        return true;
      } else {
        const error = await response.text();
        console.error('[Email] SendGrid error:', error);
        return false;
      }
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
