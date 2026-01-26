# Environment Variables Template

Copy these variables to your `.env` file in the `ldf/` directory.

## Required Variables

```bash
# Database (Neon PostgreSQL)
# Use pooled connection for application: ?pgbouncer=true
# Use direct connection for migrations: remove ?pgbouncer=true
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true"

# Application
NODE_ENV=development
PORT=4000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Optional Variables

```bash
# Frontend
FRONTEND_URL=https://your-frontend-domain.com

# Payment Gateway - Flutterwave
FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key
FLUTTERWAVE_SECRET_HASH=your-flutterwave-secret-hash

# Payment Gateway - Seerbit
SEERBIT_PUBLIC_KEY=your-seerbit-public-key
SEERBIT_SECRET_KEY=your-seerbit-secret-key
SEERBIT_WEBHOOK_SECRET=your-seerbit-webhook-secret
```

## Getting Your Neon Connection String

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to "Connection Details"
4. Copy the connection string
5. For application: use the one with `?pgbouncer=true`
6. For migrations: use the one without `?pgbouncer=true`

See [NEON_SETUP.md](../NEON_SETUP.md) for detailed setup instructions.


