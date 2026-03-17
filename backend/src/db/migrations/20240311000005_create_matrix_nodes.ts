import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('matrix_nodes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('sponsor_id').notNullable().references('id').inTable('users');
    table.uuid('parent_id').notNullable().references('id').inTable('users');
    table.integer('position').notNullable().checkIn([1, 2, 3, 4, 5]);
    table.integer('level').notNullable().checkIn([1, 2, 3, 4, 5]);
    table
      .string('placement_type')
      .notNullable()
      .checkIn(['DIRECT', 'SPILLOVER', 'SPILLUNDER']);
    table.string('status', 50).defaultTo('active').checkIn(['active', 'frozen']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['parent_id', 'position']);
  });
  await knex.raw('CREATE INDEX idx_matrix_nodes_user_id ON matrix_nodes (user_id)');
  await knex.raw('CREATE INDEX idx_matrix_nodes_sponsor_id ON matrix_nodes (sponsor_id)');
  await knex.raw('CREATE INDEX idx_matrix_nodes_parent_id ON matrix_nodes (parent_id)');
  await knex.raw('CREATE INDEX idx_matrix_nodes_level ON matrix_nodes (level)');

  await knex.raw(`
    CREATE RULE no_cascade_matrix AS
    ON DELETE TO users
    DO ALSO
    UPDATE matrix_nodes SET status = 'frozen' WHERE user_id = OLD.id
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP RULE IF EXISTS no_cascade_matrix ON users');
  await knex.schema.dropTableIfExists('matrix_nodes');
}
