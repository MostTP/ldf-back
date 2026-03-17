import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasFullName = await knex.schema.hasColumn('users', 'full_name');
  if (!hasFullName) {
    await knex.schema.alterTable('users', (t) => {
      t.string('full_name', 255).nullable();
      t.string('phone', 20).nullable();
      t.uuid('referred_by').nullable().references('id').inTable('users');
    });
  }
  await knex.raw(
    `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check`
  );
  await knex.raw(
    `ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('pending','active','suspended'))`
  );

  if (!(await knex.schema.hasTable('member_profiles'))) {
    await knex.schema.createTable('member_profiles', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').unique().notNullable().references('id').inTable('users');
      table.string('bank_name').nullable();
      table.string('bank_code').nullable();
      table.string('account_number').nullable();
      table.string('account_name').nullable();
      table.string('currency', 10).defaultTo('NGN').checkIn(['NGN', 'GHS', 'KES', 'ZAR']);
      table.string('kyc_doc_url').nullable();
      table.string('kyc_doc_hash').nullable();
      table.string('kyc_status', 50).defaultTo('pending').checkIn(['pending', 'verified', 'rejected']);
      table.string('country').nullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('activation_payments'))) {
    await knex.schema.createTable('activation_payments', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable().references('id').inTable('users');
      table.decimal('amount', 12, 2).defaultTo(3000);
      table.string('currency', 10).defaultTo('NGN');
      table.string('gateway', 50).checkIn(['paystack', 'flutterwave']);
      table.string('gateway_ref').unique();
      table.string('status', 50).defaultTo('pending').checkIn(['pending', 'completed', 'failed']);
      table.uuid('coupon_used').nullable().references('id').inTable('coupons');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('completed_at').nullable();
    });
  }

  if (!(await knex.schema.hasTable('available_balance'))) {
    await knex.schema.createTable('available_balance', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').unique().notNullable().references('id').inTable('users');
      table.decimal('balance', 12, 2).defaultTo(0);
      table.timestamp('last_updated').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('global_pool_memberships'))) {
    await knex.schema.createTable('global_pool_memberships', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable().references('id').inTable('users');
      table.timestamp('enrolled_at').defaultTo(knex.fn.now());
      table.timestamp('last_paid_at').nullable();
      table.decimal('total_received', 12, 2).defaultTo(0);
    });
  }

  const hasTitle = await knex.schema.hasColumn('notifications', 'title');
  if (!hasTitle) {
    await knex.schema.alterTable('notifications', (t) => {
      t.string('title').nullable();
      t.text('body').nullable();
      t.boolean('is_read').defaultTo(false);
      t.jsonb('metadata').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('global_pool_memberships');
  await knex.schema.dropTableIfExists('available_balance');
  await knex.schema.dropTableIfExists('activation_payments');
  await knex.schema.dropTableIfExists('member_profiles');
  await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check`);
  await knex.raw(`ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active','suspended'))`);
  if (await knex.schema.hasColumn('notifications', 'title')) {
    await knex.schema.alterTable('notifications', (t) => {
      t.dropColumn('title');
      t.dropColumn('body');
      t.dropColumn('is_read');
      t.dropColumn('metadata');
    });
  }
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('full_name');
    t.dropColumn('phone');
    t.dropColumn('referred_by');
  });
}
