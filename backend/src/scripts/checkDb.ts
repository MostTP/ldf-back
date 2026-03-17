/**
 * Check database connection and print basic stats. Run with `npm run db:check`
 */
import 'dotenv/config';
import { knexInstance } from '../config/db.js';

async function checkDb() {
  try {
    const r = await knexInstance.raw('SELECT 1 as ok');
    console.log('Database: connected', r.rows?.[0]?.ok === 1 ? '✓' : '');

    const tables = ['users', 'matrix_nodes', 'earnings_ledger', 'withdrawal_requests', 'coupons'];
    for (const table of tables) {
      const has = await knexInstance.schema.hasTable(table);
      if (!has) {
        console.log(`  ${table}: (table missing)`);
        continue;
      }
      const count = await knexInstance(table).count('* as c').first();
      const n = Number((count as { c: string })?.c ?? 0);
      console.log(`  ${table}: ${n} row(s)`);
    }

    const agents = await knexInstance('users')
      .where({ is_agent: true })
      .select('id', 'email', 'username', 'commission_rate', 'status');
    if (agents.length > 0) {
      console.log('\nAgents:');
      agents.forEach((a) =>
        console.log(`  ${(a as { email: string }).email} (${(a as { username: string }).username}) rate=${(a as { commission_rate: number }).commission_rate}%`)
      );
    }

    const admins = await knexInstance('users')
      .whereIn('role', ['SuperAdmin', 'FinanceManager', 'SupportAgent'])
      .select('email', 'username', 'role');
    if (admins.length > 0) {
      console.log('\nAdmin users:');
      admins.forEach((a) =>
        console.log(`  ${(a as { email: string }).email} (${(a as { role: string }).role})`)
      );
    }
  } catch (err) {
    console.error('Database check failed:', err);
    process.exit(1);
  } finally {
    await knexInstance.destroy();
  }
}

checkDb();
