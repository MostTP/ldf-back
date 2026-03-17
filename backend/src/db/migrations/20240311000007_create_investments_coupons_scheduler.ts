import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('investments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.decimal('amount', 12, 2).notNullable();
    table.date('lock_end_date').notNullable();
    table.decimal('total_roi_paid', 12, 2).defaultTo(0);
    table.string('status', 50).defaultTo('active').checkIn(['active', 'completed', 'locked']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('coupons', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code').unique().notNullable();
    table.uuid('agent_id').notNullable().references('id').inTable('users');
    table.uuid('used_by').nullable().references('id').inTable('users');
    table.timestamp('used_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('scheduler_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('job_type').notNullable().checkIn(['GLOBAL_POOL_DISTRIBUTION', 'PREMIUM_ROI_DISTRIBUTION']);
    table.string('triggered_by').notNullable().checkIn(['cron', 'manual']);
    table.uuid('admin_id').nullable().references('id').inTable('users');
    table.string('status').notNullable().checkIn(['running', 'success', 'failed']);
    table.decimal('total_distributed', 12, 2).nullable();
    table.integer('member_count').nullable();
    table.text('error_message').nullable();
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
  });

  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('type').notNullable();
    table.text('message').nullable();
    table.jsonb('payload').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('scheduler_logs');
  await knex.schema.dropTableIfExists('coupons');
  await knex.schema.dropTableIfExists('investments');
}
