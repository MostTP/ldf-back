import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../index.js';

describe('Scheduler Trigger TEST-003', () => {
  const superToken = () =>
    jwt.sign(
      { sub: 's1', email: 's@x.com', role: 'SuperAdmin' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

  it('SuperAdmin trigger returns 202', async () => {
    const res = await request(app)
      .post('/api/admin/scheduler/trigger')
      .set('Authorization', `Bearer ${superToken()}`)
      .send({ jobType: 'GLOBAL_POOL_DISTRIBUTION' });
    expect(res.status).toBe(202);
    expect(res.body.schedulerLogId).toBeDefined();
  });

  it('FinanceManager trigger returns 403', async () => {
    const token = jwt.sign(
      { sub: 'f1', email: 'f@x.com', role: 'FinanceManager' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .post('/api/admin/scheduler/trigger')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobType: 'GLOBAL_POOL_DISTRIBUTION' });
    expect(res.status).toBe(403);
  });

  it('Invalid jobType returns 400', async () => {
    const res = await request(app)
      .post('/api/admin/scheduler/trigger')
      .set('Authorization', `Bearer ${superToken()}`)
      .send({ jobType: 'INVALID' });
    expect(res.status).toBe(400);
  });
});
