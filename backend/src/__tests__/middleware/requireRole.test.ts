import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateJWT } from '../../middleware/authenticateJWT.js';
import { requireRole } from '../../middleware/requireRole.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-min-16-chars!!';

function makeApp() {
  const app = express();
  app.use(express.json());
  const handler = (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true });
  app.get('/super-only', authenticateJWT, requireRole('SuperAdmin'), handler);
  app.get('/finance', authenticateJWT, requireRole('SuperAdmin', 'FinanceManager'), handler);
  return app;
}

describe('RBAC Middleware (TEST-001)', () => {
  const superApp = makeApp();

  it('Valid SuperAdmin token → 200 on SuperAdmin-only route', async () => {
    const token = jwt.sign(
      { sub: 'admin-1', email: 's@x.com', role: 'SuperAdmin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(superApp)
      .get('/super-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('Valid FinanceManager token on SuperAdmin-only route → 403', async () => {
    const token = jwt.sign(
      { sub: 'admin-2', email: 'f@x.com', role: 'FinanceManager' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(superApp)
      .get('/super-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('Valid SupportAgent token on FinanceManager route → 403', async () => {
    const app = makeApp();
    const token = jwt.sign(
      { sub: 'admin-3', email: 'a@x.com', role: 'SupportAgent' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/finance')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('Expired token → 401', async () => {
    const token = jwt.sign(
      { sub: 'admin-1', email: 's@x.com', role: 'SuperAdmin' },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );
    const res = await request(superApp)
      .get('/super-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorised');
  });

  it('Missing Authorization header → 401', async () => {
    const res = await request(superApp).get('/super-only');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorised');
  });

  it('Tampered JWT signature → 401', async () => {
    const token = jwt.sign(
      { sub: 'admin-1', email: 's@x.com', role: 'SuperAdmin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const tampered = token.slice(0, -2) + 'xx';
    const res = await request(superApp)
      .get('/super-only')
      .set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorised');
  });
});
