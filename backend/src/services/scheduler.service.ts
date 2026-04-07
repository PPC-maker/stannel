// Scheduler Service - STANNEL Platform
// Handles scheduled tasks like weekly reports and daily system reports

import { healthReportService } from './health-report.service.js';
import { dailyReportService } from './daily-report.service.js';
import { backupService } from './backup.service.js';
import { financialSecurityService } from './financial-security.service.js';

interface ScheduledTask {
  name: string;
  cronExpression: string;
  lastRun: Date | null;
  nextRun: Date;
  enabled: boolean;
  handler: () => Promise<void>;
}

const tasks: Map<string, ScheduledTask> = new Map();

// Calculate next run time based on cron-like schedule
function getNextSunday9AM(): Date {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(9, 0, 0, 0);
  if (nextSunday <= now) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  }
  return nextSunday;
}

// Calculate next 10:00 AM (daily)
function getNext10AM(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(10, 0, 0, 0);

  // If it's already past 10:00 AM today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

// Calculate next 1:00 AM (daily backup)
function getNext1AM(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(1, 0, 0, 0);

  // If it's already past 1:00 AM today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

// Calculate next 2:00 AM (financial integrity check)
function getNext2AM(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(2, 0, 0, 0);

  // If it's already past 2:00 AM today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function getNextRunTime(name: string): Date {
  switch (name) {
    case 'weekly-health-report':
      return getNextSunday9AM();
    case 'daily-system-report':
      return getNext10AM();
    case 'daily-backup':
      return getNext1AM();
    case 'financial-integrity-check':
      return getNext2AM();
    default:
      // Default to next hour
      const next = new Date();
      next.setHours(next.getHours() + 1, 0, 0, 0);
      return next;
  }
}

export const schedulerService = {
  init(): void {
    // Register scheduled tasks
    this.registerTask({
      name: 'weekly-health-report',
      cronExpression: '0 9 * * 0', // Every Sunday at 9:00 AM
      lastRun: null,
      nextRun: getNextRunTime('weekly-health-report'),
      enabled: true,
      handler: async () => {
        console.log('[Scheduler] Running weekly health report...');
        await healthReportService.sendWeeklyReport();
      },
    });

    // Daily system report at 10:00 AM
    this.registerTask({
      name: 'daily-system-report',
      cronExpression: '0 10 * * *', // Every day at 10:00 AM
      lastRun: null,
      nextRun: getNextRunTime('daily-system-report'),
      enabled: true,
      handler: async () => {
        console.log('[Scheduler] Running daily system report...');
        await dailyReportService.sendDailyReport();
      },
    });

    // Daily backup at 1:00 AM
    this.registerTask({
      name: 'daily-backup',
      cronExpression: '0 1 * * *', // Every day at 1:00 AM
      lastRun: null,
      nextRun: getNextRunTime('daily-backup'),
      enabled: true,
      handler: async () => {
        console.log('[Scheduler] Running daily backup...');
        await backupService.performBackup();
      },
    });

    // Financial integrity check at 2:00 AM
    this.registerTask({
      name: 'financial-integrity-check',
      cronExpression: '0 2 * * *', // Every day at 2:00 AM
      lastRun: null,
      nextRun: getNextRunTime('financial-integrity-check'),
      enabled: true,
      handler: async () => {
        console.log('[Scheduler] Running financial integrity check...');
        await financialSecurityService.runIntegrityCheck();
      },
    });

    // Start the scheduler loop
    this.startLoop();

    console.log('[Scheduler] Initialized with', tasks.size, 'tasks');
  },

  registerTask(task: ScheduledTask): void {
    tasks.set(task.name, task);
    console.log(`[Scheduler] Registered task: ${task.name}, next run: ${task.nextRun.toISOString()}`);
  },

  async runTask(name: string): Promise<boolean> {
    const task = tasks.get(name);
    if (!task) {
      console.error(`[Scheduler] Task not found: ${name}`);
      return false;
    }

    try {
      console.log(`[Scheduler] Running task: ${name}`);
      await task.handler();
      task.lastRun = new Date();
      task.nextRun = getNextRunTime(name);
      console.log(`[Scheduler] Task completed: ${name}, next run: ${task.nextRun.toISOString()}`);
      return true;
    } catch (error) {
      console.error(`[Scheduler] Task failed: ${name}`, error);
      return false;
    }
  },

  startLoop(): void {
    // Check every minute if any task needs to run
    setInterval(() => {
      const now = new Date();

      for (const [name, task] of tasks) {
        if (task.enabled && task.nextRun <= now) {
          this.runTask(name);
        }
      }
    }, 60 * 1000); // Check every minute
  },

  getTasks(): Array<{
    name: string;
    enabled: boolean;
    lastRun: Date | null;
    nextRun: Date;
  }> {
    return Array.from(tasks.values()).map(task => ({
      name: task.name,
      enabled: task.enabled,
      lastRun: task.lastRun,
      nextRun: task.nextRun,
    }));
  },

  enableTask(name: string): boolean {
    const task = tasks.get(name);
    if (task) {
      task.enabled = true;
      return true;
    }
    return false;
  },

  disableTask(name: string): boolean {
    const task = tasks.get(name);
    if (task) {
      task.enabled = false;
      return true;
    }
    return false;
  },

  // Force run a task immediately (for testing or manual triggers)
  async forceRun(name: string): Promise<boolean> {
    return this.runTask(name);
  },
};
