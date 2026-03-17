import { Redis } from 'ioredis';
import { env } from './env.js';

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
    client.on('error', (err: unknown) => console.error('[Redis]', err));
  }
  return client;
}

const DENY_LIST_PREFIX = 'jwt:deny:';

export async function isTokenDenied(jti: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const key = `${DENY_LIST_PREFIX}${jti}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

export async function denyToken(jti: string, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const key = `${DENY_LIST_PREFIX}${jti}`;
  await redis.setex(key, ttlSeconds, '1');
}

const PWD_RESET_PREFIX = 'pwd-reset:';

export async function setPasswordResetToken(userId: string, tokenHash: string, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.setex(`${PWD_RESET_PREFIX}${userId}`, ttlSeconds, tokenHash);
}

export async function getPasswordResetToken(userId: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  return redis.get(`${PWD_RESET_PREFIX}${userId}`);
}

export async function deletePasswordResetToken(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`${PWD_RESET_PREFIX}${userId}`);
}
