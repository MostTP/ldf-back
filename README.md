# Node.js with Prisma ORM

This project is set up with Node.js and Prisma ORM.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

3. Create and run migrations:
   ```bash
   npm run prisma:migrate
   ```

## Available Scripts

- `npm run dev` - Run the main application
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:push` - Push schema changes to database without migrations

## Database

The project is configured to use SQLite by default. The database file will be created at `prisma/dev.db`.

To use a different database, update the `DATABASE_URL` in `.env` and change the `provider` in `prisma/schema.prisma`.

### Supported databases:
- PostgreSQL
- MySQL
- SQLite (default)
- SQL Server
- MongoDB

## Next Steps

1. Modify the schema in `prisma/schema.prisma` to match your data models
2. Run migrations to apply changes: `npm run prisma:migrate`
3. Use Prisma Client in your code (see `index.js` for examples)

