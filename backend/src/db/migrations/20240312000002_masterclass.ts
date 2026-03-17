import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('masterclass_modules'))) {
    await knex.schema.createTable('masterclass_modules', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title').notNullable();
      table.text('description').nullable();
      table.string('video_url').nullable();
      table.integer('order_index').defaultTo(0);
      table.string('status', 50).defaultTo('active').checkIn(['active', 'inactive']);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('masterclass_progress'))) {
    await knex.schema.createTable('masterclass_progress', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable().references('id').inTable('users');
      table.uuid('module_id').notNullable().references('id').inTable('masterclass_modules');
      table.integer('completion_pct').defaultTo(0);
      table.timestamp('last_activity').defaultTo(knex.fn.now());
      table.timestamp('completed_at').nullable();
      table.unique(['user_id', 'module_id']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('masterclass_progress');
  await knex.schema.dropTableIfExists('masterclass_modules');
}
