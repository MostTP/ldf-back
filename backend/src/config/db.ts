import path from 'path';
import { fileURLToPath } from 'url';
import knex, { Knex } from 'knex';
import { env } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: Knex.Config = {
  client: 'pg',
  connection: env.DATABASE_URL,
  pool: { min: 1, max: 10 },
  migrations: {
    directory: path.join(__dirname, '../db/migrations'),
    extension: 'ts',
  },
};

export const knexInstance = knex(config);

export type Transaction = Knex.Transaction;
