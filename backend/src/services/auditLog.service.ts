import type { Knex } from 'knex';

export interface AuditLogPayload {
  adminId: string;
  actionType: string;
  targetEntity: string;
  targetId?: string;
  payloadSnapshot?: Record<string, unknown>;
  ipAddress?: string;
}

export async function writeAuditLog(
  payload: AuditLogPayload,
  trx: Knex.Transaction
): Promise<void> {
  try {
    await trx('audit_logs').insert({
      admin_id: payload.adminId,
      action_type: payload.actionType,
      target_entity: payload.targetEntity,
      target_id: payload.targetId ?? null,
      payload_snapshot: payload.payloadSnapshot ?? {},
      ip_address: payload.ipAddress ?? null,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err);
    throw err; // Re-throw so the main transaction rolls back (per AGENTS.md: "If the audit log write fails, the whole transaction rolls back")
  }
}
