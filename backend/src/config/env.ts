import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().url().optional().or(z.literal('')),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  FRONTEND_URL: z.string().url().optional().or(z.literal('')),
  MEMBER_FRONTEND_URL: z.string().url().optional().or(z.literal('')),
  ADMIN_HMAC_SECRET: z.string().optional().or(z.literal('')),
  ADMIN_IP_WHITELIST: z.string().optional().or(z.literal('')),
  // Optional: where redirected commissions go (Rule-of-2 gaps, subscription expired).
  ADMIN_WALLET_USER_ID: z.string().uuid().optional().or(z.literal('')),
  DISBURSEMENT_PROVIDER: z.enum(['auto', 'paystack', 'flutterwave']).optional().or(z.literal('')),
});

const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://localhost:5174'];

/** CORS allowed origins: always include localhost for dev, plus any from env. */
export function getAllowedOrigins(): string[] {
  const fromEnv = [env.FRONTEND_URL, env.MEMBER_FRONTEND_URL].filter(Boolean) as string[];
  const combined = [...DEFAULT_ORIGINS, ...fromEnv];
  return [...new Set(combined)];
}

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('[Config] Invalid environment:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}

export const env = loadEnv();
