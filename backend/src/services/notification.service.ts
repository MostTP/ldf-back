import type { Knex } from 'knex';

export async function insertNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  metadata: Record<string, unknown>,
  trx: Knex.Transaction
): Promise<void> {
  await trx('notifications').insert({
    user_id: userId,
    type,
    title: title ?? null,
    body: body ?? null,
    message: body ?? null,
    payload: metadata ?? {},
  });
}
