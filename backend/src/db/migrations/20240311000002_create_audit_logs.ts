import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('admin_id').notNullable().references('id').inTable('users');
    table.string('action_type').notNullable();
    table.string('target_entity').notNullable();
    table.uuid('target_id').nullable();
    table.jsonb('payload_snapshot').nullable();
    table.string('ip_address').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
  await knex.raw('CREATE INDEX idx_audit_logs_admin_id ON audit_logs (admin_id)');
  await knex.raw('CREATE INDEX idx_audit_logs_action_type ON audit_logs (action_type)');
  await knex.raw('CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at)');

  // Append-only: no UPDATE, no DELETE (AUDIT-001)
  await knex.raw(
    'CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING'
  );
  await knex.raw(
    'CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP RULE IF EXISTS no_update_audit ON audit_logs');
  await knex.raw('DROP RULE IF EXISTS no_delete_audit ON audit_logs');
  await knex.schema.dropTableIfExists('audit_logs');
}
