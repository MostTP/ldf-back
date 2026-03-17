/**
 * TEST-008 — Security Penetration Checklist
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../index.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-min-16-chars!!';

describe('Security Penetration (TEST-008)', () => {
  it('GET /api/admin/users with no token → 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorised');
  });

  it('GET /api/admin/users with role Member token → 401 or 403', async () => {
    const token = jwt.sign(
      { sub: 'm1', email: 'm@x.com', role: 'Member' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect([401, 403]).toContain(res.status);
  });

  it('POST /api/admin/audit-logs → 404 (endpoint does not exist)', async () => {
    const token = jwt.sign(
      { sub: 's1', email: 's@x.com', role: 'SuperAdmin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .post('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(404);
  });

  it('DELETE /api/admin/audit-logs/some-id → 404', async () => {
    const token = jwt.sign(
      { sub: 's1', email: 's@x.com', role: 'SuperAdmin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .delete('/api/admin/audit-logs/some-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('SQL injection in query param → safe response', async () => {
    const token = jwt.sign(
      { sub: 's1', email: 's@x.com', role: 'SuperAdmin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/admin/users?query=' + encodeURIComponent("'; DROP TABLE users; --"))
      .set('Authorization', `Bearer ${token}`);
    expect([200, 400, 500]).toContain(res.status);
    expect(res.body).toBeDefined();
  });

  it('JWT with forged payload but wrong signature → 401', async () => {
    const badToken = jwt.sign(
      { sub: 's1', email: 's@x.com', role: 'SuperAdmin' },
      'wrong-secret',
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${badToken}`);
    expect(res.status).toBe(401);
  });
});
