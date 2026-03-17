import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).unique().notNullable();
    table.string('username', 100).unique().notNullable();
    table.text('password_hash').notNullable();
    table
      .string('role')
      .notNullable()
      .checkIn(['SuperAdmin', 'FinanceManager', 'SupportAgent', 'Member']);
    table.boolean('is_agent').defaultTo(false);
    table.decimal('commission_rate', 5, 2).defaultTo(0);
    table
      .string('status', 50)
      .defaultTo('active')
      .checkIn(['active', 'suspended']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_login').nullable();
  });
  await knex.raw('CREATE INDEX idx_users_email ON users (email)');
  await knex.raw('CREATE INDEX idx_users_username ON users (username)');
  await knex.raw('CREATE INDEX idx_users_role ON users (role)');
  await knex.raw('CREATE INDEX idx_users_status ON users (status)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
