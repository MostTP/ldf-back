import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../index.js';

describe('Ledger Adjustment TEST-002', () => {
  it('Missing reason returns 400', async () => {
    const token = jwt.sign(
      { sub: 'a', email: 's@x.com', role: 'SuperAdmin' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .post('/api/admin/users/some-uuid/ledger-adjustment')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'credit', amount: 100 });
    expect(res.status).toBe(400);
  });

  it('No token returns 401', async () => {
    const res = await request(app)
      .post('/api/admin/users/some-uuid/ledger-adjustment')
      .send({ type: 'credit', amount: 100, reason: 'A reason with twenty chars here' });
    expect(res.status).toBe(401);
  });
});
