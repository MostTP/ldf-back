import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../index.js';

describe('Withdrawal Approval TEST-005', () => {
  const financeToken = () =>
    jwt.sign(
      { sub: 'f1', email: 'f@x.com', role: 'FinanceManager' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

  it('Approve non-existent withdrawal returns 404', async () => {
    const res = await request(app)
      .post('/api/admin/payouts/00000000-0000-0000-0000-000000000000/approve')
      .set('Authorization', `Bearer ${financeToken()}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Withdrawal not found');
  });
});
