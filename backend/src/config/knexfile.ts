import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import type { Knex } from 'knex';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from backend root (knex CLI may run with cwd = src/config)
dotenv.config({ path: path.resolve(__dirname, '../..', '.env') });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 1, max: 10 },
    migrations: {
      directory: path.join(__dirname, '../db/migrations'),
      extension: 'ts',
    },
  },
  test: {
    client: 'pg',
    connection: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL,
    pool: { min: 1, max: 5 },
    migrations: {
      directory: path.join(__dirname, '../db/migrations'),
      extension: 'ts',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: path.join(__dirname, '../db/migrations'),
      extension: 'ts',
    },
  },
};

export default config;
