# LDF Admin Backend

Node.js + Express + TypeScript API for the LDF Admin Panel. See project root `AGENTS.md` for full ticket list and specs.

## Database schema (Ticket 1.1)

- **users**: `id`, `email`, `username`, `password_hash`, `role`, `status`, `full_name`, `phone`, `referred_by`, `activation_coupon`, `package_type` (Silver/Gold), `is_matrix_qualified`, `direct_referral_count`, `is_agent`, `commission_rate`, `created_at`, `last_login`.
- **wallets** (1:1 with users): `user_id` (PK), `main_earnings`, `affiliate_income`, `matrix_income`, `global_pool`, `lost_earnings`, `detty_december`, `game_points`, `updated_at`.
- **matrix_nodes** (adjacency list / matrix tree): `user_id`, `sponsor_id`, `parent_id`, `position`, `level`, `placement_type`, `status`.
- **earnings_ledger** (transactions): every movement of funds; `user_id`, `type` (AFFILIATE, MATRIX, GLOBAL_POOL, ROI, ADJUSTMENT), `amount`, `source_user_id`, `level`, `description`, `created_at`.
- Other tables: `audit_logs`, `withdrawal_requests`, `coupons`, `activation_payments`, `available_balance`, `global_pool_memberships`, `notifications`, etc. Run `npm run migrate` to deploy.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, and optionally `REDIS_URL`.
2. `npm install`
3. `npm run migrate` (requires PostgreSQL running and `DATABASE_URL` set)
4. `npm run dev` to start with hot reload

Optional (Ticket 1.2 – Admin security): set `ADMIN_HMAC_SECRET` to require `X-Admin-Signature` (HMAC-SHA256 of request body) on admin routes; set `ADMIN_IP_WHITELIST` to a comma-separated list of IPs allowed to hit `/api/admin/*`.

## Scripts

- `npm run dev` — run with tsx watch
- `npm run build` — compile TypeScript
- `npm run start` — run compiled `dist/index.js`
- `npm run migrate` — run Knex migrations
- `npm run test` — run Jest tests

## API base

- `POST /api/admin/auth/login` — login (email, password)
- `POST /api/admin/auth/refresh` — refresh token
- `POST /api/admin/auth/logout` — logout (Bearer + body refreshToken)
- `GET /api/admin/dashboard/summary` — dashboard summary (auth required)
- `GET /api/admin/users` — user search (auth required)
- `GET /api/admin/users/:id` — user detail (auth required)
- `GET /api/admin/users/:id/ledger` — earning ledger (auth required)
- `POST /api/admin/users/:id/ledger-adjustment` — manual adjustment (SuperAdmin only)
