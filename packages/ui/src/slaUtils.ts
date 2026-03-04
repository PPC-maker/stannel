// STANNEL UI Utilities - SLA Helpers

import type { InvoiceStatus } from '@stannel/types';

/**
 * Calculate time remaining until SLA deadline
 */
export function getSlaTimeRemaining(deadline: Date | string): {
  hours: number;
  minutes: number;
  isOverdue: boolean;
  urgencyLevel: 'normal' | 'warning' | 'critical' | 'overdue';
} {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      hours: 0,
      minutes: 0,
      isOverdue: true,
      urgencyLevel: 'overdue',
    };
  }

  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);

  let urgencyLevel: 'normal' | 'warning' | 'critical' | 'overdue' = 'normal';
  if (hours < 6) urgencyLevel = 'critical';
  else if (hours < 24) urgencyLevel = 'warning';

  return {
    hours,
    minutes,
    isOverdue: false,
    urgencyLevel,
  };
}

/**
 * Format SLA time remaining as Hebrew string
 */
export function formatSlaRemaining(deadline: Date | string): string {
  const { hours, minutes, isOverdue, urgencyLevel } = getSlaTimeRemaining(deadline);

  if (isOverdue) return 'איחור!';

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} ימים`;
  }

  if (hours > 0) {
    return `${hours} שעות`;
  }

  return `${minutes} דקות`;
}

/**
 * Get SLA urgency color based on remaining time
 */
export function getSlaColor(deadline: Date | string): string {
  const { urgencyLevel } = getSlaTimeRemaining(deadline);

  switch (urgencyLevel) {
    case 'overdue':
      return '#dc2626'; // Red
    case 'critical':
      return '#ef4444'; // Light red
    case 'warning':
      return '#f59e0b'; // Orange
    default:
      return '#10b981'; // Green
  }
}

/**
 * Get status display info
 */
export function getStatusInfo(status: InvoiceStatus): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
} {
  const statusMap: Record<InvoiceStatus, { label: string; color: string; bgColor: string; icon: string }> = {
    PENDING_ADMIN: {
      label: 'ממתין לאישור',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.2)',
      icon: '⏳',
    },
    CLARIFICATION_NEEDED: {
      label: 'נדרש הבהרה',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.2)',
      icon: '❓',
    },
    APPROVED: {
      label: 'אושר',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.2)',
      icon: '✅',
    },
    REJECTED: {
      label: 'נדחה',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.2)',
      icon: '❌',
    },
    PENDING_SUPPLIER_PAY: {
      label: 'ממתין לתשלום ספק',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.2)',
      icon: '💳',
    },
    PAID: {
      label: 'שולם',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.2)',
      icon: '✓',
    },
    OVERDUE: {
      label: 'באיחור',
      color: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.2)',
      icon: '⚠️',
    },
  };

  return statusMap[status] || statusMap.PENDING_ADMIN;
}

/**
 * Get rank display info
 */
export function getRankInfo(rank: string): {
  label: string;
  color: string;
  icon: string;
  nextRank?: string;
} {
  const rankMap: Record<string, { label: string; color: string; icon: string; nextRank?: string }> = {
    BRONZE: {
      label: 'ארד',
      color: '#cd7f32',
      icon: '🥉',
      nextRank: 'SILVER',
    },
    SILVER: {
      label: 'כסף',
      color: '#c0c0c0',
      icon: '🥈',
      nextRank: 'GOLD',
    },
    GOLD: {
      label: 'זהב',
      color: '#d4af37',
      icon: '🥇',
      nextRank: 'PLATINUM',
    },
    PLATINUM: {
      label: 'פלטינום',
      color: '#e5e4e2',
      icon: '💎',
    },
  };

  return rankMap[rank] || rankMap.BRONZE;
}
