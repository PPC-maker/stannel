// STANNEL UI Utilities - Formatters

/**
 * Format currency in ILS (Israeli Shekel)
 */
export function formatCurrency(amount: number, showSymbol = true): string {
  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return showSymbol ? `₪${formatted}` : formatted;
}

/**
 * Format points display
 */
export function formatPoints(points: number): string {
  return `${new Intl.NumberFormat('he-IL').format(points)} נק׳`;
}

/**
 * Format date in Hebrew locale
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "לפני 3 שעות")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return formatDate(d);
}

/**
 * Format phone number (Israeli format)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 9) {
    return `0${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Format card number with masking
 */
export function formatCardNumber(cardNumber: string): string {
  const last4 = cardNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}
