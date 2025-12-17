# Database Seeding Guide

This guide explains how to seed the LDF database with sample data for development and testing.

## Prerequisites

1. **Database Setup**: Ensure your PostgreSQL database is running and accessible
2. **Environment Variables**: Make sure your `.env` file has the correct `DATABASE_URL`
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/ldf_db?schema=public"
   ```
3. **Prisma Client**: Ensure Prisma Client is generated
   ```bash
   npm run prisma:generate
   ```

## Running the Seed Script

To seed the database with sample data, run:

```bash
npm run seed
```

Or directly:

```bash
node prisma/seed.js
```

## What Gets Seeded

The seed script creates:

### Users (7 total)
- **2 Agents**:
  - `agent1@ldf.com` (Premium Agent)
  - `sarah@ldf.com` (Regular Agent)
- **5 Regular Users**:
  - `michael@ldf.com` (sponsored by agent1)
  - `chioma@ldf.com` (sponsored by agent1)
  - `david@ldf.com` (sponsored by michael)
  - `amina@ldf.com` (sponsored by michael)
  - `emeka@ldf.com` (sponsored by chioma)

**All users have the password**: `password123`

### Coupons (8 total)
- 5 coupons for agent1 (3 used, 2 available)
- 3 coupons for agent2 (all available)

### Earnings (11 total)
- Referral bonuses
- Matrix level bonuses (Level 1, 2, 3)
- Global Pool ROI
- Premium ROI

### Investments (4 total)
- 1 Premium investment (agent1)
- 3 Basic investments (users)

### Withdrawals (4 total)
- Various statuses: PAID, APPROVED, PENDING, REJECTED

## Test Credentials

After seeding, you can log in with:

| Email | Password | Role |
|-------|----------|------|
| `agent1@ldf.com` | `password123` | Premium Agent |
| `sarah@ldf.com` | `password123` | Agent |
| `michael@ldf.com` | `password123` | User |
| `chioma@ldf.com` | `password123` | User |
| `david@ldf.com` | `password123` | User |

## Important Notes

⚠️ **Warning**: The seed script **clears all existing data** before seeding. If you want to keep existing data, comment out the cleanup section in `prisma/seed.js`:

```javascript
// Comment out these lines to preserve existing data:
// await prisma.withdrawal.deleteMany();
// await prisma.investment.deleteMany();
// await prisma.earning.deleteMany();
// await prisma.coupon.deleteMany();
// await prisma.user.deleteMany();
```

## Troubleshooting

### Database Connection Error
If you see `Can't reach database server`, check:
1. Your database is running
2. `DATABASE_URL` in `.env` is correct
3. Database credentials are valid

### Prisma Client Not Generated
Run:
```bash
npm run prisma:generate
```

### Schema Validation Errors
If you see schema errors, make sure you've run migrations:
```bash
npm run prisma:migrate
```

## Customizing Seed Data

You can modify `prisma/seed.js` to:
- Add more users
- Change user relationships (sponsors)
- Add more coupons
- Create different earning scenarios
- Adjust investment amounts

