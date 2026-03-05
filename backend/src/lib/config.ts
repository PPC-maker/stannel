// Environment Configuration & Validation

import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.string().default('7070'),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis (optional in development)
  REDIS_URL: z.string().optional(),

  // Google Cloud
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GCS_INVOICE_BUCKET: z.string().default('stannel-invoices'),
  GCS_ASSETS_BUCKET: z.string().default('stannel-assets'),
  VERTEX_LOCATION: z.string().default('me-west1'),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().default('development-secret-change-in-production'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig;

export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    result.error.errors.forEach((err) => {
      console.error(`   - ${err.path.join('.')}: ${err.message}`);
    });

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  Running in development mode with incomplete config');
    }
  }

  config = result.data || (process.env as unknown as EnvConfig);
  return config;
}

export function getConfig(): EnvConfig {
  if (!config) {
    return validateEnv();
  }
  return config;
}

export default getConfig;
