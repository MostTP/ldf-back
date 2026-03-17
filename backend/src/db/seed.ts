
import 'dotenv/config';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { knexInstance } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ADMIN_EMAIL = 'admin@ldf.local';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'AdminPass123';

const AGENT_EMAIL = 'agent@ldf.local';
const AGENT_USERNAME = 'ldfagent';
const AGENT_PASSWORD = 'AgentPass123';
const AGENT_COMMISSION_RATE = 5;

async function seed() {
  const hasUsers = await knexInstance.schema.hasTable('users');
  if (!hasUsers) {
    console.log('"users" table not found. Running migrations...');
    const backendRoot = path.resolve(__dirname, '../..');
    execSync('npm run migrate', { cwd: backendRoot, stdio: 'inherit' });
    console.log('Migrations completed. Seeding...');
  }

  const passwordHash = (p: string) => bcrypt.hash(p, 12);

  const adminHash = await passwordHash(ADMIN_PASSWORD);
  const agentHash = await passwordHash(AGENT_PASSWORD);

  const existingAdmin = await knexInstance('users').where({ email: ADMIN_EMAIL }).first('id');
  if (existingAdmin) {
    console.log('Admin already exists, skipping.');
  } else {
    const [admin] = await knexInstance('users')
      .insert({
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        password_hash: adminHash,
        role: 'SuperAdmin',
        is_agent: false,
        commission_rate: 0,
        status: 'active',
      })
      .returning('id');
    console.log('Created SuperAdmin:', ADMIN_EMAIL, (admin as { id: string })?.id);
  }

  const existingAgent = await knexInstance('users').where({ email: AGENT_EMAIL }).first('id');
  if (existingAgent) {
    console.log('Agent already exists, skipping.');
  } else {
    const agentRow: Record<string, unknown> = {
      email: AGENT_EMAIL,
      username: AGENT_USERNAME,
      password_hash: agentHash,
      role: 'Member',
      is_agent: true,
      commission_rate: AGENT_COMMISSION_RATE,
      status: 'active',
    };
    const hasFullName = await knexInstance.schema.hasColumn('users', 'full_name');
    if (hasFullName) agentRow.full_name = 'LDF Agent';

    const [agent] = await knexInstance('users').insert(agentRow).returning('id');
    const agentId = (agent as { id: string })?.id;
    if (agentId) {
      if (await knexInstance.schema.hasTable('available_balance')) {
        await knexInstance('available_balance').insert({ user_id: agentId, balance: 0 });
      }
      if (await knexInstance.schema.hasTable('member_profiles')) {
        await knexInstance('member_profiles').insert({ user_id: agentId });
      }
      console.log('Created Agent:', AGENT_EMAIL, agentId);
    }
  }

  const agentForCredits = await knexInstance('users').where({ email: AGENT_EMAIL }).first('id');
  const agentIdForCredits = agentForCredits ? (agentForCredits as { id: string }).id : null;
  if (agentIdForCredits && (await knexInstance.schema.hasColumn('users', 'agent_coupon_credits'))) {
    const SEED_CREDITS = 10;
    await knexInstance('users')
      .where({ id: agentIdForCredits })
      .update({ agent_coupon_credits: SEED_CREDITS });
    const row = await knexInstance('users').where({ id: agentIdForCredits }).first('agent_coupon_credits');
    const total = Number((row as { agent_coupon_credits?: number })?.agent_coupon_credits ?? 0);
    console.log('Set coupon credit balance for agent', AGENT_EMAIL, 'to', total);
  }

  const count = await knexInstance('users').count('* as c').first();
  console.log('\nSeeded users (total in DB:', (count as { c: string })?.c ?? 0, '):');
  console.log('  Admin panel:', ADMIN_EMAIL, '/', ADMIN_PASSWORD);
  console.log('  Member agent:', AGENT_EMAIL, '/', AGENT_PASSWORD);
}

seed()
  .then(() => knexInstance.destroy())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    knexInstance.destroy().finally(() => process.exit(1));
  });
